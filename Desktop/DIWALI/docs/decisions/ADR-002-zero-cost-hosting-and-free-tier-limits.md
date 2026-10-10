# ADR-002: Enforcement of Zero-Cost Hosting and Quota Management

**Status:** Accepted  
**Date:** October 2026  
**Context:**  
The project constraint mandates ₹0 in recurring hosting and software charges. However, free tiers are bounded by hard rate limits (Cloudflare Workers: 100k requests/day; D1: 100k writes/day, 5M reads/day). An unoptimized architecture could exhaust these quotas during a single afternoon of Diwali viral sharing, causing service outages.

**Decision:**  
We enforce a multi-layer edge caching and data minimisation architecture:
1. Public catalogue endpoints (`GET /api/v1/catalogue`) carry `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600`. Cloudflare's CDN caches responses globally, reducing Worker invocations by ~90–95%.
2. Carts are managed in customer browser LocalStorage and only hit the backend at checkout submission time.
3. Unavoidable non-software business expenses (optional custom domain ~₹800/yr, payment gateway MDR fees, and statutory LE-5 licensing) are documented separately from software hosting.

**Alternatives Considered:**
- *Server-Side Rendering (SSR) on Every Page:* Rejected because every page visit would invoke a Worker request, rapidly consuming the 100k daily free limit within a few hours of peak festival traffic.
- *Real-Time WebSocket Polling for Order Status:* Rejected due to high edge connection usage; replaced with client-triggered token polling with exponential backoff.

**Consequences:**
- **Positive:** Preserves the ₹0 recurring hosting guarantee even during festival surges of 15,000+ daily page views.
- **Negative:** Catalogue price updates take up to 60 seconds to propagate to all edge caches unless an admin purge API is called.
