# NAGARJUNA TRADERS — DESIGN REVIEW & SKILL SYNTHESIS

**Document Reference:** `docs/design-review.md`  
**Review Date:** October 2026  
**Primary Visual Source:** Supplied Diwali Poster Artwork (`docs/reference/nagarjuna-traders-catalog.jpg`)  
**Skills Loaded & Applied:**
1. `leonxlnx/taste-skill` (Alias: `design-taste-frontend`, Taste Skill)
2. `nextlevelbuilder/ui-ux-pro-max` (UI UX Pro Max Skill)

---

## 1. Skill Verification & Ingestion Record

As mandated by Section 3 of the master prompt, both design skills were discovered, retrieved, and thoroughly evaluated via the Antigravity `ui-skills` registry:

### 1.1 Taste Skill Ingestion
- **Registry Slug:** `leonxlnx/taste-skill`
- **Skill Version / Title:** `design-taste-frontend` (Anti-Slop Frontend Skill)
- **Core Directives Applied:**
  - Brief Inference & Design Read protocol.
  - Configuration of the Three Dials (`DESIGN_VARIANCE`, `MOTION_INTENSITY`, `VISUAL_DENSITY`).
  - Strict Anti-Default rules: Explicit ban on generic AI-purple glow, centered hero over dark mesh, generic card containers, unmotivated motion, wrapped CTAs, and beige/brass/espresso slop.
  - Layout discipline: Single-line navigation at desktop, hero within initial viewport (max 2 lines headline, max 20 words subtext), max 1 eyebrow per 3 sections, single locked theme palette.

### 1.2 UI UX Pro Max Skill Ingestion
- **Registry Slug:** `nextlevelbuilder/ui-ux-pro-max`
- **Domain Specialization:** UI/UX Design Intelligence & Rigorous Interaction Mechanics
- **Core Directives Applied:**
  - Priority 1: WCAG 2.2 AA Accessibility (minimum contrast 4.5:1, non-color status indicators, screen reader aria attributes).
  - Priority 2: Touch & Ergonomics (minimum 44×44px touch targets, 8px spacing, tactile `:active` state feedback).
  - Priority 3: Performance (zero CLS < 0.1, skeleton loading states, lightweight SVG icons, no layout thrashing).
  - Priority 5: Mobile-first responsive hierarchy (explicit fallback < 768px, bottom navigation / floating cart action).
  - Priority 8: Forms & Progressive Disclosure (labels strictly above inputs, inline validation near field, no placeholder-as-label).

---

## 2. Brief Inference: The "Design Read"

Following Section 0.B of the Taste Skill:

> **Official Design Read:**  
> *"Reading this as: Festive retail e-commerce catalogue for budget-conscious Indian mobile shoppers, with an authentic, celebratory Diwali retail language, leaning toward a high-contrast dark festive theme (Deep Charcoal `#0F0E13` + Warm Marigold `#FF8800` + Crimson Spark `#E63946`), clean geometric sans typography, zero AI gradient slop, and rock-solid 44px+ mobile touch ergonomics."*

---

## 3. Configuration of the Three Dials

Based on the retail nature, festive context, and mobile-first constraint, the three global design dials are calibrated as follows:

| Dial | Calibration (1–10) | Concrete Project Implementation |
|---|:---:|---|
| **`DESIGN_VARIANCE`** | **5** | **Structured Festive Retail:** Clean, predictable grid hierarchy that allows shoppers to rapidly compare prices and variant sizes without chaotic artistic asymmetry, while avoiding cookie-cutter generic SaaS card templates. |
| **`MOTION_INTENSITY`** | **3** | **Purposeful Micro-Interactions:** Subtle, battery-efficient transitions. Instant tactile feedback on button push (`active:scale-[0.98]`), smooth cart drawer slide, and layout animations for variant toggling. Zero heavy 3D canvases, no scroll-hijacking, fully disabled under `prefers-reduced-motion`. |
| **`VISUAL_DENSITY`** | **6** | **High-Efficiency Catalogue:** Retail shoppers need to scan items, prices, and quantities quickly. Product cards are compact, information-dense, and cleanly separated by subtle borders (`border-white/10`) rather than floating bloated cards with deep muddy drop shadows. |

---

## 4. Synthesis & Conflict Resolution Between Skills

| Design Tension | Taste Skill Directive | UI UX Pro Max Directive | Synthesized Decision for Nagarjuna Traders |
|---|---|---|---|
| **Card Styling & Elevation** | Ban generic cards with heavy drop shadows; prefer `border-t`, `divide-y`, or negative space. | Clear visual container grouping to define tap target bounds on mobile screens. | **Subtle Framed Containers:** Cards use high-contrast dark slate surface (`#1A1822`) with crisp hairline borders (`1px solid rgba(255,255,255,0.08)`) and zero blurry drop shadows. Borders highlight on active tap. |
| **Typography & Festivity** | Ban generic serif defaults ("creative brief = serif is an AI tell"). Use high-grade sans display or authentic brand typography. | Base body size ≥ 16px, line-height 1.5, strict readability across low-cost mobile displays. | **Modern Sans with Festive Warmth:** Headlines in **Outfit** or **Plus Jakarta Sans** (clean, open, festive geometry). Body in **Inter** / system sans (rock-solid rendering on Android Chrome). No decorative calligraphic serifs that blur on low-DPI mobile screens. |
| **Festive Colors vs Anti-Slop** | Ban "AI-purple gradient" and ban beige/brass cookware slop. Lock 1 dominant accent. | Semantic color tokens for states (Success green, Error red, Warning yellow) with 4.5:1 contrast. | **Warm Marigold & Charcoal Lock:** Deep night background (`#0F0E13`), surface (`#1A1822`), Primary Accent = Festive Marigold (`#FF8800`), Secondary Highlight = Crimson Spark (`#E63946`). Semantic tokens (Success `#10B981`, Error `#EF4444`) strictly reserved for form feedback and order states. |
| **Quantity Stepper Ergonomics** | Keep micro-interactions tactile and restrained. | Minimum touch targets 44×44px; prevent accidental multi-taps. | **48×48px Stepper Buttons:** Quantity `-` and `+` touch areas are explicitly padded to 48×48px with physical haptic-style depression (`scale-[0.97]`). Text input allows direct typing or tap adjustments. |

---

## 5. Anti-Default Discipline Checklist

The design system enforces these specific anti-patterns from both skills:

- [x] **No AI-Purple Meshes:** Zero neon purple or blue gradients. Background is authentic festive deep charcoal with warm golden-amber lighting.
- [x] **Hero Viewport Discipline:** Customer home hero occupies < 65vh on mobile, ensuring product categories are visible above or immediately upon initial scroll. Headline max 2 lines, subtext < 20 words.
- [x] **No Wrapped Buttons:** CTA buttons ("View Cart", "Select Variant", "Send Enquiry") have explicit `whitespace-nowrap` and concise labels.
- [x] **Max 1 Eyebrow per 3 Sections:** Eyebrows (e.g. `DIWALI 2026 CATALOGUE`) are used sparingly on the hero and suppressed across standard product category rows.
- [x] **Zero Div-Based Fake Screenshots:** No mock UI divs pretending to be products. Cards use real poster references and clean typography.
- [x] **Tactile Feedback:** Every button and selector has an explicit `:active` state.
- [x] **Sticky Bottom Cart Bar:** Floating bottom sheet on mobile provides instant visibility of cart count, subtotal in ₹, and quick checkout action without hiding catalogue content.
