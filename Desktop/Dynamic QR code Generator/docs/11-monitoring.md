# 11 — Monitoring, Observability, and Failure Mode Matrix

> **Status:** Fully Implemented and Verified in Milestones 1–6.  
> **Tooling:** UptimeRobot Free + Cloudflare Health Probes + Workers Native Observability + Capacity Circuit Breakers.

---

## 1. Free-Tier Capacity Boundaries (Workers 100k Quota)

The system enforces four operational zones based on daily dynamic Worker invocations:

```text
0k                      70k             90k            100k
[─────── GREEN ─────────][─── WARNING ──][─ CRITICAL ──][─── EXHAUSTION ───]
      0% - 70%              70% - 90%      90% - 100%         100%+
```

| Operational Zone | Daily Request Range | System Status & Action | Financial Risk |
|---|---|---|---|
| **🟢 GREEN** | 0 to 70,000 req/day (0%–70%) | Normal edge operation. All redirects, activations, and admin features active. | \$0.00 |
| **🟡 WARNING** | 70,000 to 90,000 req/day (70%–90%) | Automated alert dispatched to operators. Non-critical background operations deferred. | \$0.00 |
| **🔴 CRITICAL** | 90,000 to 100,000 req/day (90%–100%) | Urgent operator alert. Restrict admin dashboard queries to preserve remaining quota for customer card redirects. | \$0.00 |
| **⛔ EXHAUSTION** | 100,000+ req/day (100%+) | **Quota Exhausted:** Cloudflare edge automatically drops subsequent dynamic Worker invocations (returning HTTP 1027 or 429) until 00:00 UTC reset. **System fails safely; zero financial overage or credit card charge incurred.** | \$0.00 (Guaranteed) |

*Zero Quota-Evasion Rule:* The application will never attempt to bypass limits via unauthorized proxying or account rotation.

---

## 2. Health Monitoring Probes (`/healthz`)

The edge engine exposes `/healthz` for external synthetic probes (UptimeRobot Free):
- **Frequency:** Every 5 minutes (UptimeRobot 50 free monitors).
- **Checks Performed:** Edge worker execution, response time ($< 15$ ms), environment context (`environment: "production"`).
- **Alert Channels:** Email / Webhook to operations on consecutive probe failures.

---

## 3. Comprehensive Failure Mode Matrix (All 17 Conditions)

| ID | Failure Condition | Exact System Behavior & User Experience | Error Code Emitted | Internal Data Exposed? |
|---|---|---|---|---|
| **FM-01** | **D1 Database Unavailable** | Worker catches error; returns clean, styled static maintenance page. | `500 Server Error` | ❌ No (Zero SQL/D1 details leaked) |
| **FM-02** | **D1 Daily Quota Exhausted** | Worker catches quota limit exception; serves static maintenance page until 00:00 UTC. | `500 Server Error` | ❌ No |
| **FM-03** | **Worker Daily Quota Exhausted** | Cloudflare edge halts execution and returns standard Cloudflare 1027 error page. | `1027 / 429` | ❌ No |
| **FM-04** | **Malformed Public ID** | In-memory validation rejects prior to database lookup; serves generic 404 page. | `404 Not Found` | ❌ No |
| **FM-05** | **Unknown Card ID** | D1 query returns 0 rows; serves generic 404 page. | `404 Not Found` | ❌ No |
| **FM-06** | **UNACTIVATED Card Scanned** | Worker intercepts status; returns HTTP 302 directing scanner to `/activate/:publicId`. | `302 Found` | ❌ No |
| **FM-07** | **ACTIVE Card Scanned** | Worker intercepts status; returns immediate HTTP 302 to stored Google Review URL. | `302 Found` | ❌ No |
| **FM-08** | **DISABLED Card Scanned** | Worker serves static maintenance page ("Card temporarily inactive") without redirecting. | `200 OK` | ❌ No |
| **FM-09** | **RETIRED Card Scanned** | Worker serves static notice ("Card has been retired from service") without redirecting. | `200 OK` | ❌ No |
| **FM-10** | **Invalid Activation Code** | HMAC comparison fails; returns generic message: "Invalid activation code or card ID." | `400 Bad Request` | ❌ No |
| **FM-11** | **Reused / Replayed Activation** | Atomic `UPDATE` matches 0 rows (card already ACTIVE); returns generic error. | `400 Bad Request` | ❌ No (Business details kept private) |
| **FM-12** | **Turnstile Failure** | Token verification fails; request rejected immediately without querying D1. | `403 Forbidden` | ❌ No |
| **FM-13** | **Malicious Destination URL** | URL fails protocol or hostname allowlist; returns "Invalid review URL". | `400 Bad Request` | ❌ No |
| **FM-14** | **Google URL Not Recognized** | URL structure not recognized by centralized validator; rejects with guidance helper. | `400 Bad Request` | ❌ No |
| **FM-15** | **Admin Dashboard Unavailable** | Admin static asset or auth fails; **public redirects continue functioning with zero degradation**. | Admin 500 / Redirect 302 | ❌ No |
| **FM-16** | **Backup Pipeline Unavailable** | GitHub Action fails; alert dispatched to ops; **public redirects continue functioning with zero degradation**. | CI Failure / Redirect 302 | ❌ No |
| **FM-17** | **Monitoring Unavailable** | UptimeRobot probe drops; **public redirects continue functioning with zero degradation**. | Probe Timeout / Redirect 302 | ❌ No |
