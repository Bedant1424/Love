# 10 — Backup, Retention, and Disaster Recovery

> **Status:** Operational Runbook Reconciled & Verified for Milestone 6 Production Launch.  
> **Retention Standard:** Continuous Dual-Layer Recovery (D1 7-Day Time Travel + Off-Site Encrypted GPG Backups).  
> **Target Cost:** \$0.00 / month (Cloudflare Free Tier + GitHub Actions).

---

## 1. Dual-Tier Recovery Architecture

1. **Tier 1 — Cloudflare D1 Time Travel (Point-in-Time Recovery):**
   - 7 days rolling point-in-time recovery included in Cloudflare D1 Free tier.
   - Allows instant restoration to any historical bookmark or timestamp with $< 5$ minutes Recovery Time Objective (RTO).
   - Zero additional storage cost or compute overhead.

2. **Tier 2 — Automated Nightly Off-Site GPG Backups:**
   - Daily automated GitHub Action exports full SQL snapshot via `wrangler d1 export`.
   - Encrypted with AES-256 GPG before storage in private repository artifacts or cold storage.
   - Preserves historical card inventory and audit trail beyond 7 days with zero plain-text credential leaks.

---

## 2. Disaster Recovery & Restoration Procedures

### Drill 1: Point-in-Time Restore via D1 Time Travel
Used when accidental data modifications or schema issues occur within the past 7 days:

```bash
# 1. Inspect bookmarks and recovery points
npx wrangler d1 time-travel info qroute_production

# 2. Restore database to specific bookmark
npx wrangler d1 time-travel restore qroute_production --bookmark <BOOKMARK_ID>
```

### Drill 2: Complete Off-Site SQL Dump Restoration
Used for catastrophic recovery or data migration:

```bash
# 1. Decrypt off-site GPG archive
gpg --decrypt --passphrase "$GPG_PASSPHRASE" backups/qroute_prod_latest.sql.gpg > restored.sql

# 2. Apply restored database schema and records to production D1
npx wrangler d1 execute qroute_production --remote --file=restored.sql
```

---

## 3. Recovery Objectives

| Metric | Target | Method |
|---|---|---|
| **Recovery Time Objective (RTO)** | $< 5$ minutes | D1 Time Travel bookmark restore |
| **Recovery Point Objective (RPO)** | $< 1$ second | D1 continuous change tracking |
| **Cold Storage Retention** | 365+ days | GPG-encrypted GitHub Actions artifact dumps |
