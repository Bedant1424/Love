# NAGARJUNA TRADERS — SECURITY AND PRIVACY SPECIFICATION

**Document Reference:** `docs/security-and-privacy.md`  
**Threat Modeling Standard:** STRIDE & OWASP Top 10 (2025/2026 Edition)  
**Privacy Framework:** Digital Personal Data Protection Act (DPDP Act), 2023  
**Classification:** Internal System Architecture & Defensive Security Plan

---

## 1. Threat Model & Risk Register

```
+───────────────────────────────────────────────────────────────────────────────────+
| ATTACK SURFACE      │ THREAT DESCRIPTION              │ ENFORCED DEFENSE          |
+─────────────────────┼─────────────────────────────────┼───────────────────────────+
| Client Browser      | Price & Quantity Tampering       | Server recalculates all   |
|                     | Modifying HTML inputs/JS        | subtotals and tokens from |
|                     | submitting negative quantities  | trusted database.         |
+─────────────────────┼─────────────────────────────────┼───────────────────────────+
| Public Order URL    | Order Enumeration / IDOR        | Non-enumerable NanoIDs    |
|                     | Guessing /order/NT-XXXX         | (NT-XXXX) plus strictly   |
|                     | Query param token leakage       | required X-Order-Token.   |
|                     | in browser/proxy logs           | No query param tokens.    |
+─────────────────────┼─────────────────────────────────┼───────────────────────────+
| Payment Processing  | False Claims of Verification    | Status strictly recorded  |
|                     | Claiming funds received without | as RECORDED_UNVERIFIED;   |
|                     | verified banking integration    | reconciliation removed.   |
+─────────────────────┼─────────────────────────────────┼───────────────────────────+
| Public Endpoints    | Unsolicited PII Collection      | When payment is disabled, |
|                     | Sending customer PII when       | no PII is collected or    |
|                     | payment is unavailable          | transmitted to backend.   |
+─────────────────────┼─────────────────────────────────┼───────────────────────────+
| Administrative Area | Broken Access Control           | Cloudflare Access Zero    |
|                     | Direct admin endpoint access    | Trust JWT validation      |
|                     | Password login in production    | (Cf-Access-Jwt-Assertion).|
+─────────────────────┼─────────────────────────────────┼───────────────────────────+
```

---

## 2. Defensive Controls by Vulnerability Class

### 2.1 Tampering & Price Integrity
- **Untrusted Client Invariant:** The client payload sends *only* `{ variantId, quantity }`. It NEVER transmits unit prices, discounts, or line subtotals.
- **Server Recalculation:** The server queries the database for the active `price_paise`, verifies `is_active = 1`, and computes line subtotals and tokens internally.
- **Input Sanitization:** All numbers are validated as positive integers:
  ```typescript
  quantity: z.number().int().min(1).max(50)
  ```
  Negative, fractional, zero, or excessively large values fail validation with HTTP 400.

### 2.2 Broken Object Level Authorization (BOLA / IDOR) & Header Protection
- Orders are NEVER identified by auto-incrementing sequential integers (`1, 2, 3...`).
- Public order identifiers are formatted as `NT-XXXX` (random alphanumeric).
- **Header-Only Authentication:** Accessing `/api/v1/orders/:reference` or `/api/v1/orders/:reference/status` strictly requires the matching secret token in the `X-Order-Token` header.
- **Query Parameter Tokens Prohibited:** Passing tokens in URL query parameters (`?token=...`) is explicitly rejected with `401 Unauthorized` to prevent token leakage in proxy logs, browser histories, and HTTP referrer headers.
- **Anti-Caching Header Invariant:** Any response containing customer PII or order payment status must include:
  ```http
  Cache-Control: no-store, no-cache, must-revalidate
  Pragma: no-cache
  ```

### 2.3 Payment Security & Absence of Verification Claims
- **Disabled Public Payment Collection (`PAYMENT_COLLECTION_ENABLED = false`):** Public online payment collection is disabled. When disabled in production, the application displays a truthful notice: *"Payment instructions are currently unavailable."* No test VPA is presented to the public, no fake QR code is shown as real payment, and customer PII is not sent to the backend.
- **Restricted Testing Mode:** Complete payment flow is testable only in local or restricted test environments with synthetic records and non-payable QR fixtures (`test-fixture@nagarjunatraders`).
- **12-Digit String UTR Data Type Invariant:** The payment reference must be a string of **strictly 12 numeric digits** (`/^\d{12}$/`). The server rejects non-string inputs and never casts the UTR to a JavaScript number or integer, avoiding precision distortion and loss of leading zeroes.
- **Replay & Duplicate Prevention:** Duplicate UTR submissions across orders are rejected with `HTTP 409 Conflict` (`DUPLICATE_UTR`).
- **Strictly RECORDED_UNVERIFIED Status:** Submitting a UTR transitions the payment status to `RECORDED_UNVERIFIED`.
- **Prohibition of Verification Operations:** The application contains no manual bank reconciliation buttons, verification buttons, or operations claiming to establish receipt of funds. Any attempt to invoke legacy reconciliation endpoints returns `400 Bad Request` with `PAYMENT_VERIFICATION_DISABLED`.
- **No Fabricated Collected Funds Metrics:** The admin dashboard reports operational counts (`utrSubmittedCount`, `awaitingUtrCount`) and never calculates or displays metrics labeled as money collected or verified.

### 2.4 Denial of Service (DoS) & Abuse Prevention
- **Cloudflare Turnstile:** Every order submission requires a valid Turnstile token.
- **Rate Limiting:** Rate limiter permits a maximum of 5 order submissions per IP address per 10-minute window.
- **Atomic Database Writes:** Order creation and UTR recording are executed atomically in database transactions, preventing partial state writes.

---

## 3. Privacy & Personal Data Protection (DPDP Act 2023)

### 3.1 Data Minimisation Matrix

| Customer Field | Collected? | Operational Necessity | Retention Period |
|---|:---:|---|---|
| **Full Name** | Yes (in active checkout) | Required to identify customer at counter collection. | 90 days post-festival, then anonymized. |
| **Mobile Number** | Yes (in active checkout) | Required for order lookup and pickup coordination. | 90 days post-festival, then hashed. |
| **Email Address** | **NO** | Not required for local counter collection; excluded. | N/A |
| **Delivery Address**| **NO** | Home delivery is prohibited; physical address excluded. | N/A |
| **Customer Password**| **NO** | Secret tokens used in headers; passwords eliminated. | N/A |

### 3.2 Log Scrubbing Invariant
Server logs must NEVER print customer phone numbers or full access tokens in plain text:
```typescript
console.log(`[Order Created] ref=${order.order_reference} phone=******${phone.slice(-4)}`);
```

---

## 4. Administrative Security Perimeter

1. **Zero Public Self-Registration:** There is no public registration for admin users.
2. **Cloudflare Access (Zero Trust):** In production, all requests to `/admin*` and `/api/v1/admin/*` are secured behind Cloudflare Access.
3. **Cryptographic RS256 JWT Signature Verification:** The server strictly validates the `Cf-Access-Jwt-Assertion` header using the maintained `jose` library with RS256 cryptographic signature validation against public keys fetched and cached from the documented Cloudflare Access JWKS endpoint (`https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`). It verifies token structure, key rotation (`kid`), issuer (`CF_ACCESS_TEAM_DOMAIN`), audience (`CF_ACCESS_AUD`), not-before (`nbf`), expiration (`exp`), and enforces an optional configured administrator identity allowlist (`CF_ACCESS_ALLOWED_ADMINS`). Missing configuration, forged tokens, expired signatures, or unauthorized identities fail closed immediately (`401`, `403`, or `500`).
4. **Password Login Blocked in Production:** Standard password login (`/api/v1/admin/auth/login`) is strictly disabled in production and returns `403 Forbidden`. Local development uses isolated mock authentication tokens (`dev-admin-token`), strictly segregated from production checks.
5. **Audit Logging:** Every modification to catalogue prices, bounds overrides, and operational status transitions is recorded in an immutable audit stream with operator ID, action, and timestamp.
