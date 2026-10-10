# ADR-005: Integer Paise Accounting and Token Deposit Model

**Status:** Accepted  
**Date:** October 2026  
**Context:**  
Floating-point arithmetic in JavaScript and SQLite is susceptible to binary IEEE-754 precision errors (e.g. `0.1 + 0.2 === 0.30000000000000004`). In commerce applications, rounding discrepancies between item line totals, advance tokens, and remaining balances erode customer trust and cause reconciliation failures at the billing counter.

**Decision:**  
1. All monetary values are strictly represented, stored, and calculated as **integer minor units (Paise)**:
   $$\text{1 INR} = \text{100 Paise}$$
   Example: ₹350.00 is stored as `35000` paise.
2. Advance token deposit is calculated server-side:
   $$\text{token\_due\_paise} = \max\left(10000, \left\lceil \text{subtotal\_paise} \times 0.20 \right\rceil\right)$$
   (Default 20% advance with a minimum floor of ₹100 / 10,000 paise).
3. Remaining balance due at store counter:
   $$\text{balance\_due\_paise} = \text{subtotal\_paise} - \text{verified\_amount\_paise}$$
4. Client prices are completely untrusted; the server recalculates every total from current D1 database values.
5. Placed orders freeze their unit prices in `order_items` snapshots, making historical order totals permanently immutable.

**Alternatives Considered:**
- *Decimal Strings (`"350.00"`):* Rejected due to SQL arithmetic overhead and potential string-to-number parsing errors.
- *Standard IEEE Floats (`350.0`):* Rejected due to inevitable accumulation of penny/paisa roundoff drift across multi-item orders.

**Consequences:**
- **Positive:** Zero financial drift; exact paisa reconciliation across orders, bank credits, and counter cash receipts.
- **Negative:** Formatting utilities (`formatPaise()`, `parseInrToPaise()`) must be used consistently across UI and API boundaries.
