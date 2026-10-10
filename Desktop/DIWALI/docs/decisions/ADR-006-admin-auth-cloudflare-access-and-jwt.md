# ADR-006: Administrative Authentication via Cloudflare Access and JWT

**Status:** Accepted  
**Date:** October 2026  
**Context:**  
The administrative console (`/admin`) manages sensitive business operations: setting product prices, modifying inventory, verifying customer payments, and viewing customer contact details. It must be impenetrable to unauthorized public access while requiring zero recurring auth SaaS fees (e.g. Auth0, Clerk).

**Decision:**  
We implement a zero-trust administrative security perimeter using **Cloudflare Access (Zero Trust)**:
1. All traffic to `/admin*` and `/api/v1/admin*` is intercepted at the Cloudflare edge network before reaching application code.
2. Store managers authenticate via One-Time PIN (OTP) sent to verified business email addresses (or Google Workspace SSO).
3. The Cloudflare Worker validates the cryptographic `Cf-Access-Jwt-Assertion` header using Cloudflare's public JWKS certificates.
4. As a local development fallback, the Worker supports signed HTTP-only secure session cookies generated via the Web Crypto API.
5. Zero public administrative self-registration endpoints exist.

**Alternatives Considered:**
- *Basic Username & Password in Database:* Rejected due to credential stuffing risks, rainbow table vulnerabilities, and the complexity of building secure password reset/MFA flows from scratch.
- *Third-Party Auth SaaS (Auth0, Clerk, Stytch):* Rejected due to potential monthly fees and vendor lock-in violating the ₹0-cost target.

**Consequences:**
- **Positive:** Enterprise-grade Zero Trust security for up to 50 staff members at ₹0 cost; protects the entire edge surface from automated attacks and credential stuffing; shifts authentication out of application code.
- **Negative:** Requires initial setup of a free Cloudflare Zero Trust account and configuration of the Access application policy.
