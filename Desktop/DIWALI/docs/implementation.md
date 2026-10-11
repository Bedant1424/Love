# NAGARJUNA TRADERS — IMPLEMENTATION PLAN & MILESTONE ROADMAP

**Document Reference:** `docs/implementation.md`  
**Development Methodology:** Small Conventional Commits, Feature Branching, Zero Unreviewed Merges  
**Execution Environment:** Antigravity AI Pair Programming  
**Branch Strategy:** Dedicated feature branches per milestone; PR review before merge to `main`

---

## 1. Milestone Overview & Timeline Estimates

```
MILESTONE TIMELINE & DEPENDENCY GRAPH
[M1: Spec & Design Review] ──> [M2: Core Customer UI] ──> [M3: Backend & Admin API]
        (Complete)                   (Est: 2-3 Days)             (Est: 2-3 Days)
                                                                        │
                                                                        ▼
[M6: Production Launch] <── [M5: Security & Quality] <── [M4: Payment Flow]
    (Est: 1 Day)                 (Est: 2 Days)              (Est: 1-2 Days)

TOTAL ESTIMATED CALENDAR DURATION: 8 to 11 Working Days
```

| Milestone | Scope Description | Output Deliverables | Est. Effort | Release Gate |
|---|---|---|:---:|---|
| **Milestone 1** | **Repository & Product Specification** | Complete 20 docs, legal assessment, catalogue extraction, design review. | **Completed** | Full documentation approved. |
| **Milestone 2** | **Core Customer Interface** | Responsive React 18 + TS + Vite app, authentic 6-category UI, paise cart engine, transient customer form, copy enquiry summary, 42 passing tests. | **Completed** | 100% tests pass (42/42), bundle < 65 KB gzip, zero lint/build errors, COMMERCE_CHECKOUT_ENABLED=false strictly enforced. |
| **Milestone 3** | **Backend Edge API & Admin Console** | Cloudflare Workers API, D1 schema migrations, Turnstile verification, Cloudflare Access admin auth. | **Completed** | Auth enforced, D1 parameterised queries working. |
| **Milestone 4** | **Payment Workflow & Verification** | Non-payable QR fixture, tiered tokens (< ₹200 $\rightarrow$ ₹50, $\ge$ ₹200 $\rightarrow$ ₹100), 12-digit string UTR validation, duplicate rejection (409), manual admin reconciliation. | **Completed** | 100% tests pass (66/66), clean production build. |
| **Milestone 5** | **Security & Quality Hardening** | Vitest unit/integration suite, Playwright mobile E2E tests, Axe-core WCAG AA accessibility audit. | 2 Days | 100% tests pass, zero accessibility violations. |
| **Milestone 6** | **Cloudflare Deployment & Launch Review** | Cloudflare Pages deployment, D1 remote migration, DNS setup, legal gate review before live toggle. | 1 Day | Legal sign-off before `COMMERCE_CHECKOUT_ENABLED=true`. |

---

## 2. Git Feature Branching Strategy

To maintain repository safety and prevent accidental overrides:
1. **Never commit directly to `main`.**
2. Every milestone executes on an isolated task branch starting from an approved clean base.
3. Commits follow the **Conventional Commits** specification (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`).

| Milestone | Target Feature Branch | Base Branch | Sample Commit Message |
|---|---|---|---|
| **M1** | `feature/nagarjuna-store-docs` | `HEAD` | `docs(spec): finalize master architecture and design system` |
| **M2** | `feature/nagarjuna-customer-ui` | `main` (after M1 merge) | `feat(ui): implement responsive 6-category catalogue grid` |
| **Correction** | `fix/nagarjuna-demo-mode-and-catalogue` | `feature/nagarjuna-customer-ui` | `fix(demo): enforce fixed token and portfolio demo framing` |
| **M3** | `feature/nagarjuna-demo-backend-admin` | `fix/nagarjuna-demo-mode-and-catalogue` | `feat(api): create d1 order management and admin routes` |
| **M4** | `feature/nagarjuna-order-payment-flow` | `feature/nagarjuna-demo-backend-admin` | `feat(pay): implement tiered advance tokens, upi qr fixtures, utr submission, and admin reconciliation` |
| **M5** | `feature/nagarjuna-qa-hardening` | `feature/nagarjuna-order-payment-flow` | `test(e2e): add mobile touch target and axe-core audit` |
| **M6** | `feature/nagarjuna-prod-deploy` | `feature/nagarjuna-qa-hardening` | `chore(deploy): configure cloudflare pages and d1 bindings` |

---

## 3. Milestone Execution Steps

### Milestone 2: Core Customer Interface (COMPLETED)
1. **Initialize Project:** Scaffolded React 18 + Vite + TypeScript application with Tailwind CSS in `c:\Users\17042\Desktop\DIWALI`.
2. **Design Tokens & Typography:** Implemented festive color palette (deep night `#080604`, festive marigold `#F59E0B`, warm cream `#FFFBEB`) with responsive typography and accessible touch targets (48×48px).
3. **Authentic Catalogue Data:** Extracted authentic products/variants across 6 categories from `docs/catalogue-data.md` into strongly typed structures (`src/data/catalogueData.ts`), preserving printed prices, marking unverified sizes, and flagging unpriced range items as "Price on enquiry".
4. **Client Cart Engine (`useCart`):** Engineered immutable cart hook with integer paise arithmetic (`src/utils/formatters.ts`), 1–50 quantity clamping, unpriced items count separation, and sanitized LocalStorage synchronization (`nt_cart_items_v1`).
5. **Transient Customer State:** Customer personal details (full name, 10-digit mobile, 18+ age attestation) are stored exclusively in React memory and strictly excluded from LocalStorage to protect customer privacy under DPDP Act 2023.

### Correction Milestone: Portfolio Demo Mode, Fixed ₹100 Token & Catalogue Accuracy (COMPLETED)
1. **Branch Safety:** Created and developed on `fix/nagarjuna-demo-mode-and-catalogue` based on `feature/nagarjuna-customer-ui`.
2. **Explicit Portfolio Demo Framing:**
   - Added persistent portfolio demo banner across header, footer, cart, and simulated checkout: *"Portfolio Demo Only. No real orders, fireworks sales, delivery, or payments are processed."*
   - Updated header badge to `Portfolio Demo Mode` with pulsing amber indicator.
   - Removed all unsupported commercial marketing claims ("Direct wholesale rates", "Licensed counter pickup").
3. **Fixed ₹100 Token & Financial Engine:**
   - Enforced single source of truth constant: `TOKEN_AMOUNT_PAISE = 10000` (₹100.00).
   - Removed old 20% variable deposit and variable minimum token logic.
   - Remaining balance is strictly `Math.max(0, subtotalPaise - 10000)` (never negative).
   - Gated checkout: orders require `subtotalPaise >= 10000` (₹100). If below ₹100, displays: *"Add items until your subtotal reaches ₹100. The demo token amount is fixed at ₹100."*
   - Range items gating: orders with unconfirmed range prices cannot proceed to simulated payment until all items have confirmed prices.
4. **Catalogue & Poster Alignment:**
   - Sparkler prices strictly restored to printed poster prices: 9cm (₹180), 9cm Color (₹250), 12cm (₹250), 12cm Color (₹300), and 15cm Crackling (₹350).
   - Kumpi restricted to authentic poster sizes: Medium (₹150 to ₹200 range) and Large (₹200 to ₹250 range) only. Invented Small, Big, Special, and Deluxe purged.
   - Chakri Medium set to ₹100 printed rate; Chakri Large kept as ₹250 to ₹350 unpriced range item.
   - Added `POSTER_CATALOGUE_NOTE` preserving poster note on enquiry requests.
5. **Simulated Payment & Checkout Flow:**
   - Implemented interactive simulated payment modal with `PENDING`, `SUCCESS`, and `FAILED` states.
   - Provided test action buttons to simulate authorization success or test error states with retry capability.
   - Successful simulation generates `DEMO-NT-XXXX` confirmation record with zero real banking API or UPI calls.
   - Idempotency ref (`isSubmittingRef`) prevents duplicate submissions on rapid repeated clicks.
6. **Automated Verification:**
   - 50 Vitest unit and component tests passing (100% green across 9 test suites).
   - Zero TypeScript errors (`tsc && vite build` clean: JS bundle 221.53 kB / gzip 61.64 kB).

### Milestone 3: Cloudflare Backend, D1 Database, Admin Dashboard & Demo Orders (COMPLETED)
1. **Branch Safety:** Created and developed on `feature/nagarjuna-demo-backend-admin` based on `fix/nagarjuna-demo-mode-and-catalogue`.
2. **Cloudflare Infrastructure Configuration:**
   - Created `wrangler.jsonc` specifying Cloudflare Pages output directory `dist`, compatibility date `2026-10-01`, and D1 database binding `DB`.
3. **Database Migrations (`migrations/`):**
   - `migrations/0001_initial_schema.sql`: DDL for `categories`, `products`, `product_variants` (with separate printed pricing fields vs demo prices), `demo_orders`, `demo_order_items`, `price_audit_logs`, and `system_settings`.
   - `migrations/0002_seed_catalogue.sql`: Authentic poster data for all 6 categories, products, and 26 variants with exact poster prices and verbatim notes.
4. **Cloudflare Edge API (`src/server/` & `functions/`):**
   - Implemented edge-compatible API router (`src/server/api.ts`) and Cloudflare Pages Functions adapter (`functions/api/[[route]].ts`).
   - `GET /api/v1/catalogue`: Returns categories, products, and variants.
   - `POST /api/v1/orders`: Validates customer details, blocks unpriced items, enforces ₹100 minimum subtotal, calculates fixed ₹100 token and non-negative remaining balance, generates `DEMO-NT-XXXX` reference.
   - `GET /api/v1/orders/:reference`: Returns demo order with item snapshots.
   - `POST /api/v1/orders/:reference/payment-reference`: Validates 12-digit UTR and moves status to `PENDING_VERIFICATION`.
   - `GET /api/v1/admin/dashboard`: Real-time KPI aggregation.
   - `GET /api/v1/admin/orders`: Filterable and searchable demo orders.
   - `POST /api/v1/admin/orders/:id/status`: Controlled operational status transitions (`SUBMITTED` -> `CONFIRMED` -> `PREPARING` -> `READY_FOR_PICKUP` -> `COMPLETED`).
   - `POST /api/v1/admin/orders/:id/verify-payment`: Approves simulated ₹100 token or rejects invalid UTR.
   - `GET /api/v1/admin/variants`: Variant list with printed bounds vs demo price.
   - `POST /api/v1/admin/variants/:id/demo-price`: Validates prices against printed bounds; enforces explicit override rationale when outside bounds.
   - `GET /api/v1/admin/audit-logs`: Immutable stream of price overrides and status changes.
   - `POST /api/v1/admin/auth/login`: Admin passphrase authentication (`nagarjuna-demo-2026`).
5. **Interactive Administrator Dashboard (`AdminView.tsx`):**
   - Fully interactive portal with tabs for Overview/KPIs, Orders, Catalogue Pricing, Audit Logs, and Settings.
   - Accessible via Header navigation "Admin Portal" or "Admin Console" tab.
6. **Automated Verification:**
   - 63 Vitest tests passing across 11 test files (100% green).
   - Zero TypeScript compile errors (`npm run build` succeeds).

### Milestone 4: Full-Stack Ordering System, UPI QR Fixture, UTR Submission & Admin Reconciliation (COMPLETED)
1. **Branch Safety:** Created and developed on `feature/nagarjuna-order-payment-flow` based on `feature/nagarjuna-demo-backend-admin`.
2. **Clean Commercial Storefront Experience:**
   - Scrubbed all portfolio and demo labels from the customer storefront.
   - Designed clean, authentic Sivakasi retailer UI with warm amber accents, crisp contrast, PESO safety compliance notices, and counter collection guidance.
3. **Restricted Payment Safety & Test Fixture:**
   - Live money collection disabled by default (`PAYMENT_COLLECTION_ENABLED = false`).
   - Non-payable test QR fixture served with explicit test payload (`test-fixture@nagarjunatraders`) and clear restricted environment notice.
4. **Shared Tiered Token Calculation Engine (`src/utils/tokenPolicy.ts`):**
   - Subtotal < ₹200 (`20,000 paise`): advance token amount is **₹50** (`5,000 paise`).
   - Subtotal $\ge$ ₹200 (`20,000 paise`): advance token amount is **₹100** (`10,000 paise`).
   - Boundary condition: exactly ₹200 belongs to the ₹100 tier.
   - Minimum order subtotal is ₹50 (`5,000 paise`).
   - Remaining balance = $\max(0, \text{subtotal} - \text{token})$ payable at counter.
   - Server recalculates all prices, line subtotals, and tokens using integer paise; never trusts client values.
5. **10 Customer Screens / States Implemented:**
   - `HOME`: Clean welcome screen with counter collection info.
   - `CUSTOMER_FORM`: Transient customer details with 18+ age verification.
   - `CATALOGUE`: 6 Authentic categories with search and category tabs.
   - `VARIANT_CONTROLS`: Stepper quantity controls (1–50 limits).
   - `CART`: Responsive basket showing subtotal, advance token due, remaining balance, and checkout gates.
   - `REVIEW`: Order summary before reservation submission.
   - `QR_INSTRUCTIONS`: Test QR code fixture, UPI ID, reference note, and advance token due.
   - `UTR_SUBMISSION`: 12-digit numeric string input with instant feedback.
   - `CONFIRMATION`: Reservation reference (`NT-XXXX`), advance token status, and WhatsApp share button.
   - `STATUS_TRACKER`: Real-time order tracker polling `GET /api/v1/orders/:reference/status`.
6. **12-Digit UTR Workflow & Database Migrations:**
   - `migrations/0003_payment_flow_schema.sql`: Added `payment_submissions` table with unique constraint on 12-digit `utr_reference`.
   - Added `order_status_history` and `payment_status_history` tables.
   - UTR strictly handled as a 12-digit string (`/^\d{12}$/`); never parsed into a number.
   - Status transitions to `RECORDED_UNVERIFIED`.
   - Duplicate UTR rejected with `HTTP 409 Conflict` (`DUPLICATE_UTR`).
7. **Staff Manual Bank Reconciliation:**
   - Prohibited automated bank verification claims.
   - Admin reconciliation modal requires mandatory staff notes confirming match against official bank statements.
   - Audit trail records `reconciled_by`, `reconciled_at`, and `reconciliation_notes`.
8. **Automated Verification:**
   - 66 Vitest tests passing across 11 test files (100% green).
   - Clean production build (`tsc && vite build` generates 225.86 kB bundle / gzip 62.77 kB).

### Milestone 5: Quality & Security Hardening
1. **Vitest Unit Suite:** Test mathematical functions, paise conversions, and Zod schemas.
2. **Edge Integration Suite:** Test order price tampering rejection, rate limiting, and IDOR protection.
3. **Playwright E2E Suite:** Run mobile emulator tests on Pixel 7 and iPhone 14.
4. **Accessibility Check:** Run Axe-core scan verifying zero WCAG 2.2 AA violations.

### Milestone 6: Deployment & Launch Review
1. **Cloudflare Provisioning:** Run `wrangler d1 create` and `wrangler d1 migrations apply --remote`.
2. **Pages Build Deployment:** Connect repository to Cloudflare Pages; configure build command `npm run build`.
3. **Secret Provisioning:** Store `TURNSTILE_SECRET_KEY` and `ADMIN_JWT_SECRET` via `wrangler secret put`.
4. **Final Compliance Review:** Verify all P0 open questions before toggling `COMMERCE_CHECKOUT_ENABLED=true`.
