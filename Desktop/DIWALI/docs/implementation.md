# NAGARJUNA TRADERS: IMPLEMENTATION PLAN & MILESTONE ROADMAP

**Document Reference:** `docs/implementation.md`  
**Development Methodology:** Small Conventional Commits, Feature Branching, Zero Unreviewed Merges  
**Execution Environment:** Antigravity AI Pair Programming  
**Branch Strategy:** Dedicated feature branches per milestone; PR review before merge to `main`

---

## 1. Milestone Overview & Timeline Estimates

```
MILESTONE TIMELINE & DEPENDENCY GRAPH
[M1: Spec & Design Review] ──> [M2: Core Customer UI] ──> [M3: Backend & Admin API]
        (Complete)                   (Complete)                  (Complete)
                                                                         │
                                                                         ▼
[M6: Production Launch] <── [M5: Payment Consistency] <── [M4: Payment Flow]
     (Upcoming)                    (Complete)                  (Complete)

TOTAL PROGRESS: All Milestones (M1 to M6) Completed
```

| Milestone | Scope Description | Output Deliverables | Status | Release Gate |
|---|---|---|:---:|---|
| **Milestone 1** | **Repository & Product Specification** | Complete 20 docs, legal assessment, catalogue extraction, design review. | **Completed** | Full documentation approved. |
| **Milestone 2** | **Core Customer Interface** | Responsive React 18 + TS + Vite app, authentic 6-category UI, paise cart engine, transient customer form, copy enquiry summary, 42 passing tests. | **Completed** | 100% tests pass (42/42), bundle < 65 KB gzip, zero lint/build errors. |
| **Milestone 3** | **Backend Edge API & Admin Console** | Cloudflare Workers API, D1 schema migrations, Turnstile verification, Cloudflare Access admin auth. | **Completed** | Auth enforced, D1 parameterised queries working. |
| **Milestone 4** | **Payment Workflow & Verification** | Non-payable QR fixture, tiered tokens (< ₹200 $\rightarrow$ ₹50, $\ge$ ₹200 $\rightarrow$ ₹100), 12-digit string UTR validation, duplicate rejection (409). | **Completed** | 100% tests pass (66/66), clean production build. |
| **Milestone 5** | **Payment Consistency, Security Audit & Deployment Readiness** | Scrubbed unverified claims, truthful disabled payment message, safe subtotal below token rule, strict X-Order-Token header lookup, Cloudflare Access JWT validation, removal of bank reconciliation, 69 passing tests across 11 files. | **Completed** | 100% tests pass (69/69), clean build. |
| **Milestone 6** | **Cloudflare Hosting, Database Setup & End-to-End Verification** | Production fail-closed environment gating, parameterised D1 database adapter, atomic batch queries, sequential schema migrations, Pages Functions entrypoint, 99 passing tests across 14 files. | **Completed** | 100% tests pass (99/99), zero compile errors. |

---

## 2. Git Feature Branching Strategy

To maintain repository safety and prevent accidental overrides:
1. **Never commit directly to `main`.**
2. Every milestone executes on an isolated task branch starting from an approved clean base.
3. Commits follow the **Conventional Commits** specification (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`).

| Milestone | Target Feature Branch | Base Branch | Commit Message |
|---|---|---|---|
| **M1** | `feature/nagarjuna-store-docs` | `HEAD` | `docs(spec): finalize master architecture and design system` |
| **M2** | `feature/nagarjuna-customer-ui` | `main` | `feat(ui): implement responsive 6-category catalogue grid` |
| **Correction** | `fix/nagarjuna-demo-mode-and-catalogue` | `feature/nagarjuna-customer-ui` | `fix(demo): enforce fixed token and portfolio demo framing` |
| **M3** | `feature/nagarjuna-demo-backend-admin` | `fix/nagarjuna-demo-mode-and-catalogue` | `feat(api): create d1 order management and admin routes` |
| **M4** | `feature/nagarjuna-order-payment-flow` | `feature/nagarjuna-demo-backend-admin` | `feat(pay): implement tiered advance tokens, upi qr fixtures, utr submission` |
| **M5** | `fix/nagarjuna-payment-flow-consistency` | `feature/nagarjuna-order-payment-flow` | `fix(security): align payment status and protect order access` |
| **M6** | `feature/nagarjuna-cloudflare-deployment` | `fix/nagarjuna-access-jwt-and-token-boundary` | `chore(deploy): configure restricted Cloudflare environment` |

---

## 3. Milestone Execution Steps

### Milestone 5: Payment Consistency, Security Audit & Deployment Readiness (COMPLETED)
1. **Branch Safety:** Created and developed on `fix/nagarjuna-payment-flow-consistency` branched from `feature/nagarjuna-order-payment-flow`.
2. **Scrubbed Unverified Storefront Claims:**
   - Removed unverified claims regarding licensing, wholesale status, physical premises, collection availability, and statutory requirements (Supreme Court, PESO, Explosives Rules) from `Header.tsx`, `Footer.tsx`, `HomeView.tsx`, and `ReviewView.tsx`.
   - Preserved authentic poster catalogue names and exact prices.
3. **Truthful Disabled Payment Notice:**
   - When public payment collection is disabled in production, the application displays: *"Payment instructions are currently unavailable."*
   - Does not present a test QR code as a real payment method or expose test VPAs as real merchant addresses to the public.
   - Does not request real UTRs or send real customer details to the backend when payment is disabled.
   - Complete payment flow remains testable in local or restricted test environments with synthetic records and non-payable test QR fixture.
4. **Shared Tiered Token Calculation Engine (`src/utils/tokenPolicy.ts`):**
   - Subtotal < ₹200 (`20,000 paise`): token is **₹50** (`5,000 paise`).
   - Subtotal $\ge$ ₹200 (`20,000 paise`): token is **₹100** (`10,000 paise`).
   - Exact ₹200 boundary tested to belong to ₹100 tier.
   - Safe rule for subtotals below token amount (e.g. ₹30): token capped at subtotal (`Math.min(subtotalPaise, 5000)` = ₹30), remaining balance is ₹0. Remaining balance is never negative.
   - Removed unapproved ₹50 minimum order barrier.
5. **UTR Submission & Absence of Verification Claims:**
   - 12-digit numeric string validation (`/^\d{12}$/`), retaining leading zeroes and rejecting duplicates with `409 Conflict`.
   - Recorded status strictly set to `RECORDED_UNVERIFIED`.
   - Eradicated manual bank reconciliation buttons, verification modals, and operations claiming to establish receipt of funds (`400 PAYMENT_VERIFICATION_DISABLED`).
   - Removed metrics claiming to represent money collected or verified from the admin dashboard.
6. **Protected Order Lookup:**
   - Removed URL query parameter tokens (`?token=...`).
   - Strictly require `X-Order-Token` header for private order access; reject missing with 401 and invalid with 403.
   - Added anti-caching response header: `Cache-Control: no-store, no-cache, must-revalidate`.
7. **Production Admin Authentication:**
   - In production, admin routes strictly require valid Cloudflare Access JWT Assertion (`Cf-Access-Jwt-Assertion`), validating structure, issuer, audience (`CF_ACCESS_AUD`), and expiration (`exp`).
   - Password login in production is blocked with `403 Forbidden`. Local development uses isolated mock token.
8. **Automated Verification:**
   - 69 Vitest tests passing across 11 test files (100% green).
   - Zero TypeScript compile errors (`npm run build` succeeds).

---

### Final Security Patch: Cloudflare Access JWT Verification & Exact Token Boundary Policy (COMPLETED)
1. **Branch Safety:** Created `fix/nagarjuna-access-jwt-and-token-boundary` branched from `fix/nagarjuna-payment-flow-consistency`.
2. **Cryptographic Cloudflare Access JWT Verification (`src/server/accessJwt.ts`):**
   - Implemented cryptographic signature verification using the maintained, Workers-compatible `jose` library (`RS256`).
   - Fetches and caches public signing keys from documented Cloudflare Access certs endpoint (`https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`).
   - Handles key rotation using key ID (`kid`).
   - Validates issuer (`CF_ACCESS_TEAM_DOMAIN`), audience (`CF_ACCESS_AUD`), expiration (`exp`), and not-before (`nbf`).
   - Validates authenticated operator identities against optional configured allowlist (`CF_ACCESS_ALLOWED_ADMINS`).
   - Fails closed on any error (401, 403, 500).
   - Segregates dev/test auth tokens from production.
3. **Exact Token Boundary Policy (`src/utils/tokenPolicy.ts`):**
   - Subtotal < ₹200: token strictly ₹50 (`5,000 paise`).
   - Subtotal $\ge$ ₹200: token strictly ₹100 (`10,000 paise`).
   - Subtotal < ₹50: rejected with `400 Bad Request` (`SUBTOTAL_BELOW_MINIMUM_TOKEN`) because required token exceeds subtotal. Removed silent reduction below ₹50.
   - Exact ₹50 boundary: token ₹50, remaining balance ₹0.
   - Exact ₹200 boundary: token ₹100, remaining balance ₹100.
4. **Comprehensive Automated Verification:**
   - 85 Vitest tests passing across 12 test files (100% green).
   - `tsc --noEmit` and `npm run build` succeed with 0 errors.

---

### Milestone 6: Cloudflare Hosting, Database Setup & End-to-End Verification (COMPLETED)
1. **Branch Safety:** Created `feature/nagarjuna-cloudflare-deployment` branched from `fix/nagarjuna-access-jwt-and-token-boundary` (`3fe2960`).
2. **Server-Side Environment Security Gating (`src/server/api.ts`):**
   - Eliminated client header override vulnerabilities: `X-Restricted-Test-Mode` is strictly ignored and removed from CORS headers.
   - Production (`ENVIRONMENT: 'production'`) strictly fails closed: test mode disabled, test QR fixtures omitted, UTR submission blocked (`403 PAYMENT_COLLECTION_DISABLED`), password login blocked (`403 PASSWORD_AUTH_DISABLED`).
   - Restricted testing gated purely by server-side configuration (`env.RESTRICTED_TEST_MODE === 'true'` or `env.ENVIRONMENT === 'test'`).
3. **Cloudflare Deployment Architecture & Wrangler Configuration (`wrangler.jsonc`):**
   - Pages Functions entrypoint (`functions/api/[[route]].ts`) forwards `request` and `env` directly to `handleApiRequest`.
   - Production environment bound to D1 database `nagarjuna-traders-d1-prod` with `ENVIRONMENT="production"`.
   - Test environment (`env.test`) bound to D1 database `nagarjuna-traders-d1-test` with `RESTRICTED_TEST_MODE="true"`.
4. **Cloudflare D1 Database Adapter (`src/server/db.ts`):**
   - Implemented `D1DatabaseAdapter` utilizing 100% parameterised prepared statements (`this.d1.prepare(...).bind(...)`).
   - Atomic batch transactions (`d1.batch([...])`) for order creation, price updates, operational transitions, and UTR submissions.
   - PII protection: Audit logs store masked UTR (`******${utr.slice(-4)}`).
   - Zero SQL injection surface.
5. **Database Migration Alignment (`migrations/0004_orders_schema_alignment.sql`):**
   - Canonical `orders` table schema with constraints `CHECK (subtotal_paise >= 5000)`, `CHECK (token_amount_paise IN (5000, 10000))`, `CHECK (payment_status IN ('UNPAID', 'RECORDED_UNVERIFIED', 'FAILED'))`.
   - Initialized system settings for token tiers and minimum order subtotals.
6. **Automated Verification:**
   - 99 passing Vitest tests across 14 test files (100% green).
   - Added unit test suites for server-side environment gating (`tests/unit/environmentGating.test.ts`) and D1 database adapter (`tests/unit/d1Adapter.test.ts`).
   - `tsc --noEmit` and `npm run build` verify 0 type errors and successful Vite production asset bundling.

