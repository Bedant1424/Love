# NAGARJUNA TRADERS — ADMINISTRATIVE RUNBOOK & OPERATIONAL GUIDE

**Document Reference:** `docs/admin-runbook.md`  
**Target Audience:** Store Owner, Billing Counter Staff, Inventory Managers  
**System Access:** `/admin` (Protected via Cloudflare Access Zero Trust in Production)  
**Emergency Contacts:** Store Manager, Technical Support Team

---

## 1. Staff Authentication & Access Control

1. **Accessing the Portal:**
   - In production, navigate to `https://<domain>/admin`. The route is guarded by Cloudflare Access Zero Trust.
   - Operators authenticate using authorized team identity (Google Workspace or email OTP).
   - The Cloudflare Access edge validates the JWT assertion (`Cf-Access-Jwt-Assertion`) header on all requests to `/api/v1/admin/*`.
   - Direct password login in production is prohibited and returns `403 Forbidden`.
   - In local development mode, the admin console uses an isolated staff development passphrase and bearer token.
2. **Security Invariant:** Logout immediately upon leaving the counter desk.

---

## 2. Daily Counter Morning Checklist

Every morning during Diwali festival week, the shift supervisor must execute:

- [ ] **Check 1: Review Overnight Orders:** Open the Orders tab to review newly placed orders and customer pickup schedules.
- [ ] **Check 2: Inventory Spot Check:** Inspect warehouse stock for high-demand items (e.g. Bigboss Skyshot, 9cm Sparklers).
- [ ] **Check 3: Pricing Verification:** Confirm that active prices match current printed poster rates. If adjustments are necessary within printed bounds, update via the Catalogue tab.

---

## 3. Product & Pricing Management Procedure

### 3.1 Updating a Variant Price
1. Navigate to `/admin` and select the **Catalogue & Pricing** tab.
2. Locate the variant (e.g. *10 cm Electric Sparklers - Gold*).
3. Click **Edit Price**.
4. Enter the new active price in Rupees (e.g. `180`).
5. **Printed Bounds Check:** The system verifies that the price falls within the printed minimum and maximum bounds from the Diwali poster.
6. **Overrides:** If an exceptional override outside printed bounds is required, the operator must check "Allow price outside printed boundaries" and enter a mandatory audit justification reason.
7. Click **Save Price**. The update is recorded in the immutable audit log stream.

---

## 4. Order Management & UTR Submission Status

The application records customer orders and submitted 12-digit UTR payment references.

### 4.1 Payment Status Lifecycle
- **`UNPAID`:** The order has been submitted, but no 12-digit UTR reference has been provided.
- **`RECORDED_UNVERIFIED`:** The customer has submitted a 12-digit UTR reference.
  - **Important Policy:** This application does **not** verify payments, connect to bank APIs, or claim to establish receipt of funds.
  - No automated or manual "verification" buttons exist.
  - Staff must directly check store banking records before handing over fireworks at the counter.

### 4.2 Operational Status Progression
Staff can advance the order's physical fulfilment state:
1. **`SUBMITTED`:** Initial customer booking.
2. **`CONFIRMED`:** Staff have acknowledged the reservation.
3. **`PREPARING`:** Warehouse is packing the box.
4. **`READY_FOR_PICKUP`:** Box is packed and labeled with the Order Reference at the collection desk.
5. **`COMPLETED`:** Customer has visited the counter, age has been confirmed (18+), balance has been collected, and items handed over.

---

## 5. Counter Handover & Balance Collection Procedure

When the customer visits the counter to collect their order:

1. **Identify Customer:** Ask customer for their **Order Reference** (e.g. `NT-4829`) and registered Mobile Number.
2. **Search Order:** Enter reference into `/admin` Orders search bar.
3. **Review Details:**
   - Confirm customer details and items in box.
   - Note submitted 12-digit UTR reference (if submitted).
   - Confirm remaining balance due at collection.
4. **Verify Photo ID:** Confirm photo ID (18+) before handing over fireworks.
5. **Collect Remaining Balance:** Collect remaining balance in cash or UPI at the collection desk.
6. **Complete Handover:** Click **COMPLETED** to finalize the order record.
