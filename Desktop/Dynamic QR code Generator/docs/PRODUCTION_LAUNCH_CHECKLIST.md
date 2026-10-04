# Production Launch Checklist & Deployment Guide — QRoute Platform

> **Milestone:** Milestone 6 — Production Cloudflare Deployment, Custom Domain & Launch Readiness  
> **Status:** Production Launch Ready  
> **Target Cost:** \$0.00 / month (100% Cloudflare Free Tier & Open Source)  
> **Operating Runtime:** Cloudflare Workers + D1 + React 19 Static Assets + Cloudflare Access + Turnstile

---

## 1. Architecture & Multi-Hostname Co-Existence

QRoute is engineered for **Multi-Hostname Resilience**. Physical review cards and NFC chips encode strictly the card redirect URL:

```text
Customer Physical Scan/Tap
           │
           ▼
   [Canonical Host]
   (e.g., https://qr.yourbrand.com/c/A7K92P4X8Q  OR  https://qroute.workers.dev/c/A7K92P4X8Q)
           │
           ▼
    Cloudflare Edge Worker
           │
           ▼
     Single Indexed D1 Query: SELECT status, destination_url FROM cards WHERE public_id = ?
           │
           ├─► ACTIVE:      HTTP 302 ──► https://search.google.com/local/writereview?placeid=...
           ├─► UNACTIVATED: HTTP 302 ──► /activate/A7K92P4X8Q (preserves host)
           ├─► DISABLED:    HTTP 200 ──► Accessible Temporary Maintenance Screen
           ├─► RETIRED:     HTTP 200 ──► Terminal Retired Notice
           └─► UNKNOWN:     HTTP 404 ──► Generic Not Found Screen
```

### Physical Invariants
1. **Never Encode Google Destination in Physical Cards:** The physical QR code or NFC chip encodes strictly `https://<HOST>/c/<publicId>`. The Google URL is resolved dynamically at the edge.
2. **Co-Existence Invariant:** Pilot cards printed with `qroute.workers.dev` and production cards printed with `qr.yourbrand.com` resolve on the same Worker and same D1 database simultaneously without data migration or reprinting.

---

## 2. Cloudflare Free Tier Provisioning Step-by-Step

All services utilize standard, officially published 2026 Cloudflare Free Tier resources with \$0 monthly infrastructure expenditure.

### Step 2.1: Cloudflare D1 Production Database Creation
Run via terminal authenticated with Wrangler:
```bash
# 1. Create production database on Cloudflare edge
npx wrangler d1 create qroute_production
```
*Note the returned `database_id` (UUID format). Update `wrangler.jsonc` under `env.production.d1_databases[0].database_id` with this value.*

### Step 2.2: Apply Production Schema Migration
Execute the numbered forward-only migration against remote production D1:
```bash
# Apply migration to remote D1
npm run d1:migrate:prod
# Or directly:
npx wrangler d1 migrations apply qroute_production --remote --env production
```

Verify that the remote database is completely clean (zero dev seed data) and contains all required performance indexes:
- `idx_cards_public_id` (UNIQUE)
- `idx_cards_batch_id`
- `idx_cards_status`
- `idx_audit_logs_card_id`
- `idx_audit_logs_created_at`

### Step 2.3: Production Secret Configuration
Set server secrets securely using Wrangler secret storage. **Never** commit secrets to git repositories, `.env` files, or build artifacts.

```bash
# 1. Provision cryptographic activation secret (minimum 32 random bytes)
# Generate a cryptographically random 32-byte hex secret:
# In Node: crypto.randomBytes(32).toString('hex')
npx wrangler secret put ACTIVATION_SECRET --env production

# 2. Configure Cloudflare Turnstile Secret Key (obtained from Turnstile dashboard)
npx wrangler secret put TURNSTILE_SECRET_KEY --env production

# 3. (Optional) Configure admin email allowlist
npx wrangler secret put ADMIN_ALLOWED_EMAILS --env production
```

### Step 2.4: Cloudflare Turnstile Setup
1. In Cloudflare Dashboard, navigate to **Turnstile** $\rightarrow$ **Add Widget**.
2. **Widget Name:** `QRoute Card Activation`.
3. **Domain:** Add both `workers.dev` subdomain and pilot hostname (e.g., `taprevieww.workers.dev`, `go.taprevieww.workers.dev`), and any future custom domain (no `https://` prefix).
4. **Widget Mode:** *Managed* (or *Non-interactive*).
5. Copy the **Sitekey** and insert it into client configuration (`VITE_TURNSTILE_SITE_KEY`).
6. Copy the **Secret Key** and save via `wrangler secret put TURNSTILE_SECRET_KEY --env production`.

### Step 2.5: Cloudflare Access (Zero Trust) Perimeter
1. In Cloudflare Dashboard, navigate to **Zero Trust** $\rightarrow$ **Access** $\rightarrow$ **Applications**.
2. **Add an Application** $\rightarrow$ **Self-hosted**.
3. **Application Name:** `QRoute Admin Console`.
4. **Application Domain:** `qr.yourbrand.com` (Path: `/admin*` and `/api/admin*`).
5. **Session Duration:** 24 hours.
6. **Policy Definition:**
   - **Policy Name:** `Authorized Operators`.
   - **Action:** `Allow`.
   - **Include Rule:** `Emails` ending in `@yourbrand.com` (or specific operator email list).
7. Under Zero Trust Free Tier, up to 50 administrative seats are included at \$0 cost.

### Step 2.6: Custom Domain Attachment
1. In Cloudflare Dashboard, navigate to **Workers & Pages** $\rightarrow$ `go` $\rightarrow$ **Settings** $\rightarrow$ **Triggers**.
2. Click **Add Custom Domain**.
3. Enter `qr.yourbrand.com` (DNS zone managed in Cloudflare).
4. Cloudflare automatically issues universal SSL certificates and provisions the edge route.

---

## 3. Deployment Runbook

### Step 3.1: Pre-Deployment Build & Verification
Before pushing to production, verify all suites pass locally:

```bash
# 1. Verify strict SSL configuration
npm config get strict-ssl
# Expected: true

# 2. Run TypeScript typecheck
npm run typecheck

# 3. Run ESLint code quality checks
npm run lint

# 4. Verify formatting
npm run format:check

# 5. Run full Vitest integration suite (12 files, 174 tests)
npm test

# 6. Run Playwright E2E browser test suite (22 tests)
npm run test:e2e

# 7. Build production client bundle
npm run build
```

### Step 3.2: Production Deployment
Deploy the compiled client bundle and worker to Cloudflare edge:

```bash
npm run deploy:prod
# Or: npx wrangler deploy --env production
```

---

## 4. Post-Deployment Smoke Test Protocol

Run these verification checks immediately after deployment to guarantee operational readiness:

### 1. Health Probe Verification
```bash
curl -I https://qr.yourbrand.com/healthz
# Expected: HTTP 200 OK
# Body: {"status":"ok","timestamp":"...","environment":"production"}
```

### 2. Multi-Hostname Pilot Verification
```bash
curl -I https://go.taprevieww.workers.dev/healthz
# Expected: HTTP 200 OK
```

### 3. Public Redirect Path Smoke Test
```bash
curl -I https://qr.yourbrand.com/c/UNKNOWN999
# Expected: HTTP 404 Not Found
# Headers: Cache-Control: private, no-cache, no-store, must-revalidate
#          Referrer-Policy: no-referrer
#          X-Content-Type-Options: nosniff
#          X-Frame-Options: DENY
```

### 4. Admin Security Perimeter Verification
```bash
# Test 1: Direct request without Cloudflare Access headers
curl -I https://qr.yourbrand.com/api/admin/dashboard
# Expected: HTTP 401 Unauthorized

# Test 2: Verify dev bypass header is strictly ignored in production
curl -I -H "x-admin-email: attacker@fake.com" https://qr.yourbrand.com/api/admin/dashboard
# Expected: HTTP 401 Unauthorized (Bypass strictly rejected in production)
```

### 5. Turnstile Bot Defense Verification
```bash
# Attempt activation without Turnstile token
curl -X POST https://qr.yourbrand.com/api/public/activate \
  -H "Content-Type: application/json" \
  -d '{"publicId":"TEST123456","businessName":"Test","reviewUrl":"https://g.page/r/test/review","activationCode":"1111-2222-3333"}'
# Expected: HTTP 403 Forbidden ({"success":false,"error":{"code":"TURNSTILE_FAILED"}})
```

---

## 5. Capacity Planning & Free Tier Boundaries

QRoute operates strictly within published Cloudflare Free Tier quotas:

| Resource | Cloudflare Free Limit | QRoute Pilot Consumption | Safety Margin |
|---|---|---|---|
| **Workers Dynamic Invocations** | 100,000 req / day | ~500–5,000 scans / day | > 95% headroom |
| **Worker CPU Time** | 10 ms / request | 1–3 ms edge latency | > 70% headroom |
| **D1 Database Reads** | 5,000,000 rows / day | Exactly 1 read per scan | > 99% headroom |
| **D1 Database Writes** | 100,000 rows / day | Zero writes on redirect; 1 write on activation | > 99% headroom |
| **D1 Storage Capacity** | 5 GB | ~1 MB per 10,000 cards | > 99.9% headroom |
| **Cloudflare Turnstile** | Unlimited challenges | Form activations only | 100% covered |
| **Cloudflare Access (Zero Trust)** | 50 free seats | 1–5 internal operators | 90% headroom |
| **Workers Static Assets** | Included in Workers Free | Cached edge delivery | 100% covered |

### Zero Overdraft Guarantee:
If the 100,000 daily Worker request limit is ever reached under extraordinary load:
- Cloudflare edge returns HTTP 1027 or 429 until the daily reset at 00:00 UTC.
- **Zero billable credit card charges or financial penalties occur.**

---

## 6. Disaster Recovery & Rollback Runbook

### Rollback Scenario A: Worker Application Code Issue
If a worker release introduces an unexpected issue, roll back instantly via Wrangler:
```bash
# Roll back to the preceding deployment version
npx wrangler rollback --env production
```

### Rollback Scenario B: Database Accidental Mutation
1. **D1 Time Travel (7-day rolling window included free):**
```bash
# Retrieve database bookmarks
npx wrangler d1 time-travel info qroute_production

# Restore to specific timestamp or bookmark
npx wrangler d1 time-travel restore qroute_production --bookmark <BOOKMARK_ID>
```
2. **Encrypted Offsite Backup Recovery:**
```bash
gpg --decrypt --passphrase "$BACKUP_GPG_PASSPHRASE" backups/qroute_prod_latest.sql.gpg > restore.sql
npx wrangler d1 execute qroute_production --remote --file=restore.sql
```

---

## 7. Physical Manufacturing Gate Criteria

Before authorizing the physical printing of CR-80 cards or encoding NFC tags:

- [ ] **Domain Permanence Confirmed:** The target hostname (`qr.yourbrand.com`) is an owned, active, authoritative domain with auto-renewal enabled.
- [ ] **URL Canonical Format Verified:** Physical QR code and NFC payload encode strictly: `https://<HOST>/c/<publicId>`. **Never the Google review URL.**
- [ ] **Level H Error Correction Verified:** QR codes are generated with ISO/IEC 18004 Level H error correction (30% recovery capability for scratched cards) and a 4-module quiet zone.
- [ ] **NFC NTAG213 Capacity Verified:** NDEF URI payload length is $< 45$ bytes, well within the 144-byte NTAG213 limit.
- [ ] **Physical Print Proof Scanned:** A printed physical proof was scanned with both iOS Camera and Android Google Lens under low light and direct glare.
- [ ] **Zero-Knowledge Manifest Verified:** The supplier manifest (`manifest.csv`) contains zero merchant names, zero Google review URLs, and zero internal database IDs.
- [ ] **Batch Provisioning Verified in D1:** All cards in the batch exist in `UNACTIVATED` status in the production D1 database with hashed activation codes.

---

## 8. Launch Sign-Off

| Milestone Milestone Phase | Verification Criteria | Status |
|---|---|---|
| Milestone 1: Runtime & Database Foundation | Worker, Static Assets, D1 SQLite, `/healthz` | ✅ APPROVED |
| Milestone 2: Public QR Redirect Engine | 1 Indexed D1 read, zero writes, 302 routing | ✅ APPROVED |
| Milestone 3: Cryptography & Activation | HMAC-SHA256, URL validator, atomic state | ✅ APPROVED |
| Milestone 4: Admin Console & Lifecycle | Zero Trust perimeter, state transitions | ✅ APPROVED |
| Milestone 5: Physical Asset Pipeline | Level H vector QR, NTAG213 NFC, supplier manifest | ✅ APPROVED |
| Milestone 6: Production Launch Readiness | Multi-hostname, Turnstile prod, zero-leak verification | ✅ APPROVED |
