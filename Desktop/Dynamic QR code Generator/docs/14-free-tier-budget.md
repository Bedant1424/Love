# 14 — Free-Tier Budget & Resource Limits (Gate 1.5 Reconciled)

> **Status:** Reconciled at Final Design Review (Gate 1.5). Implementation has NOT started.  
> **Financial Mandate:** \$0.00 / month infrastructure cost for pilot.  
> **Verification Standard:** Grounded in verified Cloudflare platform limits (October 2026).

---

## 1. Verified Cloudflare Free Tier Quotas

| Service / Resource | Free Tier Limit (2026) | Official Source URL |
|---|---|---|
| **Workers Requests** | **100,000 requests / day** (resets 00:00 UTC) | [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/) |
| **Worker CPU Time** | **10 ms / request** (wall-clock waiting excluded) | [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/) |
| **Worker Memory** | **128 MB** | [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/) |
| **Static Assets** | **Free & Unlimited requests** (up to 20,000 files, 25 MiB max/file) | [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) |
| **D1 Row Reads** | **5,000,000 row reads / day** | [Cloudflare D1 Limits](https://developers.cloudflare.com/d1/platform/limits/) |
| **D1 Row Writes** | **100,000 row writes / day** | [Cloudflare D1 Limits](https://developers.cloudflare.com/d1/platform/limits/) |
| **D1 Database Storage** | **500 MB / database**, 5 GB total account storage | [Cloudflare D1 Limits](https://developers.cloudflare.com/d1/platform/limits/) |
| **D1 Databases** | **Up to 10 databases** per account | [Cloudflare D1 Limits](https://developers.cloudflare.com/d1/platform/limits/) |
| **D1 Time Travel** | **7 days** point-in-time recovery | [Cloudflare D1 Limits](https://developers.cloudflare.com/d1/platform/limits/) |
| **Cloudflare Turnstile** | **Unlimited verifications** (\$0 forever) | [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) |
| **Cloudflare WAF** | Free Managed Ruleset + **5 custom rules** | [Cloudflare WAF Custom Rules](https://developers.cloudflare.com/waf/custom-rules/) |
| **Cloudflare Rate Limiting** | **1 IP-based rule** | [Cloudflare Rate Limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/) |
| **DDoS Protection** | **Unmetered L3/4/7 protection** on all plans | [Cloudflare DDoS](https://www.cloudflare.com/ddos/) |
| **Cloudflare Access** | **50 user seats**, 24h audit logs | [Cloudflare Zero Trust Limits](https://developers.cloudflare.com/cloudflare-one/account-limits/) |

---

## 2. Free-Tier Capacity Boundary & Threshold Protocol

```
0k                      70k             90k            100k
[─────── GREEN ─────────][─── WARNING ──][─ CRITICAL ──][─── EXHAUSTION ───]
      0% - 70%              70% - 90%      90% - 100%         100%+
```

- **🟢 GREEN (0% to 70% | 0–70,000 req/day):** Normal edge operations. All public scans and admin tools fully operational.
- **🟡 WARNING (70% to 90% | 70,000–90,000 req/day):** Operational warning logged. Tighten WAF bot challenges to conserve remaining headroom.
- **🔴 CRITICAL (90% to 100% | 90,000–100,000 req/day):** Throttle non-critical admin operations. Reserve remaining capacity strictly for customer card scans.
- **⛔ EXHAUSTION (100%+ | >100,000 req/day):**
  - **Platform Reality:** Exceeding the 100k limit is **NOT** a harmless delay. Cloudflare edge actively halts further dynamic Worker execution, returning HTTP 1027 or 429 until the daily quota resets at 00:00 UTC.
  - **Financial Safety:** The account does not automatically upgrade or incur surprise bills. The system fails safely.
  - **No Quota Evasion:** The application will never use multiple accounts, rotating proxies, or evasive hacks. The zero-dollar promise is valid strictly within published quotas.

---

## 3. Free-Tier Capacity Model Across Fleet Scales

> **Fundamental Principle:** The number of physical cards printed does **NOT** consume Worker quota. Quota is driven strictly by **inbound HTTP requests** (scans + activations + admin calls). All admin and public API traffic shares the single 100k Worker request daily pool.

| Fleet Size | Typical Scans/Day | Activation Attempts/Day | Admin Ops/Day | Total Worker Req/Day | D1 Row Reads/Day | D1 Row Writes/Day | Free Quota Utilization |
|---|---|---|---|---|---|---|---|
| **10 Cards** | 100 scans (10/card) | 2 | 20 | **122 reqs** | 122 reads | 4 writes | **0.12% (Green)** |
| **100 Cards** (Pilot) | 1,000 scans (10/card) | 10 | 50 | **1,060 reqs** | 1,060 reads | 20 writes | **1.06% (Green)** |
| **1,000 Cards** | 10,000 scans (10/card) | 50 | 200 | **10,250 reqs** | 10,250 reads | 100 writes | **10.25% (Green)** |
| **10,000 Cards** | 80,000 scans (8/card) | 200 | 500 | **80,700 reqs** | 80,700 reads | 400 writes | **80.70% (Warning)** |

### Modeling Insights:
- At **100 cards (Pilot Target)**, the system consumes $\approx 1\%$ of daily Worker requests and $0.02\%$ of D1 read capacity.
- The 100k limit comfortably accommodates up to $\sim 1,000$ active cards before approaching warning thresholds, assuming typical retail scan frequency (~10 scans/day/card).
- D1 daily read quota (5,000,000 reads/day) is virtually unconstrained at this scale ($< 2\%$ utilized even at 10,000 cards).
