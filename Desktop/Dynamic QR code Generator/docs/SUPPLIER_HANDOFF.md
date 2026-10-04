# QRoute Supplier Handoff & Print Specification

> **Purpose:** Internal & Supplier Handoff Guide for Physical Review Card Manufacturing  
> **Package Standard:** Vector SVG + High-Res PNG + A4 Batch Sheet PDF  
> **Privacy Rule:** Zero-Knowledge Manufacturing. Suppliers never receive activation credentials, Google destination URLs, merchant names, or customer identities.

---

## 1. Package Structure

Every exported batch package is delivered as a single standardized ZIP archive:
`QRoute_Batch_<BatchName>.zip`

```text
QRoute_Batch_<BatchName>.zip
├── SVG/
│   ├── QR-001.svg
│   ├── QR-002.svg
│   └── ...
├── PNG/
│   ├── QR-001.png
│   ├── QR-002.png
│   └── ...
└── QR-SHEET.pdf
```

### File Contents & Roles:
- **`SVG/` (Primary Print Master):**  
  Scalable vector graphics (`.svg`) with pure path geometry and crisp edge rendering. Use this directory as the primary input for prepress plate making, vector layout assembly, and digital printing.
- **`PNG/` (High-Resolution Raster Reference):**  
  High-resolution raster files ($1127 \times 1127$ px, 32bpp) generated with integer module scaling (23 pixels per module at Level H error correction). Suitable for direct raster workflows or visual verification (~563 DPI at 2-inch print).
- **`QR-SHEET.pdf` (Visual Batch Reference):**  
  A single-page A4 print sheet containing all batch QR codes laid out in a clean 3-column $\times$ 4-row grid. Intended solely as a visual batch reference and physical packing checklist.

### Strict Exclusions (What is NEVER in the Supplier Package):
- ❌ No plaintext activation codes or passwords
- ❌ No printed public IDs or internal database IDs
- ❌ No Google Review URLs or destination endpoints
- ❌ No business names or merchant details
- ❌ No customer personal data
- ❌ No admin keys or mapping spreadsheets
- ❌ No decorative PVC card mockups or substrate specs

---

## 2. Supplier Instructions & Rules

1. **Unmodified Artwork:**  
   The QR code artwork must remain completely unmodified. Do not alter module shapes, rounded corners, or patterns.
2. **Quiet Zone Invariant:**  
   The mandatory 4-module white quiet zone surrounding each QR code must remain completely intact on all four sides. Never crop, trim, or bleed artwork into the quiet zone.
3. **Aspect Ratio:**  
   Strict 1:1 square aspect ratio must be maintained at all times. Never stretch, compress, or scale asymmetrically.
4. **No Overlays or Inner Text:**  
   Do not place icons, logos, emojis, or text inside or over the QR matrix. The Level H error correction is reserved for physical scratch resistance in the field.
5. **No URL Substitution:**  
   Never replace or re-encode the QR codes with third-party short links, redirects, or direct Google links. Each QR code is already permanently routed at the edge.
6. **One QR Per Physical Card:**  
   Each numbered file (`QR-001`, `QR-002`, etc.) represents exactly one unique physical review card.
7. **Physical Card Design:**  
   The supplier and designer remain responsible for the physical card aesthetic and substrate design. The QR asset is placed onto the card according to these readability guidelines.

---

## 3. Print Specification

| Parameter | Specification |
|---|---|
| **Format** | Vector SVG (preferred) or 32bpp PNG ($1127 \times 1127$ px) |
| **Error Correction** | ISO/IEC 18004 Level H (~30% damage recovery) |
| **Quiet Zone Margin** | Minimum 4 modules on all sides (included in asset files) |
| **Color Contrast** | High-contrast 100% Solid Black (`#000000`) on Pure White (`#FFFFFF`) |
| **Minimum Print Size** | 25 mm $\times$ 25 mm (Recommended: 35 mm to 40 mm for standard credit card form factors) |
| **Resolution Target** | Minimum 300 DPI at final print size (provided PNG yields ~563 DPI at 2 inches) |
| **Distortion & Cropping**| Zero tolerance. No non-uniform scaling or edge clipping |

---

## 4. NFC Tag Specification (When NFC Is Included)

When physical NFC cards or tags (e.g. NTAG213, NTAG215) are integrated into the card manufacturing run:
- **Payload Type:** Standard NDEF URI Record.
- **URI Format:** Strictly encode the permanent canonical card URL corresponding to the card's QR code:
  `https://go.taprevieww.workers.dev/c/<publicId>`
- **Payload Length:** Exactly 52 ASCII bytes (utilizing only 36% of standard 144-byte NTAG213 capacity, leaving 92 bytes headroom).
- **Prohibitions:**
  - ❌ Never encode activation credentials in the NFC chip.
  - ❌ Never encode Google destination URLs directly in the NFC chip.
  - ❌ Never append tracking query strings or parameters to the NFC URI.

---

## 5. Quality & Acceptance Status

As of the latest production verification:

| Checkpoint | Status | Notes |
|---|---|---|
| **Digital Asset Validation** | **PASS** | Verified 10 SVGs, 10 PNGs, 1 PDF against strict geometry & security invariants |
| **Software URL Routing** | **PASS** | Verified canonical edge routing (`/c/:publicId`) and HTTP 302 redirect engine |
| **Mobile Camera Scan** | **PASS** | Successfully acquired and decoded on real smartphone camera |
| **Edge Activation Flow** | **PASS** | Verified Turnstile bot protection and atomic transition to ACTIVE |
| **Commercial Prepress / Press Proof** | **PENDING** | Awaits actual supplier physical press proof on chosen substrate |
| **Physical NFC Hardware Test** | **PENDING** | Awaits physical writable NTAG213/215 sample tags |

---

## 6. Custom Domain & Procurement Planning Notice

- **Current Pilot Host:** `https://go.taprevieww.workers.dev`
- **Procurement Invariant:**  
  Before initiating large-scale physical card printing (e.g., runs $> 100$ cards), an owned custom domain (e.g., `go.yourbrand.com`) should be provisioned and configured as the canonical host in QRoute. Because physical QR codes and NFC chips permanently encode the public URL, establishing the owned domain prior to mass manufacturing ensures the printed cards remain permanent brand assets without requiring domain migration of printed materials.
