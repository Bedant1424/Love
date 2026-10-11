# NAGARJUNA TRADERS — CLOUDFLARE DEPLOYMENT SPECIFICATION

**Document Reference:** `docs/cloudflare-deployment.md`  
**Target Infrastructure:** Cloudflare Free Ecosystem (Pages + Workers + D1 + Turnstile + Access)  
**IaC Tool:** Wrangler CLI (`wrangler.jsonc`)  
**Deployment Pipeline:** GitHub Actions CI/CD to Cloudflare

---

## 1. Cloudflare Resource Topology

```
+───────────────────────────────────────────────────────────────────────────────────+
| CLOUDFLARE ACCOUNT DASHBOARD (Account: f5007499f208d03d531ad81e9d1f33aa)          |
|                                                                                   |
| 1. Clean Production Pages Project: 'nagarjuna-traders'                            |
|    - Production URL: https://nagarjuna-traders.pages.dev                          |
|    - Direct Deployment: https://cf638cde.nagarjuna-traders.pages.dev              |
|    - Build Command: `npm run build` (Output Directory: `dist`)                    |
|    - Pages Functions: `functions/[[path]].ts` edge proxy                          |
|                                                                                   |
| 2. Isolated Test Pages Project: 'nagarjuna-traders-test' (Preserved Intact)       |
|    - Preview URL: https://nagarjuna-traders-test.pages.dev                        |
|                                                                                   |
| 3. Cloudflare D1 Database: 'nagarjuna-traders-d1-test'                            |
|    - Database ID: aace32a4-8ec3-487e-b202-a98e898868bc                           |
|    - Migrations: 0001 through 0007 applied                                        |
|                                                                                   |
| 4. Cloudflare R2 Bucket: 'nagarjuna-qr-images' (Pending Dashboard Activation)     |
|    - Storage Strategy: Decoupled metadata in D1, binary raster bytes in R2        |
|    - Fallback: Deterministic simulated in-memory storage until R2 enabled (10042)  |
|    - Public Proxy Route: `/api/v1/qr-images/:id`                                  |
|                                                                                   |
| 5. Cloudflare Zero Trust (Access Application):                                    |
|    - Protected Routes: `/admin*` and `/api/v1/admin/*`                            |
|    - Cryptographic Verification: RS256 signature, JWKS rotation, aud & iss checks |
|    - Revoked Tokens: admin-jwt-session-nagarjuna permanently blocked               |
+───────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Infrastructure Configuration (`wrangler.jsonc`)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "nagarjuna-traders-api",
  "main": "src/server/index.ts",
  "compatibility_date": "2026-10-01",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "nagarjuna-traders-d1",
      "database_id": "<PRODUCTION_D1_DATABASE_ID>"
    }
  ],
  "vars": {
    "COMMERCE_CHECKOUT_ENABLED": "false",
    "STORE_NAME": "Nagarjuna Traders",
    "STORE_LOCATION": "Sivakasi / Counter Collection",
    "STORE_UPI_VPA": "nagarjunatraders@okhdfcbank",
    "STORE_PHONE": "+919876543210",
    "TOKEN_PERCENTAGE": "20",
    "MIN_TOKEN_AMOUNT_PAISE": "10000"
  }
}
```

---

## 3. Environment Secrets Management

Production secrets are NEVER committed to source control. They are provisioned strictly via the encrypted Cloudflare CLI or dashboard:

```bash
# Set Turnstile Secret Key for Server Verification
npx wrangler secret put TURNSTILE_SECRET_KEY

# Set Administrative JWT Secret (if not using Cloudflare Access)
npx wrangler secret put ADMIN_JWT_SECRET
```

Local development uses `.dev.vars` (ignored in `.gitignore`):
```ini
# .dev.vars (LOCAL ONLY)
TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"
ADMIN_JWT_SECRET="local_dev_secret_key_32_bytes_long_minimum"
```

---

## 4. D1 Database Provisioning & Migrations

### 4.1 Creating the Database
```bash
# Create the production D1 database
npx wrangler d1 create nagarjuna-traders-d1
```

### 4.2 Applying Migrations
All schema updates are versioned in `migrations/`:
- `migrations/0001_initial_schema.sql` (Creates categories, products, variants, orders, items, payments, audit)
- `migrations/0002_seed_catalogue.sql` (Seeds authentic poster categories and items)

```bash
# Apply migrations to local SQLite emulator
npx wrangler d1 migrations apply nagarjuna-traders-d1 --local

# Apply migrations to live production D1 database
npx wrangler d1 migrations apply nagarjuna-traders-d1 --remote
```

---

## 5. Build, Test & Deployment Workflow

### 5.1 Local Development
```bash
# 1. Install dependencies
npm install

# 2. Run local development server (Vite + Miniflare Edge runtime)
npm run dev
```

### 5.2 Production Release Pipeline (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build

      - name: Deploy Pages & Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=nagarjuna-traders-web
```

---

## 6. Live Monitoring, Logs & Rollback Runbook

### 6.1 Real-Time Edge Logs
```bash
# Tail live production worker logs (sanitized)
npx wrangler tail nagarjuna-traders-api
```

### 6.2 Instant Rollback Procedure
If a production defect is discovered:
1. **Frontend Rollback:** Open Cloudflare Dashboard -> **Pages** -> **nagarjuna-traders-web** -> **Deployments**. Click the previous known-good deployment and select **Rollback to this deployment**. (Takes < 5 seconds).
2. **Feature Freeze:** Immediately disable checkout by running:
   ```bash
   npx wrangler secret put COMMERCE_CHECKOUT_ENABLED # Enter 'false'
   ```
3. **Database Restore:** D1 provides automatic Time-Travel point-in-time recovery for up to 30 days. To restore:
   ```bash
   npx wrangler d1 time-travel restore nagarjuna-traders-d1 --timestamp="2026-10-10T12:00:00Z"
   ```
