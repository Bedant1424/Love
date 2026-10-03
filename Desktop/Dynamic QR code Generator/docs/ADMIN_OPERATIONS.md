# QRoute Admin Operations & Card Lifecycle Engine

> **Document Version:** 1.0.0  
> **Milestone:** Milestone 4 — Merchant/Admin Operations and Card Management  
> **Status:** Implemented & Verified (Gate 4 Complete)

---

## 1. Overview & Architectural Boundary

The **QRoute Admin Operations Engine** provides edge-native administrative controls, card inventory lifecycle management, batch provisioning, and cryptographic audit logs for the QRoute dynamic QR/NFC platform.

### Architectural Invariant Preservation
1. **Sacred Public Redirect Isolation:**
   The public customer scan redirect path (`GET /c/:publicId`) remains **100% unauthenticated**, executes strictly **one indexed D1 lookup**, and contains **zero dependencies** on administrative services, external network sockets, or Cloudflare Access.
2. **Zero-Trust Administrative Perimeter:**
   All administrative routes (`/api/admin/*` and `/admin/*`) are protected by Cloudflare Access (Zero Trust). Requests without verified identity headers are rejected immediately with `HTTP 401 Unauthorized`.
3. **One-Time Secret Visibility:**
   Batch provisioning generates 12-character Crockford Base32 activation codes (`XXXX-XXXX-XXXX`) returned to the operator for supplier manifest creation. Raw activation codes are **never stored in the database** (only HMAC-SHA256 digests).

---

## 2. Security & Authentication Architecture

### 2.1 Cloudflare Access Zero Trust Integration
In production, Cloudflare Access intercepts requests to administrative routes before they reach the Worker script:
- Injected header: `cf-access-authenticated-user-email` (and `cf-access-jwt-assertion`).
- The Worker's `adminAuthMiddleware` extracts and validates the operator's identity.
- In non-production environments (`development`, `staging`), testing identity is supported via `x-admin-email` or local session configuration, adhering to strict email syntax validation.
- Unauthorized or missing identity triggers a clean `401 Unauthorized` API response or the Zero Trust access barrier in the Admin UI.

### 2.2 Role & Authorization Model
- **Actor Identification:** Every administrative mutation records the acting admin's email into `audit_logs.actor_identifier` with `actor_type = 'ADMIN'`.
- **Allowed Emails Whitelist:** Optional environment variable `ADMIN_ALLOWED_EMAILS` allows comma-separated email restrictions if needed.

---

## 3. Card Lifecycle State Machine

```
   [ PROVISIONING ]
          |
          v
   +--------------+     activation (HMAC verified)     +--------------+
   | UNACTIVATED  | ---------------------------------> |    ACTIVE    | <------+
   +--------------+                                    +--------------+        |
          |                                               |        |           |
          | retire                                disable |        | retire    | restore
          v                                               v        |           |
   +--------------+                                    +--------------+        |
   |   RETIRED    | <--------------------------------- |   DISABLED   | -------+
   +--------------+               retire               +--------------+
      (TERMINAL)
```

### State Definitions & Permitted Transitions:
| Current Status | Target Status | Transition Trigger | Endpoint | Audit Action Logged |
| :--- | :--- | :--- | :--- | :--- |
| `UNACTIVATED` | `ACTIVE` | Merchant Card Activation | `POST /api/public/activate` | `CARD_ACTIVATED` |
| `ACTIVE` | `DISABLED` | Operator Disable | `POST /api/admin/cards/:id/disable` | `CARD_DISABLED` |
| `DISABLED` | `ACTIVE` | Operator Restore | `POST /api/admin/cards/:id/restore` | `CARD_RESTORED` |
| `ACTIVE` | `ACTIVE` | Change Destination URL | `POST /api/admin/cards/:id/change-destination` | `DESTINATION_CHANGED` |
| `*` (Any Non-Retired) | `RETIRED` | Operator Permanent Retire | `POST /api/admin/cards/:id/retire` | `CARD_RETIRED` |

### Critical Invariants:
1. **Atomic Conditional SQL:**
   State transitions execute using atomic conditional SQLite queries (e.g. `WHERE id = ? AND status = 'ACTIVE'`). If `changes !== 1`, the transition fails, preventing race conditions.
2. **Terminal Retirement:**
   Once a card enters `RETIRED`, it cannot be transitioned to any other state. All restoration and activation attempts return `HTTP 400 Bad Request`.
3. **Public Redirect Behavior by State:**
   - `ACTIVE`: `HTTP 302 Found` redirecting to Google Review destination URL.
   - `UNACTIVATED`: `HTTP 302 Found` redirecting to `/activate/:publicId`.
   - `DISABLED`: `HTTP 200 OK` serving accessible "Review Card Temporarily Inactive" notice.
   - `RETIRED`: `HTTP 200 OK` serving accessible "Card Retired" notice.

---

## 4. Batch Provisioning Engine

### 4.1 Identifiers & Cryptography
- **Public ID:** 10-character Crockford Base32 string (e.g., `8T2K9M4W1X`), generated using Web Crypto `crypto.getRandomValues()` with zero modulo bias across the 32-character alphabet ($256 = 8 \times 32$). Excludes ambiguous characters (`I`, `L`, `O`, `U`).
- **Activation Code:** 12-character Crockford Base32 string formatted as `XXXX-XXXX-XXXX` (e.g., `K7XM-92PR-V8Q2`).
- **Storage:** Only the HMAC-SHA256 digest (`activation_code_hash`) is stored in Cloudflare D1.

### 4.2 Atomic Transaction Batch
The batch provisioning engine executes atomic multi-statement D1 transactions (`db.batch([...])`) containing:
1. `INSERT INTO batches (id, name, card_count, notes, created_at) ...`
2. $N$ statements inserting each card into `cards`:
   `INSERT INTO cards (id, public_id, batch_id, status, activation_code_hash, created_at, updated_at) ...`
3. $N$ statements inserting initial creation audit logs into `audit_logs`:
   `INSERT INTO audit_logs (id, card_id, action, actor_type, actor_identifier, created_at) ...`

### 4.3 Supplier Manifest Format
Provisioning returns raw activation codes once in the response payload. The operator can download `qroute-manifest-<batch>.csv`:
```csv
public_id,activation_code,qr_url,nfc_url,batch_name
8T2K9M4W1X,K7XM-92PR-V8Q2,https://example.com/c/8T2K9M4W1X,https://example.com/c/8T2K9M4W1X,"Pilot Batch 1"
```

---

## 5. Admin API Specification Summary

All endpoints require authentication via Cloudflare Access identity headers.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Returns platform summary metrics (total cards, counts by status, total batches). |
| `GET` | `/api/admin/cards` | Paginated card list with bounded pagination (`page`, `limit`), filtering by `status`, and search query (`q` or `search`). |
| `GET` | `/api/admin/cards/:id` | Detailed card view with metadata and recent audit log timeline. |
| `POST` | `/api/admin/cards/:id/disable` | Transitions `ACTIVE` card to `DISABLED`. |
| `POST` | `/api/admin/cards/:id/restore` | Transitions `DISABLED` card back to `ACTIVE`. |
| `POST` | `/api/admin/cards/:id/retire` | Permanently retires a card (terminal). |
| `POST` | `/api/admin/cards/:id/change-destination` | Updates Google Review destination URL for `ACTIVE` cards with full syntax and Place ID validation. (Alias: `/destination`). |
| `GET` | `/api/admin/batches` | Lists provisioned card batches. |
| `POST` | `/api/admin/batches` | Provisions $N$ cards atomically and returns one-time activation codes. |
| `GET` | `/api/admin/audit` | Global platform audit trail with filtering by `action` and `cardId`. (Alias: `/audit-logs`). |

---

## 6. Verification & Quality Gates

| Test Suite | File | Count | Status |
| :--- | :--- | :--- | :--- |
| Unit Tests (Crypto & Utilities) | `tests/unit/admin-utils.test.ts` | 11 tests | PASS |
| Unit Tests (Activation Crypto) | `tests/unit/activation-crypto.test.ts` | 27 tests | PASS |
| Unit Tests (URL Validator) | `tests/unit/google-url-validator.test.ts` | 20 tests | PASS |
| Unit Tests (Core Utils) | `tests/unit/utils.test.ts` | 12 tests | PASS |
| Integration Tests (Admin Engine) | `tests/integration/admin.test.ts` | 15 tests | PASS |
| Integration Tests (Activation Engine) | `tests/integration/activation.test.ts` | 16 tests | PASS |
| Integration Tests (Redirect Engine) | `tests/integration/redirect.test.ts` | 16 tests | PASS |
| Integration Tests (D1 Bindings) | `tests/integration/d1-binding.test.ts` | 3 tests | PASS |
| Integration Tests (Health) | `tests/integration/health.test.ts` | 2 tests | PASS |
| **Total Vitest Tests** | | **122 tests** | **PASS (100%)** |
| Playwright E2E Tests | `tests/e2e/admin.spec.ts` | 5 browser journeys | PASS |
| Playwright E2E Tests (Full Suite) | `tests/e2e/*.spec.ts` | 16 tests | PASS |
| Static Analysis | TypeScript (`tsc -b --noEmit`) | | PASS |
| Code Quality | ESLint (`eslint .`) | 0 errors, 0 warnings | PASS |
| Code Formatting | Prettier (`prettier --check .`) | | PASS |
| Security Invariant | `npm config get strict-ssl` | `true` | PASS |
