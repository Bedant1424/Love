# 12 — Quality Assurance & Testing Architecture

> **Status:** Reconciled at Final Design Review (Gate 1.5). Implementation has NOT started.  
> **Core Testing Tooling:** `@cloudflare/vitest-plugin` + Vitest + Playwright

---

## 1. Testing Stack & Runtime Architecture

```mermaid
flowchart TD
    Unit["Vitest Unit Tests\n(Pure Logic: Crypto, Google URL Validator)"]
    Bindings["@cloudflare/vitest-plugin Tests\n(Workers Runtime with Native D1 Bindings)"]
    E2E["Playwright Browser E2E\n(Activation Flow, Turnstile, Mobile Viewports)"]
    Physical["Physical QR & NFC Field QA\n(Real Hardware & Print Proofs)"]

    Unit --> Bindings --> E2E --> Physical
```

### Framework Roles
1. **`@cloudflare/vitest-plugin`:** The official Cloudflare test runner. Executes tests directly inside the Workers runtime environment with real local D1 database bindings, isolated storage, and full compatibility flags.
2. **Vitest (Node):** High-speed unit execution for pure functional modules (`google-url-validator.ts`, `crypto.ts`).
3. **Playwright:** End-to-end browser automation testing merchant activation, error states, and responsive mobile layouts across Chromium and WebKit.
4. **Physical Scan Matrix:** Manual verification on real mobile devices under varying lighting conditions before print runs.

---

## 2. Mandatory Acceptance Test Suites

### Suite 1: Google URL Validator (`test/unit/google-url-validator.test.ts`)
- [ ] Accepts canonical Place ID link: `https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4`.
- [ ] Accepts GBP short link: `https://g.page/r/CY2_EXAMPLE/review`.
- [ ] Accepts Google Maps share link: `https://maps.app.goo.gl/wP4Example`.
- [ ] Rejects deceptive hostnames (`https://google.com.attacker.com`).
- [ ] Rejects URLs containing userinfo credentials (`https://admin:pass@search.google.com/...`).
- [ ] Rejects non-HTTPS schemes (`http://`, `javascript:`, `data:`).

### Suite 2: Public Redirect Resilience (`test/integration/redirect.test.ts` via `@cloudflare/vitest-plugin`)
- [ ] Normal ACTIVE card resolves in exactly ONE indexed D1 point query ($< 15$ ms).
- [ ] Response headers contain strict `Cache-Control: private, no-cache, no-store, must-revalidate` and `Referrer-Policy: no-referrer`.
- [ ] **Non-Critical Outage Test:** Simulate total failure or disconnection of Admin UI, Turnstile API, Analytics, and UptimeRobot. Assert that an already-`ACTIVE` card continues redirecting with zero degradation.

### Suite 3: Activation Atomicity & Race Prevention (`test/integration/activate.test.ts`)
- [ ] 10 concurrent requests submitting the same valid activation code $\rightarrow$ Exactly 1 returns HTTP 200; 9 return HTTP 400/409.
- [ ] Replay of used Turnstile token returns HTTP 403.
- [ ] Public status checks on activated cards never leak business names or target destinations.
