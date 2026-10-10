# NAGARJUNA TRADERS — OPEN QUESTIONS, ASSUMPTIONS & BLOCKER REGISTER

**Document Reference:** `docs/open-questions.md`  
**Status:** Active Action Items Pending Owner Decision  
**Owner Action Required:** Mandatory review before toggling commercial checkout

---

## 1. High-Priority Launch Blockers (P0)

| ID | Category | Question / Issue Description | Current System Default | Responsible Party | Status |
|---|---|---|---|:---:|:---:|
| **BLK-01** | **Legal & Location** | The poster states *"Sivakasi, Andhra Pradesh"*, but Sivakasi is in Tamil Nadu. What is the actual physical shop address, district, and state? | Labelled as printed on poster; commercial checkout gated. | Store Owner | **BLOCKER** |
| **BLK-02** | **Statutory Licensing** | Does Nagarjuna Traders possess a valid LE-5 Retail Explosives License issued by the local DM/Police Commissioner for Diwali 2026? | Live checkout gated (`COMMERCE_CHECKOUT_ENABLED=false`). | Store Owner / Legal Counsel | **BLOCKER** |
| **BLK-03** | **Supreme Court Laddi Ban** | The Supreme Court of India banned series/garland crackers (Laddis). Are Bijli Laddi and Big Lanka Laddi to be removed or offered only for non-binding enquiry? | Displayed with prominent environmental regulatory disclaimer; blocked from checkout. | Store Owner | **BLOCKER** |
| **BLK-04** | **UPI Project Repository** | The owner mentioned providing an open-source UPI payment repository. What is the GitHub URL? | Recorded as outstanding dependency; manual UTR fallback specified. | Store Owner | **BLOCKER** |

---

## 2. Product Catalogue & Pricing Questions (P1)

| SKU Code | Product Name | Ambiguity on Supplied Poster | Options / Decisions Needed | Impact |
|---|---|---|---|---|
| `CAT1-LAD-001` | **Bijli Laddi** | Printed as `₹60 / ₹70`. Which size corresponds to ₹60 and which to ₹70? | Define exact length/count per variant (e.g. Size S = ₹60, Size M = ₹70). | Cannot purchase until priced. |
| `CAT1-LAD-002` | **Big Lanka Laddi** | Printed as `₹180 / ₹210 / ₹550`. Which size corresponds to each price? | Provide exact variant definitions for ₹180, ₹210, and ₹550. | Cannot purchase until priced. |
| `CAT2-SKY-001` | **Pandav (5 pcs)** | Printed as `₹200 to ₹250`. What is the exact retail selling price? | Choose single price (e.g. ₹220.00). | Cannot purchase until priced. |
| `CAT2-SKY-002` | **Single Shot** | Pack piece count is omitted on poster. | Confirm if sold as individual single pipe or multi-pack box. | Display clarity. |
| `CAT2-SKY-004` | **Skyshot - JJ** | Printed as `₹400 to ₹450`. What is the exact selling price? | Choose single price (e.g. ₹420.00). | Cannot purchase until priced. |
| `CAT2-SKY-005` | **Skyshot - Elephant** | Printed as `₹550 to ₹600`. What is the exact selling price? | Choose single price (e.g. ₹580.00). | Cannot purchase until priced. |
| `CAT3-BMB-001` | **Bullet Bomb (10 pcs)**| Printed as `₹80 to ₹100`. What is the exact selling price? | Choose single price (e.g. ₹90.00). | Cannot purchase until priced. |
| `CAT3-BMB-003` | **Kingkong / Naji** | Is this two separate interchangeable brands or two distinct items? | Confirm whether to list as one item or two separate options. | Product listing. |
| `CAT3-BMB-004` | **Jurassic Bomb (10 pcs)**| Printed as `₹200 to ₹220`. What is the exact selling price? | Choose single price (e.g. ₹210.00). | Cannot purchase until priced. |
| `CAT3-BMB-005` | **Marshal Bomb (10 pcs)**| Printed as `₹200 to ₹220`. What is the exact selling price? | Choose single price (e.g. ₹210.00). | Cannot purchase until priced. |
| `CAT3-BMB-006` | **Tiger Bomb** | Printed as `Sizes 3, 4, 5, 6 - ₹200 to ₹400 per box`. What is the exact price for each size? | Require: Size 3 = ₹?, Size 4 = ₹?, Size 5 = ₹?, Size 6 = ₹?. | Cannot purchase until priced. |
| `CAT3-BMB-007` | **Tiger XXXL Bomb** | Pieces per box is not stated. | Confirm number of bombs per box. | Display clarity. |
| `CAT4-SPK-ALL` | **Sparklers Packs** | Poster states *"All packs include 10 packets, each containing 10 pieces"*. Does this apply to all 5 items? | Confirm if 100 sparklers applies universally to 9cm, 12cm, and 15cm crackling. | Specification accuracy. |
| `CAT5-KMP-001` | **Kumpi (Flower Pots)** | Printed as `Medium: ₹150 to ₹200`, `Large: ₹200 to ₹250`. What are exact prices and pieces per box? | Specify exact prices (e.g. Med = ₹180, Lrg = ₹230) and piece counts. | Cannot purchase until priced. |
| `CAT5-CHK-001` | **Chakri (Spinners)** | Medium is ₹100, Large is `₹250 to ₹350`. What is the exact price for Large and pieces per box? | Specify exact price for Large (e.g. ₹300) and piece counts. | Cannot purchase until priced. |
| `CAT6-OTH-001` | **Helicopter** | Printed as `₹150 to ₹200 per box`. What is the exact price and pieces per box? | Specify exact price (e.g. ₹180) and piece count. | Cannot purchase until priced. |
| `CAT6-OTH-002` | **Ganga Jamuna** | Pieces per box omitted. | Confirm pieces per box. | Display clarity. |

---

## 3. Commercial & Financial Questions (P2)

| Question | Default Assumption | Owner Action Required |
|---|---|---|
| **Tax Inclusion:** Do printed prices include Goods & Services Tax (GST)? | Assumed **Inclusive** of all taxes. No unexpected tax surcharges added at cart. | Confirm whether GST invoice is required and whether prices are tax-inclusive. |
| **Token Percentage Policy:** Is 20% advance token with a minimum of ₹100 acceptable? | Defaulted to 20% advance token (`MIN_TOKEN_AMOUNT_PAISE = 10000`). | Confirm if flat token (e.g. ₹500) or percentage is preferred. |
| **Store UPI VPA:** What is the official merchant UPI ID and registered account name? | Placeholder used: `nagarjunatraders@okhdfcbank`. | Provide genuine store UPI VPA for customer payment routing. |
| **WhatsApp Group Link:** The poster has a WhatsApp QR code. What is the target group/phone URL? | Placeholder WhatsApp enquiry link. | Provide invite URL or 10-digit WhatsApp business number. |
