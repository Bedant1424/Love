# 09 — Deployment Runbook & Infrastructure Guide

> **Status:** Reconciled & Verified through Milestones 1–4. Runtime foundation, D1 migrations, client assets, and local dev server verified. See `docs/ADMIN_OPERATIONS.md`.  
> **Tooling:** Wrangler v3+ / GitHub Actions / `@cloudflare/vitest-plugin`

---

## 1. Wrangler Configuration (`wrangler.jsonc`)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "qroute-platform",
  "main": "src/worker/index.ts",
  "compatibility_date": "2026-10-01",
  "compatibility_flags": ["nodejs_compat"],

  // Workers Static Assets for Client Application
  "assets": {
    "directory": "dist/client",
    "binding": "ASSETS",
    "html_handling": "single-page-application",
    "not_found_handling": "single-page-application"
  },

  // Cloudflare D1 Database Binding
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "qroute_production",
      "database_id": "00000000-0000-0000-0000-000000000000",
      "migrations_dir": "migrations"
    }
  ],

  "observability": {
    "enabled": true
  }
}
```

---

## 2. Multi-Domain Routing Setup (Cloudflare Dashboard)

To support multiple concurrent hostnames on the same Worker:
1. Navigate to **Workers & Pages** $\rightarrow$ `qroute-platform` $\rightarrow$ **Settings** $\rightarrow$ **Triggers**.
2. Under **Custom Domains**, add:
   - Development/Pilot domain: `qroute.workers.dev` (built-in).
   - Future owned custom domain: `qr.yourbrand.com` (verified zone).
3. Both hostnames route to the same Worker instance simultaneously.

---

## 3. GitHub Actions CI/CD Pipeline (`.github/workflows/deploy.yml`)

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
      - run: npm run test:unit # Runs Vitest with @cloudflare/vitest-plugin

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build:client
      - name: Apply D1 Migrations
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: npx wrangler d1 migrations apply qroute_production --remote
      - name: Deploy Worker & Assets
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: npx wrangler deploy
```
