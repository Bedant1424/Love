# RESEARCH_DECISION — Architectural Decision Record (Gate 1.5 Reconciled)

> **Status:** Final Architectural Decision Record  
> **Date:** October 2026  
> **Branch:** `feature/qr-nfc-platform-design`

---

## 1. Chosen Technology Stack

| Layer | Chosen Technology | Rationale | Cost |
|---|---|---|---|
| **Edge Compute** | **Cloudflare Workers (Hono router)** | Global low-latency edge runtime (<15ms cold start), lightweight, no container overhead. | Free (100k req/day) |
| **Edge Database** | **Cloudflare D1 (SQLite)** | Native zero-latency bindings, single-threaded serialized execution, 7-day Time Travel. | Free (5M reads, 100k writes/day) |
| **Frontend UI** | **React 19 + TypeScript + Vite** | Modern client-side reactivity, component isolation, static compilation. | \$0 (MIT) |
| **Styling & Design** | **Tailwind CSS v4 + shadcn/ui** | Zero-runtime CSS, fully accessible Radix primitives, Swiss clean design aesthetic. | \$0 (MIT) |
| **Static Hosting** | **Workers Static Assets** | Integrated with Worker runtime, unlimited free static requests, zero cache delays. | Free |
| **Bot Mitigation** | **Cloudflare Turnstile** | Frictionless CAPTCHA replacement, cryptographically bound single-use tokens. | Free (Unlimited) |
| **Admin Auth** | **Cloudflare Access (Zero Trust)** | Enterprise-grade identity enforcement at the edge without managing OAuth servers. | Free (50 seats) |
| **Edge Security** | **Cloudflare WAF + DDoS** | 5 custom WAF rules, IP rate limiting, unmetered L3/L4/L7 DDoS absorption. | Free |
| **QR Code Engine** | **`qrcode` npm package (soldair)** | Open-source (MIT), direct SVG XML generation, ISO/IEC Error Correction Level H. | \$0 (MIT) |
| **Testing Architecture** | **`@cloudflare/vitest-plugin` + Playwright** | Binding-aware Workers testing harness with local D1; Playwright browser journeys. | \$0 (MIT) |
| **CI/CD & Storage** | **GitHub Actions Free** | Automated tests, automated deployment, and daily GPG-encrypted D1 backups. | Free |
| **Synthetic Monitoring**| **UptimeRobot Free** | 5-minute health monitoring on `/healthz` and synthetic redirect checks. | Free |

---

## 2. Gate 1.5 Reconciliation Decisions

1. **Redirect Critical Path Invariant:**
   The customer scan path (`GET /c/:publicId`) consists exclusively of:
   $$\text{Request} \longrightarrow \text{Worker} \longrightarrow \text{One Indexed D1 Read} \longrightarrow \text{HTTP 302 Found}$$
   Zero scan-writes, zero analytics writes, zero Turnstile, zero external fetches in the critical path.
2. **D1 Single-Threaded Architecture:**
   Recognizing that D1 SQLite operates single-threaded per database, all queries in the redirect path use indexed point lookups (`idx_cards_public_id`), completely eliminating full-table scans.
3. **Domain Strategy Reality:**
   `workers.dev` is used for dev, staging, pilot validation, and small zero-dollar card tests. For permanent commercial cards, multi-hostname support enables adding an owned custom domain (\$3–\$10/yr) without changing printed card identifiers.
4. **Flexible Google URL Validation:**
   Replaced brittle single-pattern validation with a centralized module supporting all official Google Business Profile review links (Search, Maps, `g.page`).
5. **Modern Workers Testing:**
   Standardized on `@cloudflare/vitest-plugin` for binding-aware unit and integration testing.
