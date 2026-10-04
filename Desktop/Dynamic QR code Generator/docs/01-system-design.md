# 01 — System Design & Edge Architecture

> **Status:** Reconciled at Final Design Review (Gate 1.5). Implementation has NOT started.  
> **Core Runtime:** Cloudflare Workers + Hono + Cloudflare D1

---

## 1. System Architecture Overview

```mermaid
flowchart TD
    Browser["📱 Customer Phone / Scanner"]
    CF_Edge["Cloudflare Global Anycast Edge"]
    Worker["Cloudflare Worker\n(Hono Lightweight Router)"]
    D1[("Cloudflare D1\n(SQLite at the Edge)")]
    StaticAssets["Workers Static Assets\n(React SPA: Activation & Admin)"]
    Turnstile["Cloudflare Turnstile\n(Activation Bot Challenge)"]
    CFAccess["Cloudflare Access\n(Zero Trust SSO for Admin)"]
    GitHub["GitHub Actions\n(CI/CD + GPG Backups)"]

    Browser -->|"GET /c/:publicId"| CF_Edge
    CF_Edge --> Worker
    Worker -->|"Single Indexed Point Query"| D1
    Worker -->|"HTTP 302 Found"| Browser

    Browser -->|"GET /activate/:publicId"| CF_Edge
    CF_Edge --> StaticAssets

    Browser -->|"POST /api/public/activate"| CF_Edge
    CF_Edge --> Worker
    Worker -->|"Verify Token"| Turnstile
    Worker -->|"Atomic UPDATE (changes === 1)"| D1

    Browser -->|"GET /api/admin/*"| CF_Edge
    CF_Edge -->|"Zero Trust Check"| CFAccess
    CFAccess --> Worker
    Worker --> D1

    GitHub -->|"wrangler deploy"| CF_Edge
```

---

## 2. The Sacred Public Redirect Path (`GET /c/:publicId`)

The redirect critical path is intentionally minimal:
```
Request -> Worker -> Exactly One Indexed D1 Read -> State Check -> HTTP 302 Found
```

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 📱 Customer Phone
    participant Edge as ⚡ Cloudflare Edge
    participant Worker as 🛡️ Worker Router
    participant D1 as 🗄️ D1 Database

    Customer->>Edge: GET /c/A7K92P4X8Q
    Edge->>Worker: Route invocation (< 1ms cold start)
    Worker->>D1: SELECT status, destination_url FROM cards WHERE public_id = ?
    Note over D1: Single-threaded SQLite engine.<br/>Uses UNIQUE index idx_cards_public_id.<br/>Execution: < 2ms.
    D1-->>Worker: Row: {status: 'ACTIVE', destination_url: 'https://search.google.com/...'}
    Worker-->>Customer: HTTP 302 Found<br/>Location: https://search.google.com/...<br/>Cache-Control: private, no-cache, no-store, must-revalidate<br/>Referrer-Policy: no-referrer
```

### Invariant Rules in the Critical Path:
1. **NO Scan Writes in Critical Path:** D1 write queries acquire write locks on SQLite. Incrementing scan counters during customer redirect would block concurrent reads and exhaust the 100k daily write quota. Scan counters are **NOT** updated during the 302 redirect.
2. **NO Analytics Engine / KV:** Zero external dependencies in the redirect flow.
3. **NO Outbound HTTP Requests on Customer Redirect:** Customer redirect requests make no outbound requests (Worker does not call Google or any external service). The activation flow performs the required server-side Cloudflare Turnstile Siteverify request (and never initiates outbound fetches to destination URLs).
4. **Latency Target:** Global p99 edge processing time $< 25$ ms.

---

## 3. Public Activation Flow (`POST /api/public/activate`)

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as 👤 Merchant Phone
    participant Edge as ⚡ Cloudflare Edge
    participant Worker as 🛡️ Worker Router
    participant Turnstile as 🤖 Turnstile API
    participant D1 as 🗄️ D1 Database

    Merchant->>Edge: POST /api/public/activate {publicId, businessName, reviewUrl, activationCode, turnstileToken}
    Edge->>Worker: Route invocation
    
    Worker->>Turnstile: POST https://challenges.cloudflare.com/turnstile/v0/siteverify
    Turnstile-->>Worker: {success: true}

    Worker->>Worker: Parse & validate Google Review URL (Exact Host & Path Match)
    Worker->>Worker: Compute HMAC-SHA256(ACTIVATION_SECRET, normalize(activationCode))
    
    Worker->>D1: Single Atomic State Mutation:<br/>UPDATE cards SET status='ACTIVE', destination_url=?, business_name=?, activated_at=?<br/>WHERE public_id=? AND activation_code_hash=? AND status='UNACTIVATED'
    D1-->>Worker: Query Meta: changes = 1
    
    Worker->>D1: INSERT INTO audit_logs (CARD_ACTIVATED)
    Worker-->>Merchant: HTTP 200 OK {success: true}
```

---

## 4. Multi-Hostname Architecture & Seamless Domain Migration

The system natively supports multiple hostnames pointing to the same Cloudflare Worker:

```
[Old/Pilot URL]   https://qroute.workers.dev/c/A7K92P4X8Q  ──────+
                                                                |
                                                                v
[Future Brand]    https://qr.customdomain.com/c/A7K92P4X8Q ───► [Same Cloudflare Worker]
                                                                │
                                                                ▼
                                                        [D1 Point Lookup]
                                                                │
                                                                ▼
                                                        [HTTP 302 to Google]
```

- Cloudflare Workers Free supports up to 100 Custom Domains per zone.
- During migration, both `workers.dev` and the owned custom domain resolve to the same Worker.
- Physical cards printed during the pilot will **never** need to be reprinted when adding an owned custom domain.
