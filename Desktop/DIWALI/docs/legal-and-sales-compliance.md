# NAGARJUNA TRADERS: LEGAL AND SALES COMPLIANCE ASSESSMENT

**Document Reference:** `docs/legal-and-sales-compliance.md`  
**Applicable Jurisdiction:** India (Union Statutes, State Regulations, and District Licensing)  
**System Mode:** Portfolio Demo Mode (`PORTFOLIO_DEMO_MODE=true`)  
**Investigation Date:** October 2026  

---

## 1. Executive Summary & Portfolio Demonstration Nature

This repository contains a **portfolio demonstration** of a fireworks catalogue and ordering system.

> [!IMPORTANT]
> **PORTFOLIO DEMONSTRATION NOTICE:**
> This website is strictly an educational engineering portfolio project demonstrating full-stack architecture, integer paise financial accuracy, and mobile-first responsive design.
> 
> **Zero Real Commercial Transactions:**
> - No real fireworks sales, dispatch, courier transport, or inventory delivery are conducted.
> - No real payment gateways are connected and no real UPI or card credentials are collected.
> - All orders, payments, tokens, and balances are strictly simulated demo records (`DEMO-NT-XXXX`).
> - The application respects Indian legal frameworks (Explosives Act 1884, Explosives Rules 2008, Supreme Court directives in *Arjun Gopal v. Union of India*) by never engaging in actual commercial fireworks e-commerce.

---

## 2. Official Statutory Frameworks

### 2.1 The Explosives Act, 1884 and The Explosives Rules, 2008
- **Enforcement Authority:** Petroleum and Explosives Safety Organisation (PESO), Ministry of Commerce and Industry, Government of India.
- **Rule 74 & Rule 84 (Licensing for Possession and Sale):** A physical premises must possess an LE-5 license (issued by the District Magistrate or Commissioner of Police) or a valid PESO license for possessing and selling fireworks. Licenses mandate strict fire safety, clearance distances, and maximum explosive quantity thresholds.
- **Rules on Transportation (Part VI):** Fireworks are classified as Class 7 (Fireworks) hazardous explosives. They cannot be transported via public passenger transport, postal services, or standard commercial parcel couriers (e.g. Bluedart, Delhivery, India Post). Transportation requires licensed hazardous goods carriers with approved safety manifests and PESO transit permits.
- **Source Link:** [PESO Official Portal: Explosives Rules 2008](https://peso.gov.in/)

### 2.2 Supreme Court of India Orders (*Arjun Gopal & Others v. Union of India*)
- **Citation:** (2018) 13 SCC 523, reaffirmed in subsequent orders (2020, 2021, 2023).
- **Absolute E-Commerce Prohibition:** The Supreme Court ordered:
  > *"No e-commerce websites, including Flipkart, Amazon etc., shall accept any online orders and effect online sales. Any such e-commerce company found selling crackers online shall be hauled up for contempt of court and may also face monetary penalties."*
- **Ban on Series / Garland Crackers (Laddis):** The Supreme Court explicitly banned the manufacture and sale of joined crackers (laddis) on account of massive localized air and noise pollution.
- **Green Crackers Mandate:** Only crackers formulated by CSIR-NEERI (National Environmental Engineering Research Institute) carrying certified green logos and verifiable QR codes containing emission test data are legally permissible for manufacture and retail. Barium salts and toxic heavy metal formulations are prohibited nationwide.

### 2.3 Consumer Protection (E-Commerce) Rules, 2020
- **Statutory Mandate:** Applies to all electronic commerce entities operating in India.
- **Mandatory Disclosures:**
  1. Full legal name of the business entity, physical registered address, and valid trade contact phone/email.
  2. GSTIN (Goods and Services Tax Identification Number) and PAN details where applicable.
  3. Clear, itemized display of total price in Indian Rupees (INR) with tax breakdowns.
  4. Appointment and published details of a Grievance Officer, with a ticket acknowledgement timeframe of 48 hours and resolution within 1 month.
  5. Clear terms of refund, exchange, and cancellation.

### 2.4 Digital Personal Data Protection Act (DPDP Act), 2023
- **Data Minimisation:** The application must strictly collect only customer details essential for store pickup identification (Customer Name and 10-digit Mobile Number).
- **Purpose Limitation:** Customer numbers must never be repurposed, sold, or shared with third-party marketing brokers.
- **Age of Majority Requirement:** Under the Explosives Rules, fireworks cannot be sold or delivered to persons below 18 years of age. A clear self-attestation checkbox ("I confirm I am 18 years or older") is required prior to order or enquiry generation.

---

## 3. Critical Geographic Discrepancy on Supplied Artwork

The supplied Nagarjuna Traders poster bears the location:
`"Sivakasi, Andhra Pradesh"`

> [!WARNING] Geographic Anomaly
> Sivakasi is a historic industrial hub located in **Virudhunagar District, Tamil Nadu**, NOT Andhra Pradesh.
> 
> Potential explanations requiring owner verification:
> 1. The store is physically located in Andhra Pradesh (e.g., Vijayawada, Guntur, Tirupati) and purchases wholesale stock from Sivakasi, Tamil Nadu.
> 2. The store is physically in Sivakasi, Tamil Nadu, and the graphic designer mislabeled the state.
> 3. The business is an intermediary operating out of an unspecified location.
>
> **Action Required:** The business owner must present their actual physical store address, municipal trade license, and LE-5 retail explosive license before any commercial operations are published.

---

## 4. Analysis of Fulfilment & Sales Models

| Sales Model | Statutory Feasibility | Regulatory Constraints | System Recommendation |
|---|---|---|---|
| **Model 1: Online Commerce + Courier Delivery** | **ILLEGAL** | Violates Supreme Court e-commerce ban and Explosives courier transport restrictions. Violators face contempt and criminal prosecution under Section 9B of the Explosives Act. | **REJECTED / HARD-BLOCKED** |
| **Model 2: Online Token Advance + Counter Pickup** | **CONDITIONAL** | May be permissible ONLY IF: (a) Store has valid LE-5 retail license for the festival period, (b) Local DM / Police Commissioner permits advance token reservation, (c) Physical customer age verification (18+) occurs at billing counter. | **DEFERRED** (requires written verification of local permissions) |
| **Model 3: Digital Catalogue & Non-Binding Enquiry Generator** | **PERMITTED** | Operates purely as an informational digital flyer and price calculator. Generates a formatted enquiry summary for WhatsApp or counter consultation without taking online payments or forming a binding e-commerce contract. | **APPROVED DEFAULT** (`COMMERCE_CHECKOUT_ENABLED=false`) |

---

## 5. Mandatory Technical Gating & Safe Fallback

To ensure the technical implementation cannot be weaponized into an illegal e-commerce portal, the software architecture enforces:

```typescript
// Environment Configuration: wrangler.jsonc / .env
export const COMMERCE_CHECKOUT_ENABLED = false; // Hard-coded default
```

### When `COMMERCE_CHECKOUT_ENABLED === false`:
1. The "Proceed to Payment" / "Submit Order" button is replaced with "Generate Estimate Slip" / "Send WhatsApp Enquiry".
2. No payment gateways, VPAs, or bank accounts are queried or presented.
3. The cart calculates expected estimates (subtotal, approximate token deposit if visited in store), but issues a prominent legal disclaimer:
   > *"This website is an informational catalogue for Nagarjuna Traders. Online sale and door-to-door delivery of fireworks are strictly prohibited under Indian law. Please visit our licensed retail counter with valid government ID for in-person inspection and purchase."*
4. All garland cracker (Laddi) entries carry an alert advising on environmental bans.

---

## 6. Pre-Launch Legal Clearance Checklist

Before toggling `COMMERCE_CHECKOUT_ENABLED=true`, the following signed documentation must be uploaded to `docs/reference/legal/`:

- [ ] Valid LE-5 Firework Retail License copy issued by District Magistrate / Police Commissioner.
- [ ] Valid GSTIN registration certificate showing registered trade name and address.
- [ ] Written legal opinion confirming that physical counter collection of advance-reserved green crackers is compliant with local district circulars.
- [ ] Confirmation that all offered items are certified CSIR-NEERI green crackers with valid QR codes.
- [ ] Confirmation of store physical location resolving the "Sivakasi, Andhra Pradesh" discrepancy.
- [ ] Appointment of designated Grievance Officer with published email and phone.
