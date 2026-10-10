# NAGARJUNA TRADERS — TESTING AND ACCEPTANCE SPECIFICATION

**Document Reference:** `docs/testing-and-acceptance.md`  
**Test Frameworks:** Vitest (Unit & Integration) + Miniflare (Edge Worker Environment) + Playwright (E2E & Mobile)  
**Acceptance Standard:** 100% Deterministic Verification Before Release

---

## 1. Test Strategy & Architecture

```
+───────────────────────────────────────────────────────────────────────────────────+
|                               TEST SUITE TOPOLOGY                                 |
|                                                                                   |
|  [ Level 1: Unit Tests (Vitest) ]                                                 |
|  - Integer paise arithmetic (token calculation, rounding, balance)                |
|  - Price snapshot immutability                                                    |
|  - Zod request body validation & phone number regex                               |
|  - UTR 12-digit format validation                                                 |
|                                                                                   |
|  [ Level 2: Edge Integration Tests (Vitest + Miniflare + D1 In-Memory) ]          |
|  - GET /api/v1/catalogue (edge caching, hides unpriced variants)                  |
|  - POST /api/v1/orders (recalculates client prices, rejects tampering)            |
|  - POST /api/v1/orders/:id/payment-reference (enforces unique UTR)                |
|  - POST /api/v1/admin/* (enforces Cloudflare Access JWT authentication)           |
|                                                                                   |
|  [ Level 3: Concurrency & Security Tests ]                                        |
|  - Idempotency key replay protection                                              |
|  - Race condition on inventory deductions                                         |
|  - SQL injection payloads on D1 queries                                           |
|  - IDOR / BOLA attack without secret order token                                  |
|                                                                                   |
|  [ Level 4: E2E & Mobile UX Tests (Playwright) ]                                  |
|  - Complete customer booking flow (Home -> Cart -> UTR -> Confirmation)           |
|  - Mobile viewports (360px Android, 390px iPhone)                                 |
|  - Touch target audit (minimum 44×44px / 48×48px)                                 |
|  - WCAG 2.2 AA color contrast audit (Axe-core)                                    |
+───────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Unit Test Matrix

| Test Suite | Test Case Description | Pass Criteria | Command |
|---|---|---|---|
| `math.test.ts` | Paise to INR conversion | `formatPaise(35000)` returns `"₹350.00"`. `parseInrToPaise("350.00")` returns `35000`. | `npm run test:unit` |
| `math.test.ts` | 20% Token calculation | Order of ₹1,000 (100,000 paise) returns ₹200 (20,000 paise). | `npm run test:unit` |
| `math.test.ts` | Minimum token rule | Order of ₹300 (30,000 paise) returns minimum ₹100 (10,000 paise) token deposit. | `npm run test:unit` |
| `math.test.ts` | Remaining balance calculation | Correctly computes `subtotalPaise - tokenDuePaise` down to exact single paisa. | `npm run test:unit` |
| `validation.test.ts`| Phone number validation | Accepts `9876543210`, rejects `123456`, `abcdefghij`, `5876543210` (starts with 5). | `npm run test:unit` |
| `validation.test.ts`| UTR format validation | Accepts `428901234567` (12 digits), rejects `12345` or alphanumeric strings. | `npm run test:unit` |
| `validation.test.ts`| Quantity bounds | Rejects `0`, `-5`, `1.5`, and `9999`. Accepts `1` through `50`. | `npm run test:unit` |

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
