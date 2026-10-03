# AGENTS.md — Contributor & Autonomous Agent Directives

> **Operating Rules for AI Agents and Human Developers on QRoute**  
> **Status:** Reconciled & Frozen at Gate 1.5 Final Review (October 2026)

---

## 1. Project Purpose

QRoute is a self-hosted, \$0/month dynamic QR and NFC routing platform designed specifically for physical Google Review cards. It replaces \$15–\$200/month commercial dynamic QR subscriptions with a permanent, ultra-fast Cloudflare edge redirect engine that never locks or holds physical cards hostage.

---

## 2. Core Stack

- **Runtime & Edge API:** Cloudflare Workers + Hono (TypeScript)
- **Edge Database:** Cloudflare D1 (SQLite, single-threaded per DB, indexed point lookups only)
- **Frontend & Static Assets:** React 19 + TypeScript + Vite + Workers Static Assets
- **UI & Styling:** Tailwind CSS v4 + shadcn/ui primitives
- **Bot Defense:** Cloudflare Turnstile (Unlimited Free Tier)
- **Admin Authentication:** Cloudflare Access (Zero Trust, 50 free seats)
- **QR Engine:** `qrcode` npm package (MIT license, SVG output, Level H error correction)
- **Testing:** Vitest + `@cloudflare/vitest-plugin` (Workers binding-aware runtime) + Playwright
- **CI/CD & Backups:** GitHub Actions Free + GPG Encrypted Artifacts
- **Monitoring:** UptimeRobot Free (HTTP probes on `/healthz` and `/healthz/redirect-test`)

---

## 3. The Prime Invariant: The Public Redirect Path

The customer scan redirect path (`GET /c/:publicId`) is sacred and minimal:
```
Customer Scan -> Cloudflare Worker -> Single Indexed D1 Query -> State Resolution -> HTTP 302 Found
```

### HARD ARCHITECTURAL INVARIANTS:
1. **Exactly One Indexed D1 Lookup:** The normal redirect path (`ACTIVE` or `UNACTIVATED`) must execute exactly one indexed point query (`SELECT status, destination_url FROM cards WHERE public_id = ?`). Full-table scans are strictly banned.
2. **Zero Optional Dependencies in Critical Path:** The following are strictly **FORBIDDEN** from the public redirect critical path:
   - ❌ No Cloudflare Turnstile
   - ❌ No Analytics Engine / analytics writes
   - ❌ No D1 scan-count increment writes (write transactions block the single-threaded D1 engine)
   - ❌ No Google Business Profile or external Google API calls
   - ❌ No outbound network `fetch()` requests
   - ❌ No AI / LLM invocations
   - ❌ No email / notification dispatches
   - ❌ No Cloudflare Queues
   - ❌ No Cloudflare Workers KV
   - ❌ No Admin dashboard dependencies
3. **Resilience Invariant:** If any non-critical service (admin UI, analytics, batch generator, monitoring, backup automation) is degraded or completely offline, an already-`ACTIVE` card **must continue redirecting with zero degradation**.
4. **Header Invariant:** All 302 redirect responses must emit:
   - `Cache-Control: private, no-cache, no-store, must-revalidate`
   - `Referrer-Policy: no-referrer`
   - Complete security headers (CSP, HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: DENY).

---

## 4. Absolute Prohibition List (Do NOT Introduce)

1. ❌ **No Paid Services:** Absolutely zero monthly infrastructure costs for the pilot. No paid plans, add-ons, or billable features.
2. ❌ **No Quota-Evasion Tricks:** Never build multi-account rotators, proxy pools, or quota-evasion mechanisms. The system operates strictly within published Cloudflare free tiers.
3. ❌ **No Vercel Hobby:** Vercel Hobby terms prohibit commercial use.
4. ❌ **No Supabase as Production Core:** Avoid non-edge latency and vendor dependency for the core redirect.
5. ❌ **No Third-Party Dynamic QR Providers:** Do not proxy or wrap external services like Bitly, Uniqode, or QR Code Generator.
6. ❌ **No Google Business Profile APIs in v1:** Destination URLs are validated purely via structural syntax, hostname exact matching, and URL parser allowlists.
7. ❌ **No Outbound Network Sockets on Activation:** Never initiate server-side `fetch()` requests to destination URLs (zero SSRF risk).
8. ❌ **No Review Gating or Screening:** Never filter or intercept negative reviews. All visitors are directed straight to Google's official review form.
9. ❌ **No Destination in Printed QR:** The physical QR or NFC tag must **never** encode the Google destination directly. It must encode only the permanent public card identifier URL (`/c/:publicId`).

---

## 5. Security & Cryptographic Rules

1. **Activation Code Storage:** Activation codes must **never** be stored in plaintext. They are stored strictly as HMAC-SHA256 hex digests using `ACTIVATION_SECRET`.
2. **Atomic State Transitions:** Public activation transitions cards from `UNACTIVATED` to `ACTIVE` using atomic SQLite queries (`WHERE public_id = ? AND status = 'UNACTIVATED'`). Verify `changes === 1` to guarantee race condition prevention.
3. **Strict Destination Validation:** Destination validation must use the standard `URL` parser and exact hostname/path allowlists. Naive substring matching like `url.includes("google.com")` is strictly prohibited.
4. **Parameterized SQL Only:** Every D1 query must use `.prepare().bind(...)`. Raw string concatenation or `.exec()` with interpolated values is banned.
5. **Generic Error Messages:** Activation errors must return generic feedback ("Invalid activation code or card ID") to prevent username/merchant enumeration.
6. **No Plaintext in Logs:** Activation codes, secret keys, auth tokens, and request bodies must never appear in logs or error traces.

---

## 6. Git, Branching & Conventional Commits

1. **Feature Branching:** Never commit directly to `main`. All work must occur on dedicated feature branches (e.g., `feature/qr-nfc-platform-design`).
2. **No Auto-Merge:** Human operator approval is required prior to merging to `main`.
3. **Conventional Commits:** Use conventional commit formatting:
   - `feat(worker): add Crockford Base32 ID generation`
   - `fix(security): sanitize business name input`
   - `docs(api): update OpenAPI specifications`
   - `test(e2e): add Playwright activation journey`

---

## 7. Database Migration Protocol

1. Migrations are numbered forward-only SQL files located in `/migrations/` (e.g. `0001_initial_schema.sql`).
2. D1 is single-threaded per database: all indexes must be explicitly declared and tested.
3. Never run destructive drops (`DROP TABLE`, `DROP COLUMN`) without a confirmed GPG-encrypted backup.
4. Before applying remote migrations, always test locally using `wrangler d1 migrations apply <DB> --local`.

---

## 8. UI/UX & Design Guidelines

1. When designing or modifying frontend components, use the local design intelligence from `ui-ux-pro-max` and `taste-skill`.
2. Strictly avoid generic "AI SaaS" tropes (purple-to-blue neon gradients, bloated card shadows, meaningless decorative blobs).
3. Design for mobile-first utility, high-contrast daylight readability, and instant touch feedback.
