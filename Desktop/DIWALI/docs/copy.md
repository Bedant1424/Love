# NAGARJUNA TRADERS — UI COPY AND MESSAGING SPECIFICATION

**Document Reference:** `docs/copy.md`  
**Language:** English (Clear, respectful, Indian retail context) with localized terms (Diwali, Sivakasi, Laddis, Chakri, Kumpi, Skyshot)  
**System Mode:** Portfolio Demo Mode (`PORTFOLIO_DEMO_MODE=true`)  
**Tone:** Celebratory, trustworthy, transparent, concise

---

## 1. Global Navigation & Portfolio Demo Elements

| UI Element | Proposed Copy | Notes / Context |
|---|---|---|
| **Site Wordmark** | `NAGARJUNA TRADERS` | Displayed in top navigation. |
| **Site Tagline** | `Diwali Catalogue Showcase • Portfolio Demo` | Subtle subhead below brand. |
| **Global Demo Notice** | `Portfolio Demo Only. No real orders, fireworks sales, delivery, or payments are processed.` | Prominently displayed across banner, cart, review, and footer. |
| **Status Pill** | `● Portfolio Demo Mode` | Amber pulsating badge in header. |
| **Basket Button** | `Basket ({count})` / `Demo Basket ({count})` | Displays active item count in sample basket. |
| **Footer Notice** | `Portfolio Demo Only. No real orders, fireworks sales, delivery, or payments are processed. This project demonstrates an e-commerce interface, catalogue modelling, and simulated token payments for an engineering portfolio.` | Mandatory footer notice. |

---

## 2. Customer Home Page

| Section / Element | Proposed Copy |
|---|---|
| **Hero Eyebrow** | `DIWALI 2026 CELEBRATION` |
| **Hero Headline** | `Light Up Your Festivities with Authentic Crackers` |
| **Hero Subtext** | `Direct wholesale rates from Sivakasi. Reserve your festival box online and pick up fresh stock at our store counter.` |
| **Primary Hero CTA** | `Browse 2026 Catalogue` |
| **Secondary Hero CTA**| `Direct WhatsApp Chat` |
| **Trust Strip Item 1** | `✓ Genuine CSIR-NEERI Green Crackers` |
| **Trust Strip Item 2** | `✓ Exact Wholesale Pricing` |
| **Trust Strip Item 3** | `✓ Safe In-Person Counter Handover` |

---

## 3. Product Catalogue & Cards

| Component | Proposed Copy |
|---|---|
| **Category 1 Title** | `Laddis (Garland Crackers)` |
| **Category 1 Warning**| `⚠️ Series / garland crackers are subject to environmental regulations. Please check local district rules.` |
| **Category 2 Title** | `Skyshots (Aerial Fireworks)` |
| **Category 3 Title** | `Bombs (Sound Crackers)` |
| **Category 4 Title** | `Jharjhari & Sparklers` |
| **Category 4 Pack Note**| `All sparkler packs contain 10 packets of 10 pieces (100 pieces total per box).` |
| **Category 5 Title** | `Kumpi & Chakri (Flower Pots & Spinners)` |
| **Category 6 Title** | `Others & Special Novelties` |
| **Variant Label Format**| `{variantName} — ₹{price}` (e.g. `Medium — ₹150.00`) |
| **Unpriced Variant Label**| `{variantName} — Rate on Enquiry` |
| **Out of Stock Badge** | `Currently Sold Out` |
| **Add to Cart Button** | `Add to Box` |
| **Quantity Stepper Label**| `Quantity` (with `Decrease quantity` and `Increase quantity` screen-reader aria labels) |

---

## 4. Customer Details Form

| Form Field | Label / Placeholder / Helper Text | Error Message |
|---|---|---|
| **Full Name** | Label: `Full Name`<br>Placeholder: `e.g. Ravi Kumar`<br>Helper: `Name of the person collecting the order at counter.` | `Please enter your full name (minimum 2 characters).` |
| **Mobile Number** | Label: `Mobile Number`<br>Placeholder: `9876543210`<br>Helper: `We will send your order pickup OTP to this number.` | `Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.` |
| **Fulfilment Mode** | Label: `Collection Method`<br>Option 1: `Store Counter Pickup (Licensed Premises)`<br>Option 2: `Custom Wholesale Enquiry` | `Please select a collection method.` |
| **Age Attestation** | Label: `I confirm that I am 18 years of age or older as required by the Explosives Rules, 2008.` | `You must be 18 years or older to order fireworks.` |
| **Customer Notes** | Label: `Special Instructions (Optional)`<br>Placeholder: `e.g. Preferred pickup timing or packaging request.` | `Notes cannot exceed 150 characters.` |

---

## 5. Basket & Fixed ₹100 Token Breakdown
 
| Element | Proposed Copy |
|---|---|
| **Cart Title** | `Demo Basket` |
| **Empty Cart Title** | `Your Demo Basket is Empty` |
| **Empty Cart Subtext**| `You have not selected any cracker items yet. Browse our 6 authentic Diwali poster categories to assemble your sample box.` |
| **Empty Cart CTA** | `Explore 2026 Catalogue →` |
| **Subtotal Line** | `Simulated Order Subtotal` |
| **Fixed Token Line** | `Fixed Demo Token (Fixed ₹100)` |
| **Fixed Token Amount** | `₹100.00` (Strictly 10,000 integer paise) |
| **Remaining Balance Line** | `Remaining Balance (Subtotal - ₹100)` |
| **Subtotal < ₹100 Blocker** | `Add items until your subtotal reaches ₹100. The demo token amount is fixed at ₹100.` |
| **Unpriced Items Blocker** | `Every item in your box must have a confirmed price before proceeding to simulated payment.` |
| **Review Order CTA** | `Proceed to Review & Summary →` |

---

## 6. Simulated Checkout & Demo Payment Flow

| Element | Proposed Copy |
|---|---|
| **Review Title** | `Simulated Checkout & Review` |
| **Review Subtitle** | `Review your sample customer details, selected fireworks, fixed ₹100 demo token, and remaining balance below.` |
| **Proceed Button** | `Proceed to Simulated Payment (₹100 Demo Token) →` |
| **Modal Heading** | `Fixed ₹100 Demo Token Payment` |
| **Pending Status** | `Simulating Payment Authorization...` |
| **Pending Subtext** | `No real UPI intent or bank API is contacted. Use the buttons below to test success or error response states:` |
| **Simulate Success CTA** | `Simulate Successful Payment (Test Success)` |
| **Simulate Failure CTA** | `Simulate Payment Failure (Test Error)` |
| **Retry CTA** | `Retry Simulated Payment` |
| **Failure Notice** | `Simulated Payment Failed. This error state demonstrates how transaction timeouts, bank declines, or user cancellation are handled. No funds were charged.` |
| **Confirmation Title** | `Demo Order Confirmation` |
| **Confirmation Badge** | `Simulated Payment Completed` |
| **Order Reference** | `Demo Reference: DEMO-NT-XXXX` |
| **Confirmation Notice**| `Portfolio Demo Only: No real funds were charged, no real bank transaction occurred, and no commercial order will be packed or dispatched.` |
| **Copy Summary CTA** | `📋 Copy Demo Order Summary` |
| **Start New Order CTA**| `Start New Demo Order` |

---

## 7. Order Status Messaging

| Status | Headline | Subtext / Customer Guidance |
|---|---|---|
| **Submitted / Unpaid** | `Booking Submitted — Awaiting Token Payment` | `Please complete your UPI advance token payment to reserve your stock.` |
| **Pending Verification** | `Payment Reference Received — Verification Pending` | `Thank you! Our billing counter team is verifying your UTR with our bank credit alerts. Your booking will be confirmed shortly.` |
| **Confirmed & Preparing**| `Booking Confirmed! Packing Your Cracker Box` | `Your advance payment has been verified. Our staff is currently assembling your festive cracker box.` |
| **Ready for Pickup** | `Ready for Counter Collection! 🎉` | `Your cracker package is packed and sealed. Please visit our store counter with your Order Reference ({reference}) and valid government ID to collect your items.` |
| **Completed** | `Order Collected — Happy & Safe Diwali!` | `This order has been picked up. Thank you for celebrating with Nagarjuna Traders.` |
| **Cancelled** | `Booking Cancelled` | `This booking was cancelled. If you made an advance payment, please contact our support desk for refund reconciliation.` |

---

## 8. Administrative Portal Copy

| Screen / Element | Proposed Copy |
|---|---|
| **Admin Login Title** | `Nagarjuna Traders — Management Console` |
| **Admin Login Subtitle**| `Restricted authorized personnel access only.` |
| **Dashboard Metric 1** | `Pending UTR Verifications` |
| **Dashboard Metric 2** | `Orders Ready for Handover` |
| **Dashboard Metric 3** | `Today's Confirmed Advance (₹)` |
| **Dashboard Metric 4** | `Out of Stock Alerts` |
| **Verify Payment CTA** | `Verify Bank Credit & Confirm Order` |
| **Reject UTR CTA** | `Reject UTR (Mismatched or Uncredited)` |
| **Operator Note Prompt**| `Enter verification note (Bank alert time / remarks):` |

---

## 9. Error & Edge Case Notifications

| Code / Scenario | Customer-Facing Notification Copy |
|---|---|
| **400 Invalid Input** | `Please check the entered details. Phone numbers must be 10 digits and quantities must be positive.` |
| **403 Gated Checkout** | `Online checkout is currently in catalogue enquiry mode. Please tap the WhatsApp button to send your product list directly to our sales counter.` |
| **409 Duplicate UTR** | `This UPI transaction reference has already been submitted for another booking. Please check your bank receipt or contact support.` |
| **429 Rate Limit** | `Too many attempts. To protect our booking system during festival traffic, please wait 10 minutes before submitting again.` |
| **500 Server Error** | `Our system experienced a momentary glitch during Diwali rush. Your cart is safe. Please retry in a few moments.` |
| **Offline Mode** | `You are currently offline. Showing saved catalogue prices. Reconnect to submit bookings.` |
