# 09 — Deployment Runbook & Infrastructure Guide

> **Status:** Reconciled & Fully Verified in Milestone 6 (Production Cloudflare Deployment, Custom Domain & Launch Readiness).  
> **Tooling:** Wrangler v3+ / GitHub Actions / `@cloudflare/vitest-plugin` / Playwright  
> **Reference Guide:** See `docs/PRODUCTION_LAUNCH_CHECKLIST.md` for comprehensive step-by-step checklist.

---

## 1. Wrangler Configuration (`wrangler.jsonc`)

The production configuration separates local development defaults from the production edge environment:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "qroute-platform",
  "main": "src/server/index.ts",
  "compatibility_date": "2026-10-01",
  "compatibility_flags": ["nodejs_compat"],

  // Workers Static Assets for Client Application
  "assets": {
    "directory": "./dist/client",
    "binding": "ASSETS",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "single-page-application"
  },

  // Local Development D1 Database Binding
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "qroute_local",
      "database_id": "00000000-0000-0000-0000-000000000000",
      "migrations_dir": "migrations"
    }
  ],

  "vars": {
    "ENVIRONMENT": "development",
    "ACTIVATION_SECRET": "local_dev_activation_secret_not_for_production_32b"
  },

  "observability": {
    "enabled": true
  },

  // Production Environment Definition
  "env": {
    "production": {
      "name": "qroute-platform",
      "vars": {
        "ENVIRONMENT": "production"
      },
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "qroute_production",
          "database_id": "00000000-0000-0000-0000-000000000000",
          "migrations_dir": "migrations"
        }
      ],
      "routes": [
        {
          "pattern": "qr.yourbrand.com",
          "custom_domain": true
        }
      ]
    }
  }
}
```

---

## 2. Multi-Domain Routing & Co-Existence Architecture

To support multiple concurrent hostnames on the same Worker:
1. Navigate to **Workers & Pages** $\rightarrow$ `qroute-platform` $\rightarrow$ **Settings** $\rightarrow$ **Triggers**.
2. Under **Custom Domains**, add:
   - Development/Pilot domain: `qroute.workers.dev` (built-in).
   - Owned production domain: `qr.yourbrand.com` (verified zone).
3. **Co-Existence Invariant:** Both hostnames route to the same Worker instance and single indexed D1 query simultaneously. Physical cards printed with either hostname never break.

---

## 3. Secret Provisioning Protocol

Secrets are encrypted and managed strictly at the edge using Wrangler. Never commit secrets to version control.

```bash
# Provision production activation HMAC secret
npx wrangler secret put ACTIVATION_SECRET --env production

# Provision production Turnstile secret key
npx wrangler secret put TURNSTILE_SECRET_KEY --env production

# (Optional) Provision admin allowed emails allowlist
npx wrangler secret put ADMIN_ALLOWED_EMAILS --env production
```

---

## 4. Production CI/CD Pipeline (`.github/workflows/deploy.yml`)

```yaml
name: Production CI/CD Pipeline

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run format:check
      - run: npm run test # Runs all Vitest suites with @cloudflare/vitest-plugin
      - run: npm run test:e2e # Runs all Playwright E2E suites

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - name: Apply D1 Migrations
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: npm run d1:migrate:prod
      - name: Deploy Worker & Static Assets
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: npm run deploy:prod
```

---

## 5. Operations & CLI Reference

| Operational Task | Command | Target Environment |
|---|---|---|
| **Local dev server** | `npm run dev:worker` | Local Miniflare / SQLite |
| **Apply local migrations** | `npm run d1:migrate:local` | `.wrangler/state/v3/d1` |
| **Seed local database** | `npm run d1:seed:local` | Local SQLite fleet |
| **Apply remote migrations** | `npm run d1:migrate:prod` | Remote `qroute_production` D1 |
| **Deploy production** | `npm run deploy:prod` | Cloudflare Edge (`env.production`) |
| **Rollback deployment** | `npx wrangler rollback --env production` | Preceding Edge Release |
| **Time Travel restore** | `npx wrangler d1 time-travel restore qroute_production --bookmark <ID>` | Remote Production D1 |
