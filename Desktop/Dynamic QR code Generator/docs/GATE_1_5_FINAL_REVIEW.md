# GATE 1.5 — Final Design Review & Platform Reconciliation

> **Status:** GATE 1.5 COMPLETE — Ready for Implementation  
> **Date:** October 2026  
> **Branch:** `feature/qr-nfc-platform-design`

---

## Formal Gate Statement

**Gate 1.5 complete. Implementation may now begin.**

---

## 1. Executive Summary & Purpose

Gate 1.5 serves as the formal design reconciliation gate between initial research and physical application implementation. It reconciles all system documentation with verified Cloudflare edge behavior, eliminates overconfident or brittle assumptions, and freezes the core invariants.

---

## 2. Reconciliations Summary (The 13 Focus Areas)

### 1. Domain Strategy Reconciliation
- **Pilot Phase:** `workers.dev` is fully viable and authorized for development, staging, pilot validation, and small \$0 physical-card testing.
- **Commercial Reality:** Cloudflare classifies `workers.dev` as intended for personal/hobby projects and recommends custom domains for business-critical production. A provider-controlled free subdomain is **not** the preferred long-term strategy for physical cards in circulation for years.
- **Free Domain Rigor:** No free domain service in 2026 (`is-a.dev`, `eu.org`, `freedns`, `pp.ua`) satisfies all 5 commercial criteria (commercial permission, longevity, stable DNS, friction-free renewal, low revocation risk).
- **Migration Architecture:** The Worker is host-agnostic. A future owned custom domain (`qr.yourbrand.com` at \$3–\$10/yr) attaches directly to the Worker alongside `workers.dev`. Physical cards never require reprinting.

### 2. Workers Free Quota & Capacity Boundary
- Daily dynamic Worker invocations are capped at **100,000 requests/day**.
- Quota exhaustion is **not** a harmless throttling; Cloudflare edge actively halts further execution, returning HTTP 1027 or 429 until 00:00 UTC.
- **Capacity Boundary Protocol:**
  - 🟢 **Green (0%–70%):** Normal operation.
  - 🟡 **Warning (70%–90%):** Alert operators; tighten edge WAF rate limits.
  - 🔴 **Critical (90%–100%):** Throttle non-critical admin traffic; prioritize customer card redirects.
  - ⛔ **Exhaustion (100%+):** Fails safely at edge; zero billable overages.
- Zero quota evasion tricks (no multi-account rotators).

### 3. D1 Single-Threading & Performance Invariant
- Cloudflare D1 operates **single-threaded per database instance**.
- Full-table scans are strictly banned. Every query in the redirect path must execute an indexed point lookup (`idx_cards_public_id`).
- Normal redirect (`GET /c/:publicId`) executes **exactly one indexed D1 lookup** ($< 2$ ms compute).
- **Zero Redirect Writes:** D1 scan-count increment writes are completely removed from the redirect critical path to prevent SQLite write lock contention.

### 4. Testing Stack Modernization
- Adopted Cloudflare's official `@cloudflare/vitest-plugin` as the primary Workers testing harness.
- Executes tests directly inside the Workers runtime with native local D1 database bindings.
- Playwright provides end-to-end browser automation for the merchant activation journey.

### 5. Centralized Flexible Google URL Validation
- Avoids brittle single-pattern validation.
- Accommodates official Google Business Profile sharing links:
  - Canonical Place ID review links (`search.google.com/local/writereview?placeid=...`)
  - GBP short links (`g.page/r/.../review`)
  - Google Maps mobile app share links (`maps.app.goo.gl/...`)
  - Desktop Maps links (`maps.google.com/maps?...`)
- Enforced via exact hostname allowlists and URL parsing; zero substring matching (`url.includes("google.com")` is banned); zero server-side fetches (zero SSRF).

### 6. Sacred Redirect Path Invariant
The redirect path (`GET /c/:publicId`) is frozen:
$$\text{Customer Scan} \longrightarrow \text{Worker} \longrightarrow \text{Single Indexed D1 Read} \longrightarrow \text{HTTP 302 Found}$$
- **Strictly Forbidden in Critical Path:** Turnstile, analytics, D1 scan-writes, external HTTP fetches, Google APIs, AI, emails, Queues, KV, and admin dashboard services.

### 7. Activation Security Finalization
- Public ID (`A7K92P4X8Q`) + Separate Activation Code (`K7XM-92PR-L8Q2`).
- Stored exclusively as HMAC-SHA256 digests. Plaintext codes are never stored in D1, never in public URLs, never in analytics, and never in logs.
- Turnstile verification precedes all DB activity.
- Atomic conditional update: `UPDATE cards SET status='ACTIVE' ... WHERE public_id=? AND activation_code_hash=? AND status='UNACTIVATED'` with `changes === 1` check.
- Generic error messages prevent card/business enumeration.

### 8. Audit Logging Standards
- Records 6 canonical events: `CARD_CREATED`, `CARD_ACTIVATED`, `DESTINATION_CHANGED`, `CARD_DISABLED`, `CARD_RESTORED`, `CARD_RETIRED`.
- Never logs plaintext codes, secret keys, or auth credentials.

### 9. Business Continuity (Critical vs Non-Critical Services)
- **Critical:** Cloudflare edge, Worker, D1, public QR URL, destination URL.
- **Non-Critical:** Admin dashboard, batch generator, analytics, monitoring, backups.
- **Rule:** A failure of any non-critical service must never break an already-`ACTIVE` card redirect.

### 10. Complete Failure Mode Matrix
- All 17 documented failure scenarios are cataloged in `docs/11-monitoring.md` with explicit error codes and a guarantee of zero internal database information leakage.

### 11. Fleet Capacity Modeling
- Modeled across 10, 100, 1,000, and 10,000 cards.
- Demonstrated that physical card volume does not consume quota; inbound HTTP requests drive quota.
- Pilot fleet of 100 cards consumes $\approx 1\%$ of daily Worker requests.

### 12. Physical Product Safety
- The physical QR code encodes strictly the permanent routing URL (`/c/:publicId`) and never the destination URL.
- Supplier receives only vector artwork, public IDs, activation codes, and print instructions. Zero client identities, review destinations, or admin credentials.

### 13. Domain Migration Runbook
- `workers.dev` and owned custom domain co-exist concurrently on the same Worker. No card reprinting needed when transitioning domains.

---

## 3. Approval & Sign-Off

The final design review is complete. All 20 project documentation files and directives have been reconciled and verified.

**Gate 1.5 complete. Implementation may now begin.**
