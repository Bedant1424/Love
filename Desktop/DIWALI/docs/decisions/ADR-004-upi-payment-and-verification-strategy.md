# ADR-004: UPI Payment and Verification Architecture

**Status:** Accepted  
**Date:** October 2026  
**Context:**  
The client requested an online UPI payment flow for token booking. However, standard UPI deep links and static QR codes do not send webhooks or callbacks to web servers. Furthermore, commercial payment gateways (Razorpay, Cashfree) prohibit firecracker transactions in their standard risk policies. The business owner intends to supply an open-source UPI project repository, but its URL is currently outstanding.

**Decision:**  
We design a dual-path architecture:
1. **Primary Operational Path (Option B): Manual UPI QR + 12-Digit UTR Verification:**
   - Client generates dynamic UPI link / QR code containing store VPA and order reference.
   - Customer submits the 12-digit bank UTR reference.
   - Server enforces global uniqueness on the UTR, placing order in `PENDING_VERIFICATION`.
   - Store operator reconciles UTR against their bank SMS/app notifications and approves in the private Admin Panel.
2. **Automated Gateway Path (Option A):** Prepared as a future pluggable adapter if the owner provides an authorized gateway with merchant fireworks underwriting.

**Alternatives Considered:**
- *Automatic Screenshot Optical Character Recognition (OCR):* Rejected due to extreme vulnerability to Photoshop / screenshot tampering scams.
- *Browser Redirect as Payment Proof:* Rejected because URL redirects (`?status=paid`) can be trivially forged by any user using browser developer tools.

**Consequences:**
- **Positive:** Zero gateway transaction fees; zero merchant onboarding roadblocks; impossible for fraudsters to mark an order paid without bank staff verification.
- **Negative:** Requires active staff attention at the billing counter to approve incoming payments during festival hours.
