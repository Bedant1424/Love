# NAGARJUNA TRADERS: UPI PAYMENTS RESEARCH & ARCHITECTURE

**Document Reference:** `docs/payments-research.md`  
**Status:** Evaluation & Security Specification  
**External Repository Dependency:** Outstanding (Owner has not yet supplied the open-source UPI GitHub URL)  
**Currency:** Indian Rupee (INR), Internal Computation in Paise  
**Operating Mode:** Default Enquiry / Manual Verification Fallback

---

## 1. External Repository Dependency Status

As noted in Section 10 of the master prompt:
> *"The business owner intends to provide a GitHub repository for an open-source UPI payment project. If the URL is not yet available, record it as an outstanding dependency. Do not fabricate a repository or claim to have tested it."*

**Status:** **PENDING SUPPLY BY OWNER**  
No open-source repository URL has been provided to date. Consequently, no external repository code has been cloned, tested, or executed. This document provides an objective evaluation of UPI integration architectures, security standards, and failure handling patterns.

---

## 2. Technical Evaluation of UPI Payment Mechanisms

### 2.1 The UPI Ecosystem Reality: Intent vs Verification

In the National Payments Corporation of India (NPCI) Unified Payments Interface (UPI) ecosystem, there is a fundamental difference between **initiating** a payment and **verifying** a payment.

```
+-----------------------------------------------------------------------------------+
| UPI Deep Link / QR Code:                                                          |
| upi://pay?pa=store@bank&pn=NagarjunaTraders&am=500.00&tr=NT1001&tn=Order%20NT1001 |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
                             [Customer's UPI App]
                                         │
                             Money moves at NPCI/Bank
                                         │
                        ┌────────────────┴────────────────┐
                        ▼                                 ▼
              [Customer Mobile Screen]        [Merchant Bank Account]
              Shows "Payment Successful"      Receives credit & UTR
                        │                                 │
           DOES NOT NOTIFY WEB BROWSER!       DOES NOT PING CLOUDFLARE!
                        │                                 │
                        ▼                                 ▼
          Browser returns with ZERO proof     Store owner gets SMS alert
```

> [!IMPORTANT] Core Security Rule
> A browser redirect, URL parameter (`?status=success`), customer-supplied screenshot, or local button click **is NEVER proof of payment**. Without a cryptographically signed server webhook from an authorized payment aggregator or direct banking API, the web server cannot authenticate that funds were deposited.

---

## 3. Comparative Evaluation of Payment Options

### Option A: Authorized Merchant Payment Aggregator (Recommended for Automation)
*Examples:* Cashfree Payments, Razorpay, PhonePe PG, Decentro.

- **How it works:** Customer pays via gateway-hosted checkout or seamless UPI intent. The aggregator verifies the bank credit and sends an HTTP POST webhook to Cloudflare Worker with an `X-Webhook-Signature` (HMAC-SHA256).
- **Merchant Prerequisites:** Valid business registration (Sole Proprietorship / Partnership), GSTIN, active current bank account, KYC onboarding.
- **Transaction Costs (MDR):** 
  - Standard UPI (P2M): 0% MDR under Government of India / RBI guidelines for standard debit UPI.
  - Payment Aggregator platform / SaaS maintenance fee: Typically ₹0 recurring, small fee on credit cards/netbanking if enabled.
- **Automated Verification:** 100% server-authoritative. Server verifies signature, validates amount, checks order state, and automatically moves order to `CONFIRMED`.
- **Refund Capabilities:** Fully supported via automated API.

### Option B: Manual UPI QR + UTR Verification (Zero Cost, No Onboarding Overhead)
*Examples:* Store static BharatQR or dynamic QR encoded with order note.

- **How it works:**
  1. Application generates dynamic UPI link / QR code containing store VPA (`pa=...`), exact token amount in ₹ (`am=...`), and unique order transaction note (`tn=NT-2026-XXXX`).
  2. Customer authorizes payment in their UPI app (PhonePe, GPay, Paytm).
  3. Customer copies the 12-digit numeric **UTR (Unique Transaction Reference)** / Bank Reference Number from their receipt into the website.
  4. Server stores UTR with status `PENDING_VERIFICATION`.
  5. Store operator opens private Admin Panel, compares submitted UTR with their bank statement / SMS credit alerts, and clicks "Verify Token Payment".
- **Merchant Prerequisites:** Standard bank account or merchant VPA. Zero gateway contracts needed.
- **Transaction Costs:** ₹0.00.
- **Limitations:** Requires manual human attention at peak festival hours. Susceptible to typo errors or fraudulent reference submissions until verified by staff.

### Option C: Enquiry-Only Mode (Zero Risk, Mandatory Initial Default)
- **How it works:** No financial transactions are attempted online. Website acts as a product booking estimate sheet. Customer generates order summary and visits counter to pay in cash or card at pickup.
- **Prerequisites:** None.
- **Costs:** ₹0.00.
- **Risk Level:** Zero financial, legal, or compliance exposure.

---

## 4. Payment Security & Fraud Prevention Specifications

If Option B (Manual UTR Verification) or Option A (Gateway Webhook) is deployed, the server enforces:

### 4.1 Anti-Fraud Invariants
1. **UTR Global Uniqueness Constraint:** The database enforces a `UNIQUE(payment_reference)` index across all payments. A UTR cannot be submitted twice for different orders.
2. **Strict Currency & Integer Validation:** Payments must be strictly recorded in paise. Any mismatch between expected token amount and recorded transaction amount prevents automatic or manual closure without supervisor override.
3. **Idempotent Webhook Processing:** Webhooks process an `idempotency_key` (Event ID). Duplicate incoming delivery attempts return HTTP 200 without double-crediting the balance.
4. **Signature Verification (Option A):** Webhook signatures are computed via `crypto.subtle.importKey` using the pre-shared secret and compared with constant-time equality check (`timingSafeEqual`) to prevent timing side-channel attacks.
5. **No Fake Success Displays:** The customer UI explicitly states:
   > *"Payment Reference Received. Your payment is currently under verification by our counter team. Your order reference is NOT confirmed until verified."*

---

## 5. Decision & Recommendation Matrix

| Attribute | Option A (Merchant Gateway) | Option B (Manual UTR Verification) | Option C (Enquiry Only) |
|---|---|---|---|
| **Software Cost** | ₹0 setup | ₹0 setup | ₹0 |
| **Transaction Fees** | 0% UPI | 0% UPI | ₹0 |
| **Merchant KYC Required** | Yes (GST, Current A/c) | No (Uses existing UPI VPA) | None |
| **Server Verification** | Real-time Webhook | Operator Bank Verification | None (Counter) |
| **Legal Risk for Fireworks** | High (Gateway T&Cs often ban explosives) | Low (No direct online capture) | Zero (Informational) |
| **Recommendation** | **Explore for Post-Legal Phase** | **Approved Fallback for Booking** | **Mandatory Default Now** |

> [!TIP] Gateway Policy Risk
> Most mainstream Indian payment aggregators (Razorpay, Cashfree, Stripe India) explicitly list **"Fireworks, Explosives, and Hazardous Chemicals"** on their Prohibited Business Categories list under RBI risk guidelines. Attempting to run fireworks transactions through standard gateway accounts without special written underwriting will lead to immediate account freezing and fund holding.
> 
> Therefore, **Option B (Manual UTR Verification for Counter Pickup)** or **Option C (Enquiry-Only)** are the only practically viable paths for Nagarjuna Traders.
