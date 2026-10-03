# 03 — API Specification

> **Status:** Reconciled at Final Design Review (Gate 1.5). Implementation has NOT started.  
> **Framework:** Hono on Cloudflare Workers (TypeScript)

---

## 1. Global API Standards

1. **Protocol:** HTTPS enforced via Cloudflare edge SSL/TLS.
2. **Error Responses (Never Leaks Internal Infrastructure):**
   ```json
   {
     "success": false,
     "error": {
       "code": "INVALID_REQUEST",
       "message": "The request could not be processed."
     }
   }
   ```
   *Invariant:* D1 SQLite syntax errors, table names, file paths, and stack traces must **never** be exposed in public responses.
3. **Public Redirect SLA:** `GET /c/:publicId` edge processing time $< 25$ ms.

---

## 2. Public Endpoints

### 2.1 GET `/c/:publicId` (The Critical Redirect Path)
- **Method:** `GET`
- **Authentication:** None (Public)
- **Path Parameter:** `publicId`: `^[A-HJ-NP-Z2-9]{10}$` (Crockford Base32)
- **Critical Execution Logic:**
  1. Uppercase & normalize `publicId`.
  2. Execute **exactly one indexed D1 point query**:
     ```sql
     SELECT status, destination_url FROM cards WHERE public_id = ?;
     ```
  3. Dispatch based on status:
     - Record not found $\rightarrow$ `404 Not Found` (Generic static page)
     - `ACTIVE` $\rightarrow$ `302 Found` with `Location: ${destination_url}`
     - `UNACTIVATED` $\rightarrow$ `302 Found` with `Location: /activate/${publicId}`
     - `DISABLED` $\rightarrow$ `200 OK` (Static maintenance message)
     - `RETIRED` $\rightarrow$ `200 OK` (Static retired card message)
- **Strict Headers Emitted:**
  - `Cache-Control: private, no-cache, no-store, must-revalidate`
  - `Referrer-Policy: no-referrer`
- **Zero-Dependency Guarantee:** No Turnstile, no external fetch, no scan writes, no analytics blocking this response.

---

### 2.2 GET `/activate/:publicId`
- **Method:** `GET`
- **Authentication:** None (Public)
- **Behavior:** Serves the static client application from Workers Static Assets.

---

### 2.3 GET `/api/public/card/:publicId/status`
- **Method:** `GET`
- **Authentication:** None (Public)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "publicId": "A7K92P4X8Q",
      "status": "UNACTIVATED"
    }
  }
  ```
- **Privacy Invariant:** If `status === 'ACTIVE'`, returns strictly `{"status": "ACTIVE"}` without disclosing business name, destination URL, or activation code metadata.

---

### 2.4 POST `/api/public/activate`
- **Method:** `POST`
- **Authentication:** None (Protected by Cloudflare Turnstile token validation)
- **Request Body:**
  ```json
  {
    "publicId": "A7K92P4X8Q",
    "businessName": "Sunrise Bakery",
    "reviewUrl": "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
    "activationCode": "K7XM-92PR-L8Q2",
    "turnstileToken": "0.X.TOKEN..."
  }
  ```
- **Validation Pipeline:**
  1. `turnstileToken`: Verified server-side via `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`. Fails $\rightarrow$ HTTP 403 Forbidden.
  2. `businessName`: 2–100 characters, trimmed, stripped of HTML tags.
  3. `activationCode`: Format `[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}`.
  4. `reviewUrl`: Verified against the **Centralized Google Review URL Validator** (see Section 3 below).
- **Atomic State Mutation:**
  1. Compute `hash = HMAC_SHA256(ACTIVATION_SECRET, normalize(activationCode))`.
  2. Execute atomic update:
     ```sql
     UPDATE cards 
     SET status = 'ACTIVE',
         business_name = ?,
         destination_url = ?,
         activated_at = ?
     WHERE public_id = ? 
       AND activation_code_hash = ?
       AND status = 'UNACTIVATED';
     ```
  3. Evaluate `meta.changes === 1`:
     - If `1`: Log `CARD_ACTIVATED` in `audit_logs` and return HTTP 200.
     - If `0`: Return generic error HTTP 400 (`"Invalid activation code or card is already active"`).
- **Post-Activation Invariant:** The activation form is disabled permanently. Plaintext activation code is destroyed from memory.

---

## 3. Centralized Google Review Destination Validator

To avoid brittle single-pattern validation and accommodate official Google Business Profile sharing links, destination validation is managed by a single centralized module (`src/shared/google-url-validator.ts`):

```typescript
export interface ValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  error?: string;
}

export function validateGoogleReviewUrl(inputUrl: string): ValidationResult {
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    return { isValid: false, error: "Invalid URL structure." };
  }

  // 1. Enforce HTTPS only
  if (parsed.protocol !== "https:") {
    return { isValid: false, error: "HTTPS protocol is required." };
  }

  // 2. Disallow Userinfo (e.g. user:pass@)
  if (parsed.username || parsed.password) {
    return { isValid: false, error: "URL credentials are not permitted." };
  }

  // 3. Exact Google Hostname Allowlist (No partial or deceptive matching)
  const APPROVED_HOSTNAMES = new Set([
    "search.google.com",
    "g.page",
    "maps.app.goo.gl",
    "maps.google.com",
    "www.google.com"
  ]);

  const hostname = parsed.hostname.toLowerCase();
  if (!APPROVED_HOSTNAMES.has(hostname)) {
    return { isValid: false, error: "Destination must be an approved Google Review domain." };
  }

  // 4. Approved Path & Query Rules per Hostname
  if (hostname === "search.google.com") {
    // Canonical Place ID link: /local/writereview?placeid=...
    if (parsed.pathname === "/local/writereview" && parsed.searchParams.has("placeid")) {
      return { isValid: true, normalizedUrl: parsed.toString() };
    }
  } else if (hostname === "g.page") {
    // Business profile short link: /r/{code}/review or /{slug}/review
    if (parsed.pathname.endsWith("/review")) {
      return { isValid: true, normalizedUrl: parsed.toString() };
    }
  } else if (hostname === "maps.app.goo.gl") {
    // Official Google Maps mobile share link: /...
    if (parsed.pathname.length > 1) {
      return { isValid: true, normalizedUrl: parsed.toString() };
    }
  } else if (hostname === "maps.google.com" || hostname === "www.google.com") {
    // Maps place or CID link
    if (parsed.pathname.startsWith("/maps")) {
      return { isValid: true, normalizedUrl: parsed.toString() };
    }
  }

  return { isValid: false, error: "Unrecognized Google Review link pattern." };
}
```

*Architectural Principle:* All Google hostname and path logic resides strictly in this module. Any future Google URL format updates require exactly one controlled code change.

---

## 4. Admin API Endpoints (`/api/admin/*`)

*All admin endpoints are protected by Cloudflare Access Zero Trust.*

- `GET /api/admin/dashboard`: Overview statistics (cards by status, total batches).
- `GET /api/admin/cards`: Paginated card inventory with status filtering.
- `GET /api/admin/cards/:id`: Card detail view with audit timeline.
- `POST /api/admin/batches`: Provisions new batch of cards with generated public IDs and codes.
- `POST /api/admin/cards/:id/rotate-code`: Rotates activation code for an `UNACTIVATED` card.
- `POST /api/admin/cards/:id/change-destination`: Updates target URL on an `ACTIVE` card. Logs `DESTINATION_CHANGED`.
- `POST /api/admin/cards/:id/disable`: Transitions `ACTIVE` $\rightarrow$ `DISABLED`. Logs `CARD_DISABLED`.
- `POST /api/admin/cards/:id/restore`: Transitions `DISABLED` $\rightarrow$ `ACTIVE`. Logs `CARD_RESTORED`.
- `POST /api/admin/cards/:id/retire`: Transitions to `RETIRED` (terminal). Logs `CARD_RETIRED`.

---

## 5. Health Endpoints

- `GET /healthz`: Public liveness probe. Returns HTTP 200 `{"status": "ok"}`.
- `GET /healthz/redirect-test`: Public synthetic probe executing a test 302 redirect.
- `GET /healthz/deep`: Cloudflare Access protected probe verifying D1 read connectivity.
