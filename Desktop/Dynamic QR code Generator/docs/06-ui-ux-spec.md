# 06 — UI/UX Specification & Copywriting Master

> **Status:** Reconciled at Final Design Review (Gate 1.5). Implementation has NOT started.  
> **Aesthetic Standard:** Modern Swiss utility inspired by `ui-ux-pro-max` and `taste-skill`. Engineered for high-glare retail environments. Zero purple AI SaaS gradients.

---

## 1. Visual Design System & Design Tokens

### Token Definitions (Zinc Neutral Canvas)
```css
:root {
  /* Canvas */
  --bg-app: #fafafa;
  --bg-surface: #ffffff;
  --border-subtle: #e4e4e7;
  --border-strong: #a1a1aa;
  
  /* Text Contrast Hierarchy (WCAG AAA) */
  --text-primary: #09090b;   /* 14.8:1 contrast */
  --text-secondary: #52525b; /* 5.8:1 contrast */
  --text-muted: #71717a;
  
  /* Semantic Status Signals */
  --status-active: #059669;       /* Emerald-600 */
  --status-active-bg: #ecfdf5;
  --status-unactivated: #d97706;  /* Amber-600 */
  --status-unactivated-bg: #fffbeb;
  --status-disabled: #dc2626;     /* Red-600 */
  --status-disabled-bg: #fef2f2;
  
  /* Focus Rings */
  --ring-focus: #09090b;
}
```

### Typography Scale
- UI Body: `Inter`, system sans-serif (15px base, line-height 1.5).
- Identifiers & Codes: `Geist Mono` or `Consolas` with tabular numerals (`font-variant-numeric: tabular-nums`) and `0.06em` letter spacing.

---

## 2. Mobile Activation Screen Layout

```
+-------------------------------------------------+
|  [Status Pill: Unactivated Card]                |
|                                                 |
|  Activate Review Card                           |
|  Card ID: A7K92P4X8Q                            |
|                                                 |
|  Business Name                                  |
|  [ Apex Dental Studio                         ] |
|                                                 |
|  Google Review Link                             |
|  [ https://search.google.com/local/...        ] |
|  ℹ️ Accepts Google Maps, search, or g.page links|
|                                                 |
|  Activation Code                                |
|  [ K7XM - 92PR - L8Q2                         ] |
|  (Printed on back of physical card)             |
|                                                 |
|  [ Cloudflare Turnstile Challenge ]             |
|                                                 |
|  [   Activate Card Now   ->   ]                 |
|                                                 |
|  🔒 Permanent configuration. Free forever.      |
+-------------------------------------------------+
```

---

## 3. Copywriting Master (Verbatim Production Text)

### 3.1 Public Activation Screen
- **Title:** `Activate Your Review Card`
- **Subtitle:** `Set your business review link once. Your physical card will instantly direct customers to your Google review form.`
- **Business Name Label:** `Business Name`
- **Business Name Placeholder:** `e.g. Sunrise Bakery & Cafe`
- **Review Link Label:** `Google Review Link`
- **Review Link Placeholder:** `Paste your link from Google Maps or Business Profile`
- **Review Link Helper:** `Supports direct review links (search.google.com), Google Maps share links (maps.app.goo.gl), or short links (g.page/.../review).`
- **Activation Code Label:** `Activation Code`
- **Activation Code Placeholder:** `XXXX-XXXX-XXXX`
- **Submit Button:** `Activate Card Now`
- **Submitting State:** `Validating & Activating...`

### 3.2 Generic Public Error Messages (Zero Leakage)
- **Generic Activation Failure:**  
  *“Unable to activate card. Please check that your activation code matches the card and that you entered a valid Google Review link.”*
- **Already Active Notification:**  
  *“This card is already active. For security, activated cards cannot be modified through the public setup screen.”*
- **Invalid Card ID (404):**  
  *“Card not found. Please verify that you scanned an official review card.”*
- **Card Disabled:**  
  *“This review card is temporarily inactive. Please check back later.”*
- **Card Retired:**  
  *“This card has been retired from service.”*

### 3.3 Success Screen
- **Title:** `Card Successfully Activated`
- **Body:** `Your review card is now live. Whenever a customer taps or scans this card, they will immediately be directed to your Google review page.`
- **Action Button:** `Test Review Link ↗`

### 3.4 Ethical Guidance (Non-Gating Statement)
- Embedded footer note on activation:  
  *“In compliance with Google Business Profile terms, this card connects customers directly to Google's official review form without screening, filtering, or gating.”*
