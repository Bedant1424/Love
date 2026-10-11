# NAGARJUNA TRADERS — CATALOGUE DATA SPECIFICATION

**Document Reference:** `docs/catalogue-data.md`  
**Source of Truth:** Physical Diwali Poster Artwork (`docs/reference/nagarjuna-traders-catalog.jpg`)  
**Currency:** Indian Rupee (INR) — Internal Minor Units: Paise (₹1.00 = 100 paise)  
**System Mode:** Portfolio Demo Mode — Authentic Poster Extraction & Simulated Ordering

---

## 1. Overview and Ingestion Principles

This catalogue specification records the exact fireworks inventory extracted from the Nagarjuna Traders Diwali poster. 

> [!NOTE]
> **PORTFOLIO DEMO SPECIFICATION:**
> In this portfolio demonstration, all 6 authentic poster categories and products are modeled. No real commercial transactions or product dispatch occur.

### Mandatory Catalogue Invariants:
1. **Never Invent Data:** If a pack size, item count, or price is omitted or shown as a range on the poster, it is mapped with `pricePaise: null` and `priceStatus: 'PRICE_ON_ENQUIRY'`. It cannot reach the final simulated payment stage until confirmed.
2. **Strict Pricing Origins:** Every variant tracks a `pricingOrigin`:
   - `POSTER_EXACT`: Exact single numeric price printed on the supplied poster (e.g., 9cm Sparklers at ₹180, Skyshot Bigboss at ₹350, Chakri Medium at ₹100).
   - `POSTER_RANGE`: A range printed on the poster (e.g., Pandav at ₹200 to ₹250, JJ at ₹400 to ₹450, Kumpi Medium at ₹150 to ₹200). Kept unpriced (`pricePaise: null`).
   - `UNCONFIRMED_MAPPING`: Multiple sizes without per-size pricing (e.g., Tiger Bomb sizes 3, 4, 5, 6 with broad ₹200 to ₹400 range). Kept unpriced (`pricePaise: null`).
3. **No Fabricated Sizes or Categories:** Kumpi is strictly Medium and Large (no Small, Big, Special, or Deluxe). Sparklers are strictly 9cm (₹180), 9cm Color (₹250), 12cm (₹250), 12cm Color (₹300), and 15cm Crackling (₹350).
4. **Original Spelling Preserved:** Product names retain poster spelling (e.g., "Jharjhari", "Kumpi", "Bijli Laddi").

---

## 2. Category 1: Laddis (Garland Crackers)

> [!WARNING] Legal Notice
> The Supreme Court of India in *Arjun Gopal v. Union of India (2018)* banned joined firecrackers (series crackers / laddis) due to extreme particulate emissions and noise pollution. See `docs/legal-and-sales-compliance.md`. Publication of this category for online commercial checkout is legally blocked by default.

| Product Code | Product Name | Pack / Size on Poster | Printed Price | Internal Status | Notes / Owner Confirmation Needed |
|---|---|---|---|---|---|
| `CAT1-LAD-001` | Bijli Laddi | Unspecified Size A / B | ₹60 / ₹70 | `UNPRICED_RANGE` | Confirm exact length/count for ₹60 vs ₹70. |
| `CAT1-LAD-002` | Big Lanka Laddi | Unspecified Size 1 / 2 / 3 | ₹180 / ₹210 / ₹550 | `UNPRICED_RANGE` | Confirm exact laddi lengths/counts for ₹180, ₹210, and ₹550 variants. |

---

## 3. Category 2: Skyshots (Aerial Fireworks)

| Product Code | Product Name | Pack Info | Printed Price | Internal Status | Notes / Owner Confirmation Needed |
|---|---|---|---|---|---|
| `CAT2-SKY-001` | Pandav | 5 pcs | ₹200 to ₹250 | `UNPRICED_RANGE` | Confirm exact price for the 5 pcs pack (e.g., ₹220 vs ₹250). |
| `CAT2-SKY-002` | Single Shot | Not specified | ₹120 | `READY_FOR_CONFIRMATION` | Exact price printed (₹120 / 12,000 paise). Confirm pack count (single pipe vs multi-pack). |
| `CAT2-SKY-003` | Skyshot - Bigboss | 3 pcs | ₹350 | `READY_FOR_CONFIRMATION` | Exact price printed (₹350 / 35,000 paise). Pack is 3 pcs. |
| `CAT2-SKY-004` | Skyshot - JJ | 3 pcs | ₹400 to ₹450 | `UNPRICED_RANGE` | Confirm exact selling price (₹400 vs ₹450). |
| `CAT2-SKY-005` | Skyshot - Elephant | 3 pcs | ₹550 to ₹600 | `UNPRICED_RANGE` | Confirm exact selling price (₹550 vs ₹600). |

---

## 4. Category 3: Bombs (Sound Crackers)

| Product Code | Product Name | Pack Info | Printed Price | Internal Status | Notes / Owner Confirmation Needed |
|---|---|---|---|---|---|
| `CAT3-BMB-001` | Bullet Bomb | 10 pcs | ₹80 to ₹100 | `UNPRICED_RANGE` | Confirm exact price per box of 10 pcs. |
| `CAT3-BMB-002` | Laxmi Paper Bomb | 50 pcs | ₹240 | `READY_FOR_CONFIRMATION` | Exact price printed (₹240 / 24,000 paise) for 50 pcs. |
| `CAT3-BMB-003` | Kingkong / Naji | 10 pcs | ₹250 | `READY_FOR_CONFIRMATION` | Confirm whether "Kingkong" and "Naji" are two distinct brands/variants or synonymous. |
| `CAT3-BMB-004` | Jurassic Bomb | 10 pcs | ₹200 to ₹220 | `UNPRICED_RANGE` | Confirm exact price for 10 pcs box. |
| `CAT3-BMB-005` | Marshal Bomb | 10 pcs | ₹200 to ₹220 | `UNPRICED_RANGE` | Confirm exact price for 10 pcs box. |
| `CAT3-BMB-006` | Tiger Bomb | Sizes 3, 4, 5, 6 | ₹200 to ₹400 per box | `UNPRICED_RANGE` | Require exact price for Size 3, Size 4, Size 5, and Size 6 individually. |
| `CAT3-BMB-007` | Tiger XXXL Bomb | Per box | ₹500 | `READY_FOR_CONFIRMATION` | Exact price printed (₹500 / 50,000 paise). Confirm number of pieces per box. |

---

## 5. Category 4: Jharjhari & Sparklers

> **Poster Specification Note:** The poster carries a global footnote: *"All packs include 10 packets, each containing 10 pieces."* (i.e. 100 sparklers total per main pack).

| Product Code | Product Name | Pack Info | Printed Price | Internal Status | Notes / Owner Confirmation Needed |
|---|---|---|---|---|---|
| `CAT4-SPK-001` | 9 cm Sparklers | 10 pkts × 10 pcs | ₹180 | `READY_FOR_CONFIRMATION` | Confirm if 100 pcs pack specification applies universally. |
| `CAT4-SPK-002` | 9 cm Color Sparklers | 10 pkts × 10 pcs | ₹250 | `READY_FOR_CONFIRMATION` | Confirm pack count and color breakdown. |
| `CAT4-SPK-003` | 12 cm Sparklers | 10 pkts × 10 pcs | ₹250 | `READY_FOR_CONFIRMATION` | Confirm pack count. |
| `CAT4-SPK-004` | 12 cm Color Sparklers | 10 pkts × 10 pcs | ₹300 | `READY_FOR_CONFIRMATION` | Confirm pack count. |
| `CAT4-SPK-005` | 15 cm Crackling Sparklers | 10 pkts × 10 pcs | ₹350 | `READY_FOR_CONFIRMATION` | Confirm pack count and special crackling composition. |

---

## 6. Category 5: Kumpi & Chakri (Flower Pots & Ground Spinners)

**Kumpi (Flower Pots)**
*Description:* Ground emitting fountain fireworks.

| Product Code | Product Name | Variant | Printed Price | Internal Status | Notes / Owner Confirmation Needed |
|---|---|---|---|---|---|
| `CAT5-KMP-001` | Kumpi (Flower Pots) | Medium | ₹150 to ₹200 per box | `UNPRICED_RANGE` | Confirm pieces per box and exact price. |
| `CAT5-KMP-002` | Kumpi (Flower Pots) | Large | ₹200 to ₹250 per box | `UNPRICED_RANGE` | Confirm pieces per box and exact price. |

**Chakri (Ground Spinners / Zamin Chakkar)**
*Description:* Ground circular spinning wheel fireworks.

| Product Code | Product Name | Variant | Printed Price | Internal Status | Notes / Owner Confirmation Needed |
|---|---|---|---|---|---|
| `CAT5-CHK-001` | Chakri (Spinners) | Medium | ₹100 per box | `READY_FOR_CONFIRMATION` | Exact price printed (₹100 / 10,000 paise). Confirm pcs per box (typically 10 or 25). |
| `CAT5-CHK-002` | Chakri (Spinners) | Large | ₹250 to ₹350 per box | `UNPRICED_RANGE` | Confirm pieces per box and exact price (e.g., ₹280 vs ₹350). |

---

## 7. Category 6: Others (Novelty & Aerial Twisters)

| Product Code | Product Name | Pack Info | Printed Price | Internal Status | Notes / Owner Confirmation Needed |
|---|---|---|---|---|---|
| `CAT6-OTH-001` | Helicopter | Per box | ₹150 to ₹200 per box | `UNPRICED_RANGE` | Confirm pcs per box and exact price. |
| `CAT6-OTH-002` | Ganga Jamuna | Per box | ₹150 per box | `READY_FOR_CONFIRMATION` | Exact price printed (₹150 / 15,000 paise). Confirm product type and count. |
| `CAT6-OTH-003` | Special Requests / Custom Enquiries | Variable | On Enquiry | `ENQUIRY_ONLY` | Retain direct WhatsApp / counter enquiry button without cart booking. |

---

## 8. Summary of Product Readiness

| Category | Total Extracted Items | Exact Prices Found | Items Requiring Price/Pack Clarification |
|---|---|---|---|
| 1. Laddis | 2 | 0 | 2 (100%) |
| 2. Skyshots | 5 | 2 | 3 (60%) |
| 3. Bombs | 7 | 3 | 4 (57%) |
| 4. Jharjhari & Sparklers | 5 | 5 | 0 (0% price, 100% pack verify) |
| 5. Kumpi & Chakri | 4 | 1 | 3 (75%) |
| 6. Others | 3 | 1 | 2 (67%) |
| **Total** | **26 Items / Variants** | **12 Discrete Prices** | **14 Unpriced Ranges / Variants** |

### Immediate Launch Blockers
1. 14 items currently have unpriced price ranges and cannot be made active for commerce.
2. WhatsApp QR code on poster routes to customer group, which requires verification of target phone number / link.
3. Actual store location must be confirmed: Sivakasi is in Tamil Nadu, yet poster states "Sivakasi, Andhra Pradesh".
