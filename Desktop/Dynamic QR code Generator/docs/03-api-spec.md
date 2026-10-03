# 03 — API Specification

> **Status:** Core Redirect Engine (Section 2.1) & Public Activation Engine (Sections 2.2–2.4, 3) Implemented & Verified (Milestones 2 & 3). Framework: Hono on Cloudflare Workers (TypeScript). See `docs/REDIRECT_ENGINE.md` and `docs/ACTIVATION_ENGINE.md`.

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
3. **Public Redirect SLA:** `GET /c/:publicId` edge processing time $< 25$ ms (target compute $< 10$ ms).

---

## 2. Public Endpoints

### 2.1 GET `/c/:publicId` (The Critical Redirect Path)
- **Method:** `GET`, `HEAD`, `OPTIONS`
- **Disallowed Methods:** `POST`, `PUT`, `PATCH`, `DELETE` return `405 Method Not Allowed` with `Allow: GET, HEAD, OPTIONS`.
- **Authentication:** None (Public)
- **Path Parameter:** `publicId`: `^[0-9A-HJKMNP-TV-Z]{10}$` (Crockford Base32: 10 chars, excluding ambiguous `I`, `L`, `O`, `U`)
- **Critical Execution Logic:**
  1. Uppercase & normalize `publicId` in memory. Reject obviously malformed inputs without querying D1.
  2. Execute **exactly one indexed D1 point query**:
     ```sql
     SELECT status, destination_url FROM cards WHERE public_id = ?;
     ```
  3. Dispatch based on status:
     - Malformed / Not found $\rightarrow$ `404 Not Found` (Generic Swiss Design status page or JSON envelope)
     - `ACTIVE` $\rightarrow$ `302 Found` with `Location: ${destination_url}`
     - `UNACTIVATED` $\rightarrow$ `302 Found` with `Location: /activate/${publicId}`
     - `DISABLED` $\rightarrow$ `200 OK` (Clean maintenance message, no destination leak)
     - `RETIRED` $\rightarrow$ `200 OK` (Retired card message, no destination leak)
- **Strict Headers Emitted:**
  - `Cache-Control: private, no-cache, no-store, must-revalidate`
  - `Referrer-Policy: no-referrer`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()`
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

> **Status:** Implemented & Verified (Milestone 4). See [`docs/ADMIN_OPERATIONS.md`](file:///c:/Users/17042/Desktop/Dynamic%20QR%20code%20Generator/docs/ADMIN_OPERATIONS.md).  
> **Security:** Protected by Cloudflare Access Zero Trust identity headers (`cf-access-authenticated-user-email`). Rejects unauthenticated requests with `401 Unauthorized`.

### 4.1 GET `/api/admin/dashboard`
- **Description:** Returns aggregate KPI operational statistics.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "totalCards": 100,
      "activeCards": 60,
      "unactivatedCards": 30,
      "disabledCards": 8,
      "retiredCards": 2,
      "cardsByStatus": {
        "UNACTIVATED": 30,
        "ACTIVE": 60,
        "DISABLED": 8,
        "RETIRED": 2
      },
      "totalBatches": 5
    }
  }
  ```

### 4.2 GET `/api/admin/cards`
- **Query Parameters:** `page` (default 1), `limit` (default 20, max 100), `status` (`ALL|ACTIVE|UNACTIVATED|DISABLED|RETIRED`), `search` or `q` (substring match on `public_id` or `business_name`).
- **Response `200 OK`:** Paginated result array of `AdminCardSummary` objects including `batchName`, omitting raw activation hashes.

### 4.3 GET `/api/admin/cards/:id`
- **Path Parameter:** `id` (Card UUID or Crockford `publicId`).
- **Response `200 OK`:** `AdminCardDetail` object including card metadata and audit log history array.

### 4.4 POST `/api/admin/batches`
- **Request Body:** `{ "name": "Batch Name", "cardCount": 10, "notes": "Optional notes" }`
- **Behavior:** Generates $N$ cards with Crockford Base32 public IDs and activation codes atomically in D1. Returns raw activation codes once in response for supplier manifest export. Raw codes are **never** stored in D1.

### 4.5 POST `/api/admin/cards/:id/disable`
- **Behavior:** Transitions an `ACTIVE` card to `DISABLED`. Records `CARD_DISABLED` audit log.

### 4.6 POST `/api/admin/cards/:id/restore`
- **Behavior:** Transitions a `DISABLED` card back to `ACTIVE`. Records `CARD_RESTORED` audit log.

### 4.7 POST `/api/admin/cards/:id/retire`
- **Behavior:** Permanently transitions any non-retired card to `RETIRED` (terminal). Records `CARD_RETIRED` audit log. Subsequent restoration attempts return `400 Bad Request`.

### 4.8 POST `/api/admin/cards/:id/change-destination` (Alias: `/destination`)
- **Request Body:** `{ "destinationUrl": "https://search.google.com/local/writereview?placeid=..." }`
- **Behavior:** Validates destination via `validateGoogleReviewUrl`. Updates destination on `ACTIVE` card and records `DESTINATION_CHANGED` audit log.

### 4.9 GET `/api/admin/audit` (Alias: `/audit-logs`)
- **Query Parameters:** `page`, `limit`, `cardId`, `action`.
- **Response `200 OK`:** Paginated platform audit trail with joined card public IDs.

---

## 5. Health Endpoints

- `GET /healthz`: Public liveness probe. Returns HTTP 200 `{"status": "ok"}`.
- `GET /healthz/redirect-test`: Public synthetic probe executing a test 302 redirect.
- `GET /healthz/deep`: Cloudflare Access protected probe verifying D1 read connectivity.
