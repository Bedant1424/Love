# ADR-003: Legal Gating and Enquiry-Only Default Mode

**Status:** Accepted  
**Date:** October 2026  
**Context:**  
Under Indian law, the Supreme Court (*Arjun Gopal v. Union of India*) prohibited e-commerce sales and courier delivery of firecrackers. Furthermore, joined crackers (laddis/garlands) are banned nationwide. Deploying a live checkout without verifying local LE-5 retail permissions exposes the business and technical team to criminal liability and contempt of court.

**Decision:**  
The software defaults to a fail-closed configuration:
```ini
COMMERCE_CHECKOUT_ENABLED=false
```
When false:
1. Live order creation and online payment collection are hard-blocked at the Worker API boundary.
2. The user interface switches into a **Non-Binding Digital Catalogue & Estimate Generator**, allowing shoppers to calculate costs and output a WhatsApp estimate slip for counter consultation.
3. Live checkout can ONLY be unlocked when the store owner provides verified physical LE-5 licensing and legal clearance.

**Alternatives Considered:**
- *Deploy Live Checkout Immediately with Disclaimers:* Rejected as legally unsafe and non-compliant with Supreme Court directives.
- *Omit the Website Entirely:* Rejected because an informational digital price calculator and catalogue flyer provides legitimate commercial utility without violating e-commerce bans.

**Consequences:**
- **Positive:** Complete insulation against statutory violation and legal liability; maintains a functional, useful application for shoppers and store staff.
- **Negative:** Customers cannot complete end-to-end binding purchases online until compliance clearance is secured.
