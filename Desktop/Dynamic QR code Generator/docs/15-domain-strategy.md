# 15 — Domain Strategy & Long-Term URL Resilience (Gate 1.5 Reconciled)

> **Status:** Architecture Reconciled, Implemented, and Fully Verified in Milestone 6 (Production Cloudflare Deployment, Custom Domain Attachment & Launch Readiness).  
> **Physical Anchor Principle:** A broken domain permanently bricks every physical card in circulation.

---

## 1. Domain Strategy Correction & Reality Assessment

### The Two Realities
1. **Pilot Phase (\$0 Budget):**
   - **`workers.dev`** (`qroute-platform.<account>.workers.dev`) is fully functional, free, and approved for **development, staging, pilot validation, and small zero-dollar physical-card testing**.
   - Cloudflare explicitly classifies `workers.dev` as intended for personal or hobby projects and recommends custom domains or Worker routes for business-critical production.
2. **Permanent Commercial Reality:**
   - **A provider-controlled free subdomain is NOT the preferred long-term strategy for a commercial, business-critical physical product.**
   - While a \$0 pilot is 100% technically possible, permanent commercial cards in circulation for 3–5 years should transition to an owned custom domain once proven.

---

## 2. Rigorous Evaluation of Free Domain Options

A free domain suitable for permanent physical cards must satisfy all 5 requirements:
1. Current verified commercial-use permission
2. Reasonable multi-year organizational longevity
3. Stable, authoritative DNS control
4. No fragile or manual renewal dependencies (e.g. SMS, manual forms)
5. Zero risk of arbitrary policy change or domain revocation

| Candidate | Commercial Permission | Longevity (3-5yr) | Stable DNS | No Renewal Friction | Low Revocation Risk | Meets All 5 Criteria? |
|---|---|---|---|---|---|---|
| **`workers.dev`** | ⚠️ Discouraged | ⚠️ Medium | ✅ Full CF DNS | ✅ Automatic | ⚠️ Account-tied | ❌ **No** (Dev/pilot only) |
| **`is-a.dev`** | ❌ **Prohibited** | ⚠️ Low | ⚠️ GitHub PR | ❌ Manual | ❌ High risk | ❌ **No** (Terms violation) |
| **`eu.org`** | ⚠️ Discouraged | ⚠️ Volunteer | ⚠️ Manual DNS | ⚠️ Slow approval | ⚠️ Unpredictable | ❌ **No** (Volunteer-run) |
| **`freedns.afraid.org`** | ⚠️ Unclear | ❌ **Critically Low**| ❌ Private owner | ❌ High risk | ❌ Catastrophic | ❌ **No** (Owner can delete anytime) |
| **`pp.ua`** | ✅ Permitted | ⚠️ Medium-Low | ⚠️ Registrar | ❌ **Annual SMS re-activation** | ⚠️ Geopolitical risk | ❌ **No** (Fragile SMS dependency) |

### Formal Conclusion on Free Domains:
> **No free domain currently available in 2026 meets all five operational criteria for permanent, multi-year commercial physical review cards.**

Volunteer projects (`is-a.dev`, `eu.org`, `freedns`) risk domain revocation, terms violation, or deletion by private domain owners. Registry offerings (`pp.ua`) introduce single points of failure via mandatory annual SMS re-activations in an active conflict zone.

---

## 3. The Future Owned Custom Domain Architecture

The system resolves this via **Multi-Hostname Resilience**:

```
[Pilot Card URL]   https://qroute.workers.dev/c/A7K92P4X8Q  ─────+
                                                                 |
                                                                 v
[Production URL]   https://qr.yourbrand.com/c/A7K92P4X8Q    ───► [Same Cloudflare Worker]
                                                                 │
                                                                 ▼
                                                         [Single D1 Lookup]
                                                                 │
                                                                 ▼
                                                         [HTTP 302 to Google]
```

### Exact Migration Runbook:
1. **Pilot Run:** Physical cards are printed with `https://qroute.workers.dev/c/A7K92P4X8Q`.
2. **Domain Acquisition:** Operator registers a permanent owned domain (`.com`, `.link`, `.click` for \$3–\$10/year).
3. **Cloudflare Attachment:** Domain is added to Cloudflare as a Custom Domain trigger for the Worker.
4. **Co-Existence Invariant:** Both `qroute.workers.dev` and `qr.yourbrand.com` remain concurrently active on the same Worker.
5. **Zero Card Breakage:** Previously printed pilot cards continue working indefinitely without reprinting. Future batch runs adopt the custom domain.
