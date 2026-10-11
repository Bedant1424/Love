# NAGARJUNA TRADERS — TESTING AND ACCEPTANCE SPECIFICATION

**Document Reference:** `docs/testing-and-acceptance.md`  
**Test Frameworks:** Vitest (Unit & Integration) + React Testing Library  
**Acceptance Standard:** 100% Deterministic Verification Before Release

---

## 1. Test Strategy & Architecture

```
+───────────────────────────────────────────────────────────────────────────────────+
|               TEST SUITE TOPOLOGY (FINAL SECURITY PATCH & ACCESS JWT)              |
|                                                                                   |
|  [ Level 1: Unit & Cryptographic Tests (Vitest) - 100% Passed (59 tests) ]        |
|  - Integer paise arithmetic and Rupee formatting (formatters.test.ts: 3)          |
|  - Exact token policy & boundary invariants: < ₹200 -> ₹50, >= ₹200 -> ₹100      |
|    Boundary tests: ₹0, ₹30, ₹49.99, ₹50, ₹199.99, ₹200, larger (cart.test: 13)    |
|  - Strict subtotal validation: subtotal < ₹50 rejected (cart.test.ts, api.test.ts) |
|  - Zero remaining balance at exact ₹50 subtotal (cart.test.ts, api.test.ts)       |
|  - Safe LocalStorage cart recovery (storage.test.ts: 5)                           |
|  - Enquiry summary generator & WhatsApp link (enquirySummary.test.ts: 5)          |
|  - Cloudflare Access Cryptographic Suite (accessJwt.test.ts: 15)                  |
|    * RS256 signature validation using Web Crypto jose                             |
|    * Cloudflare Access JWKS certs endpoint & key rotation via kid                |
|    * Issuer, audience, nbf, and exp validation                                    |
|    * Rejection of forged, tampered, expired, and unknown-kid tokens (401/403)     |
|    * Identity allowlist filtering against CF_ACCESS_ALLOWED_ADMINS                |
|    * Fail-closed behavior on missing configuration (500)                          |
|  - Edge API & Server router unit tests (api.test.ts: 18)                          |
|    * GET /api/v1/payment-config returns truthful status & token tiers             |
|    * Server-side tiered token enforcement & subtotal < ₹50 rejection              |
|    * Exact ₹50 boundary with zero remaining balance                               |
|    * Rejection of unpriced range items                                            |
|    * 12-digit string UTR regex validation (non-numeric string data type)          |
|    * Duplicate UTR rejection with 409 Conflict                                    |
|    * Strict X-Order-Token header required for status & order lookup               |
|    * Rejection of URL query param token (?token=...) with 401 Unauthorized        |
|    * Prohibition of bank reconciliation (400 PAYMENT_VERIFICATION_DISABLED)       |
|    * Admin API cryptographic RS256 verification in production mode                |
|                                                                                   |
|  [ Level 2: Component Integration Tests (Vitest + RTL) - 100% Passed (26 tests) ]  |
|  - 6 Authentic category tabs & poster pricing (CatalogueView.test.tsx: 5)         |
|  - Environmental statutory notice for Category 1 Laddis (CatalogueView.test.tsx) |
|  - Customer form validation & 18+ attestation (CustomerForm.test.tsx: 5)          |
|  - Cart view, tiered token breakdown & checkout gating (CartView.test.tsx: 4)     |
|  - Truthful notice when payment disabled in public mode (ReviewView.test.tsx: 5)  |
|  - Restricted test mode with non-payable QR fixture (ReviewView.test.tsx)         |
|  - Admin portal: KPI cards, price bounds, no reconciliation (AdminView.test.tsx: 4)|
|  - Full E2E user flow from Home to UTR submission & confirmation (App.test.tsx: 3)|
+───────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Unit & Integration Test Matrix

| Test Suite | Tests | Scenario Covered | Outcome | Command |
|---|---|---|---|---|
| `accessJwt.test.ts` | 15 | Cryptographic RS256 signature verification, JWKS key rotation, audience/issuer check, expired/forged rejection, admin allowlist, fail-closed handling | ✓ Passed (15/15) | `npm test` |
| `cart.test.ts` | 13 | Exact token policy (< ₹200 $\rightarrow$ ₹50, $\ge$ ₹200 $\rightarrow$ ₹100, boundary ₹200 $\rightarrow$ ₹100), boundary values (₹0, ₹30, ₹49.99, ₹50, ₹199.99, ₹200), subtotal < ₹50 rejection, non-negative balance | ✓ Passed (13/13) | `npm test` |
| `api.test.ts` | 18 | Payment config, server tiered tokens, subtotal < ₹50 rejection (`SUBTOTAL_BELOW_MINIMUM_TOKEN`), exact ₹50 order creation, 12-digit UTR string validation, duplicate UTR 409, strict `X-Order-Token` header, rejection of query param tokens, reconciliation prohibited, prod Access JWT verification | ✓ Passed (18/18) | `npm test` |
| `formatters.test.ts` | 3 | Integer paise to Indian Rupee formatting (`35000` $\rightarrow$ `"₹350.00"`) | ✓ Passed (3/3) | `npm test` |
| `storage.test.ts` | 5 | Safe localStorage recovery, JSON fallback, quota error handling | ✓ Passed (5/5) | `npm test` |
| `enquirySummary.test.ts` | 5 | Order summary generator, tiered token breakdown, WhatsApp share URL | ✓ Passed (5/5) | `npm test` |
| `CustomerForm.test.tsx` | 5 | Name validation, Indian mobile regex (`^[6-9]\d{9}$`), age verification | ✓ Passed (5/5) | `npm test` |
| `CartView.test.tsx` | 4 | Cart item list, price confirmation notes, tiered token breakdown, blockers | ✓ Passed (4/4) | `npm test` |
| `ReviewView.test.tsx` | 5 | Truthful unavailable notice when payment disabled, non-payable QR fixture in restricted mode, 12-digit UTR submission, status tracker | ✓ Passed (5/5) | `npm test` |
| `CatalogueView.test.tsx` | 5 | 6 Categories, discrete vs range items, category filtering, search, Laddis notice | ✓ Passed (5/5) | `npm test` |
| `AdminView.test.tsx` | 4 | Passphrase login, KPI overview (without money collected claims), price bounds override, audit logs | ✓ Passed (4/4) | `npm test` |
| `App.test.tsx` | 3 | End-to-end full customer journey to reservation and UTR confirmation | ✓ Passed (3/3) | `npm test` |
| **Total** | **85** | **Comprehensive Full-Stack Ordering, Security & Access Verification** | **✓ 85/85 Passed (100%)** | `npm test` |

---

## 3. Formal Acceptance Sign-Off Checklist

Before release:
- [x] All 6 Diwali poster categories are represented with authentic extracted names.
- [x] Unverified claims regarding licensing, wholesale status, physical premises, collection availability, and statutory requirements are scrubbed from customer-facing copy.
- [x] When public payment collection is disabled in production, the application displays a truthful notice: *"Payment instructions are currently unavailable."* No fake QR code or merchant VPA is shown.
- [x] Complete payment flow remains testable in local or restricted test environments with synthetic records and non-payable test QR fixture.
- [x] Exact token policy (< ₹200 $\rightarrow$ strictly ₹50, $\ge$ ₹200 $\rightarrow$ strictly ₹100, exact ₹200 $\rightarrow$ ₹100) is enforced without silent reduction. Subtotals below ₹50 are rejected with `400 SUBTOTAL_BELOW_MINIMUM_TOKEN`. Exact ₹50 yields ₹0 remaining balance.
- [x] UTR is stored strictly as a 12-digit numeric string (`/^\d{12}$/`), retaining leading zeroes and rejecting duplicates with 409 Conflict.
- [x] Payment status is set strictly to `RECORDED_UNVERIFIED`.
- [x] Manual bank reconciliation buttons and operations claiming to establish receipt of funds are eliminated. Legacy reconciliation routes return `400 PAYMENT_VERIFICATION_DISABLED`.
- [x] Metrics claiming to represent money collected or verified are removed from the admin dashboard.
- [x] Private order lookup strictly requires the `X-Order-Token` header. URL query parameter tokens (`?token=...`) are prohibited and rejected with 401. Responses include `Cache-Control: no-store, no-cache, must-revalidate`.
- [x] Admin endpoints are authenticated via cryptographic RS256 signature verification of Cloudflare Access JWT Assertion (`Cf-Access-Jwt-Assertion`) in production via `jose` against documented JWKS certificates; password login in production is blocked with 403; fail-closed behavior on all invalid tokens.
- [x] All 85 automated tests pass cleanly with 0 failures, and `npm run build` succeeds with 0 TypeScript errors.
