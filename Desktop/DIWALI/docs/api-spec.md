# NAGARJUNA TRADERS — API SPECIFICATION

**Document Reference:** `docs/api-spec.md`  
**Base Path:** `/api/v1`  
**Protocol:** HTTPS / JSON Only  
**Authentication:** 
- Public Endpoints: Public / Rate-limited + Cloudflare Turnstile Verification
- Customer Order Access: Bearer Secret Token in Query (`?token=...`) or Header (`X-Order-Token: ...`)
- Admin Endpoints: Cloudflare Access JWT (`Cf-Access-Jwt-Assertion`) or Bearer Admin Token

---

## 1. Status Codes & Error Envelope

All API error responses follow a standardized JSON envelope:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_UTR_FORMAT",
    "message": "Payment UTR reference must be exactly 12 numeric digits.",
    "details": []
  }
}
```

| HTTP Status | Meaning | Typical Usage |
|---|---|---|
| `200 OK` | Successful request | Retrieval or status update successful. |
| `201 Created` | Resource created | Order created, variant added. |
| `400 Bad Request` | Validation failure | Malformed JSON, non-numeric phone, negative quantity. |
| `401 Unauthorized` | Missing / invalid auth | Missing admin token or wrong order secret token. |
| `403 Forbidden` | Operation disallowed | Live checkout called when `COMMERCE_CHECKOUT_ENABLED=false`. |
| `404 Not Found` | Entity missing | Unknown order reference or product ID. |
| `409 Conflict` | Concurrency / Duplicate | UTR reference already used on another order; duplicate SKU. |
| `429 Too Many Requests` | Rate limit hit | More than 5 order attempts from single IP in 10 minutes. |
| `500 Server Error` | Edge worker error | Database timeout or unhandled exception. |

---

## 2. Public Customer Endpoints

### 2.1 `GET /api/v1/payment-config`
Returns payment system configuration, active token tier rules, and restricted test environment fixtures.

- **Headers:** None required.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "paymentCollectionEnabled": false,
    "testFixture": {
      "qrPayload": "upi://pay?pa=test-fixture@nagarjunatraders&pn=NAGARJUNA%20TRADERS&am=0&tn=TEST%20FIXTURE%20ONLY",
      "vpa": "test-fixture@nagarjunatraders",
      "accountName": "NAGARJUNA TRADERS (TEST FIXTURE)",
      "isRestrictedEnv": true,
      "notice": "Payment collection is currently disabled. Test fixture provided for restricted workflow testing only."
    },
    "tokenTiers": {
      "thresholdPaise": 20000,
      "lowTierPaise": 5000,
      "highTierPaise": 10000,
      "minOrderSubtotalPaise": 5000
    }
  }
}
```

### 2.2 `GET /api/v1/catalogue`
Returns the active product categories, products, purchasable variants, and store payment policy.

- **Headers:** None required.
- **Cache Policy:** `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600`.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "store": {
      "name": "Nagarjuna Traders",
      "location": "Sivakasi / Counter Collection",
      "checkoutEnabled": true,
      "paymentCollectionEnabled": false,
      "tokenTiers": {
        "thresholdPaise": 20000,
        "lowTierPaise": 5000,
        "highTierPaise": 10000,
        "minOrderSubtotalPaise": 5000
      }
    },
    "categories": [
      {
        "id": "cat_skyshots",
        "name": "Skyshots",
        "slug": "skyshots",
        "products": [
          {
            "id": "prod_bigboss",
            "name": "Skyshot - Bigboss",
            "packInfo": "3 pcs",
            "imageUrl": "/images/bigboss.jpg",
            "variants": [
              {
                "id": "var_bigboss_std",
                "name": "Standard Pack",
                "sku": "SKY-BB-03",
                "packPieces": 3,
                "pricePaise": 35000,
                "inStock": true
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### 2.3 `POST /api/v1/orders`
Submits a customer reservation request. Computes tiered tokens independently on the server using database prices.

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
- **Validation Rules:**
  - `customer.fullName`: string, length $\ge$ 2.
  - `customer.mobileNumber`: string, regex `^[6-9]\d{9}$`.
  - `customer.ageConfirmed`: boolean, must be `true`.
  - `items`: array, min 1 item, max 20 distinct items.
  - `items[].quantity`: integer, between 1 and 50.
  - Minimum subtotal: ₹50 (`5,000 paise`).
  - Tiered Token Rule: Subtotal < ₹200 $\rightarrow$ ₹50 token; Subtotal $\ge$ ₹200 $\rightarrow$ ₹100 token.
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
      "accountName": "NAGARJUNA TRADERS (TEST FIXTURE)",
      "amountInr": "100.00",
      "transactionNote": "NT-4829",
      "paymentCollectionEnabled": false,
      "notice": "Payment collection is currently disabled. Test fixture provided for restricted workflow testing only."
    }
  }
}
```

### 2.4 `GET /api/v1/orders/:reference/status`
Retrieves lightweight order payment and operational status.

- **Headers / Query:** `X-Order-Token: {accessToken}` or `?token={accessToken}`
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

- **Headers / Query:** `X-Order-Token: {accessToken}` or `?token={accessToken}`
- **Response `200 OK`:** Returns full order object including item breakdowns.

### 2.6 `POST /api/v1/orders/:reference/utr` (or `/payment-reference`)
Submits a customer 12-digit UTR reference after token payment attempt.

- **Headers / Query:** `X-Order-Token: {accessToken}` or `?token={accessToken}`
- **Request Body:**
```json
{
  "utr": "987654321012"
}
```
- **Validation Rules:**
  - `utr`: string of **exactly 12 numeric digits** (`/^\d{12}$/`). Never parsed into a number.
  - Replay rejection: if UTR was previously submitted for another order, returns `409 Conflict` (`DUPLICATE_UTR`).
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "orderReference": "NT-4829",
    "paymentReference": "987654321012",
    "paymentStatus": "RECORDED_UNVERIFIED",
    "message": "12-digit UTR payment reference recorded. Status is recorded as unverified pending manual bank statement reconciliation."
  }
}
```

---

## 3. Protected Admin Endpoints

### 3.1 `GET /api/v1/admin/dashboard`
Returns live operational counters and advance token totals.

### 3.2 `GET /api/v1/admin/orders`
Search and filter orders by operational status, payment status, or customer details.

### 3.3 `POST /api/v1/admin/orders/:id/reconciliation` (or `/verify-payment`)
Performs staff manual reconciliation against official bank statement.

- **Prohibition:** Automated bank verification is prohibited.
- **Request Body:**
```json
{
  "action": "APPROVE_TOKEN", // or 'REJECT_INVALID_UTR'
  "reconciliationNotes": "Matched ₹100 deposit on HDFC Current A/c statement at 11:42 AM",
  "operatorId": "OP-NAGARJUNA"
}
```
- **Validation Rules:** `reconciliationNotes` is strictly mandatory.
- **Response `200 OK`:** Returns updated order with recorded `reconciled_by`, `reconciled_at`, and `reconciliation_notes`.

### 3.4 `POST /api/v1/admin/orders/:id/status`
Updates operational progress (`SUBMITTED` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY_FOR_PICKUP` $\rightarrow$ `COMPLETED`).
Prevents advancing unpaid orders to `READY_FOR_PICKUP` or `COMPLETED`.

### 3.5 `GET /api/v1/admin/variants` & `POST /api/v1/admin/variants/:id/demo-price`
Manage active variant pricing against printed catalogue boundaries.

### 3.6 `GET /api/v1/admin/audit-logs`
Audit log stream tracking price changes, status updates, and reconciliation entries.

### 3.7 `POST /api/v1/admin/auth/login`
Admin passphrase authentication (`nagarjuna-demo-2026`). Returns administrative session token.

- **Transition Guard:** Rejects transitions to `READY_FOR_PICKUP` or `COMPLETED` if `payment_status` is `UNPAID` or `FAILED`.

