# NAGARJUNA TRADERS — TESTING AND ACCEPTANCE SPECIFICATION

**Document Reference:** `docs/testing-and-acceptance.md`  
**Test Frameworks:** Vitest (Unit & Integration) + Miniflare (Edge Worker Environment) + Playwright (E2E & Mobile)  
**Acceptance Standard:** 100% Deterministic Verification Before Release

---

## 1. Test Strategy & Architecture

## 1. Test Strategy & Architecture

```
+───────────────────────────────────────────────────────────────────────────────────+
|               TEST SUITE TOPOLOGY (MILESTONE 4 ORDER & PAYMENT FLOW)              |
|                                                                                   |
|  [ Level 1: Unit & Calculation Tests (Vitest) - 100% Passed (41 tests) ]          |
|  - Integer paise arithmetic and Rupee formatting (formatters.test.ts: 3)          |
|  - Tiered advance token rules: < ₹200 -> ₹50, >= ₹200 -> ₹100 (cart.test.ts: 14) |
|  - Boundary condition: subtotal == ₹200 is ₹100 tier (cart.test.ts)               |
|  - Minimum subtotal gating (subtotal >= ₹50) (cart.test.ts)                       |
|  - Non-negative remaining balance calculation (cart.test.ts)                      |
|  - Unpriced range item gating & quantity clamping (cart.test.ts)                  |
|  - Safe LocalStorage cart recovery (storage.test.ts: 5)                           |
|  - Enquiry & Order summary generator & WhatsApp link (enquirySummary.test.ts: 5)  |
|  - Edge API & Server router unit tests (api.test.ts: 14)                          |
|    * GET /api/v1/payment-config returns non-payable test fixture                  |
|    * Server-side tiered token recalculation (< ₹200 -> ₹50, >= ₹200 -> ₹100)      |
|    * Rejection of unpriced range items                                            |
|    * 12-digit string UTR regex validation (non-numeric data type)                 |
|    * Duplicate UTR rejection with 409 Conflict                                    |
|    * Order status query with authorization token                                  |
|    * Admin manual reconciliation requiring mandatory staff notes                  |
|                                                                                   |
|  [ Level 2: Component Integration Tests (Vitest + RTL) - 100% Passed (25 tests) ]  |
|  - 6 Authentic category tabs & poster pricing (CatalogueView.test.tsx: 5)         |
|  - Environmental statutory notice for Category 1 Laddis (CatalogueView.test.tsx) |
|  - Transient customer form validation & 18+ attestation (CustomerForm.test.tsx: 5)|
|  - Cart view, tiered token breakdown & checkout gating (CartView.test.tsx: 4)     |
|  - Screens 6 to 10 flow: Review -> QR -> UTR -> Confirmation (ReviewView: 4)      |
|  - Admin portal: KPI cards, price bounds, reconciliation modal (AdminView: 4)     |
|  - Full E2E user flow from Home to UTR submission & confirmation (App.test.tsx: 3)|
+───────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Unit & Integration Test Matrix

| Test Suite | Tests | Scenario Covered | Outcome | Command |
|---|---|---|---|---|
| `cart.test.ts` | 14 | Tiered tokens (< ₹200 $\rightarrow$ ₹50, $\ge$ ₹200 $\rightarrow$ ₹100, boundary ₹200 $\rightarrow$ ₹100), min subtotal (₹50), non-negative balance | ✓ Passed (14/14) | `npm test` |
| `api.test.ts` | 14 | Payment config, server tiered tokens, 12-digit UTR string validation, duplicate UTR 409, order status, admin reconciliation | ✓ Passed (14/14) | `npm test` |
| `formatters.test.ts` | 3 | Integer paise to Indian Rupee formatting (`35000` $\rightarrow$ `"₹350.00"`) | ✓ Passed (3/3) | `npm test` |
| `storage.test.ts` | 5 | Safe localStorage recovery, JSON fallback, quota error handling | ✓ Passed (5/5) | `npm test` |
| `enquirySummary.test.ts` | 5 | Order summary generator, tiered token breakdown, WhatsApp share URL | ✓ Passed (5/5) | `npm test` |
| `CustomerForm.test.tsx` | 5 | Name validation, Indian mobile regex (`^[6-9]\d{9}$`), age verification | ✓ Passed (5/5) | `npm test` |
| `CartView.test.tsx` | 4 | Cart item list, price confirmation notes, tiered token breakdown, blockers | ✓ Passed (4/4) | `npm test` |
| `ReviewView.test.tsx` | 4 | 10-screen lifecycle: Review $\rightarrow$ QR instructions $\rightarrow$ UTR submit $\rightarrow$ Confirmation $\rightarrow$ Status tracker | ✓ Passed (4/4) | `npm test` |
| `CatalogueView.test.tsx` | 5 | 6 Categories, discrete vs range items, category filtering, search, Laddis notice | ✓ Passed (5/5) | `npm test` |
| `AdminView.test.tsx` | 4 | Passphrase login, KPI overview, catalogue price bounds override, reconciliation | ✓ Passed (4/4) | `npm test` |
| `App.test.tsx` | 3 | End-to-end full customer journey to reservation and UTR confirmation | ✓ Passed (3/3) | `npm test` |
| **Total** | **66** | **Comprehensive Full-Stack Ordering, UTR & Payment Flow Verification** | **✓ 66/66 Passed (100%)** | `npm test` |


---

## 3. Integration & Edge API Test Matrix

| Test Suite | Endpoint | Test Scenario | Expected Outcome |
|---|---|---|---|
| `catalogue.test.ts` | `GET /api/v1/catalogue` | Catalogue retrieval | Returns only products where `is_active = 1`. Unpriced items or price ranges are omitted or tagged unpurchasable. |
| `orders.test.ts` | `POST /api/v1/orders` | Client price tampering attempt | Client submits `pricePaise: 100` for item costing `35000`. Server ignores client price, queries D1, and bills exact `35000`. |
| `orders.test.ts` | `POST /api/v1/orders` | Missing Turnstile token | Returns `HTTP 400 Bad Request` with `BOT_VERIFICATION_FAILED`. |
| `orders.test.ts` | `POST /api/v1/orders` | Idempotency replay | Client sends same `idempotencyKey` twice. Server returns existing order on second call without creating second database row. |
| `orders.test.ts` | `POST /api/v1/orders` | Feature flag disabled | When `COMMERCE_CHECKOUT_ENABLED=false`, returns `HTTP 403` with fallback WhatsApp enquiry payload. |
| `payment.test.ts` | `POST /api/v1/orders/:ref/payment-reference` | Duplicate UTR submission | Submitting a previously recorded UTR returns `HTTP 409 Conflict` (`UTR_ALREADY_SUBMITTED`). |
| `security.test.ts` | `GET /api/v1/orders/:ref` | IDOR lookup without token | Request with valid reference but invalid or missing token returns `HTTP 401 Unauthorized`. |
| `admin.test.ts` | `GET /api/v1/admin/orders` | Unauthenticated admin request | Request without valid Cloudflare Access JWT header returns `HTTP 401 Unauthorized`. |
| `admin.test.ts` | `POST /api/v1/admin/orders/:id/verify-payment` | Payment verification | Updates payment status to `VERIFIED_TOKEN`, operational status to `CONFIRMED`, and logs operator ID. |

---

## 4. Mobile, E2E & Accessibility Test Matrix (Playwright)

| Test Suite | Scenario | Device Emulation | Pass Criteria | Command |
|---|---|---|---|---|
| `e2e/customer-flow.spec.ts` | Complete booking journey | Pixel 7 (393×851px) | User browses catalogue, selects variant, views cart, enters details, solves Turnstile, submits order, sees payment screen. | `npm run test:e2e` |
| `e2e/touch-targets.spec.ts` | Tap target audit | iPhone 14 (390×844px) | Every interactive element (`button`, `input`, `select`) has bounding box ≥ 44×44px. Steppers are 48×48px. | `npm run test:e2e` |
| `e2e/a11y.spec.ts` | Axe-core accessibility scan | Desktop & Mobile | Zero WCAG 2.2 AA violations. Text contrast ≥ 4.5:1 everywhere. | `npm run test:e2e` |
| `e2e/responsive.spec.ts` | Layout stability & CLS | Viewports 360px to 1280px | Zero horizontal scroll (`scrollWidth <= clientWidth`). Cumulative Layout Shift (CLS) < 0.1. | `npm run test:e2e` |

---

## 5. Formal Acceptance Sign-Off Checklist

Before any production release candidate is tagged:

- [ ] All 6 poster categories are represented with authentic extracted names.
- [ ] 14 unpriced/range variants are blocked from checkout until owner confirms prices.
- [ ] `COMMERCE_CHECKOUT_ENABLED=false` is enforced by default in code and config.
- [ ] All financial arithmetic passes paise precision unit test suite.
- [ ] Zero secret values exist in git tracked files.
- [ ] Cloudflare Access protects all administrative endpoints.
- [ ] Mobile touch targets meet or exceed 44×44px across all 19 screens.
- [ ] Axe-core accessibility scan passes with zero critical or serious violations.
- [ ] Database migrations execute cleanly from scratch on fresh D1 instance.
