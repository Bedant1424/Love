# 05 — Comprehensive OWASP Threat Model

> **Status:** Reconciled at Final Design Review (Gate 1.5). Threat mitigations for Public Redirect and Activation Pipelines (TH-01, TH-02, TH-03, TH-06, TH-08, TH-11, TH-21, TH-23) Implemented & Verified in Milestones 2 & 3.  
> **Standards:** Grounded in OWASP Top 10 (2021) and OWASP API Security Top 10 (2023).

---

## Threat Matrix & Mitigation Summary

| ID | Threat Category | OWASP Ref | Risk | Attack Surface | Core Mitigation | Automated Test Case |
|---|---|---|---|---|---|---|
| **TH-01** | **Open Redirects** | A01:2021 | 🔴 Critical | `GET /c/:publicId` | Centralized Google URL Validator (`URL()` parser + exact hostname allowlist). | Reject `evil.com`, `google.com.attacker.com`, `user:pass@google.com`. |
| **TH-02** | **Stored XSS** | A03:2021 | 🟠 High | `business_name` field | Regex stripping of `<` and `>`, React auto-escaping, strict CSP. | Submit `<script>alert(1)</script>`; assert escaped & blocked. |
| **TH-03** | **SQL Injection** | A03:2021 | 🟠 High | D1 Query Parameters | Parameterized `.prepare().bind(...)` exclusively; zero string concatenation. | Probe `/c/' OR 1=1 --`; assert 404 with no DB syntax leak. |
| **TH-04** | **CSRF** | A01:2021 | 🟡 Medium | Public Activation | Single-use Cloudflare Turnstile token validation; `SameSite=Lax` on admin. | Post without Turnstile; assert HTTP 403 Forbidden. |
| **TH-05** | **BOLA / IDOR** | API1:2023 | 🔴 Critical | `/api/admin/cards/:id` | Cloudflare Access Zero Trust with strict role enforcement; UUID keys. | Access admin endpoint without JWT; assert edge block. |
| **TH-06** | **SSRF** | A10:2021 | 🟠 High | URL Validation | Zero outbound server-side fetch. Verification is purely structural. | Enter `http://169.254.169.254`; assert rejected by scheme check. |
| **TH-07** | **Brute-Force Code** | API4:2023 | 🟠 High | Activation Code | $32^{12}$ entropy, Turnstile challenge, WAF rate limit (5 attempts / 10m). | Run 10 rapid guesses; assert 429 throttle after 5 attempts. |
| **TH-08** | **Activation Replay** | A07:2021 | 🟠 High | `POST /activate` | Atomic conditional update (`WHERE status='UNACTIVATED'`); Turnstile single-use. | Replay identical POST payload; assert HTTP 400 / 409 error. |
| **TH-09** | **Slug Enumeration** | API1:2023 | 🟡 Medium | `/c/:publicId` | Non-sequential Crockford Base32; uniform 404 response timing. | Scan 100 sequential IDs; assert WAF rate limiter fires. |
| **TH-10** | **Formula Injection** | A03:2021 | 🟡 Medium | CSV Export | Quote formula prefixes (`=`, `+`, `-`, `@`) in supplier manifest generation. | Submit `=CMD|' /C calc'!A0`; assert quoted in export. |
| **TH-11** | **Malicious URLs** | A01:2021 | 🟠 High | Review Destination | Whitelist constrained strictly to Google Review path patterns. | Submit phishing domains; assert validation rejection. |
| **TH-12** | **Admin Account Takeover** | API5:2023 | 🟠 High | Admin API | Cloudflare Access Zero Trust with MFA enforcement; immutable audit log. | Verify all destination changes log to `audit_logs`. |
| **TH-13** | **Operator Mistake** | A05:2021 | 🟡 Medium | Card Retirement | UI confirmation modal requiring typing the exact card ID before retirement. | Attempt retirement without confirmation string; assert blocked. |
| **TH-14** | **Domain Takeover** | A05:2021 | 🔴 Critical | Routing Hostname | Avoid unverified shared subdomains (`is-a.dev`); own DNS with DNSSEC. | Verify domain ownership locks in Cloudflare registrar. |
| **TH-15** | **Database Corruption** | A08:2021 | 🟠 High | D1 SQLite Storage | 7-day D1 Time Travel point-in-time recovery + nightly GPG encrypted backup. | Run test restoration from GPG dump; check SQLite integrity. |
| **TH-16** | **Dependency Poisoning** | A06:2021 | 🟡 Medium | npm packages | Zero-dependency core router (Hono); strict package-lock; Dependabot alerts. | Run `npm audit --production` in CI pipeline. |
| **TH-17** | **Denial of Service** | API4:2023 | 🟠 High | Worker Edge | Cloudflare unmetered L3/L4/L7 DDoS absorption; WAF rate limiting. | Load test with synthetic traffic; assert edge mitigation. |
| **TH-18** | **Quota Exhaustion** | API4:2023 | 🟠 High | Free Worker Limit | Fail-safe edge drop (HTTP 1027/429); zero surprise billing. | Monitor capacity thresholds (Green/Warn/Critical). |
| **TH-19** | **Cache Inconsistency** | A04:2021 | 🟡 Medium | 302 Redirects | `Cache-Control: private, no-cache, no-store, must-revalidate` on all 302s. | Change destination; verify immediate update on next scan. |
| **TH-20** | **Stale Reads** | A04:2021 | 🟢 Low | Edge Replication | Direct indexed D1 reads on each redirect; zero stale cache layers. | Query updated card within 50ms; assert new destination. |
| **TH-21** | **Concurrent Activation**| A04:2021 | 🟠 High | Race Condition | SQLite write serialization; atomic conditional query; check `changes===1`. | Dispatch 10 concurrent activation requests; assert exactly 1 succeeds. |
| **TH-22** | **Accidental Reassignment**| A04:2021 | 🟡 Medium | Bulk Edit | Disallow bulk destination reassignment in UI/API; single-card modals only. | Attempt bulk destination update API; assert route not found. |
| **TH-23** | **Activation Code Leak** | A02:2021 | 🟠 High | Print Manifest / Logs | Plaintext shown once at creation; stored only as HMAC-SHA256; scrubbed from logs. | Search D1 dump for raw activation code; assert 0 matches. |
