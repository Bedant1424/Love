# NAGARJUNA TRADERS — ADMINISTRATIVE RUNBOOK & OPERATIONAL GUIDE

**Document Reference:** `docs/admin-runbook.md`  
**Target Audience:** Store Owner, Billing Counter Staff, Inventory Managers  
**System Access:** `/admin` (Protected via Cloudflare Access Zero Trust)  
**Emergency Contacts:** Store Manager (+91 98765 43210), Technical Support Team

---

## 1. Staff Authentication & Access Control

1. **Accessing the Portal:** Navigate to `https://<domain>/admin` using any modern browser (Chrome, Safari, Edge) on store desktop, tablet, or mobile.
2. **Identity Verification:**
   - The screen will prompt for your authorized staff email.
   - Enter your email and click **Send Login Code**.
   - Cloudflare Access will immediately send a 6-digit One-Time PIN (OTP) to your inbox.
   - Enter the OTP to unlock the console. Sessions remain active for 12 hours.
3. **Security Invariant:** Never share OTP codes. Logout immediately upon leaving the billing counter.

---

## 2. Daily Festival Morning Checklist (08:00 AM)

Every morning during Diwali festival week, the shift supervisor must execute:

- [ ] **Check 1: Bank Balance & Alerts Connectivity:** Confirm store smartphone receiving bank SMS credit notifications is charged and connected to mobile network.
- [ ] **Check 2: Pending Verifications Triage:** Open `/admin/orders?paymentStatus=PENDING_VERIFICATION` and reconcile any bookings submitted overnight.
- [ ] **Check 3: Inventory Spot Check:** Inspect physical warehouse stock for high-demand items (e.g. Bigboss Skyshot, 9cm Sparklers). Update stock counts in `/admin/inventory`.
- [ ] **Check 4: Pricing Review:** Confirm wholesale rate changes. If supplier rates changed, update variant prices in `/admin/products`.

---

## 3. Product & Pricing Management Procedure

### 3.1 Adding or Updating a Variant Price
1. Navigate to `/admin/products`.
2. Locate the product (e.g. *Tiger Bomb*) and click **Manage Variants**.
3. In the variant list, find the target size (e.g. *Size 4*).
4. Click **Edit Price**. Enter the exact price in Rupees (e.g. `250.00`).
5. Click **Save & Publish**.
6. **Important:** The system automatically converts this to paise (`25000 paise`) and purges the Cloudflare edge cache. All new website shoppers will immediately see the updated price. Existing historical orders will retain their locked price snapshots.

### 3.2 Marking a Product Sold Out
1. In `/admin/inventory` or `/admin/products`, toggle the **Active** switch to **OFF**, or set stock to `0`.
2. The product will instantly display the `Currently Sold Out` badge on the customer website and block new cart additions.

---

## 4. Payment Verification Runbook (Reconciliation)

```
[Customer Enters 12-Digit UTR on Website]
                     │
                     ▼
[Order Appears in Admin Panel with 'PENDING_VERIFICATION']
                     │
                     ▼
[Billing Staff Checks Bank Smartphone / Statement]
                     │
         Does bank SMS/app show credit matching
         Order Amount (₹XXX) and UTR (12 digits)?
                    / \
                  YES  NO
                  /     \
                 /       \
                ▼         ▼
  [Click 'Approve Payment']   [Click 'Flag Mismatched UTR']
  - Status becomes CONFIRMED  - Enters operator note
  - Customer gets confirmed   - Status remains PENDING
    receipt for packing       - Customer alerted to re-enter
```

### 4.1 Step-by-Step Payment Approval
1. Open `/admin/orders` and filter by `Status: Pending Verification`.
2. Click on the order to open the **Verification Modal**.
3. Note the **Expected Amount** (e.g. `₹140.00`) and the **Submitted UTR** (e.g. `428901234567`).
4. Cross-reference with the store HDFC/SBI/Paytm bank account transaction log:
   - Verify date and time match.
   - Verify credit amount is exactly equal to expected token amount.
   - Verify the 12-digit reference matches the UTR on screen.
5. Click **Verify Token Payment**. Enter operator initials (e.g. `OP-NAGARJUNA`).
6. The order status automatically advances to **CONFIRMED**, moving into the warehouse packing queue.

### 4.2 Handling Duplicate or Fraudulent References
- If a customer enters a fabricated UTR or an old transaction from yesterday:
  1. Click **Reject Payment Reference**.
  2. Select reason: `Bank credit not found` or `Amount mismatch`.
  3. The customer's status page updates to request customer service contact or re-entry of valid UTR.

---

## 5. Counter Handover & Balance Collection Procedure

When the customer visits the physical counter to collect their cracker box:

1. **Identify Customer:** Ask customer for their **Order Reference** (e.g. `NT-2026-884920`) or registered Mobile Number.
2. **Search Order:** Enter reference into `/admin/orders` search bar.
3. **Verify Status:** Confirm status is **READY_FOR_PICKUP**.
4. **Collect Balance:**
   - Display shows: `Remaining Balance: ₹560.00`.
   - Customer pays via Cash or counter UPI QR.
   - Click **Record Final Balance Payment**.
5. **Age & Handover Check:** Confirm customer is 18 years or older as required by the Explosives Rules, 2008. Hand over inspected and sealed cracker package.
6. **Close Order:** Click **Mark Order Completed**. The transaction is permanently archived.

---

## 6. End-of-Day Reconciliation & Data Export

1. At 10:00 PM, navigate to `/admin/reports`.
2. Click **Download Today's Transaction CSV**.
3. The report lists: Order IDs, Customer Names, Token Amounts Paid, Final Balances Collected, and Operator Sign-offs.
4. Total cash and UPI receipts are balanced against the store cash drawer and bank statements.

---

## 7. Emergency Response: Counter Overwhelmed / System Freeze

If physical counter crowds become overwhelming or warehouse stock is critically depleted:
1. Open `/admin/settings`.
2. Toggle **Master Commerce Checkout** to **OFF** (`COMMERCE_CHECKOUT_ENABLED=false`).
3. The website immediately pauses active order booking and shifts into **Informational Catalogue & WhatsApp Enquiry Mode**, preventing new booking obligations while preserving the website display.
