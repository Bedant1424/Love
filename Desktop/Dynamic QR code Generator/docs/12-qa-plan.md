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

### Suite 1: Google URL Validator (`tests/unit/google-url-validator.test.ts`) — [VERIFIED M3]
- [x] Accepts canonical Place ID link: `https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4`.
- [x] Accepts GBP short link: `https://g.page/r/CY2_EXAMPLE/review`.
- [x] Accepts Google Maps share link: `https://maps.app.goo.gl/wP4Example`.
- [x] Rejects deceptive hostnames (`https://google.com.attacker.com`).
- [x] Rejects URLs containing userinfo credentials (`https://admin:pass@search.google.com/...`).
- [x] Rejects non-HTTPS schemes (`http://`, `javascript:`, `data:`).

### Suite 2: Public Redirect Resilience (`tests/integration/redirect.test.ts` via `@cloudflare/vitest-plugin`) — [VERIFIED M2]
- [x] Normal ACTIVE card resolves in exactly ONE indexed D1 point query ($< 15$ ms).
- [x] Response headers contain strict `Cache-Control: private, no-cache, no-store, must-revalidate` and `Referrer-Policy: no-referrer`.
- [x] Security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy`) enforced.
- [x] State-aware routing verified for `ACTIVE` (302 to destination), `UNACTIVATED` (302 to `/activate/:publicId`), `DISABLED` (200 maintenance notice), `RETIRED` (200 retired notice), `UNKNOWN` (404), and malformed IDs (404).
- [x] D1 write-prevention verified: Zero writes or mutations during customer scan redirects.
- [x] Outbound fetch spy confirms zero server-side fetch requests (Zero SSRF).
- [x] Playwright E2E suite (`tests/e2e/redirect.spec.ts`) validates end-to-end edge redirects and browser status pages.
- [x] **Non-Critical Outage Invariant:** An outage or absence of Admin UI, Turnstile API, Analytics, and UptimeRobot causes zero degradation to `ACTIVE` card redirects.

### Suite 3: Activation Atomicity & Race Prevention (`tests/integration/activation.test.ts` & `tests/e2e/activation.spec.ts`) — [VERIFIED M3]
- [x] Concurrent requests submitting the same valid activation code -> Exactly 1 returns HTTP 200; competing requests return HTTP 400/409.
- [x] Public status checks on activated cards never leak business names, activation secrets, or target destinations.
- [x] Constant-time comparison preventing side-channel timing leaks.
- [x] E2E browser activation journey with subsequent immediate 302 redirect verification.

### Suite 4: Admin Operations, Card Lifecycle & Batch Provisioning (`tests/integration/admin.test.ts` & `tests/e2e/admin.spec.ts`) — [VERIFIED M4]
- [x] Rejection of unauthenticated requests to `/api/admin/*` and `/admin/*` with HTTP 401 Unauthorized.
- [x] Bounded card inventory listing and filtering without leaking activation code hashes.
- [x] Card inspection modal with detailed metadata and audit timeline history.
- [x] Lifecycle state transitions (`ACTIVE -> DISABLED`, `DISABLED -> ACTIVE`, `* -> RETIRED` terminal) executed atomically.
- [x] Destination URL modifications on `ACTIVE` cards validated against Google URL allowlist and logged with `DESTINATION_CHANGED`.
- [x] Batch provisioning generates collision-free 10-char Crockford Base32 IDs and returns raw one-time activation codes without storing plaintext in D1.
- [x] Full Playwright browser E2E test verifying operator lifecycle actions and instant reflection in public `/c/:publicId` redirects.

### Suite 5: QR Code & Physical Asset Pipeline (`tests/unit/qr-generator.test.ts`, `tests/unit/fulfillment.test.ts`, `tests/e2e/assets.spec.ts`) — [VERIFIED M5]
- [x] Vector SVG generator outputs valid XML with ISO/IEC 18004 Level H error correction, 4-module quiet zone, and zero hostile tokens (<script>, onload).
- [x] Pure TypeScript zero-dependency PNG encoder builds valid 8-bit grayscale PNGs decoding cleanly to canonical URLs using jsQR.
- [x] Canonical URL builder enforces physical invariant: encodes strictly `https://<HOST>/c/<publicId>` and never Google destination URLs.
- [x] NDEF URI Type U payload generator validates NXP NTAG213 user memory limits (< 45 of 144 bytes used) and permanent read-only lock directive.
- [x] Supplier manifest CSV adheres to RFC 4180 with CSV formula injection mitigation (`='`, `+'`, `-'`, `@'`).
- [x] Zero-knowledge privacy verification confirms zero business identities, review URLs, or database UUIDs in manifests or packages.
- [x] Full batch packaging builds in-memory ZIP archives with manifest.csv, README.txt, SVGs, and PNGs.
- [x] Playwright E2E browser test validates CR-80 card preview, face flipping, custom domain live validation, substrate switching, and manifest downloads.
