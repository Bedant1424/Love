# ACTIVATION_ENGINE.md — Card Activation Engine Specification & Operational Runbook

> **Component:** Merchant Card Activation Engine (`POST /api/public/activate` & `GET /api/public/card/:publicId/status`)  
> **Status:** Implemented and Verified in Milestone 3  
> **Guiding Principle:** Defense-in-depth, cryptographic protection of physical cards, atomic single-row SQLite transitions, and zero secret leakage.

---

## 1. Architectural Overview

The QRoute Card Activation Engine provides the merchant-facing mechanism to link physical review cards (QR and NFC) to an official Google Business Profile review destination. 

While the public redirect engine (`GET /c/:publicId`) remains ultra-minimal with zero external dependencies and zero D1 writes, the activation pipeline implements rigorous server-side verification, cryptographic checks, and transactional audit logging.

```
Merchant Device (Web Browser)
        │
        ├──> GET /activate/:publicId (Workers Static Assets SPA)
        │       │
        │       └──> GET /api/public/card/:publicId/status (Readiness Probe)
        │
        └──> POST /api/public/activate
                │
                ├── 1. In-Memory Crockford Base32 ID Validation
                ├── 2. Input Sanitization (XSS mitigation on business_name)
                ├── 3. Centralized Google Review URL Validation (No network calls to destination URLs)
                ├── 4. Turnstile Challenge Verification (Server-Side POST /siteverify)
                ├── 5. Fail-Closed ACTIVATION_SECRET Check
                ├── 6. Web Crypto HMAC-SHA256 Derivation
                ├── 7. Indexed Point Lookup in Cloudflare D1
                ├── 8. Constant-Time Hex Equality Check (timingSafeEqualHex)
                ├── 9. Atomic Conditional State Mutation (UNACTIVATED -> ACTIVE)
                ├── 10. Immutable Audit Log Write (CARD_ACTIVATED)
                │
                └──> HTTP 200 OK Response (JSON Envelope)
```

---

## 2. Cryptographic Architecture

### 2.1 Code Normalization & Entropy
Physical review cards are manufactured with an activation code formatted as:
`XXXX-XXXX-XXXX` (12 characters).

The character set is strictly **Crockford Base32** (`0123456789ABCDEFGHJKMNPQRSTVWXYZ`), explicitly excluding easily confused glyphs:
- `I` (confused with 1)
- `L` (confused with 1)
- `O` (confused with 0)
- `U` (excluded in Crockford to prevent accidental profanities)

Normalization algorithm:
```typescript
export function normalizeActivationCode(raw: string): string {
  return raw.replace(/[-\s]/g, "").toUpperCase();
}
```

### 2.2 HMAC-SHA256 Secret Derivation
Plaintext activation codes are **never** stored in the database. Instead, codes are stored as lowercase 64-character hexadecimal HMAC-SHA256 digests:
$$\text{activation\_code\_hash} = \text{HMAC-SHA256}(\text{ACTIVATION\_SECRET}, \text{Normalize}(\text{Code}))$$

The Web Crypto API (`crypto.subtle`) available natively in Cloudflare Workers executes the cryptographic derivation.

### 2.3 Constant-Time Comparison
To prevent side-channel timing attacks from leaking information about matching character prefixes during verification, digests are compared using a constant-time bitwise accumulator:
```typescript
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  const lenA = aLower.length;
  const lenB = bLower.length;
  let diff = lenA ^ lenB;
  const maxLen = Math.max(lenA, lenB);
  for (let i = 0; i < maxLen; i++) {
    const charA = i < lenA ? aLower.charCodeAt(i) : 0;
    const charB = i < lenB ? bLower.charCodeAt(i) : 0;
    diff |= (charA ^ charB);
  }
  return diff === 0;
}
```

### 2.4 Fail-Closed Environment Secrets
`ACTIVATION_SECRET` must be set in the Worker environment bindings. If missing, empty, or undefined:
- The activation handler immediately fails closed with HTTP 500 (`CONFIGURATION_ERROR`).
- No fallback or default secrets are generated dynamically.
- The card remains in its `UNACTIVATED` state.

---

## 3. Centralized Google Review Destination Validation

Destination validation is encapsulated in `src/shared/google-url-validator.ts`. It is deterministic, side-effect free, and makes **zero network requests** (eliminating server-side request forgery risks). Customer redirect requests make no outbound requests. The activation flow performs the required server-side Cloudflare Turnstile Siteverify request (and never initiates outbound fetches to destination URLs).

### 3.1 Validation Rules
1. **Scheme:** Must strictly be `https:`.
2. **Userinfo:** Usernames and passwords (`user:pass@`) are banned.
3. **Control Characters:** Carriage return (`\r`) and newline (`\n`) characters trigger immediate rejection to prevent HTTP response splitting.
4. **Allowed Hostnames (Exact Matching Only):**
   - `search.google.com`: Path must be `/local/writereview` with a non-empty `placeid` query parameter.
   - `g.page`: Path must end with `/review` (e.g., `https://g.page/r/{slug}/review`).
   - `maps.app.goo.gl`: Mobile share link with a valid path token.
   - `maps.google.com`: Path must start with `/maps` (CID or place link).
   - `www.google.com`: Path must start with `/maps` (specifically excluding arbitrary redirectors like `/url`).

---

## 4. Atomic State Mutation & Concurrency Protection

Activation enforces a strict one-way state transition:
$$\text{UNACTIVATED} \longrightarrow \text{ACTIVE}$$

### 4.1 SQL Conditional Atomic Write
To eliminate race conditions when two activation requests arrive simultaneously, the update statement enforces state invariants directly at the database layer:

```sql
UPDATE cards
SET status = 'ACTIVE',
    business_name = ?,
    destination_url = ?,
    activated_at = ?,
    updated_at = ?
WHERE public_id = ?
  AND status = 'UNACTIVATED'
  AND activation_code_hash = ?;
```

### 4.2 Single-Winner Guarantee
The application evaluates the mutation metadata returned by Cloudflare D1:
```typescript
if (updateResult.meta.changes !== 1) {
  return c.json(createErrorResponse('ACTIVATION_FAILED', 'Card activation failed or card was concurrently activated'), 409);
}
```
If two requests race, SQLite's write serialization ensures that only one request can update the row while `status = 'UNACTIVATED'`. The second request finds `changes === 0` and is safely rejected.

### 4.3 Immutable Audit Logging
Upon confirmed mutation (`changes === 1`), an audit record is immediately inserted into `audit_logs`:
- Action: `CARD_ACTIVATED`
- Actor: `PUBLIC`
- Previous State: `{"status": "UNACTIVATED"}`
- New State: `{"status": "ACTIVE", "businessName": "..."}`
- Secrets Scrubbing: Activation codes and hashes are strictly excluded from audit logs and metadata.

---

## 5. API Contracts

### 5.1 Public Card Status Check
**`GET /api/public/card/:publicId/status`**

- **Response (200 OK — Unactivated):**
  ```json
  {
    "success": true,
    "data": {
      "publicId": "PEND123456",
      "status": "UNACTIVATED"
    }
  }
  ```
- **Response (200 OK — Active):**
  ```json
  {
    "success": true,
    "data": {
      "publicId": "ACTV123456",
      "status": "ACTIVE"
    }
  }
  ```
  *(Note: Zero disclosure of business name, target URL, or activation hash)*
- **Response (404 Not Found):**
  ```json
  {
    "success": false,
    "error": {
      "code": "NOT_FOUND",
      "message": "Card not found"
    }
  }
  ```

### 5.2 Public Card Activation
**`POST /api/public/activate`**

- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "publicId": "PEND123456",
    "businessName": "Sunrise Bakery & Cafe",
    "reviewUrl": "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
    "activationCode": "K7XM-92PR-V8Q2",
    "turnstileToken": "0.X.TOKEN..."
  }
  ```
- **Response (200 OK — Success):**
  ```json
  {
    "success": true,
    "data": {
      "publicId": "PEND123456",
      "status": "ACTIVE",
      "businessName": "Sunrise Bakery & Cafe",
      "destinationUrl": "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
      "activatedAt": "2026-10-03T18:25:00.000Z"
    }
  }
  ```
- **Response (400 Bad Request — Generic Error):**
  ```json
  {
    "success": false,
    "error": {
      "code": "ACTIVATION_FAILED",
      "message": "Invalid activation code or card ID"
    }
  }
  ```
- **Response (400 Bad Request — Card Already Active):**
  ```json
  {
    "success": false,
    "error": {
      "code": "CARD_ALREADY_ACTIVE",
      "message": "Card is already active or in an invalid state"
    }
  }
  ```

---

## 6. Frontend Activation Experience (`/activate/:publicId`)

The merchant activation UI is built with React 19, TypeScript, and Tailwind CSS v4 according to Swiss Modernist design principles:
- **Mobile-First Layout:** Single-column centered layout (`max-w-md`), comfortable tap targets ($\ge 44$ px).
- **Auto-Formatting Code Input:** Real-time uppercase conversion and automatic hyphenation (`XXXX-XXXX-XXXX`).
- **Live Form Validation:** Clear client-side feedback for invalid Google review URLs and missing fields.
- **Dedicated Lifecycle States:**
  - `UNACTIVATED`: Renders activation form.
  - `ACTIVE`: Displays "Card Already Active" notice with live redirect test button.
  - `DISABLED`: Displays temporary deactivation notice.
  - `RETIRED`: Displays permanent decommission notice.
  - `NOT_FOUND`: Displays invalid card identifier notice.
  - `SUCCESS`: Displays confirmation and redirect test button.

---

## 7. Local Testing & Verification Runbook

### 7.1 Seed Database
```bash
npx wrangler d1 execute qroute_local --local --file=seed-local.sql
```

### 7.2 Run Unit & Integration Tests
```bash
npm test
```

### 7.3 Run Playwright Browser Tests
```bash
npx playwright test
```

### 7.4 Quality Gate Verification
```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
```
