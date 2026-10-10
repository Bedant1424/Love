# NAGARJUNA TRADERS — UI COPY AND MESSAGING SPECIFICATION

**Document Reference:** `docs/copy.md`  
**Language:** English (Clear, respectful, Indian retail context) with localized terms (Diwali, Sivakasi, Laddis, Chakri, Kumpi, Skyshot)  
**Tone:** Celebratory, trustworthy, transparent, concise (following Taste Skill copy audit)

---

## 1. Global Navigation & Brand Elements

| UI Element | Proposed Copy | Notes / Context |
|---|---|---|
| **Site Wordmark** | `NAGARJUNA TRADERS` | Displayed in top navigation. |
| **Site Tagline** | `Diwali 2026 Wholesale & Retail Crackers` | Subtle subhead below brand. |
| **Location Badge** | `📍 Sivakasi • Licensed Counter Pickup` | Reminds customer of physical collection. |
| **Status Pill (Active)**| `● 2026 Festive Bookings Open` | Emerald badge in header. |
| **Status Pill (Enquiry)**| `● Enquiry & Estimate Mode Active` | Amber badge when checkout is gated. |
| **Cart Button** | `Cart ({count})` | Displays active item count. |
| **Footer Legal Disclaimer**| `Online sale and delivery of firecrackers are prohibited under Indian law. Nagarjuna Traders operates an advance counter reservation service. Products must be collected in person with valid government ID.` | Mandatory statutory disclaimer on all pages. |

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

## 5. Cart & Totals Breakdown

| Element | Proposed Copy |
|---|---|
| **Cart Title** | `Your Festival Cracker Box` |
| **Empty Cart Title** | `Your Cracker Box is Empty` |
| **Empty Cart Subtext**| `You have not selected any Diwali crackers yet. Browse our 6 categories to pick your celebration favourites.` |
| **Empty Cart CTA** | `Start Browsing Catalogue` |
| **Subtotal Line** | `Catalogue Subtotal` |
| **Taxes Line** | `Taxes & Surcharges` (`Included in printed prices`) |
| **Token Due Line** | `Advance Token Due (20%)` |
| **Token Helper Copy** | `Required to reserve physical stock in your name.` |
| **Balance Line** | `Remaining Balance at Counter` |
| **Balance Helper Copy**| `Payable in cash or UPI during physical package collection.` |
| **Review Order CTA** | `Proceed to Review & Booking` |

---

## 6. Payment Instructions & UTR Entry

| Element | Proposed Copy |
|---|---|
| **Screen Title** | `Complete Advance Token Payment` |
| **Order Reference** | `Order Reference: {reference}` |
| **Amount Highlight** | `Advance Token Payable: ₹{tokenAmount}` |
| **UPI Instructions** | `1. Scan the QR code below or tap your preferred UPI app.<br>2. Complete the payment of exactly ₹{tokenAmount}.<br>3. Copy the 12-digit UTR / Bank Reference Number from your UPI app receipt.<br>4. Enter the UTR below to confirm your booking.` |
| **UPI App Tap CTA** | `Pay with GPay / PhonePe / Paytm` |
| **UTR Form Label** | `12-Digit Bank Reference / UTR Number` |
| **UTR Form Placeholder**| `e.g. 428901234567` |
| **UTR Helper Text** | `Found on your UPI payment receipt under 'UPI transaction ID' or 'UTR'.` |
| **Submit UTR CTA** | `Submit Reference for Staff Verification` |

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
