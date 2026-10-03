# 10 — Backup, Retention, and Disaster Recovery

> **Status:** Reconciled at Final Design Review (Gate 1.5). Implementation has NOT started.  
> **Retention Standard:** Continuous Dual-Layer Recovery (D1 7-Day Time Travel + Off-Site Encrypted GPG Backups).

---

## 1. Dual-Tier Recovery Architecture

1. **Tier 1 — Cloudflare D1 Time Travel:**
   - 7 days rolling point-in-time recovery included in Free tier.
   - Allows instant restoration to any historical bookmark with $< 5$ minutes RTO.
2. **Tier 2 — Nightly Off-Site GPG Backups:**
   - Daily automated GitHub Action exports full SQL dump via `wrangler d1 export`.
   - Encrypted with AES-256 GPG before committing to private storage.
   - Preserves historical records beyond 7 days with zero plain-text credential leaks.

---

## 2. Disaster Recovery Drill

```bash
# Point-in-time restore to bookmark
npx wrangler d1 time-travel restore qroute_production --bookmark <BOOKMARK_ID>

# Full off-site SQL restore
gpg --decrypt --passphrase "$GPG_PASSPHRASE" dump.sql.gpg > restored.sql
npx wrangler d1 execute qroute_production --remote --file=restored.sql
```
