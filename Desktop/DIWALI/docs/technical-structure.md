# NAGARJUNA TRADERS — TECHNICAL ARCHITECTURE SPECIFICATION

**Document Reference:** `docs/technical-structure.md`  
**Platform Target:** Cloudflare Free Ecosystem + GitHub  
**Runtime:** Cloudflare Pages (Frontend) + Cloudflare Workers (Backend Edge API) + Cloudflare D1 (Database)  
**Security Perimeter:** Cloudflare Turnstile + Cloudflare Access / Web Crypto JWT

---

## 1. System Architecture Diagram

```
+───────────────────────────────────────────────────────────────────────────────────+
|                                CUSTOMER BROWSER / MOBILE                          |
|                       React 18 + Vite + TypeScript + Tailwind CSS                 |
|                   Client Cart (LocalStorage) + Turnstile Widget                   |
+────────────────────────────────────────┬──────────────────────────────────────────+
                                         │ HTTPS Requests (Edge Routed)
                                         ▼
+───────────────────────────────────────────────────────────────────────────────────+
|                             CLOUDFLARE EDGE NETWORK                               |
|                                                                                   |
|  [ Cloudflare Pages CDN ]                  [ Cloudflare Turnstile ]               |
|  Static Assets (HTML, JS, CSS, Media)     Bot Verification & Token Validation     |
|  Zero Worker CPU / Unlimited Bandwidth                                            |
|                                                                                   |
|                                                                                   |
|  [ Cloudflare Workers API ] (/api/v1/*)                                           |
|  ├── Route: /api/v1/catalogue             (Public, Cached at Edge)                |
|  ├── Route: /api/v1/orders                (Public, Rate Limited + Turnstile)      |
|  ├── Route: /api/v1/orders/:id            (Protected by Order Secret Token)       |
|  └── Route: /api/v1/admin/*               (Protected by Cloudflare Access / JWT)  |
|                                                                                   |
|                                                                                   |
|  [ Cloudflare D1 SQLite Database ]                                                |
|  Serverless Edge SQLite — Foreign Keys, Transactions, Paise Integer Math          |
+───────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Component Specifications

### 2.1 Frontend Client (Cloudflare Pages)
- **Framework:** React 18 with TypeScript and Vite.
- **Styling:** Tailwind CSS (utility-first, zero runtime CSS overhead).
- **Icons:** `@phosphor-icons/react` or `@tabler/icons-react` (standardized SVG stroke 1.5).
- **State Management:** Lightweight React Context + LocalStorage synchronization for cart persistence.
- **Network Client:** Native `fetch` with exponential backoff retry and timeout handling.
- **Hosting:** Cloudflare Pages static build (`dist/`). Requests to `/api/*` are natively routed to Workers via `_routes.json` or Functions binding.

### 2.2 Edge Backend API (Cloudflare Workers)
- **Runtime:** V8 Isolate Edge Runtime (0ms cold start, global distributed execution).
- **Router:** Lightweight Edge router (Hono or native Web Standard Fetch API).
- **Request Validation:** Zod schemas for strict payload validation and sanitization.
- **Environment Bindings:**
  - `DB`: Cloudflare D1 Database binding (`env.DB`).
  - `TURNSTILE_SECRET_KEY`: Secret string for Cloudflare Turnstile API validation.
  - `COMMERCE_CHECKOUT_ENABLED`: Boolean feature flag string (`"false"` by default).
  - `JWT_ADMIN_SECRET`: Cryptographic secret for signing/verifying admin tokens.

### 2.3 Relational Database (Cloudflare D1)
- **Engine:** Serverless SQLite distributed across Cloudflare data centers.
- **Dialect:** SQLite 3 with strict foreign key constraints (`PRAGMA foreign_keys = ON;`).
- **Integrity Guarantee:** Uses parameterised SQL queries exclusively (`db.prepare('...').bind(...)`). Zero SQL injection attack surface.
- **Migration Engine:** Wrangler native D1 migration runner (`wrangler d1 migrations apply`).

---

## 3. End-to-End Data Flows

### 3.1 Flow A: Catalogue Browsing & Edge Caching
```
Customer Browser ──> GET /api/v1/catalogue
       │
       ▼
Cloudflare Edge Cache ──[Cache Hit (TTL: 300s)]──> Return JSON (0ms Worker CPU)
       │
   [Cache Miss]
       ▼
Cloudflare Worker ──> D1 Database query (SELECT active products & variants)
       │
       ▼
Format JSON Response ──> Populate Cache (s-maxage=300, stale-while-revalidate=600) ──> Customer
```

*Architectural Benefit:* During the Diwali rush, 95%+ of catalogue read requests hit the Cloudflare CDN edge cache, consuming ZERO worker daily execution quotas.

### 3.2 Flow B: Order Submission & Verification
```
Customer Browser 
  │ 1. Solves Turnstile Challenge
  │ 2. POST /api/v1/orders { items: [...], customer: {...}, turnstileToken }
  ▼
Cloudflare Worker
  │ 3. Check COMMERCE_CHECKOUT_ENABLED flag (if false, route to enquiry slip)
  │ 4. Verify Turnstile Token via Cloudflare API
  │ 5. Rate Limit Check (IP Bucket: max 5 orders / 10 mins)
  │ 6. Begin D1 Database Transaction
  │    a. Read active variant prices from D1 (IGNORE client-supplied prices)
  │    b. Validate stock availability (if inventory tracking active)
  │    c. Recalculate Subtotal, Token (20%), and Balance in integer paise
  │    d. Generate Order ID (NT-2026-XXXXXX) & Secret Token (crypto.randomUUID)
  │    e. Insert order and order_items snapshots
  │    f. Deduct inventory count
  │ 7. Commit Transaction
  ▼
Customer Browser receives HTTP 201 Created with order reference and payment instructions.
```

### 3.3 Flow C: Payment Reference (UTR) Submission & Operator Verification
```
Customer Browser ──> POST /api/v1/orders/:id/payment-reference { utr: "123456789012" }
  │
  ▼
Worker verifies order secret token, checks UTR format (\d{12}), checks global UTR uniqueness
  │ Updates order status to PENDING_VERIFICATION in D1
  ▼
Admin opens /admin/orders ──> GET /api/v1/admin/orders
  │ Authenticated via Cloudflare Access JWT
  ▼
Admin reviews UTR against store bank notification and clicks "Verify Token"
  │ POST /api/v1/admin/orders/:id/verify-payment { action: "VERIFY_TOKEN" }
  │ D1 transaction records payment audit entry and updates OrderStatus to CONFIRMED
  ▼
Customer status page automatically reflects Step 3: CONFIRMED
```

---

## 4. Failure Modes, Redundancy & Recovery

| Failure Scenario | System Behaviour | Recovery Procedure |
|---|---|---|
| **Worker 100k Request Limit Approached** | Cloudflare returns HTTP 429 once daily free quota exhausted. | Catalogue browsing remains online via static edge cache; client displays friendly warning banner instructing customers to call or visit store directly. |
| **D1 Daily Write Quota Reached** | Writes fail with database busy / quota error. | Handled gracefully with HTTP 503; client falls back automatically to WhatsApp direct enquiry link. |
| **Network Timeout During Order Submission** | Client network drops before receiving server response. | Client retries with `Idempotency-Key` header (`orderDraftId`). Server checks if order already created and returns existing record without duplicating. |
| **Accidental Price / Stock Admin Error** | Admin accidentally publishes wrong price or clears stock. | D1 keeps an audit log (`catalog_audit_log`). Admin runbook provides simple SQL rollback script. Existing placed orders remain completely unaffected due to frozen price snapshots. |
