# QRoute — Self-Hosted Dynamic QR & NFC Review Routing Platform

> **Status:** Milestone 1 Foundation Complete.  
> **Infrastructure Target:** \$0.00 / month on Cloudflare Free Tier.

---

## 1. Project Overview

QRoute is a self-hosted dynamic QR and NFC routing platform designed specifically for physical Google Review cards. It replaces \$15–\$200/month commercial dynamic QR subscriptions with a permanent, ultra-fast Cloudflare edge redirect engine that never locks or holds physical cards hostage.

---

## 2. Core Stack

- **Runtime & Edge API:** Cloudflare Workers + Hono (TypeScript)
- **Edge Database:** Cloudflare D1 (SQLite, single-threaded per DB, indexed point lookups only)
- **Frontend & Static Assets:** React 19 + TypeScript + Vite + Workers Static Assets
- **UI & Styling:** Tailwind CSS v4 + shadcn/ui-inspired primitives (Swiss clean, anti-slop)
- **Testing Architecture:** Vitest + `@cloudflare/vitest-plugin` (Workers binding-aware) + Playwright
- **CI/CD:** GitHub Actions

---

## 3. Quick Start & Developer Commands

### Prerequisites
- Node.js `v22.x` or higher
- npm `v10.x` or higher

### Installation
```bash
npm install
```

### Local Development
```bash
# Start frontend development server (Vite)
npm run dev

# Start local Cloudflare Worker development runtime (Wrangler)
npm run dev:worker
```

### Verification & Testing
```bash
# Typecheck with strict TypeScript rules
npm run typecheck

# Lint with ESLint
npm run lint

# Run all unit and Workers integration tests (with local D1)
npm run test

# Run unit tests only
npm run test:unit

# Run Workers integration tests only
npm run test:integration

# Run Playwright end-to-end browser tests
npm run test:e2e

# Production build for frontend client assets
npm run build
```

---

## 4. Documentation Index

- [`AGENTS.md`](./AGENTS.md) — Contributor & agent directives, prime invariants, and non-negotiable rules.
- [`docs/00-product-spec.md`](./docs/00-product-spec.md) — Product specification and card state machine.
- [`docs/01-system-design.md`](./docs/01-system-design.md) — Edge architecture and sequence diagrams.
- [`docs/02-data-model.md`](./docs/02-data-model.md) — D1 relational schema and indexing strategy.
- [`docs/03-api-spec.md`](./docs/03-api-spec.md) — Full REST API specifications and centralized Google validator.
- [`docs/04-security-model.md`](./docs/04-security-model.md) — Security headers and HMAC cryptographic derivation.
- [`docs/05-threat-model.md`](./docs/05-threat-model.md) — OWASP threat model covering 23 security vectors.
- [`docs/06-ui-ux-spec.md`](./docs/06-ui-ux-spec.md) — Swiss design system and copywriting master.
- [`docs/11-monitoring.md`](./docs/11-monitoring.md) — Capacity boundaries and failure modes.
- [`docs/local-development.md`](./docs/local-development.md) — Detailed developer workflow guide.
- [`docs/testing.md`](./docs/testing.md) — Testing architecture and runner setup.
- [`docs/GITHUB_ACTIONS.md`](./docs/GITHUB_ACTIONS.md) — Continuous integration pipeline documentation.
