# NAGARJUNA TRADERS — PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Document Reference:** `docs/PRD.md`  
**Version:** 1.0.0 (Foundation Milestone)  
**Status:** Approved for Documentation & Review  
**Author:** Antigravity System Architecture  
**Target Platform:** Mobile-First Web (Cloudflare Pages + Workers + D1)  
**Commercial Mode:** Gated by Default (`COMMERCE_CHECKOUT_ENABLED=false` / Enquiry & Reservation Fallback)

---

## 1. Executive Summary & Business Objective

**Nagarjuna Traders** is a retail fireworks vendor. This project specifies a mobile-first, high-performance, ₹0-software-cost web application enabling customers to explore the authentic Diwali fireworks catalogue, configure product variants and quantities, compute exact token payments and remaining balances, and submit orders or enquiries through a legally verified fulfilment process.

A secure, private administrative portal empowers business operators to manage catalogue variants, set strict paise prices, monitor inventory, verify incoming UPI payments, audit order lifecycle transitions, and conduct store operations without recurring SaaS overhead.

### Key Tenets
1. **Zero Recurring SaaS / Hosting Cost:** Built entirely on Cloudflare's free tiers (Pages, Workers, D1, Turnstile, Access) and GitHub Actions.
2. **Authenticity Over Invention:** The supplied physical catalogue poster is the single source of truth. Unconfirmed variant prices or pack specifications are never fabricated.
3. **Legal-First Architecture:** Because Indian statutory frameworks strictly regulate firework commerce and prohibit online delivery, commercial checkout defaults to `COMMERCE_CHECKOUT_ENABLED=false` until legal council confirms retail licensing and local pickup conditions.
4. **Financial Precision:** All financial transactions and balances are tracked strictly in integer minor units (paise: ₹1 = 100 paise) with server-side authoritative recalculation.

---

## 2. Target Users & Personas

### Persona A: Festive Retail Customer ("Ravi", Mobile Shopper)
- **Device:** Android smartphone (low-to-mid tier, 4G / mobile data).
- **Need:** Quickly view Diwali cracker prices, pick items for family celebrations, know exact pack quantities, see the upfront token booking amount, and submit a store pickup booking without navigating complex checkout steps or installing an app.
- **Pain Points:** Confusing cracker pricing, hidden delivery scams, broken mobile websites, slow connections, fear of duplicate UPI payments.

### Persona B: Store Operator / Administrator ("Nagarjuna", Business Owner)
- **Device:** Smartphone and desktop tablet/laptop at the billing counter.
- **Need:** Review incoming bookings, manually verify customer UPI reference numbers (UTR) against bank SMS/app notifications, update variant prices when wholesaler rates fluctuate, and flag orders as "Ready for Pickup".
- **Pain Points:** WhatsApp chaos, manual pen-and-paper booking mistakes, reconciling ambiguous payments, inventory stockouts during peak Diwali rush.

---

## 3. Scope & Exclusions

### In-Scope (Phase 1–6)
- Mobile-first responsive web client (customer-facing).
- Authentic 6-category catalogue browsing with variant selector.
- Client-side cart with real-time token payment (e.g., 20% or flat rate) and balance computation.
- Server-authoritative order creation and price verification.
- Feature-flagged commerce engine (`COMMERCE_CHECKOUT_ENABLED=false` falling back to legal enquiry / reservation mode).
- Dedicated admin portal with secure authentication for product, variant, order, and payment management.
- Audit trail for admin order and payment status transitions.
- Cloudflare Turnstile bot protection and strict rate-limiting.

### Explicit Exclusions (Out-of-Scope)
- **No Direct Courier / Inter-State Shipping:** Strictly forbidden by Indian Explosives Rules and Supreme Court directives. Fulfilment is restricted to licensed counter pickup / permitted local handover.
- **No Floating-Point Math:** All currency must be represented as integer paise.
- **No User Account Registration:** Customers do not create passwords. Lookup uses random cryptographic order tokens and mobile numbers.
- **No Live Checkout Activation Prior to Legal Approval:** Live payment capture remains disabled until compliance gates are cleared.

---

## 4. User Journeys & Functional Requirements

```mermaid
flowchart TD
    A[Customer Opens Website] --> B[Browse 6 Authentic Categories]
    B --> C[Select Product Variants & Quantities]
    C --> D[Review Cart & Exact Subtotal in Paise]
    D --> E{COMMERCE_CHECKOUT_ENABLED?}
    E -- false --> F[Submit Non-Binding Enquiry / Store Hold Request]
    E -- true --> G[Enter Verified Customer Name & Phone]
    G --> H[Submit Order with Turnstile Verification]
    H --> I[Receive Unique Order Reference & Token Payment Instructions]
    I --> J[Customer Pays via Approved UPI & Enters UTR Reference]
    J --> K[Server Sets Status: PENDING_VERIFICATION]
    K --> L[Admin Verifies Payment in Private Portal]
    L --> M[Order Status: CONFIRMED -> READY_FOR_PICKUP]
```

### 4.1 Customer Web Application Requirements (C-REQ)

- **C-REQ-01 (Catalogue Navigation):** Customer can browse all 6 categories: Laddis, Skyshots, Bombs, Jharjhari & Sparklers, Kumpi & Chakri, and Others.
- **C-REQ-02 (Variant Selection):** Items with multiple sizes or prices (e.g., Tiger Bomb, Big Lanka Laddi) require explicit variant selection before adding to cart. No order can be placed with unpriced or ambiguous items.
- **C-REQ-03 (Price Transparency):** Exact item unit prices and line subtotals display clearly in ₹ (INR). Total shows:
  - Gross Order Subtotal
  - Token Payment Due Now (default 20% or admin-configured policy)
  - Remaining Balance Due at Pickup
- **C-REQ-04 (Customer Input):** Customer provides Full Name and 10-digit Indian Mobile Number (`^[6-9]\d{9}$`). Address is optional and only displayed if local delivery is legally permitted.
- **C-REQ-05 (Order Submission):** Customer submits order protected by Cloudflare Turnstile. Server generates a cryptographically non-enumerable order reference (e.g., `NT-2026-XXXXXX`) and a secret tracking token.
- **C-REQ-06 (Payment Instructions):** Displays the configured store UPI VPA / QR code with exact token amount and pre-filled transaction note (`NT-XXXXXX`).
- **C-REQ-07 (Payment Reference Entry):** Customer can submit their 12-digit UPI UTR / Transaction Reference number. Client notifies customer that order remains in `PENDING_VERIFICATION` until verified by store staff.
- **C-REQ-08 (Order Status Tracking):** Customer can bookmark or revisit `/order/{orderId}?token={secretToken}` to inspect real-time status without account login.

### 4.2 Admin Portal Requirements (A-REQ)

- **A-REQ-01 (Restricted Access):** Admin console `/admin` strictly protected via Cloudflare Access (Zero Trust OTP / Google Workspace) or signed JWT cookies. No public self-registration.
- **A-REQ-02 (Product & Variant Management):** Admin can create, edit, activate, deactivate, and set exact selling prices (in paise) for all variants. Prevents publishing items without confirmed prices.
- **A-REQ-03 (Inventory Control):** Optional inventory tracking per variant. Items with 0 stock automatically reflect as `OUT_OF_STOCK` in customer client.
- **A-REQ-04 (Order Management):** Table of orders filterable by date, operational status, and payment status. Detailed modal shows customer contact, items, price snapshots, and notes.
- **A-REQ-05 (Payment Verification):** Authorised operator can match customer-submitted UTR against bank records, marking payment as `VERIFIED_TOKEN` or `VERIFIED_FULL`. All state changes log operator ID and timestamp.
- **A-REQ-06 (Operational Workflow):** State progression: `SUBMITTED` -> `CONFIRMED` -> `PREPARING` -> `READY_FOR_PICKUP` -> `COMPLETED` (or `CANCELLED`).
- **A-REQ-07 (Audit History):** Immutable event log tracking every status update, price change, and payment verification.

---

## 5. Non-Functional Requirements (NFR)

- **NFR-01 (Performance & Budget):** Lighthouse mobile performance score ≥ 90. First Contentful Paint (FCP) < 1.2s, Largest Contentful Paint (LCP) < 2.0s on 4G network. Total initial bundle size < 120 KB gzipped.
- **NFR-02 (Zero Hosting Cost):** Operates 100% within Cloudflare free limits:
  - Workers: < 100,000 requests/day
  - D1 Database: < 5M read rows/day, < 100k write rows/day, < 5GB storage
  - Turnstile: Free tier
- **NFR-03 (Data Minimisation & Privacy):** Strictly collects only customer name and mobile number. Compliant with Digital Personal Data Protection Act (DPDP) 2023.
- **NFR-04 (Security):** Zero plain-text secrets in repository. Parameterised SQL queries for all D1 interactions. Rate limiting on all mutating endpoints.
- **NFR-05 (Accessibility):** WCAG 2.2 Level AA compliance. Minimum touch target 44×44px, color contrast ratio ≥ 4.5:1.

---

## 6. Business Rules & Financial Model

| Rule ID | Rule Name | Description |
|---|---|---|
| **BR-01** | **Paise Accounting** | All prices, line totals, subtotals, and tokens are stored and computed in integer paise. Formatted as `₹(paise / 100).toFixed(2)` for display only. |
| **BR-02** | **Price Snapshotting** | When an order is placed, unit prices are frozen in `order_items`. Subsequent admin catalogue price edits never alter existing orders. |
| **BR-03** | **Token Calculation** | Token amount = `Math.ceil((subtotalPaise * tokenPercentage) / 100)`. Default token percentage is 20%. Minimum token amount is ₹100 (10,000 paise). |
| **BR-04** | **Balance Calculation** | Remaining Balance = `subtotalPaise - verifiedPaidPaise`. Payable at pickup counter. |
| **BR-05** | **No Unpriced Orders** | A product variant with null or 0 price cannot be placed in the cart or submitted. |
| **BR-06** | **Enquiry-Only Fallback** | When `COMMERCE_CHECKOUT_ENABLED=false`, the cart generates an enquiry slip and WhatsApp link without storing financial liabilities. |

---

## 7. Acceptance Criteria Summary

1. Customers can browse all 6 categories on mobile devices without layout overflow or horizontal scroll.
2. Unpriced variants (e.g. unconfirmed Tiger Bomb sizes) cannot be added to cart or submitted.
3. Cart calculates correct subtotal, token (20%), and balance down to exact paise.
4. Server verifies and recalculates all line items; modified client prices in dev tools are rejected.
5. Bot submissions are blocked by Cloudflare Turnstile token validation.
6. Order references are unguessable; customer can track status with reference + secret token.
7. Admin dashboard requires verified authentication; unauthenticated requests receive HTTP 401/403.
8. Payment verification requires admin action and logs operator ID, timestamp, and UTR.
