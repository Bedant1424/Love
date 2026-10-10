# NAGARJUNA TRADERS — UI/UX SCREEN SPECIFICATIONS (DESIGN.MD)

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

## 6. Cart (`/cart`)

### 6.1 Purpose
Complete review of items, quantities, unit prices, line subtotals, gross total, token amount, and balance.

### 6.2 Layout
- **Mobile Layout:**
  - Stacked list of cart item cards.
  - Each item row contains: Product Name, Variant Pill, Exact Unit Price, Quantity Stepper, Line Subtotal, and Trash/Remove icon button.
  - Price Calculation Card:
    - Items Subtotal: `₹X,XXX.00` (computed in paise)
    - Confirmed Taxes / Charges: `₹0.00` (Inclusive / explicitly itemized)
    - Token Deposit Required (20%): `₹YYY.00`
    - Remaining Balance Payable at Counter: `₹ZZZ.00`
  - Action: Sticky Primary Button "Proceed to Review".
- **Desktop Layout:** Table layout with thumbnail, variant, price, quantity stepper, total, and sticky right-hand summary sidebar.

### 6.3 States
- **Empty Cart:** Festive illustration, text "Your Diwali box is empty", and primary button "Explore Catalogue".

---

## 7. Order Review (`/checkout/review`)

### 7.1 Purpose
Final pre-submission audit. Recalculates all values from server database rules, validates stock, and runs Cloudflare Turnstile bot verification.

### 7.2 Layout
- Customer Details Card: Name, Phone number, and Pickup preference.
- Itemized Order Summary (frozen line snapshots).
- Financial Breakdown: Total, Token Amount Due, Balance Due.
- Legal Disclaimer Box: Counter collection rules and age requirement.
- Bot Verification: Embedded Cloudflare Turnstile challenge box.
- Submission CTA:
  - If `COMMERCE_CHECKOUT_ENABLED=true`: "Submit Order & Pay Token"
  - If `COMMERCE_CHECKOUT_ENABLED=false`: "Generate WhatsApp Estimate Slip"

---

## 8. Payment Instructions (`/checkout/payment/{orderId}`)

### 8.1 Purpose
Presents approved UPI payment methods (VPA, QR code, Intent link) for the exact token amount.

### 8.2 Layout
- Order Reference Badge: `NT-2026-XXXXXX`.
- Token Deposit Due: `₹XXX.00` (Highlighted in Warm Marigold).
- Dynamic UPI QR Code: Pre-encoded with VPA, amount, and order reference note.
- "Tap to Pay with UPI App" button (Mobile only, triggers `upi://pay` intent for GPay/PhonePe/Paytm).
- Manual Reference Entry Form:
  - Label: "Enter 12-digit UPI Reference / UTR Number from your bank receipt".
  - Input: 12-digit numeric text input (`inputmode="numeric"`, pattern `\d{12}`).
  - Action Button: "Submit UTR for Verification".

---

## 9. Order Confirmation (`/checkout/confirmed/{orderId}`)

### 9.1 Purpose
Confirms successful order capture and informs the customer that staff verification is underway.

### 9.2 Layout
- Hero Status: Amber Hourglass icon + "Booking Submitted — Payment Under Verification".
- Prominent Order ID: `NT-2026-XXXXXX` with "Copy Reference" button.
- Secret Tracking Link: Bookmarking reminder with direct link `/order/{orderId}?token={secret}`.
- Next Steps Card:
  1. Store staff verifies UTR against bank account.
  2. Order changes to "Confirmed".
  3. SMS/WhatsApp notification sent when package is packed.
  4. Collect crackers at store counter by presenting this Order ID.

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
Triage and search orders.

### 15.2 Layout
- Filter Bar: Date Range, Operational Status (`ALL`, `SUBMITTED`, `CONFIRMED`, `READY`, `COMPLETED`, `CANCELLED`), Payment Status (`ALL`, `UNPAID`, `PENDING_VERIFICATION`, `VERIFIED_TOKEN`, `VERIFIED_FULL`).
- Search Bar: Search by Order Reference (`NT-...`), Customer Phone, or UTR.
- Order Table: Order ID, Date/Time, Customer Name, Mobile, Subtotal, Token, Status Badges, Action button ("View Details").

---

## 16. Order Details Modal / Page (`/admin/orders/{id}`)

### 16.1 Purpose
Complete operational view of an individual customer order.

### 16.2 Layout
- Customer Information: Name, Phone (with one-click Call / WhatsApp link), Pickup preference.
- Line Items Table: Frozen price snapshots, quantities, subtotals.
- Audit Log Timeline: Shows timestamp and operator for every status change.
- Status Action Dropdown: Enforces allowed state transitions (e.g. cannot transition to `CONFIRMED` until payment is `VERIFIED`).

---

## 17. Payment Verification Interface (`/admin/orders/{id}/verify-payment`)

### 17.1 Purpose
Reconcile customer-submitted UTR with merchant bank statements.

### 17.2 Layout
- Expected Token Amount: `₹XXX.00` (`XXXXX paise`).
- Customer Submitted UTR: `123456789012` (with "Copy UTR" button).
- Operator Verification Controls:
  - Button 1: "Approve Payment (Mark Verified)" -> Prompts for confirmation.
  - Button 2: "Flag Invalid UTR / Mismatch" -> Opens note field.
  - Button 3: "Record Partial / Full Cash Receipt" (Counter adjustment).
- History Record: Captures operator identity and timestamp permanently.

---

## 18. Inventory Adjustment (`/admin/inventory`)

### 18.1 Purpose
Real-time stock auditing during peak sales.

### 18.2 Layout
- Quick-edit tabular grid for fast inline number updates.
- Low stock highlight (< 5 units).
- Instant "Mark Out of Stock" toggle button.

---

## 19. Application Error, Unavailable & Maintenance States

### 19.1 Purpose
Graceful error handling and offline survivability.

### 19.2 Layouts
- **404 Not Found:** "Cracker Rocket Flew Off Course — Page Not Found" + Return to Catalogue CTA.
- **500 Server Error:** "Temporary Sparkler Glitch — Our servers are catching up" + Retry CTA + WhatsApp support link.
- **Network Offline:** Banner "You are offline. Showing cached catalogue."
- **Season Maintenance:** "Nagarjuna Traders is preparing for Diwali 2026. Ordering opens shortly."
