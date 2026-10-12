# NAGARJUNA TRADERS: UI/UX SCREEN SPECIFICATIONS (DESIGN.MD)

**Document Reference:** `docs/Design.md`  
**Approach:** Mobile-First Layouts, Secondary Desktop Adaptation  
**Coverage:** Complete Specification of All 19 Required Screens  
**Design System Reference:** `docs/design-system.md`  
**Review Synthesis:** `docs/design-review.md`

---

## Screen Architecture Overview

```
CUSTOMER EXPERIENCE FLOW
[Screen 1: Home] ──> [Screen 3: Catalogue Home] ──> [Screen 4: Category/Search]
        │                       │                              │
        │                       ▼                              ▼
        │               [Screen 5: Variant/Quantity Selection] 
        │                               │
        ▼                               ▼
[Screen 2: Customer Details] ──> [Screen 6: Cart] ──> [Screen 7: Order Review]
                                                               │
                                                               ▼
[Screen 10: Status Tracking] <── [Screen 9: Confirmation] <── [Screen 8: Payment/Enquiry]

ADMINISTRATIVE FLOW
[Screen 11: Admin Login] ──> [Screen 12: Admin Dashboard]
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
[Screen 13: Product List]   [Screen 15: Order List]    [Screen 18: Inventory]
      │                           │
      ▼                           ▼
[Screen 14: Category/Variant] [Screen 16: Order Details] ──> [Screen 17: Payment Verification]

GLOBAL APP STATES: [Screen 19: Error, Maintenance & Offline States]
```

---

## 1. Customer Home Page (`/`)

### 1.1 Purpose
Welcomes the customer, communicates authentic store identity (Nagarjuna Traders), displays location status, highlights active festival mode, and directs users directly to the catalogue.

### 1.2 Layout & Hierarchy
- **Mobile (<768px):**
  - **Header:** Brand Wordmark ("NAGARJUNA TRADERS"), status pill (`Store Open / Festival 2026`), and Cart Icon Badge.
  - **Hero Banner:** Headline ("Celebrate Diwali with Pure Radiance"), Subhead ("Authentic crackers direct from wholesale source", <20 words), Store Location Notice ("Licensed Counter Pickup"), Primary CTA ("Browse 2026 Catalogue").
  - **Quick Category Carousel:** Horizontal swipeable chips for all 6 categories (Laddis, Skyshots, Bombs, Sparklers, Pots/Spinners, Others).
  - **Trust & Compliance Notice:** Explicit legal disclosure regarding in-person counter collection.
  - **WhatsApp / Enquiry Link:** Direct action button to connect with store representative.
- **Desktop (≥1024px):**
  - Grid layout: Left column contains brand storytelling, operating hours, and location map directions; right column displays featured categories in an asymmetric bento grid.

### 1.3 States
- **Loading:** Skeleton banner and pulsating category pill outlines.
- **Empty / Inactive:** If season is closed, displays "Festival Catalogue Opening Soon" with WhatsApp notification signup.

---

## 2. Customer-Details Form (`/checkout/details`)

### 2.1 Purpose
Collects strictly minimal customer identification required for counter reservation under the DPDP Act 2023.

### 2.2 Layout & Fields
- **Mobile Layout:** Single-column card layout (`max-w-md mx-auto`).
  - **Field 1:** Full Name (`<input type="text">`, required, min 2 chars).
  - **Field 2:** Mobile Number (`<input type="tel">`, required, pattern `^[6-9]\d{9}$`, auto-prefixes `+91`).
  - **Field 3:** Fulfilment Preference (Segmented control: "Store Counter Pickup" vs "Special Enquiries").
  - **Field 4:** Age Attestation (Checkbox: "I confirm I am 18 years or older as required by Explosives Rules", required).
  - **Field 5:** Optional Notes (`<textarea>`, max 150 chars).
  - **Action:** Primary CTA "Proceed to Cart Review" (48px height, sticky bottom or bottom of form).
- **Desktop Layout:** Two-column split: Left column is the customer form; right column displays live cart breakdown and token deposit summary.

### 2.3 States & Validation
- **Inline Errors:** Immediate red helper text if phone is not 10 digits or name is blank.
- **Disabled State:** CTA disabled until phone and 18+ checkbox are valid.

---

## 3. Catalogue Home (`/catalogue`)

### 3.1 Purpose
Displays the full 6-category product listing with category filtering and real-time cart synchronization.

### 3.2 Layout & Hierarchy
- **Mobile Layout:**
  - Sticky sub-header with horizontal scrollable category tabs (`Laddis`, `Skyshots`, `Bombs`, `Sparklers`, `Flower Pots & Spinners`, `Others`).
  - Vertical list of category sections. Each section displays 2-column or 1-column responsive product cards.
  - Floating bottom cart bar docks to bottom displaying item count and subtotal.
- **Desktop Layout:**
  - Left sidebar (250px) contains category navigation, price filters, and stock filters.
  - Main area displays 3-column responsive card grid.

### 3.3 States
- **Loading:** 6 animated skeleton cards with price placeholder rectangles.
- **Empty State:** "No products available in this category."

---

## 4. Category / Search Results (`/catalogue?category={slug}&q={search}`)

### 4.1 Purpose
Allows shoppers to drill down into a single category or search by item name (e.g. "Bullet Bomb", "Elephant").

### 4.2 Layout
- Clear filter header with active search chip and "Clear Filter" button.
- Clean grid showing matched items with matched keyword highlight.
- Back button returns to `/catalogue` preserving cart contents.

---

## 5. Product Variant & Quantity Selection (`/product/{id}` or Modal)

### 5.1 Purpose
Resolves multi-size products (e.g., Tiger Bomb Sizes 3, 4, 5, 6; Big Lanka Laddi; Kumpi Medium/Large) into discrete priced SKUs.

### 5.2 Layout
- Product Title and authentic Category Badge.
- Pack Specification (e.g. "Box of 10 pieces").
- Variant Selector Segmented Pills: Each pill shows Variant Name + Exact Price in ₹ (e.g. `[Size 3: ₹200] [Size 4: ₹250]`). Unpriced variants disabled and marked "Rate on Enquiry".
- Quantity Stepper: Large `[-]` and `[+]` 48px touch buttons with center numeric display.
- Subtotal Calculation: Shows dynamic Line Total (`Quantity × Unit Price`).
- CTA: "Update Cart" or "Add to Cart".

---

## 6. Demo Basket (`/cart` or Cart View)

### 6.1 Purpose
Complete review of items, quantities, unit prices, line subtotals, gross total, fixed ₹100 demo token, and remaining balance.

### 6.2 Layout
- **Mobile Layout:**
  - Stacked list of cart item cards.
  - Each item row contains: Product Name, Variant Pill, Exact Unit Price, Quantity Stepper, Line Subtotal, and Remove button.
  - Range items clearly display *"Price to be confirmed (Range item: ...)"*.
  - Demo Financial Breakdown Card (Integer Paise):
    - Priced Items Subtotal: `₹X,XXX.00`
    - Fixed Demo Token: `₹100.00` (highlighted in Festive Amber, single constant `TOKEN_AMOUNT_PAISE = 10000`)
    - Remaining Balance: `₹ZZZ.00` (`Math.max(0, subtotal - 10000)`)
    - Items Requiring Price Confirmation: count displayed if any range items present.
  - Gating Notices:
    - If subtotal < ₹100: *"Add items until your subtotal reaches ₹100. The demo token amount is fixed at ₹100."*
    - If unpriced range items present: *"Every item in your box must have a confirmed price before proceeding to simulated payment."*
    - Portfolio Demo Notice: *"Portfolio Demo Only. No real orders, fireworks sales, delivery, or payments are processed."*
  - Action: Sticky Primary Button "Proceed to Review & Summary →".

### 6.3 States
- **Empty Cart:** Festive icon, title "Your Demo Basket is Empty", guidance to explore 6 poster categories, button "Explore 2026 Catalogue →".

---

## 7. Simulated Order Review (`/checkout/review` or Review View)

### 7.1 Purpose
Pre-submission audit of customer details, items, integer paise valuation, fixed ₹100 token rule, and initiation of simulated payment.

### 7.2 Layout
- Persistent Portfolio Demo Banner at top.
- Customer Details Card: Full Name, Mobile Number (+91), Collection Method, 18+ Age Attestation, Special Notes, with "Edit Details" navigation.
- Selected Items list with quantities and subtotal calculations.
- Financial Breakdown Card: Subtotal, Fixed Demo Token (₹100), Remaining Balance.
- Human-Readable Demo Summary Textarea with one-click "📋 Copy Demo Summary" button.
- Submission CTA:
  - Enabled when eligible: "Proceed to Simulated Payment (₹100 Demo Token) →"
  - Disabled when unpriced items exist or subtotal < ₹100, showing clear reason.

---

## 8. Simulated Payment Gateway Demo (Payment Modal / State)

### 8.1 Purpose
Demonstrates how an online token payment authorization behaves without connecting a live payment gateway or charging real funds.

### 8.2 Layout & Interactive Controls
- Modal Title: "Fixed ₹100 Demo Token Payment"
- Subhead: "Simulated token reservation amount: ₹100.00"
- Pending State:
  - Animated spinner with "Simulating Payment Authorization..."
  - Clear notice: *"No real UPI intent or bank API is contacted. Use the buttons below to test success or error response states:"*
  - Test Success Button: "Simulate Successful Payment (Test Success)"
  - Test Error Button: "Simulate Payment Failure (Test Error)"
  - Cancel Button: "← Cancel and Return to Review Screen"
- Failure State:
  - Error alert with decline explanation.
  - "Retry Simulated Payment" button.

---

## 9. Demo Order Confirmation (Success Screen)

### 9.1 Purpose
Displays simulated order reference, itemized receipt, token accounting, and explicit portfolio disclaimers.

### 9.2 Layout
- Success checkmark icon with emerald badge: "Simulated Payment Completed".
- Headline: "Demo Order Confirmation".
- Demo Reference: `DEMO-NT-XXXX`.
- Receipt card: Subtotal, Simulated Token Paid (₹100.00), Remaining Balance.
- Portfolio Demo Disclaimer:
  > *"Portfolio Demo Only: No real funds were charged, no real bank transaction occurred, and no commercial order will be packed or dispatched."*
- Actions: "📋 Copy Demo Order Summary" and "Start New Demo Order".

---

## 10. Order-Status Page (`/order/{orderId}`)

### 10.1 Purpose
Public-facing, token-authenticated status page allowing customers to check fulfillment progress at any time.

### 10.2 Layout
- Real-time Timeline Progress Bar:
  - Step 1: `Order Submitted` (Done)
  - Step 2: `Payment Verification` (Pending / Verified)
  - Step 3: `Order Confirmed & Preparing`
  - Step 4: `Ready for Counter Collection`
  - Step 5: `Completed`
- Store Contact Card: Store phone number, location directions, and counter timings.
- Itemized Receipt snapshot and payment status badge.

---

## 11. Admin Login (`/admin/login`)

### 11.1 Purpose
Secure administrator authentication perimeter.

### 11.2 Layout & Protection
- Minimalist high-security login card.
- Single Sign-On / Cloudflare Access integration or Email + One-Time Passcode (OTP).
- Protection: Cloudflare Turnstile challenge, brute-force rate limiter (5 failed attempts locks for 15 mins).
- Zero public self-registration links.

---

## 12. Admin Dashboard (`/admin`)

### 12.1 Purpose
Operational command center for store managers during Diwali rush.

### 12.2 Layout
- Top Metrics Row:
  - Orders Awaiting Payment Verification (Urgent count badge).
  - Orders Ready for Collection.
  - Today's Confirmed Token Revenue (in ₹).
  - Out of Stock Variants Alert.
- Action Queue: Table of the 10 most recent orders requiring immediate verification or preparation.

---

## 13. Product List & Editor (`/admin/products`)

### 13.1 Purpose
Catalogue CRUD management.

### 13.2 Layout
- Product Table: Image thumbnail, Product Name, Category, Variant Count, Active/Inactive switch, Actions.
- Product Editor Drawer / Modal:
  - Product Name (Poster spelling preserved).
  - Category dropdown (6 categories).
  - Description & Pack notes.
  - Image URL / Reference path.
  - Published switch.

---

## 14. Category & Variant Management (`/admin/products/{id}/variants`)

### 14.1 Purpose
Assigns exact prices in paise to specific sizes/variants.

### 14.2 Layout
- Variant Table: Variant Name (e.g. "Size 4"), SKU, Unit Pack Count, Price in Paise (₹ display), Stock Quantity, Active Switch.
- Form Validation: Prevents saving any variant with empty or 0 price.

---

## 15. Order List & Filters (`/admin/orders`)

### 15.1 Purpose
Triage, search, and manage customer orders.

### 15.2 Layout
- Filter Bar: Operational Status (`ALL`, `SUBMITTED`, `CONFIRMED`, `PREPARING`, `READY_FOR_PICKUP`, `COMPLETED`).
- Search Bar: Search by Order Reference (`NT-...`), Customer Phone, or Name.
- Order Table: Reference, Customer Name & Mobile, Items count, Subtotal, Token, Remaining Balance, 12-Digit UTR, UTR Status (`RECORDED_UNVERIFIED`), Operational Status, Manage Action.

---

## 16. Order Details Modal (`/admin/orders/{id}`)

### 16.1 Purpose
Complete operational view of an individual customer order.

### 16.2 Layout
- Customer Information: Name, Mobile, Fulfilment preference (`COUNTER_PICKUP`), Customer notes.
- Line Items Snapshot: Product name, variant size, quantity, unit price, line subtotal.
- Financial Breakdown: Subtotal, advance token required, remaining balance payable at counter.
- UTR Submission Card: Customer 12-digit UTR, submission timestamp, and truthful notice that payment is unverified.
- Operational Status Progression: Advance through `CONFIRMED` → `PREPARING` → `READY_FOR_PICKUP` → `COMPLETED`.

---

## 17. Inventory Management & Stock Adjustments (`/admin/inventory`)

### 17.1 Purpose
Manage physical on-hand stock, view active reservations, and log stock adjustments.

### 17.2 Layout
- Stats Bar: Total variant count, Low Stock alert count.
- Filter Bar: Toggle between All Variants and Low Stock Alerts Only; instant search by variant/product name.
- Stock Table: Variant ID, Product & Variant name, Current Stock, Reserved Stock, Available Stock, Threshold, Low Stock Badge, Adjust Action.
- Stock Adjustment Modal: Input for new physical count, mandatory audit reason (e.g. "Physical count verification", "Restock delivery"), operator ID.
- Movement Audit Stream: Chronological log of stock deltas and reasons.

---

## 18. QR Rotation, Support Issues & Sales Analytics (`/admin`)

### 18.1 QR Versions & Rotation
- Active QR banner with VPA, Account Name, and activation timestamp.
- Version history table with status badges and activate/deactivate controls.
- Draft QR Upload Modal: Label, VPA, Account Name, raster image picker (PNG/JPEG only; SVG strictly rejected).

### 18.2 Payment Support Tickets (`ISS-XXXX`)
- Support queue for customers reporting payment difficulties.
- Filter by status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `DISMISSED`).
- Manage Ticket Modal: Status dropdown, customer details, and staff contact notes.

### 18.3 Customer Directory & Purchase History
- Searchable customer directory with lifetime spend (₹), total orders, and contact details.
- Customer Profile Drawer: Complete historical order list for returning customers.

### 18.4 Sales Reports & RFC 4180 CSV Export
- Range selectors: Today, 7 Days, 30 Days, All Time.
- Summary Cards: Total Orders, Gross Order Value, Verified Bank Funds (₹0.00, Zero Hallucinated Revenue), Average Order Value.
- Daily Trend Table: Date, orders count, gross booked value, verified funds.
- Product Sales Breakdown Table: Top items ordered and revenue generated.
- CSV Export: Download RFC 4180 formatted CSV spreadsheet.

---

## 19. Application Error, Unavailable & Maintenance States

### 19.1 Purpose
Graceful error handling and offline survivability.

### 19.2 Layouts
- **404 Not Found:** "Cracker Rocket Flew Off Course: Page Not Found" + Return to Catalogue CTA.
- **500 Server Error:** "Temporary Sparkler Glitch: Our servers are catching up" + Retry CTA + WhatsApp support link.
- **Network Offline:** Banner "You are offline. Showing cached catalogue."
- **Season Maintenance:** "Nagarjuna Traders is preparing for Diwali 2026. Ordering opens shortly."
