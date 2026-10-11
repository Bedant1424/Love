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
| Client Browser      | Price & Quantity Tampering       | Server ignores all client |
|                     | Modifying HTML inputs/JS        | prices; recalculates from |
|                     | submitting negative quantities  | trusted D1 database.      |
+─────────────────────┼─────────────────────────────────┼───────────────────────────+
| Public Order URL    | Order Enumeration / IDOR        | Non-enumerable NanoIDs    |
|                     | Guessing /order/1001 to view    | (NT-2026-XXXXXX) plus     |
|                     | customer phone & order contents | secret 128-bit UUID token.|
+─────────────────────┼─────────────────────────────────┼───────────────────────────+
| Payment Processing  | Fake Screenshot / Reused UTR    | Unique SQL index on UTR;  |
|                     | Submitting same 12-digit UTR    | manual admin verification |
|                     | to mark multiple orders paid    | against store bank credit.|
+─────────────────────┼─────────────────────────────────┼───────────────────────────+
| Public Endpoints    | Automated Bot Spam & DoS        | Cloudflare Turnstile bot  |
|                     | Flooding orders to exhaust      | validation + IP bucket    |
|                     | 100,000 Workers free quota      | rate limits (5/10 min).   |
+─────────────────────┼─────────────────────────────────┼───────────────────────────+
| Administrative Area | Broken Access Control           | Cloudflare Access Zero    |
|                     | Calling /api/v1/admin directly  | Trust perimeter with JWT  |
|                     | from public Internet            | cryptographic validation. |
+─────────────────────┼─────────────────────────────────┼───────────────────────────+
```

---

## 2. Defensive Controls by Vulnerability Class

### 2.1 Tampering & Price Integrity
- **Untrusted Client Invariant:** The client payload sends *only* `{ variantId, quantity }`. It NEVER transmits unit prices, discounts, or line subtotals.
- **Server Recalculation:** The Worker queries D1 for the active `price_paise`, verifies `is_active = 1`, and computes line subtotals and tokens internally.
- **Input Sanitization:** All numbers are validated via Zod as positive integers:
  ```typescript
  quantity: z.number().int().min(1).max(50)
  ```
  Negative, fractional (`1.5`), zero, or excessively large (`999999`) values fail validation with HTTP 400.

### 2.2 Broken Object Level Authorization (BOLA / IDOR)
- Orders are NEVER identified by auto-incrementing sequential integers (`1, 2, 3...`).
- Public order identifiers are formatted as `NT-2026-XXXXXX` (cryptographically random alphanumeric).
- Accessing `/api/v1/orders/:reference` requires the matching `access_token` (UUIDv4) issued only to the original submitter:
  ```sql
  SELECT * FROM orders WHERE order_reference = ? AND access_token = ?;
  ```
  An attacker guessing the order reference cannot view customer details without the secret token.

### 2.3 Payment Security, Fixture Isolation & UTR Protection
- **Disabled Live Payment Collection (`PAYMENT_COLLECTION_ENABLED = false`):** Live money collection is explicitly disabled in the codebase and edge worker runtime until merchant banking KYC, dedicated VPA binding, and formal legal clearance are granted.
- **Non-Payable QR Test Fixture:** In restricted test environments, the system renders a non-payable test fixture QR (`test-fixture@nagarjunatraders`) with a visible test payload notice (`TEST FIXTURE ONLY`).
- **12-Digit String UTR Data Type Invariant:** The payment reference must be a string of **strictly 12 numeric digits** (`/^\d{12}$/`). The server rejects non-string inputs and never casts the UTR to a JavaScript number or integer, avoiding IEEE 754 precision distortion and loss of leading zeroes.
- **Replay & Double-Spend Prevention:** Both the D1 database (`payment_submissions.utr_reference UNIQUE` constraint) and the in-memory engine reject any duplicate UTR previously recorded for another order, responding with `HTTP 409 Conflict` (`DUPLICATE_UTR`).
- **Recorded Unverified Status:** Submitting a UTR transitions the payment status to `RECORDED_UNVERIFIED`. It never automatically confirms an order.
- **Prohibition of Automated Verification Claims:** No automated bank verification button or fake external API simulation is permitted. Staff must perform manual verification against the official store bank statement, recording mandatory reconciliation notes before confirming the advance token payment.


### 2.4 Denial of Service (DoS) & Abuse Prevention
- **Cloudflare Turnstile:** Every order submission requires a valid Turnstile token. The Worker validates this server-to-server with Cloudflare's `/siteverify` endpoint before interacting with D1.
- **Rate Limiting:** In-memory / KV rate limiter permits a maximum of 5 order submissions per IP address per 10-minute window.
- **Edge Caching of Catalogue:** Public `GET /api/v1/catalogue` is cached for 300 seconds at Cloudflare edge nodes, absorbing 95%+ of traffic spikes without consuming Worker CPU quota.

---

## 3. Privacy & Personal Data Protection (DPDP Act 2023)

### 3.1 Data Minimisation Matrix

| Customer Field | Collected? | Statutory / Operational Necessity | Retention Period |
|---|:---:|---|---|
| **Full Name** | Yes | Required to match customer at counter collection. | 90 days post-Diwali, then anonymized. |
| **Mobile Number** | Yes | Required for order lookup and SMS/WhatsApp pickup alert. | 90 days post-Diwali, then hashed. |
| **Email Address** | **NO** | Not required for local counter collection; excluded. | N/A |
| **Delivery Address**| **NO** | Home delivery is prohibited; physical address excluded. | N/A |
| **Customer Password**| **NO** | Tokenized URLs used; customer passwords eliminated. | N/A |

### 3.2 Log Scrubbing Invariant
Cloudflare Worker logs must NEVER print customer phone numbers or full names in plain text:
```typescript
// Sanitized logging utility
console.log(`[Order Created] ref=${order.order_reference} phone=******${phone.slice(-4)}`);
```

---

## 4. Administrative Security Perimeter

1. **Zero Public Self-Registration:** There is no "Register as Admin" endpoint or database capability.
2. **Perimeter Authentication:** The `/admin/*` path is secured behind **Cloudflare Access (Zero Trust)**. Operators authenticate using authorized Google Workspace accounts or one-time email PINs.
3. **Cryptographic JWT Validation:** The Worker inspects the `Cf-Access-Jwt-Assertion` header, validates the public key certificate from Cloudflare's certs endpoint (`https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`), and verifies audience tags before handling any administrative request.
4. **Audit Logging:** Every modification to products, prices, stock, or payment approvals logs the operator's authenticated email, timestamp, and previous/new values into `audit_logs`.

---

## 5. Security Incident Response Protocol

1. **Severity 1: Price / Stock Compromise**
   - Immediate Action: Set `COMMERCE_CHECKOUT_ENABLED=false` via Cloudflare dashboard environment variable.
   - Run rollback migration in D1 to restore known-good price snapshots from `catalog_audit_log`.
2. **Severity 2: Mass Bot Submission Attack**
   - Immediate Action: Elevate Cloudflare Turnstile mode from "Managed" to "Interactive Challenge" across the domain.
   - Ban offending IP blocks via Cloudflare WAF Security Rules.
3. **Severity 3: Secret Leak**
   - Rotate all Cloudflare Worker secrets immediately using `wrangler secret put`. Invalidate active admin sessions.
