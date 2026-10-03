# QRoute QR Generation, Physical Card Asset Pipeline & Supplier Fulfillment

> **Document Version:** 1.0.0  
> **Milestone:** Milestone 5 — QR Generation, Physical Card Asset Pipeline and Supplier Fulfillment  
> **Status:** Implemented & Verified (Gate 5 Complete)  
> **Physical Anchor Principle:** A printed matrix or programmed NFC chip is immutable. Physical assets encode strictly the canonical routing URL (`/c/:publicId`) and never mutable review destinations.

---

## 1. Overview & Architectural Boundary

The **QRoute Asset Pipeline** is a deterministic, offline-capable physical card asset generation and fulfillment engine. It empowers authorized operators to generate ISO/IEC 18004 Level H vector artwork, program NFC NTAG213 contactless tags, and export zero-knowledge manufacturing packages for print suppliers.

### The Sacred Physical Asset Invariant
```text
Customer Scan / Tap ──► https://<QROUTE_HOST>/c/<publicId> ──► Cloudflare Worker ──► D1 Lookup ──► HTTP 302 to Google
```

#### HARD PHYSICAL INVARIANTS:
1. **Never Encode Google URLs in Physical Assets:** Physical QR codes and NFC chips encode **strictly** the canonical routing URL `https://<HOST>/c/<publicId>`. They **never** encode the target Google Review URL, Place IDs, or mutable query parameters. If a merchant moves or changes locations, only the Cloudflare D1 destination pointer changes; the printed cards remain 100% valid.
2. **Never Encode Secrets or Identities:** Physical assets contain zero activation secrets, HMAC digests, merchant names, or internal database UUIDs.
3. **Zero-Knowledge Manufacturing:** Print and NFC suppliers receive unactivated, blank routing cards. They have zero visibility into merchant identities, Google destinations, database credentials, or Cloudflare accounts.

---

## 2. QR Code Technical Specification (ISO/IEC 18004 Standard)

### 2.1 Error Correction Level H
Physical review cards live in harsh commercial environments (restaurant tables, counter displays, shop checkout counters) where they are subjected to:
- Fingerprints, grease, and moisture
- Physical abrasion, scratches, and pocket wear
- Partial occlusion by fingers during tap/scan

To survive this, QRoute strictly enforces **ISO/IEC 18004 Level H** error correction (~30% module data restoration), the highest standard in the ISO specification.

### 2.2 Master Print Specifications (`MASTER_QR_OPTIONS`)
```typescript
export const MASTER_QR_OPTIONS = {
  type: 'svg' as const,
  errorCorrectionLevel: 'H' as const, // Survives ~30% physical occlusion/scratches
  margin: 4,                          // Strict 4-module quiet zone per ISO/IEC 18004
  color: {
    dark: '#000000',                  // 100% Black (K:100 print ink)
    light: '#ffffff'                  // 100% White (Substrate background)
  }
} as const;
```

### 2.3 Physical Dimensions (CR-80 Standard)
- **Card Standard:** ISO/IEC 7810 ID-1 / CR-80 Standard (85.60 mm × 53.98 mm × 0.76 mm).
- **QR Placement:** Back face of card, centered or in designated quadrant.
- **Recommended QR Size:** **28.0 mm × 28.0 mm** (scannable from 15–30 cm on all modern smartphones).
- **Minimum QR Size:** **20.0 mm × 20.0 mm**.
- **Quiet Zone:** Minimum 4 modules (approx. 3.5 mm solid white border on all 4 sides).

### 2.4 Vector SVG Architecture (`generateCardQrSvg`)
- **Format:** Pure vector SVG (Scalable Vector Graphics).
- **Attributes:** Explicit `xmlns="http://www.w3.org/2000/svg"`, `viewBox`, `role="img"`, `aria-label="QR Code for card <publicId>"`.
- **Security:** Sanitized with `validateQrSvg`; strictly rejects `<script>`, `onload`, `onclick`, or external resources.
- **Independence:** Pure computation; zero dependencies on DOM canvas, node-canvas, or native C++ modules.

### 2.5 Universal Zero-Dependency PNG Encoder (`encodeQrBitmapToPng`)
To ensure compatibility across Cloudflare Workers (`workerd`), Node.js, and browser runtimes without requiring native canvas libraries, QRoute includes a standalone pure TypeScript PNG encoder:
- Builds RFC 2083 compliant 8-bit grayscale PNGs directly from QR matrix modules.
- Emits RFC 1951 uncompressed zlib deflate blocks and calculates Adler-32 / CRC-32 checksums.
- Generates high-resolution raster previews (1024×1024) for screen inspection and legacy print machinery.

---

## 3. NFC Hardware & NDEF Architecture

### 3.1 Hardware Standard
- **Chip Format:** NXP NTAG213 (or NTAG215 / NTAG216).
- **Communication Protocol:** ISO/IEC 14443-A / NFC Forum Type 2 Tag.
- **Operational Frequency:** 13.56 MHz.

### 3.2 NDEF URI Specification
- **Record Type:** NFC Forum Well-Known Type `U` (URI, Hex `0x55`).
- **TNF (Type Name Format):** `0x01` (NFC Forum Well-Known).
- **Prefix Code:** `0x04` (`https://`).
- **Compressed Payload:** `<HOST>/c/<publicId>` (e.g. `qroute.workers.dev/c/8T2K9M4W1X`).

### 3.3 Memory Budget Analysis (NTAG213)
| Parameter | Value | Percentage | Status |
| :--- | :--- | :--- | :--- |
| **NTAG213 Total User Memory** | **144 bytes** | 100% | Full Capacity |
| Typical QRoute NDEF Message | ~43 bytes | 29.8% | Consumed |
| Remaining User Memory | 101 bytes | 70.2% | Free |
| **Factory Locking Directive** | **PERMANENT READ-ONLY** | OTP Lock Bits Set | Immutable |

The payload fits easily within the budget of the cost-effective NXP NTAG213 ($0.15–$0.25/chip).

---

## 4. Zero-Knowledge Supplier Manufacturing & Packaging

### 4.1 Schema Definition (`manifest.csv`)
The supplier manifest strictly follows RFC 4180:
```csv
card_index,public_id,qr_file,printed_activation_code,nfc_url,substrate
1,8T2K9M4W1X,qr/8T2K9M4W1X.svg,K7XM-92PR-V8Q2,https://qroute.workers.dev/c/8T2K9M4W1X,Matte PVC
2,3H5V7N2R9B,qr/3H5V7N2R9B.svg,B4WT-81MK-P5Q9,https://qroute.workers.dev/c/3H5V7N2R9B,Matte PVC
```

### 4.2 Formula Injection Defense (CWE-1236)
Spreadsheet applications (Excel, Google Sheets, Calc) execute formulas if a cell starts with `=`, `+`, `-`, `@`, `\t`, or `\r`.
To prevent CSV Formula Injection:
```typescript
export function sanitizeCsvCell(value: string | number): string {
  const str = String(value);
  let sanitized = str;
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = `'${sanitized}`;
  }
  if (/[",\r\n]/.test(sanitized) || sanitized.startsWith("'")) {
    sanitized = `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}
```

### 4.3 Zero-Knowledge Self-Verification (`verifyZeroKnowledgeManifest`)
The engine automatically verifies every manifest export before returning it. If any forbidden token (`business_name`, `google_url`, `destination_url`, `place_id`, `activation_code_hash`, `db_uuid`) is detected, the operation aborts immediately.

### 4.4 ZIP Package Structure (`generateBatchZipPackage`)
The in-memory ZIP package generated via `jszip` contains:
```text
qroute-supplier-package-<batchName>.zip/
  ├── manifest.csv      (Complete manufacturing data mapping)
  ├── README.txt        (CR-80 print and NTAG213 encoding standards)
  └── qr/
      ├── 8T2K9M4W1X.svg (Vector SVG artwork)
      ├── 8T2K9M4W1X.png (1024x1024 raster preview)
      ├── 3H5V7N2R9B.svg
      └── 3H5V7N2R9B.png
```

---

## 5. Domain Strategy & Multi-Hostname Resolution

### 5.1 Environment Configuration
- **Pilot Phase ($0 Budget):**
  - Default Host: `qroute.workers.dev` (or local `localhost:8787` for development).
  - Validated for immediate testing without domain registration costs.
- **Production Phase:**
  - Host: Owned custom domain (e.g. `qr.yourbrand.com`).
  - Strict RFC 1123 validation: validates FQDN, strips schemes, slashes, and paths.

### 5.2 Co-Existence Invariant
Both `qroute.workers.dev` and `qr.yourbrand.com` route to the same Cloudflare Worker and query the same Cloudflare D1 database. Previously printed pilot cards continue redirecting indefinitely without reprinting.

---

## 6. Verification & Quality Gates

| Verification Gate | Specification / Target | Actual Result | Status |
| :--- | :--- | :--- | :--- |
| **Unit Tests (QR Generator)** | `tests/unit/qr-generator.test.ts` | 16 passed | **PASS** |
| **Unit Tests (Fulfillment & Manifest)** | `tests/unit/fulfillment.test.ts` | 23 passed | **PASS** |
| **Full Vitest Suite** | All 11 unit & integration test files | 161 passed | **PASS** |
| **Playwright E2E Suite** | Full browser flows (`tests/e2e/*.spec.ts`) | 22 passed | **PASS** |
| **Asset Pipeline E2E** | `tests/e2e/assets.spec.ts` | 6 journeys passed | **PASS** |
| **TypeScript Typecheck** | `tsc -b --noEmit` | 0 errors | **PASS** |
| **ESLint Static Analysis** | `eslint .` | 0 errors, 0 warnings | **PASS** |
| **Prettier Code Formatting** | `prettier --check .` | 100% matched | **PASS** |
| **Vite Client Production Build** | `vite build` | 0 warnings, built in 13s | **PASS** |
| **Security Invariant** | `npm config get strict-ssl` | `true` | **PASS** |
