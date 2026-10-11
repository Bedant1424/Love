# NAGARJUNA TRADERS — ADMINISTRATIVE RUNBOOK & OPERATIONAL GUIDE

**Document Reference:** `docs/admin-runbook.md`  
**Target Audience:** Store Owner, Billing Counter Staff, Inventory Managers  
**System Access:** `/admin` (Protected via Cloudflare Access Zero Trust in Production)  
**Emergency Contacts:** Store Manager, Technical Support Team

---

## 1. Staff Authentication & Access Control

1. **Accessing the Portal:**
   - In production, navigate to `https://<domain>/admin`. The route is guarded by Cloudflare Access Zero Trust.
   - Operators authenticate using authorized team identity (Google Workspace or email OTP).
   - The Cloudflare Access edge validates the JWT assertion (`Cf-Access-Jwt-Assertion`) header on all requests to `/api/v1/admin/*`.
   - Direct password login in production is prohibited and returns `403 Forbidden`.
   - In local development mode, the admin console uses an isolated staff development passphrase and bearer token.
2. **Security Invariant:** Logout immediately upon leaving the counter desk.

---

## 2. Daily Counter Morning Checklist

Every morning during Diwali festival week, the shift supervisor must execute:

- [ ] **Check 1: Review Overnight Orders:** Open the Orders tab to review newly placed orders and customer pickup schedules.
- [ ] **Check 2: Inventory Spot Check:** Inspect warehouse stock for high-demand items (e.g. Bigboss Skyshot, 9cm Sparklers).
- [ ] **Check 3: Pricing Verification:** Confirm that active prices match current printed poster rates. If adjustments are necessary within printed bounds, update via the Catalogue tab.

---

## 3. Product & Pricing Management Procedure

### 3.1 Updating a Variant Price
1. Navigate to `/admin` and select the **Catalogue & Pricing** tab.
2. Locate the variant (e.g. *10 cm Electric Sparklers - Gold*).
3. Click **Edit Price**.
4. Enter the new active price in Rupees (e.g. `180`).
5. **Printed Bounds Check:** The system verifies that the price falls within the printed minimum and maximum bounds from the Diwali poster.
6. **Overrides:** If an exceptional override outside printed bounds is required, the operator must check "Allow price outside printed boundaries" and enter a mandatory audit justification reason.
7. Click **Save Price**. The update is recorded in the immutable audit log stream.

---

## 4. Order Management & UTR Submission Status

The application records customer orders and submitted 12-digit UTR payment references.

### 4.1 Payment Status Lifecycle
- **`UNPAID`:** The order has been submitted, but no 12-digit UTR reference has been provided.
- **`RECORDED_UNVERIFIED`:** The customer has submitted a 12-digit UTR reference.
  - **Important Policy:** This application does **not** verify payments, connect to bank APIs, or claim to establish receipt of funds.
  - No automated or manual "verification" buttons exist.
  - Staff must directly check store banking records before handing over fireworks at the counter.

### 4.2 Operational Status Progression
Staff can advance the order's physical fulfilment state:
1. **`SUBMITTED`:** Initial customer booking.
2. **`CONFIRMED`:** Staff have acknowledged the reservation.
3. **`PREPARING`:** Warehouse is packing the box.
4. **`READY_FOR_PICKUP`:** Box is packed and labeled with the Order Reference at the collection desk.
5. **`COMPLETED`:** Customer has visited the counter, age has been confirmed (18+), balance has been collected, and items handed over.

---

## 5. Counter Handover & Balance Collection Procedure

When the customer visits the counter to collect their order:

1. **Identify Customer:** Ask customer for their **Order Reference** (e.g. `NT-4829`) and registered Mobile Number.
2. **Search Order:** Enter reference into `/admin` Orders search bar.
3. **Review Details:**
   - Confirm customer details and items in box.
   - Note submitted 12-digit UTR reference (if submitted).
   - Confirm remaining balance due at collection.
4. **Verify Photo ID:** Confirm photo ID (18+) before handing over fireworks.
5. **Collect Remaining Balance:** Collect remaining balance in cash or UPI at the collection desk.
6. **Complete Handover:** Click **COMPLETED** to finalize the order record.

---

## 6. Cloudflare Deployment, Operations & Recovery

### 6.1 Architecture Overview
- **Hosting:** Cloudflare Pages (Static Assets + Vite React Bundle)
- **Edge API Backend:** Cloudflare Pages Functions (`functions/api/[[route]].ts`) forwarding to `handleApiRequest(request, env)`.
- **Database:** Cloudflare D1 distributed SQLite database bound to `env.DB`.
- **Zero Trust Protection:** Cloudflare Access protecting `/admin` and `/api/v1/admin/*` with cryptographic RS256 JWT signature verification via `jose`.

### 6.2 Environments & Wrangler Configuration (`wrangler.jsonc`)
Two environments are maintained with strict fail-closed segregation:

| Setting | Production (`wrangler.jsonc`) | Restricted Test (`env.test`) | Local Development |
|---|---|---|---|
| `ENVIRONMENT` | `"production"` | `"test"` | `"development"` |
| `RESTRICTED_TEST_MODE` | `"false"` | `"true"` | Local hostname auto-detect |
| `PAYMENT_COLLECTION_ENABLED` | `"false"` | `"false"` | `"false"` |
| D1 Database Binding | `DB` (`nagarjuna-traders-d1-prod`) | `DB` (`nagarjuna-traders-d1-test`) | In-memory fallback / local SQLite |
| Test QR Fixture | Never returned (`undefined`) | Provided for testing | Provided for testing |
| UTR Submission | Blocked (`403 Forbidden`) | Accepted (`RECORDED_UNVERIFIED`) | Accepted (`RECORDED_UNVERIFIED`) |
| Password Auth | Blocked (`403 Forbidden`) | Blocked (`403 Forbidden`) | Supported (`dev-admin-token`) |

> [!IMPORTANT]
> **Production Fail-Closed Invariant:**
> Client-supplied headers (such as `X-Restricted-Test-Mode`) are completely ignored. In production, the system strictly disables test mode, hides test QR fixtures, and rejects public UTR submissions. Real payment collection remains disabled until explicit owner authorization.

### 6.3 Cloudflare Secret Management
Secrets and Zero Trust credentials must never be committed to git. Configure via Wrangler CLI:

```bash
# 1. Cloudflare Access Team Domain
npx wrangler secret put CF_ACCESS_TEAM_DOMAIN

# 2. Cloudflare Access Application Audience (AUD tag)
npx wrangler secret put CF_ACCESS_AUD

# 3. Optional Allowed Admin Emails (comma-separated)
npx wrangler secret put CF_ACCESS_ALLOWED_ADMINS
```

### 6.4 D1 Database Migrations Workflow
Database migrations are strictly sequential, parameterised, and idempotent:
- `0001_initial_schema.sql`: Base categories, products, variants, audit logs, and settings.
- `0002_seed_catalogue.sql`: 6 authentic categories and 26 poster variants (`INSERT OR IGNORE`).
- `0003_payment_flow_schema.sql`: Payment submissions and status history tables.
- `0004_orders_schema_alignment.sql`: Canonical orders and items schema with `CHECK (subtotal_paise >= 5000)`.

**Commands:**
```bash
# Apply migrations locally for testing:
npx wrangler d1 migrations apply DB --local

# Apply migrations to remote test environment:
npx wrangler d1 migrations apply DB --env test --remote

# Apply migrations to production database:
npx wrangler d1 migrations apply DB --remote
```

### 6.5 Operational Inspection & Telemetry Rules
1. **PII and Financial Privacy Protection:**
   - Never log full customer mobile numbers or full 12-digit UTR references to Cloudflare Logs / Workers Tail.
   - Audit logs store masked UTR (`******${utr.slice(-4)}`).
   - Order retrieval responses enforce `Cache-Control: no-store, no-cache, must-revalidate`.

2. **D1 Database Health Check:**
```bash
# Check order counts and status breakdown
npx wrangler d1 execute DB --remote --command "SELECT operational_status, payment_status, count(*) FROM orders GROUP BY operational_status, payment_status;"

# Inspect recent audit logs
npx wrangler d1 execute DB --remote --command "SELECT id, action, operator_id, reason, created_at FROM price_audit_logs ORDER BY created_at DESC LIMIT 10;"
```

3. **Cloudflare Free-Tier Resource Quotas:**
   - **Cloudflare Pages:** Unlimited requests; 500 deployments per month.
   - **Cloudflare Workers / Pages Functions:** 100,000 requests per day (Free tier).
   - **Cloudflare D1:** 5 million row reads per day, 100,000 row writes per day, 5 GB storage.
   - **Cloudflare Access:** Up to 50 free seats for Zero Trust team members.
   - *Total recurring software and hosting charges: ₹0.*

### 6.6 Emergency Rollback & Disaster Recovery
1. **Frontend / Function Instant Rollback:**
   - In Cloudflare Pages dashboard: Go to **Deployments** $\rightarrow$ select the previous known good deployment $\rightarrow$ click **Rollback to this deployment**.
   - Or via CLI: `npx wrangler pages deployment rollback <deployment-id>`.
2. **Database Backup & Restoration:**
   - Periodic SQL export: `npx wrangler d1 export DB --remote --output backup_$(date +%Y%m%d).sql`.
   - Restore from snapshot if needed: `npx wrangler d1 execute DB --remote --file backup_YYYYMMDD.sql`.
3. **Emergency Credential Rotation:**
   - If Cloudflare Access audience or signing credentials leak, rotate the Access Application in Zero Trust dashboard and update `CF_ACCESS_AUD` immediately using `npx wrangler secret put CF_ACCESS_AUD`.

