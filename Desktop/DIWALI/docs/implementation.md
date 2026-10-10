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
| **Milestone 2** | **Core Customer Interface** | React + Vite + Tailwind setup, authentic 6-category UI, variant selector, cart calculations in paise. | 2–3 Days | Mobile responsive, CLS < 0.1, cart math passes. |
| **Milestone 3** | **Backend Edge API & Admin Console** | Cloudflare Workers API, D1 schema migrations, Turnstile verification, Cloudflare Access admin auth. | 2–3 Days | Auth enforced, D1 parameterised queries working. |
| **Milestone 4** | **Payment Workflow & Verification** | Manual UPI QR + 12-digit UTR submission, UTR uniqueness constraint, admin reconciliation modal. | 1–2 Days | UTR replay rejected, payment audit logs recorded. |
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
| **M3** | `feature/nagarjuna-edge-backend`| `main` (after M2 merge) | `feat(api): create d1 order management and admin routes` |
| **M4** | `feature/nagarjuna-upi-payments`| `main` (after M3 merge) | `feat(pay): implement manual utr verification workflow` |
| **M5** | `feature/nagarjuna-qa-hardening`| `main` (after M4 merge) | `test(e2e): add mobile touch target and axe-core audit` |
| **M6** | `feature/nagarjuna-prod-deploy` | `main` (after M5 merge) | `chore(deploy): configure cloudflare pages and d1 bindings` |

---

## 3. Milestone Execution Steps

### Milestone 2: Core Customer Interface
1. **Initialize Project:** Scaffold React 18 + Vite + TypeScript application in `c:\Users\17042\Desktop\DIWALI`.
2. **Install Design Dependencies:** Configure Tailwind CSS v4, `@phosphor-icons/react`, `motion/react`.
3. **Typography & Tokens:** Inject `Outfit` and `Inter` font definitions, set custom CSS properties from `docs/design-system.md`.
4. **Catalogue Components:** Build `CategoryNav`, `ProductCard`, `VariantModal`, `QuantityStepper` (48px tap targets).
5. **Client Cart Engine:** Implement `useCart` hook calculating integer paise subtotals, 20% token deposit, and balance.
6. **Mobile Bottom Bar:** Implement sticky bottom glass sheet for mobile viewports.

### Milestone 3: Backend Edge API & Admin Console
1. **Wrangler Setup:** Create `wrangler.jsonc` with Cloudflare D1 database binding and environment variables.
2. **Database Migrations:** Create `migrations/0001_initial_schema.sql` and `migrations/0002_seed_catalogue.sql`.
3. **API Implementation:** Implement `/api/v1/catalogue`, `/api/v1/orders`, `/api/v1/orders/:id`.
4. **Turnstile Middleware:** Integrate Cloudflare Turnstile token validation on order creation.
5. **Admin Console:** Implement `/admin` protected interface with order management and variant price editing.

### Milestone 4: Payment Workflow
1. **Dynamic UPI Generator:** Implement dynamic UPI intent link and QR renderer using store VPA and order note.
2. **UTR Ingestion API:** Implement `POST /api/v1/orders/:id/payment-reference` with 12-digit regex validation and unique constraint handling.
3. **Operator Verification Modal:** Implement staff verification interface in `/admin/orders/:id`.
4. **Audit Logging:** Wire all payment approvals to `audit_logs` table.

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
