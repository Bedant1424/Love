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

### 2.1 `GET /api/v1/catalogue`
Returns the active product categories, products, and purchasable variants.

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
      "checkoutEnabled": false
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

### 2.2 `POST /api/v1/orders`
Submits a customer order or reservation request.

- **Rate Limit:** 5 requests per 10 minutes per IP.
- **Request Body:**
```json
{
  "customer": {
    "fullName": "Ravi Kumar",
    "mobileNumber": "9876543210",
    "ageConfirmed": true,
    "customerNotes": "Visiting counter at 5 PM"
  },
  "items": [
    {
      "variantId": "var_bigboss_std",
      "quantity": 2
    }
  ],
  "turnstileToken": "0.X_mock_or_real_turnstile_token",
  "idempotencyKey": "draft_uuid_12345"
}
```
- **Validation Rules:**
  - `customer.fullName`: string, length 2–80.
  - `customer.mobileNumber`: string, regex `^[6-9]\d{9}$`.
  - `customer.ageConfirmed`: boolean, must be `true`.
  - `items`: array, min 1 item, max 20 distinct items.
  - `items[].quantity`: integer, between 1 and 50.
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "orderReference": "NT-2026-884920",
    "accessToken": "b59a4d87-9516-43fc-bc1b-87178c52119f",
    "operationalStatus": "SUBMITTED",
    "paymentStatus": "UNPAID",
    "subtotalPaise": 70000,
    "tokenDuePaise": 14000,
    "balanceDuePaise": 56000,
    "paymentInstructions": {
      "vpa": "nagarjunatraders@okhdfcbank",
      "accountName": "Nagarjuna Traders",
      "amountInr": "140.00",
      "transactionNote": "NT-2026-884920"
    }
  }
}
```

### 2.3 `GET /api/v1/orders/:reference`
Retrieves public order status for a customer.

- **Query Param:** `token` (Required secret token issued at creation).
- **Response `200 OK`:** Returns order header, item snapshots, financial calculations, and payment status timeline.

### 2.4 `POST /api/v1/orders/:reference/payment-reference`
Submits customer UTR after completing UPI transfer.

- **Headers:** `X-Order-Token: {accessToken}`
- **Request Body:**
```json
{
  "utr": "428901234567"
}
```
- **Validation Rules:** `utr`: string, regex `^\d{12}$`.
- **Response `200 OK`:** Updates `payment_status` to `PENDING_VERIFICATION` and returns confirmation message.

---

## 3. Protected Admin Endpoints

All admin endpoints require either a verified Cloudflare Access identity header or `Authorization: Bearer {jwt}`.

### 3.1 `GET /api/v1/admin/dashboard`
Returns operational counts:
```json
{
  "success": true,
  "data": {
    "pendingPaymentVerificationCount": 12,
    "ordersReadyForPickupCount": 8,
    "confirmedTodayCount": 45,
    "totalTokenCollectedPaise": 630000,
    "outOfStockVariantsCount": 2
  }
}
```

### 3.2 `GET /api/v1/admin/orders`
Search and filter orders.
- **Query Params:** `status`, `paymentStatus`, `search`, `limit`, `offset`.
- **Response `200 OK`:** Paginated array of customer orders with full metadata.

### 3.3 `POST /api/v1/admin/orders/:id/verify-payment`
Approves or rejects a customer-submitted UTR.
- **Request Body:**
```json
{
  "action": "APPROVE_TOKEN", // or 'REJECT_INVALID_UTR'
  "operatorNote": "Matched with HDFC Bank alert for ₹140.00"
}
```
- **State Transition:** Moves `payment_status` to `VERIFIED_TOKEN` and `operational_status` to `CONFIRMED`. Inserts immutable audit record.

### 3.4 `POST /api/v1/admin/orders/:id/status`
Transitions operational status.
- **Request Body:**
```json
{
  "operationalStatus": "READY_FOR_PICKUP"
}
```
- **Transition Guard:** Rejects transitions to `READY_FOR_PICKUP` or `COMPLETED` if `payment_status` is `UNPAID` or `FAILED`.
