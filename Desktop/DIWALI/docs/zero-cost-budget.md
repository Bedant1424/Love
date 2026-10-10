# NAGARJUNA TRADERS — ZERO-COST BUDGET & QUOTA ASSESSMENT

**Document Reference:** `docs/zero-cost-budget.md`  
**Research Date:** October 2026  
**Primary Constraint:** Target ₹0 in recurring software and hosting charges  
**Verification Status:** Validated against official Cloudflare & GitHub free tier quotas

---

## 1. Verified Free-Tier Quota Audit (2026 Official Limits)

The application infrastructure utilizes the free tiers of Cloudflare, GitHub, and standard web technologies.

| Service / Resource | Official Free-Tier Quota Limit | Nagarjuna Traders Utilization Strategy | Free Recurring Cost |
|---|---|---|:---:|
| **Cloudflare Pages** | **Unlimited** static requests & bandwidth; 500 build runs/month; 20k files/deploy. | Hosts React static bundle (`dist/`). Unlimited shoppers can load UI without charges. | **₹0.00** |
| **Cloudflare Workers** | **100,000 requests/day**; 10ms CPU time/request; 1,000 req/min burst. | Edge API (`/api/v1/*`). All catalogue reads cached at CDN, bypassing Worker invocations. | **₹0.00** |
| **Cloudflare D1 Database** | **5,000,000 read rows/day**;<br>**100,000 write rows/day**;<br>**5 GB total storage**. | Relational SQLite storage. Stores orders, items, products, variants, and payments. | **₹0.00** |
| **Cloudflare Turnstile** | **Unlimited** challenge requests/month. | Anti-bot verification on order submission and admin login. | **₹0.00** |
| **Cloudflare Access (Zero Trust)** | **50 free user seats**; unlimited policy evaluations. | Protects private administrative portal (`/admin`). Requires max 2–3 store staff accounts. | **₹0.00** |
| **GitHub Repos & Actions** | Unlimited public/private repos; **2,000 CI minutes/month**. | Version control and automated testing/deployment pipelines. | **₹0.00** |
| **Total Recurring Software / Hosting Cost** | | | **₹0.00 / month** |

---

## 2. Diwali Peak Surge Traffic & Capacity Modeling

To validate whether Nagarjuna Traders can survive a high-volume Diwali festival week on the free tier, we simulate a realistic local retail burst:

### Peak Festival Day Assumptions (Diwali Week)
- **Daily Unique Shoppers:** 3,000 customers
- **Page Views per Customer:** 5 page views (Home -> Category -> Product -> Cart -> Checkout)
- **Total Catalogue Reads:** 15,000 page views / day
- **Completed Bookings / Orders:** 300 orders / day
- **Admin Dashboard Refreshes:** 100 queries / day

### Quota Consumption vs Limits

```
CLOUDFLARE WORKERS (100,000 Req / Day Limit)
[===] 3,200 Actual Worker Reqs (3.2% Utilization)
- Catalogue Reads hitting Worker (90% cached): ~1,500 reqs
- Order Submissions: ~300 reqs
- Status Tracking / UTR Submissions: ~800 reqs
- Admin Operations: ~600 reqs
REMAINING BUFFER: 96,800 requests/day

CLOUDFLARE D1 DATABASE WRITES (100,000 Rows / Day Limit)
[=] 1,500 Actual Rows Written (1.5% Utilization)
- 300 Orders × (1 order + 3 items + 1 payment) = 1,500 rows written
REMAINING BUFFER: 98,500 writes/day

CLOUDFLARE D1 DATABASE READS (5,000,000 Rows / Day Limit)
[=] 45,000 Rows Read (0.9% Utilization)
- Uncached catalogue scans + order lookups + admin reports
REMAINING BUFFER: 4,955,000 reads/day
```

**Verdict:** The system operates safely with a **>95% safety margin** under realistic local retail festival traffic.

---

## 3. Unavoidable Business & External Expenses (Separate from Software)

While hosting and application software are guaranteed at ₹0 recurring cost, the business owner must account for real-world commercial expenses:

| Expense Category | Estimated Cost | Requirement Type | Mitigation / Options |
|---|---|---|---|
| **Custom Domain Name** (e.g. `nagarjunatraders.in` or `.com`) | ₹800 – ₹1,200 / year | Optional (Branding) | Free option: Use Cloudflare Pages subdomain (`nagarjunatraders.pages.dev`) at **₹0**. |
| **Payment Gateway MDR** (If Option A is chosen) | 0% for RuPay UPI; 1.8% – 2.0% on cards/netbanking | Operational Transaction Fee | Option B (Manual UTR verification) costs **₹0**. |
| **Statutory LE-5 Retail License** | Prescribed district treasury fee (typically ₹500 – ₹2,500) | Mandatory Legal Compliance | Official government fee payable to District Magistrate. |
| **Grievance / Customer Care Phone SIM** | Standard prepaid telecom plan (~₹200 / month) | Operational Requirement | Existing store phone can be used. |

---

## 4. Quota Exhaustion & Degradation Behavior

What happens if traffic exceeds expectations and hits a free tier ceiling?

### Scenario 1: Worker 100k Daily Limit Reached
- **Cloudflare Behavior:** Cloudflare returns `HTTP 429 Too Many Requests` for non-cached Worker invocations.
- **Application Degradation:** 
  1. Static catalogue browsing **remains completely functional** because HTML/JS/CSS and cached catalogue JSON are served from the unlimited Cloudflare Pages edge cache.
  2. The client detects the 429 error on the checkout endpoint and gracefully renders the fallback banner:
     > *"Due to massive Diwali rush, online booking is temporarily paused for the day. Please call us at +91 98765 43210 or visit our counter directly to reserve your cracker box."*
  3. No corrupted orders or partial transactions can occur.

### Scenario 2: D1 Daily Storage Limit (5 GB)
- **Current Data Footprint:** 1 complete order snapshot consumes ~2 KB.
- **5 GB Capacity:** Supports over **2.5 million historical orders**. Nagarjuna Traders will not reach 5 GB for several years of retail operations.

### Scenario 3: Automated Monitoring & Alerting
- Cloudflare Email Alerts are configured at 75% and 90% quota thresholds to alert the administrator before any service throttling occurs.
