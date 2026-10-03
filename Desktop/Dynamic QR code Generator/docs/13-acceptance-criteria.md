# 13 — Formal Acceptance Criteria (Gate 1.5 Reconciled)

> **Status:** Reconciled at Final Design Review (Gate 1.5). Implementation has NOT started.

---

## 1. Public Redirect Pipeline (`GET /c/:publicId`)

- [ ] **AC-RED-01:** When a valid `ACTIVE` card is requested, server returns HTTP 302 Found directing to the stored Google Review URL.
- [ ] **AC-RED-02:** Response includes `Cache-Control: private, no-cache, no-store, must-revalidate` and `Referrer-Policy: no-referrer`.
- [ ] **AC-RED-03:** When an `UNACTIVATED` card is requested, server returns HTTP 302 Found directing to `/activate/:publicId`.
- [ ] **AC-RED-04:** When a `DISABLED` card is requested, server returns HTTP 200 with clean maintenance notice without redirecting.
- [ ] **AC-RED-05:** When a `RETIRED` card is requested, server returns HTTP 200 with retired card notice without redirecting.
- [ ] **AC-RED-06:** Unknown card IDs return generic HTTP 404 with zero database syntax leakage.
- [ ] **AC-RED-07:** Normal redirect path executes **exactly one indexed D1 lookup** and zero D1 write transactions.
- [ ] **AC-RED-08:** Total edge CPU compute time is $< 10$ ms.
- [ ] **AC-RED-09:** **Non-Critical Resilience:** Complete outage of Admin UI, Analytics, Turnstile, Backups, or UptimeRobot does not degrade or halt ACTIVE card redirects.

---

## 2. Card Activation Pipeline (`POST /api/public/activate`)

- [ ] **AC-ACT-01:** Activation accepts `publicId`, `businessName`, `reviewUrl`, `activationCode`, and `turnstileToken`.
- [ ] **AC-ACT-02:** Turnstile failure rejects immediately with HTTP 403 Forbidden without querying the database.
- [ ] **AC-ACT-03:** Review URL is validated via the Centralized Google URL Validator; invalid hostnames or schemes reject with HTTP 400.
- [ ] **AC-ACT-04:** Activation codes are case-insensitive, hyphen-tolerant, and verified against stored HMAC-SHA256 digests in constant time.
- [ ] **AC-ACT-05:** State transition `UNACTIVATED -> ACTIVE` is atomic (`changes === 1`); concurrent requests permit exactly one winner.
- [ ] **AC-ACT-06:** Activated cards permanently reject subsequent activation attempts with generic error messages.
- [ ] **AC-ACT-07:** Activated card details (business name, destination URL) are never exposed to arbitrary public callers.
- [ ] **AC-ACT-08:** Every successful activation writes an immutable record to `audit_logs` (`CARD_ACTIVATED`).

---

## 3. Administration & Manufacturing

- [ ] **AC-ADM-01:** Admin routes require Cloudflare Access Zero Trust authentication.
- [ ] **AC-ADM-02:** Batch creation provisions $N$ unique cards with non-sequential Crockford Base32 IDs and exports valid `manifest.csv` and SVGs.
- [ ] **AC-ADM-03:** Supplier manifest contains only public IDs, activation codes, and filenames; zero business identities or review destinations.
- [ ] **AC-ADM-04:** Unactivated cards can have activation codes rotated by an admin, immediately invalidating the previous code.
- [ ] **AC-ADM-05:** Active cards can be disabled, restored, or have destinations updated by an admin with a mandatory audit log entry.
- [ ] **AC-ADM-06:** Retired cards cannot be reactivated, reassigned, or restored.

---

## 4. Multi-Hostname Resilience & Zero Cost

- [ ] **AC-OPS-01:** Both `workers.dev` and an owned custom domain resolve to the same Worker simultaneously without altering card identifiers.
- [ ] **AC-OPS-02:** Platform operates 100% within published Cloudflare and GitHub free limits.
- [ ] **AC-OPS-03:** If daily Worker limit (100k requests) is exhausted, edge fails safely (HTTP 1027/429) with zero credit card overage charges.
