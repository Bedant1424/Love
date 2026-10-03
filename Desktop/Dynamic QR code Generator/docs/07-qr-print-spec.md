# 07 — QR Code & NFC Print Production Specification

> **Status:** Reconciled at Final Design Review (Gate 1.5). Implementation has NOT started.  
> **Physical Reliability Standard:** ISO/IEC 18004 Error Correction Level H (~30% recovery) + NFC Forum RTD Type U.

---

## 1. QR Code Encoding Invariant

### Sacred Physical Rule
- The physical QR code **NEVER** contains the target Google Review URL.
- The physical QR code contains strictly the permanent routing URL:
  ```
  https://[DOMAIN]/c/A7K92P4X8Q
  ```
- The printed matrix is immutable. Even if the business moves or changes its review link 10 times via admin, the physical printed QR remains 100% valid.

---

## 2. Technical Generation Specs (`qrcode` npm)

```typescript
import QRCode from "qrcode";

export const MASTER_QR_OPTIONS = {
  type: "svg" as const,
  errorCorrectionLevel: "H" as const, // Survives ~30% physical occlusion/scratching
  margin: 4,                          // Strict 4-module quiet zone per ISO/IEC 18004
  color: {
    dark: "#000000ff",                // 100% Black (K:100)
    light: "#ffffffff"                // 100% White (Substrate background)
  }
};
```

### Dimensions for CR-80 Cards (85.60 mm × 53.98 mm)
- **Minimum QR Size:** 20 mm × 20 mm.
- **Recommended Production Size:** **28 mm × 28 mm**.
- **Quiet Zone Margin:** Minimum 4 modules (3.5 mm solid white border surrounding all sides).

---

## 3. NFC Encoding Specification

- **Chip Formats:** NXP NTAG213, NTAG215, NTAG216.
- **Record Type:** Well-Known Type `U` (URI, Hex `0x55`).
- **TNF:** `0x01` (NFC Forum Well-Known Type).
- **Prefix Code:** `0x04` (`https://`).
- **Payload String:** `[DOMAIN]/c/A7K92P4X8Q` (UTF-8).
- **Locking:** Set to permanent Read-Only after factory programming.
