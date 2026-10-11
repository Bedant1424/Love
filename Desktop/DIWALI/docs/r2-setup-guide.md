# Nagarjuna Traders: Cloudflare R2 Persistent QR Storage Setup Guide

## 1. Executive Summary & Verification State

- **Cloudflare Account ID**: `f5007499f208d03d531ad81e9d1f33aa`
- **CLI Verification Result**:
  ```bash
  $ npx wrangler r2 bucket list
  name:           nagarjuna-qr-images
  creation_date:  2026-10-11T11:23:06.212Z
  ```
- **Operational Reality**: Cloudflare R2 has been successfully enabled on the account. Dedicated bucket `nagarjuna-qr-images` is active and bound as `QR_BUCKET`.
- **Architectural Solution**:
  1. The server codebase (`src/server/qrStorage.ts` and `src/server/api.ts`) binds directly to `env.QR_BUCKET`.
  2. Binary raster images are persisted in `nagarjuna-qr-images` object storage under keys `qr-assets/<version_id>_<timestamp>_<rand>.<ext>`.
  3. D1 database stores only decoupled metadata (R2 key, SHA-256 hash, content type, file size). No base64 data URLs in SQLite.
  4. Binary images are served via proxy route `/api/v1/qr-images/:id` with strict security headers.

---

## 2. Step-by-Step Cloudflare Dashboard Enablement Procedure

To activate the live R2 bucket in production and preview environments, perform the following one-time administrator steps:

### Step 1: Enable R2 Subscription in Cloudflare
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Select account: `f5007499f208d03d531ad81e9d1f33aa`.
3. In the left navigation sidebar, navigate to **Storage & Databases** > **R2 Object Storage**.
4. Click **Enable R2** (or **Purchase R2** plan). Note that Cloudflare R2 provides a generous free tier:
   - 10 GB-months of standard storage
   - 1,000,000 Class A operations (writes, lists) per month
   - 10,000,000 Class B operations (reads) per month
   - \$0 egress fees

### Step 2: Create the Dedicated QR Asset Bucket
1. In the R2 Dashboard, click **Create Bucket**.
2. Specify the bucket name:
   ```
   nagarjuna-traders-qr-assets
   ```
3. Location Hint: Select **APAC (Asia-Pacific)** or **Automatic** for lowest latency to South Indian customers.
4. Retention / Lifecycle: Default standard storage class.

### Step 3: Attach R2 Binding to Cloudflare Pages Project
1. In the left navigation sidebar, navigate to **Workers & Pages**.
2. Select the Pages project: `nagarjuna-traders-test` (and `nagarjuna-traders` in production).
3. Navigate to **Settings** > **Functions**.
4. Scroll down to **R2 Bucket Bindings** and click **Add binding**:
   - **Variable name**: `QR_BUCKET`
   - **R2 bucket**: `nagarjuna-traders-qr-assets`
   - **Environment**: Both *Production* and *Preview*.
5. Click **Save**.

### Step 4: Enable in Local Configuration (`wrangler.jsonc`)
Once created in the dashboard, the binding can be formalized in `wrangler.jsonc`:
```jsonc
{
  "r2_buckets": [
    {
      "binding": "QR_BUCKET",
      "bucket_name": "nagarjuna-traders-qr-assets"
    }
  ]
}
```

---

## 3. Database Migration and Metadata Decoupling

Migration `0007_qr_r2_storage_metadata.sql` was successfully applied to remote D1 database `nagarjuna-traders-d1-test` (UUID: `aace32a4-8ec3-487e-b202-a98e898868bc`).

### Schema Additions on `qr_versions` Table:
- `r2_object_key TEXT`: Server-generated key (e.g., `qr-assets/qr_v1_1791705000_abc123.png`)
- `content_type TEXT`: Verified MIME type (`image/png`, `image/jpeg`, `image/webp`)
- `file_size_bytes INTEGER`: Exact byte count (capped at 2MB)
- `sha256_checksum TEXT`: Cryptographic hash for tamper detection
- `merchant_category_code TEXT`: UPI MCC reference
- `merchant_id TEXT`: Terminal identifier

### Server-Controlled URL:
The `image_url` stored in D1 points to the controlled server proxy route:
```
/api/v1/qr-images/:versionId
```
This ensures zero raw external asset URLs or inline base64 blobs are returned to the client.

---

## 4. Security & Hardening Controls

1. **Magic Byte / Signature Inspection**:
   - Every uploaded image payload is decoded and inspected for authentic binary magic bytes:
     - PNG: `89 50 4E 47 0D 0A 1A 0A`
     - JPEG: `FF D8 FF`
     - WebP: `52 49 46 46 ... 57 45 42 50`
   - Renaming malicious files or forging MIME type headers in HTTP requests fails validation.

2. **Strict Active Content Rejection**:
   - Payload strings and binary headers are scanned for XML, SVG, HTML, and script tags (`<svg`, `<script`, `<?xml`, `<!doctype`, `javascript:`).
   - Any active markup or script payload is immediately rejected with HTTP 400 (`INVALID_IMAGE_TYPE`).

3. **Size Limitation**:
   - Payloads exceeding 2 MB are strictly rejected with HTTP 400 (`FILE_TOO_LARGE`).

4. **Safe Response Headers on Image Serving**:
   Images served via `GET /api/v1/qr-images/:id` include:
   - `Content-Type`: authentic verified MIME type
   - `X-Content-Type-Options: nosniff`: blocks browser MIME sniffing
   - `Content-Security-Policy: default-src 'none'`: disables script execution in the image context
   - `Cache-Control: private, no-transform, max-age=86400`: caches securely

5. **Credential Boundary**:
   - Browser clients never receive R2 bucket access keys, S3 endpoints, or write credentials.
   - All uploads occur via authenticated admin routes (`POST /api/v1/admin/qr/upload`) protected by Cloudflare Access JWTs.
