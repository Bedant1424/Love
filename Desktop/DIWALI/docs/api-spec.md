# NAGARJUNA TRADERS — API SPECIFICATION

**Document Reference:** `docs/api-spec.md`  
**Base Path:** `/api/v1`  
**Protocol:** HTTPS / JSON Only  
**Authentication:** 
- Public Endpoints: Public / Rate-limited + Cloudflare Turnstile Verification
- Customer Order Access: Strictly require header `X-Order-Token: <token>`. URL query parameter tokens (`?token=...`) are prohibited and rejected with `401 Unauthorized` to prevent token leakage in browser history, proxy logs, and referrer headers.
- Admin Endpoints: In production, strictly validated with cryptographic RS256 signature verification of Cloudflare Access JWT Assertion (`Cf-Access-Jwt-Assertion`) via `jose` against documented JWKS endpoint (`https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`), validating issuer (`CF_ACCESS_TEAM_DOMAIN`), audience (`CF_ACCESS_AUD`), not-before (`nbf`), expiration (`exp`), and allowed identities (`CF_ACCESS_ALLOWED_ADMINS`). Fails closed on any error. In local/restricted development, isolated Bearer token `dev-admin-token`. Public admin registration is non-existent, and password login in production is rejected with `403 Forbidden`.
- **Server-Side Environment Security Gating:** The restricted test environment is determined strictly by verified server-side configuration (`env.RESTRICTED_TEST_MODE === 'true'` or `env.ENVIRONMENT === 'test'`). Client headers (such as `X-Restricted-Test-Mode`) are completely ignored and stripped from CORS allowed headers. Production (`ENVIRONMENT: 'production'`) unconditionally fails closed.
- **Runtime & Database:** Cloudflare Pages Functions (`functions/api/[[route]].ts`) forwarding to `handleApiRequest(request, env)`. Data access runs through `D1DatabaseAdapter` bound to `env.DB` with 100% parameterised prepared statements and atomic batch executions.

---

## 1. Status Codes & Error Envelope

All API responses follow a standardized JSON envelope:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_UTR_FORMAT",
    "message": "Payment UTR reference must be a string of exactly 12 numeric digits.",
    "details": []
  }
}
```

| HTTP Status | Meaning | Typical Usage |
|---|---|---|
| `200 OK` | Successful request | Retrieval or status update successful. Responses containing customer or order details include `Cache-Control: no-store, no-cache, must-revalidate`. |
| `201 Created` | Resource created | Order created, variant added. |
| `400 Bad Request` | Validation failure | Malformed JSON, non-numeric phone, non-12-digit UTR, unpriced items in cart. |
| `401 Unauthorized` | Missing / invalid auth | Missing `X-Order-Token` header on private order lookup, missing admin token. |
| `403 Forbidden` | Operation disallowed | Invalid `X-Order-Token`, public UTR submission while payment collection disabled, password login in production. |
| `404 Not Found` | Entity missing | Unknown order reference or product ID. |
| `409 Conflict` | Concurrency / Duplicate | UTR reference already recorded on another order (`DUPLICATE_UTR`). |
| `429 Too Many Requests` | Rate limit hit | More than 5 order attempts from single IP in 10 minutes. |
| `500 Server Error` | Edge worker error | Database timeout or unhandled exception. |

---

## 2. Public Customer Endpoints

### 2.1 `GET /api/v1/payment-config`
Returns payment configuration and token tiers.

- **Truthful Public State (`paymentCollectionEnabled = false`, production):**
  When public payment collection is disabled, returns a truthful notice and omits merchant VPA details:
  ```json
  {
    "success": true,
    "data": {
      "paymentCollectionEnabled": false,
      "isRestrictedEnv": false,
      "vpa": null,
      "accountName": null,
      "message": "Payment instructions are currently unavailable.",
      "tokenTiers": {
        "thresholdPaise": 20000,
        "lowTierPaise": 5000,
        "highTierPaise": 10000
      }
    }
  }
  ```
- **Restricted Testing Mode (Local / Developer Test Environment):**
  When in a restricted testing environment, provides a clearly labeled non-payable QR fixture:
  ```json
  {
    "success": true,
    "data": {
      "paymentCollectionEnabled": false,
      "isRestrictedEnv": true,
      "vpa": "test-fixture@nagarjunatraders",
      "accountName": "NAGARJUNA TRADERS (TEST ONLY)",
      "message": "Restricted testing environment: non-payable test QR fixture active.",
      "testFixture": {
        "qrPayload": "upi://pay?pa=test-fixture@nagarjunatraders&pn=NAGARJUNA%20TRADERS&am=0&tn=TEST%20FIXTURE%20ONLY",
        "vpa": "test-fixture@nagarjunatraders",
        "accountName": "NAGARJUNA TRADERS (TEST ONLY)",
        "isRestrictedEnv": true,
        "notice": "Restricted testing environment: non-payable test QR fixture active."
      },
      "tokenTiers": {
        "thresholdPaise": 20000,
        "lowTierPaise": 5000,
        "highTierPaise": 10000
      }
    }
  }
  ```

### 2.2 `GET /api/v1/catalogue`
Returns the active product categories, products, purchasable variants, and store metadata without unverified claims.

- **Headers:** None required.
- **Cache Policy:** `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600`.

### 2.3 `POST /api/v1/orders`
Submits a customer reservation request. Computes tiered tokens independently on the server using database prices.

- **Restricted Policy Invariant:** When public payment collection is disabled and not in a restricted testing environment, public users are truthful informed that payment instructions are unavailable, and real customer details are not transmitted to the backend. In local/restricted testing, synthetic records are accepted.
- **Rate Limit:** 5 requests per 10 minutes per IP.
- **Request Body:**
```json
{
  "customer": {
    "fullName": "Ravi Kumar",
    "mobileNumber": "9876543210",
    "ageConfirmed": true,
    "fulfilmentPreference": "COUNTER_PICKUP",
    "notes": "Visiting counter on Sunday morning"
  },
  "items": [
    {
      "variantId": "var_bigboss_std",
      "quantity": 1
    }
  ],
  "idempotencyKey": "draft_uuid_12345"
}
```
- **Server Validation & Token Rules:**
  - `customer.fullName`: string, length $\ge$ 2.
  - `customer.mobileNumber`: string, regex `^[6-9]\d{9}$`.
  - `customer.ageConfirmed`: boolean, must be `true`.
  - `items`: array, min 1 item.
  - `items[].quantity`: integer, between 1 and 50.
  - **Exact Token Policy & Boundary Invariants:**
    - Subtotal < ₹200 (`20,000 paise`): token amount is strictly ₹50 (`5,000 paise`).
    - Subtotal $\ge$ ₹200 (`20,000 paise`): token amount is strictly ₹100 (`10,000 paise`).
    - Exact ₹200 boundary belongs to ₹100 tier (subtotal ₹200 $\rightarrow$ token ₹100, balance ₹100).
    - Subtotal < ₹50 (`5,000 paise`): rejected with `400 Bad Request` (`SUBTOTAL_BELOW_MINIMUM_TOKEN`) with message: *"Order subtotal must be at least ₹50.00 because the required advance token is ₹50.00."* Silent reduction below ₹50 is strictly eliminated.
    - Exact ₹50 boundary: token is ₹50, remaining balance is ₹0.
    - Remaining balance is calculated as `Math.max(0, subtotalPaise - tokenAmountPaise)`.
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "orderReference": "NT-4829",
    "accessToken": "b59a4d87-9516-43fc-bc1b-87178c52119f",
    "operationalStatus": "SUBMITTED",
    "paymentStatus": "UNPAID",
    "subtotalPaise": 35000,
    "tokenDuePaise": 10000,
    "balanceDuePaise": 25000,
    "paymentInstructions": {
      "vpa": "test-fixture@nagarjunatraders",
      "accountName": "NAGARJUNA TRADERS (TEST ONLY)",
      "amountInr": "100.00",
      "transactionNote": "NT-4829",
      "paymentCollectionEnabled": false,
      "notice": "Restricted test fixture."
    }
  }
}
```

### 2.4 `GET /api/v1/orders/:reference/status`
Retrieves lightweight order payment and operational status.

- **Headers:** Strictly requires `X-Order-Token: <accessToken>`.
- **Query Parameter Tokens:** Prohibited. If `?token=...` is passed, returns `401 Unauthorized`.
- **Cache-Control:** `Cache-Control: no-store, no-cache, must-revalidate`.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "orderReference": "NT-4829",
    "customerName": "Ravi Kumar",
    "operationalStatus": "SUBMITTED",
    "paymentStatus": "RECORDED_UNVERIFIED",
    "paymentReference": "123456789012",
    "paymentSubmittedAt": "2026-10-11T05:30:00.000Z",
    "subtotalPaise": 35000,
    "tokenAmountPaise": 10000,
    "remainingBalancePaise": 25000,
    "createdAt": "2026-10-11T05:25:00.000Z",
    "updatedAt": "2026-10-11T05:30:00.000Z"
  }
}
```

### 2.5 `GET /api/v1/orders/:reference`
Retrieves full customer order details and line item snapshots.

- **Headers:** Strictly requires `X-Order-Token: <accessToken>`.
- **Query Parameter Tokens:** Prohibited (`401 Unauthorized`).
- **Cache-Control:** `Cache-Control: no-store, no-cache, must-revalidate`.

### 2.6 `POST /api/v1/orders/:reference/utr`
Submits a 12-digit UTR reference in restricted test mode.

- **Public Policy:** When public payment collection is disabled in production, this route is blocked with `403 Forbidden` (`PAYMENT_COLLECTION_DISABLED`).
- **Headers:** `X-Order-Token: <accessToken>`.
- **Request Body:**
```json
{
  "utr": "987654321012"
}
```
- **Validation Rules:**
  - `utr`: string of **strictly 12 numeric digits** (`/^\d{12}$/`). Never parsed into a number.
  - Duplicate check: if UTR was previously submitted for another order, returns `409 Conflict` (`DUPLICATE_UTR`).
- **Status Invariant:** Status is set strictly to `RECORDED_UNVERIFIED`.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "orderReference": "NT-4829",
    "paymentReference": "987654321012",
    "paymentStatus": "RECORDED_UNVERIFIED",
    "message": "12-digit UTR reference recorded as unverified. This application does not verify payments or establish receipt of funds."
  }
}
```

### 2.7 `POST /api/v1/payment-issues`
Allows customers experiencing payment troubles to submit assistance requests.
- **Request Body:**
```json
{
  "orderReference": "NT-4829",
  "customerName": "Ramesh Kumar",
  "customerMobile": "9876543210",
  "issueType": "QR_LIMIT_REACHED",
  "description": "GPay daily bank limit reached"
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "issueReference": "ISS-B8A1",
    "message": "Payment issue reported successfully. Store staff will assist you.",
    "status": "OPEN"
  }
}
```

---

## 3. Protected Admin Endpoints

All administrative endpoints require authentication:
- In production: Valid Cloudflare Access JWT Assertion (`Cf-Access-Jwt-Assertion`).
- In local development: Isolated Bearer token (`dev-admin-token` or `admin-jwt-session-nagarjuna`).
- Requests without credentials return `401 Unauthorized`.

### 3.1 `GET /api/v1/admin/dashboard`
Returns live operational counters:
- `totalOrders`: count of placed orders
- `utrSubmittedCount`: count of orders with submitted UTR (`RECORDED_UNVERIFIED`)
- `awaitingUtrCount`: count of orders awaiting UTR submission (`UNPAID`)
- `ordersReadyForPickupCount`: count of orders ready for pickup
- `completedOrdersCount`: count of completed orders
*Note: Metrics claiming to represent money collected or verified have been removed.*

### 3.2 `GET /api/v1/admin/orders`
Search and filter orders by operational status, payment status, or reference.

### 3.3 Prohibition of Manual Bank Reconciliation
Any calls to `/admin/orders/:id/reconciliation` or `/admin/orders/:id/verify-payment` return `400 Bad Request` with `PAYMENT_VERIFICATION_DISABLED`. The application does not support manual bank reconciliation, verification buttons, or operations claiming to establish receipt of funds.

### 3.4 `POST /api/v1/admin/orders/:id/status`
Updates operational progress (`CONFIRMED`, `PREPARING`, `READY_FOR_PICKUP`, `COMPLETED`).

### 3.5 `GET /api/v1/admin/variants` & `POST /api/v1/admin/variants/:id/demo-price`
Manages variant pricing within printed catalogue bounds, requiring audit justification for any authorized overrides.

### 3.6 `GET /api/v1/admin/audit-logs`
Audit log stream tracking price changes, overrides, operational status changes, and order events.

### 3.7 `GET /api/v1/admin/inventory` & `POST /api/v1/admin/inventory/adjust` & `GET /api/v1/admin/inventory/audit-logs`
- `GET /api/v1/admin/inventory`: Returns variants with physical `current_stock`, `reserved_stock`, `available_stock`, `low_stock_threshold`, and `is_low_stock` flag.
- `POST /api/v1/admin/inventory/adjust`: Manually adjusts on-hand physical stock with required operator and audit reason.
- `GET /api/v1/admin/inventory/audit-logs`: Returns chronological inventory movement log.

### 3.8 `GET /api/v1/admin/qr`, `POST /api/v1/admin/qr/upload`, `POST /api/v1/admin/qr/:id/activate`, `POST /api/v1/admin/qr/:id/deactivate`
- `GET /api/v1/admin/qr`: Returns list of all QR versions with active indicator.
- `POST /api/v1/admin/qr/upload`: Uploads draft QR version with raster image (PNG/JPEG; SVG strictly rejected).
- `POST /api/v1/admin/qr/:id/activate`: Atomically activates version and deactivates prior active versions.
- `POST /api/v1/admin/qr/:id/deactivate`: Deactivates version.

### 3.9 `GET /api/v1/admin/payment-issues` & `PATCH /api/v1/admin/payment-issues/:id`
- `GET /api/v1/admin/payment-issues`: Lists customer payment support tickets with optional `?status=` filter.
- `PATCH /api/v1/admin/payment-issues/:id`: Updates ticket status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `DISMISSED`) and records staff contact notes.

### 3.10 `GET /api/v1/admin/customers` & `GET /api/v1/admin/customers/:id`
- `GET /api/v1/admin/customers`: Returns customer directory with lifetime spend, total orders, and search by mobile or name.
- `GET /api/v1/admin/customers/:id`: Returns customer details and full historical order list.

### 3.11 `GET /api/v1/admin/reports/sales` & `GET /api/v1/admin/reports/export`
- `GET /api/v1/admin/reports/sales?range=(today|7d|30d|all)`: Returns sales analytics cleanly segregating Gross Order Value from Verified Bank Funds (Zero Hallucinated Revenue invariant).
- `GET /api/v1/admin/reports/export?range=(today|7d|30d|all)`: Returns RFC 4180 CSV export with header `Content-Type: text/csv`.
