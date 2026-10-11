# NAGARJUNA TRADERS — REQUIREMENTS TRACEABILITY MATRIX (RTM)

**Document Reference:** `docs/traceability.md`  
**Purpose:** End-to-End Bidirectional Mapping of Requirements, Design, Code Tasks & Test Cases  
**Standard:** ISO/IEC/IEEE 29148 Traceability Standard

---

## 1. Traceability Matrix Table

| Req ID | Requirement Description | Design Specification | Implementation Milestone | Test Case Reference | Acceptance Sign-Off Criteria |
|---|---|---|---|---|---|
| **C-REQ-01** | Browse 6 Authentic Categories | `Design.md` §3 (Catalogue Home) | Milestone 2 (Catalogue Nav) | `tests/components/CatalogueView.test.tsx`, `tests/components/App.test.tsx` | All 6 poster categories render with authentic names on mobile and desktop. |
| **C-REQ-02** | Explicit Variant & Size Selector | `Design.md` §5 (Variant Modal) | Milestone 2 (`ProductCard`) | `tests/components/CatalogueView.test.tsx` | Multi-size items provide variant switching; unpriced items labeled "Price on enquiry". |
| **C-REQ-03** | Exact Subtotal & Provisional Estimates | `design-system.md` §2, `PRD.md` §6 | Milestone 2 (`useCart`, `formatters`) | `tests/unit/formatters.test.ts`, `tests/unit/cart.test.ts`, `tests/components/CartView.test.tsx` | Calculations executed in integer paise; priced line items summed; unpriced items tracked separately. |
| **C-REQ-04** | Minimal Customer Inputs (Name, Phone) | `Design.md` §2 (Customer Form) | Milestone 2 (`CustomerForm`) | `tests/components/CustomerForm.test.tsx` | Rejects non-10 digit phones; requires 18+ age checkbox; personal details kept transient (zero LocalStorage writes). |
| **C-REQ-05** | Order Submission & Bot Defense | `technical-structure.md` §3.2 | Milestone 3 (`POST /orders`) | `orders.test.ts` | Cloudflare Turnstile validated server-side; client price tampering rejected; rate limited. |
| **C-REQ-06** | Dynamic UPI Payment Instructions | `Design.md` §8 (Payment Screen) | Milestone 4 (`PaymentModal`) | `payment.test.ts` | Dynamic QR and UPI intent generated with exact token amount and order reference note. |
| **C-REQ-07** | 12-Digit UTR Submission | `Design.md` §8 (UTR Form) | Milestone 4 (`POST /payment-reference`) | `payment.test.ts` | Regex `^\d{12}$` validated; duplicate UTR rejected via unique SQL index. |
| **C-REQ-08** | Public Status Tracking | `Design.md` §10 (Status Page) | Milestone 3 (`GET /orders/:id`) | `security.test.ts` | Lookup requires secret UUID token; status timeline reflects real-time operational state. |
| **A-REQ-01** | Protected Admin Portal | `security-and-privacy.md` §4 | Milestone 3 (Admin Auth) | `admin.test.ts` | `/admin` secured via Cloudflare Access JWT; unauthenticated calls receive HTTP 401. |
| **A-REQ-02** | Catalogue & Variant CRUD | `Design.md` §13, §14 | Milestone 3 (`/admin/products`) | `admin.test.ts` | Admin can edit prices in paise, toggle active/sold-out; changes purge edge cache. |
| **A-REQ-03** | Real-Time Stock Tracking | `Design.md` §18 (Inventory) | Milestone 3 (`/admin/inventory`) | `admin.test.ts` | Stock updates reflect immediately; 0 stock items render sold-out badge in client. |
| **A-REQ-04** | Order Triage & Filtering | `Design.md` §15 (Order List) | Milestone 3 (`/admin/orders`) | `admin.test.ts` | Orders filterable by operational and payment status; search by reference/phone. |
| **A-REQ-05** | Manual Payment Reconciliation | `Design.md` §17 (Verify Modal) | Milestone 4 (Payment Verification) | `admin.test.ts` | Operator verifies UTR against bank credit; transitions status to `CONFIRMED`; logs audit ID. |
| **A-REQ-06** | Enforced State Transitions | `PRD.md` §4.2, `api-spec.md` §3.4| Milestone 3 (State Guards) | `orders.test.ts` | Unpaid orders cannot advance to `READY_FOR_PICKUP` or `COMPLETED`. |
| **A-REQ-07** | Immutable Audit Trail | `data-model.md` §2.8 | Milestone 3 (`audit_logs`) | `admin.test.ts` | Every price change, status change, and payment verification permanently logged. |
| **NFR-01** | Mobile Performance (FCP < 1.2s) | `Design.md` §3, `design-system.md` | Milestone 2 (Vite Optimization) | `npm run build` bundle verification | Mobile bundle < 65 KB gzipped (59.87 KB JS + 4.72 KB CSS); zero horizontal overflow at 360px. |
| **NFR-02** | ₹0 Recurring Hosting & SaaS | `zero-cost-budget.md` §1 | Milestone 6 (Cloudflare Deploy) | Deployment Verification | 100% deployed on Cloudflare Pages/Workers/D1/Turnstile/Access free tiers. |
| **NFR-03** | DPDP Act 2023 Compliance | `security-and-privacy.md` §3 | Milestone 2 & 3 (Memory Only Storage) | `tests/components/CustomerForm.test.tsx` | Customer phone & name kept strictly in transient React memory; zero LocalStorage leakage. |
| **NFR-04** | Zero SQL Injection / XSS | `technical-structure.md` §2.3 | Milestone 3 (D1 Bindings) | `security.test.ts` | Parameterized SQL queries used exclusively; inputs sanitized via Zod. |
| **NFR-05** | WCAG 2.2 Level AA Accessibility | `design-system.md` §5 | Milestone 2 & 5 (Semantic UI & Focus) | `tests/components/CustomerForm.test.tsx` | Contrast ratio ≥ 4.5:1; touch targets ≥ 48×48px; keyboard focus visible. |
| **BR-01** | Integer Paise Accounting | `data-model.md` §3 | Milestone 2 & 3 (Math Engine) | `tests/unit/formatters.test.ts`, `tests/unit/cart.test.ts` | Zero floating-point roundoff; all balances accurate to single paisa. |
| **BR-06** | Gated Commerce Fallback | `legal-and-sales-compliance.md` §5 | Milestone 2 (Enquiry Review) | `tests/unit/enquirySummary.test.ts`, `tests/components/ReviewView.test.tsx` | When `COMMERCE_CHECKOUT_ENABLED=false`, orders route to legal non-binding enquiry copy/WhatsApp. |
