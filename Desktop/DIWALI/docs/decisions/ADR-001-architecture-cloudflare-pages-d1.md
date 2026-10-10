# ADR-001: Selection of Cloudflare Pages, Workers, and D1 Architecture

**Status:** Accepted  
**Date:** October 2026  
**Context:**  
Nagarjuna Traders requires a mobile-first fireworks ordering platform with a strict target of ₹0 in recurring hosting and software charges. The platform must withstand severe seasonal Diwali traffic spikes (thousands of concurrent festival shoppers) without cold starts, performance degradation, or surprise cloud billing bills.

**Decision:**  
We select an all-Cloudflare serverless architecture:
1. **Frontend:** React 18 + Vite + TypeScript hosted on **Cloudflare Pages**.
2. **Backend API:** **Cloudflare Workers** (V8 Isolates running at edge nodes worldwide).
3. **Database:** **Cloudflare D1** (Serverless distributed SQLite at edge).
4. **Abuse Mitigation:** **Cloudflare Turnstile** for managed bot challenges.

**Alternatives Considered:**
- *Vercel + Supabase:* Rejected due to Supabase free tier database pause after 1 week of inactivity (lethal for a seasonal festival store) and Vercel edge bandwidth/invocation limits.
- *Node.js / Express on VPS (DigitalOcean / Render / Fly.io):* Rejected due to recurring monthly hosting fees ($5–$12/month) violating the ₹0-cost constraint.
- *AWS Lambda + DynamoDB:* Rejected due to cold start latency, complex IAM configuration, and risk of accidental credit card charges during traffic surges.

**Consequences:**
- **Positive:** Truly ₹0 recurring cost; global edge caching of catalogue assets (90%+ traffic served with 0ms Worker execution time); zero server maintenance; seamless deployment via Wrangler.
- **Negative:** Cloudflare D1 has a daily free limit of 100,000 writes and 5M reads; Workers limited to 100,000 requests/day. Mitigated via edge caching and client-side cart management.
