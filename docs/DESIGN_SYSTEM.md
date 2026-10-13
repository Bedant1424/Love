# Design System Specification

**Project:** Girlfriend Birthday Website  
**Design Identity:** Romantic Lavender & Blush Papercraft  
**Aesthetic Family:** Tactile Greeting Card, Polaroid Scrapbook & Restrained Midnight Plum Reveal  
**Stack Baseline:** Tailwind CSS 3.4.1 (PostCSS)  
**Core Design Dials:**  
- `DESIGN_VARIANCE: 8` (Organic, tilted scrapbook angles, whimsical hand-drawn accents)  
- `MOTION_INTENSITY: 6` (Physical spring unfolding, candle extinguishing, paper reveals)  
- `VISUAL_DENSITY: 3` (Airy, generous whitespace, relaxed mobile pacing)  

---

## 1. Color System & Semantic Tokens

The color palette blends soft pastel romance with warm paper surfaces for comfortable reading, reserving deep midnight plum for dramatic emotional moments (the cake cutting and grand finale).

### 1.1 Color Palette Values

| Token Name | Hex Code | HSL Value | Primary Role |
| :--- | :--- | :--- | :--- |
| **lavender-50** | `#F7F4FD` | `260, 60%, 97%` | Lightest lavender background tint |
| **lavender-100** | `#EFE9FA` | `262, 58%, 95%` | Subtle card borders & soft fills |
| **lavender-200** | `#DFD2F5` | `261, 59%, 89%` | Interactive hover & secondary badge fills |
| **lavender-400** | `#B799E6` | `262, 60%, 75%` | Decorative dividers & ribbon accents |
| **lavender-500** | `#9F7AEA` | `259, 72%, 70%` | Brand pastel lavender (requires dark text for AA) |
| **lavender-CTA** | `#7A4AC2` | `264, 49%, 53%` | **High-contrast lavender button (5.86:1 with white text)** |
| **lavender-800** | `#523685` | `261, 42%, 37%` | High-contrast lavender headings on light surfaces |
| **rose-50** | `#FFF5F7` | `348, 100%, 98%` | Soft blush background highlight |
| **rose-100** | `#FFE6EC` | `346, 100%, 95%` | Heart badges & envelope flap lining |
| **rose-300** | `#F9A8BD` | `345, 87%, 82%` | Soft pink cards & decorative borders |
| **rose-500** | `#E85D83` | `344, 73%, 64%` | Brand pastel rose (requires dark text for AA) |
| **rose-CTA** | `#C2315D` | `342, 60%, 48%` | **High-contrast rose button (5.40:1 with white text)** |
| **cream-50** | `#FAF7F2` | `38, 43%, 96%` | Warm paper & love letter reading surface |
| **cream-100** | `#F3ECE2` | `37, 41%, 92%` | Polaroid photo border & envelope exterior |
| **plum-900** | `#241530` | `274, 39%, 14%` | Cinematic midnight atmosphere surface |
| **plum-950** | `#160B1F` | `272, 48%, 8%` | Deepest cinematic darkness |
| **gold-400** | `#FCD34D` | `45, 96%, 65%` | Candle flame glow & gold star confetti |
| **gold-500** | `#F59E0B` | `38, 92%, 50%` | Wax seal highlight & star ratings |
| **neutral-800** | `#2D2635` | `268, 17%, 18%` | Primary high-contrast body text on cream/light |
| **neutral-500** | `#736882` | `266, 11%, 46%` | Muted secondary captions & timestamp text |

---

### 1.2 Mathematical WCAG 2.1 AA Contrast Verification Table

All values below were empirically calculated using the WCAG relative luminance formula `(L1 + 0.05) / (L2 + 0.05)`:

| Foreground (Text) | Background (Surface) | Measured Ratio | WCAG AA Threshold | Compliance Verdict |
| :--- | :--- | :---: | :---: | :--- |
| **White (`#FFFFFF`)** | **`rose-CTA` (`#C2315D`)** | **5.40 : 1** | 4.5 : 1 | ✅ **PASSES AA (Primary Button)** |
| **White (`#FFFFFF`)** | **`lavender-CTA` (`#7A4AC2`)** | **5.86 : 1** | 4.5 : 1 | ✅ **PASSES AA (Secondary Button)** |
| **Dark Plum (`#241530`)** | **`rose-500` (`#E85D83`)** | **5.16 : 1** | 4.5 : 1 | ✅ **PASSES AA (Pastel Rose)** |
| **Dark Plum (`#241530`)** | **`lavender-500` (`#9F7AEA`)** | **5.26 : 1** | 4.5 : 1 | ✅ **PASSES AA (Pastel Lavender)** |
| **`neutral-800` (`#2D2635`)** | **`cream-50` (`#FAF7F2`)** | **13.64 : 1** | 4.5 : 1 | ✅ **PASSES AAA (Body on Parchment)** |
| **`neutral-500` (`#736882`)** | **`cream-50` (`#FAF7F2`)** | **4.87 : 1** | 4.5 : 1 | ✅ **PASSES AA (Muted Captions)** |
| **`lavender-800` (`#523685`)** | **White (`#FFFFFF`)** | **9.44 : 1** | 4.5 : 1 | ✅ **PASSES AAA (Headings on White)** |
| **`cream-50` (`#FAF7F2`)** | **`plum-950` (`#160B1F`)** | **17.84 : 1** | 4.5 : 1 | ✅ **PASSES AAA (Cinematic Title)** |
| **`lavender-200` (`#DFD2F5`)** | **`plum-950` (`#160B1F`)** | **13.32 : 1** | 4.5 : 1 | ✅ **PASSES AAA (Cinematic Subtitle)** |
| *White (`#FFFFFF`)* | *`rose-500` (`#E85D83`)* | *3.32 : 1* | 4.5 : 1 | ❌ *FAILS AA — Banned on small text* |
| *White (`#FFFFFF`)* | *`lavender-500` (`#9F7AEA`)* | *3.26 : 1* | 4.5 : 1 | ❌ *FAILS AA — Banned on small text* |

> **Design System Rule:**
> - When using white text on action buttons, ALWAYS use `rose-CTA` (`#C2315D`) or `lavender-CTA` (`#7A4AC2`).
> - When using soft pastel backgrounds (`#E85D83`, `#9F7AEA`), ALWAYS pair with dark text (`#241530`).

---

### 1.3 Semantic Theme Variables (CSS Custom Properties)

```css
:root {
  /* Surface colors */
  --surface-base: #FAF7F2;          /* Warm cream main background */
  --surface-card: #FFFFFF;          /* Pure paper white card */
  --surface-paper: #FDFBF7;         /* Love letter parchment */
  --surface-muted: #EFE9FA;         /* Soft lavender accent surface */
  
  /* Text colors */
  --text-primary: #2D2635;         /* Deep warm plum (13.6:1 contrast on cream) */
  --text-secondary: #736882;       /* Medium muted lavender-slate (4.87:1 contrast) */
  --text-accent: #C2315D;          /* Deep rose for emotional highlight words */
  
  /* Interactive & Accessible CTAs */
  --cta-primary: #C2315D;          /* Berry Rose button (5.4:1 with white text) */
  --cta-primary-hover: #AB2B52;
  --cta-secondary: #7A4AC2;        /* Deep Lavender button (5.86:1 with white text) */
  --cta-secondary-hover: #683BA8;
  --accent-gold: #F59E0B;          /* Wax seal & candle accents */
  
  /* Borders & Shadows */
  --border-subtle: rgba(159, 122, 234, 0.18);
  --border-paper: rgba(223, 210, 245, 0.4);
  --shadow-polaroid: 0 8px 24px -4px rgba(45, 38, 53, 0.12), 0 2px 6px -1px rgba(45, 38, 53, 0.06);
  --shadow-card: 0 10px 25px -5px rgba(159, 122, 234, 0.15);
  --shadow-floating: 0 20px 35px -8px rgba(45, 38, 53, 0.22);
}

/* Cinematic Dark Mode (Scene 2 Cake Moment & Scene 10 Grand Finale) */
[data-theme="cinematic"] {
  --surface-base: #160B1F;          /* Midnight plum background */
  --surface-card: #241530;          /* Raised plum card */
  --surface-paper: #2F1C3F;         /* Elevated stage container */
  --surface-muted: #3D2552;         
  
  --text-primary: #FAF7F2;         /* Warm cream text on dark (17.84:1 contrast) */
  --text-secondary: #DFD2F5;       /* Soft lavender secondary text (13.32:1 contrast) */
  --text-accent: #FFD166;          /* Warm candlelight gold */
  
  --border-subtle: rgba(223, 210, 245, 0.22);
  --shadow-polaroid: 0 12px 30px -4px rgba(0, 0, 0, 0.5);
  --shadow-card: 0 12px 30px -4px rgba(0, 0, 0, 0.4);
}
```

---

## 2. Typography System

The typography creates a warm, handwritten, romantic tone for display headings while maintaining crisp, effortless legibility for body text and personal messages.

### 2.1 Font Families & Roles
1. **Display Heading Font:**
   - **Primary:** `Pacifico`, cursive / `Playfair Display`, serif
   - **Role:** Hero greetings, romantic titles, chapter headings.
   - **Fallback Stack:** `'Pacifico', 'Caveat', 'Playfair Display', Georgia, serif`
2. **Body & Interface Font:**
   - **Primary:** `Quicksand`, sans-serif
   - **Role:** Body copy, love letter text, Polaroid captions, quiz options, UI labels.
   - **Fallback Stack:** `'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
3. **Handwritten Signature Font:**
   - **Primary:** `Caveat`, cursive
   - **Role:** Love letter sign-off, personal notes, coupon signatures.
   - **Fallback Stack:** `'Caveat', 'Brush Script MT', cursive`

### 2.2 Typographic Hierarchy Scale

| Level | Size (Mobile / Desktop) | Line Height | Tracking | Weight | Role & Application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | `2.5rem (40px)` / `3.75rem (60px)` | `1.15` (reserve `pb-1`) | `-0.02em` | 700 / Bold | Opening greeting & Scene 10 climax title |
| **Heading 1 (H1)**| `2.0rem (32px)` / `2.75rem (44px)` | `1.2` | `-0.01em` | 600 / SemiBold | Major scene titles ("The Birthday Moment") |
| **Heading 2 (H2)**| `1.5rem (24px)` / `1.875rem (30px)` | `1.3` | `normal` | 600 / SemiBold | Card titles, letter greeting, modal headers |
| **Heading 3 (H3)**| `1.25rem (20px)` / `1.375rem (22px)` | `1.35` | `normal` | 600 / SemiBold | Polaroid titles, quiz questions, gift titles |
| **Body Large** | `1.125rem (18px)` / `1.25rem (20px)` | `1.6` | `normal` | 500 / Medium | Love letter paragraph text |
| **Body Regular**| `1.0rem (16px)` / `1.0rem (16px)` | `1.55` | `normal` | 400 / Regular | Reasons why cards, descriptions, instructions |
| **Caption / Meta**| `0.875rem (14px)` / `0.875rem (14px)`| `1.4` | `+0.01em` | 500 / Medium | Polaroid dates, progress counters, coupon terms |

> **Typographic Guardrails:**
> - Never use uppercase shouting (`UPPERCASE`) for headings or badges.
> - Descender clearance: All cursive headings containing descenders (`y`, `g`, `p`, `q`, `j`) must specify `leading-[1.15]` or greater with `pb-1` reserve padding to prevent clipped tails on mobile devices.
> - Maximum line measure capped at `65ch` for comfortable reading.

---

## 3. Spacing, Radii, Shadows & Border Guidelines

### 3.1 Spacing Scale (8pt Grid with 4pt Micro-steps)
- `space-1`: `4px` (micro badges, inline icon spacing)
- `space-2`: `8px` (button padding small, tag margins)
- `space-3`: `12px` (card internal element spacing)
- `space-4`: `16px` (mobile viewport edge padding, standard gutter)
- `space-6`: `24px` (card internal padding, stack spacing)
- `space-8`: `32px` (section separators, modal internal padding)
- `space-12`: `48px` (scene transitions, hero vertical spacing)
- `space-16`: `64px` (major desktop section gaps)

### 3.2 Border Radius Scale
- `rounded-sm`: `6px` (tags, small badges)
- `rounded-md`: `12px` (gift lid edges, photo frames)
- `rounded-lg`: `18px` (interactive cards, love letter parchment)
- `rounded-xl`: `24px` (main scene containers, modal dialogs)
- `rounded-full`: `9999px` (buttons, avatar frames, wax seals, floating sound button)

---

## 4. Component Design Specifications

### 4.1 Buttons & Call to Actions (CTAs)
- **Primary CTA ("Begin Story", "Blow Candle", "See Finale"):**
  - Background: `bg-rose-CTA` (`#C2315D`) or accessible gradient to `lavender-CTA` (`#7A4AC2`).
  - Text: High-contrast white (`text-white font-semibold text-lg`). Contrast ratio **5.40 : 1** (WCAG AA compliant).
  - Height & Padding: `h-14 px-8 rounded-full shadow-lg`.
  - Tap / Hover Feedback: Scale up slightly on hover (`scale-105`), scale down on tap (`scale-95`).
- **Secondary CTA ("Fold Letter", "Skip"):**
  - Background: Clean white with lavender border (`bg-white/90 border border-lavender-200 text-neutral-800`).
  - Height: `h-11 px-5 rounded-full`.
- **Floating Audio Controller:**
  - Position: Fixed top-right (`top-4 right-4 z-50`).
  - Size: `44x44px` circular glass button with music note / speaker icon and gentle pulse animation when playing.

### 4.2 Interactive Birthday Cake Component
- Three Tiers: Bottom tier (`width: 220px`, blush pink), middle tier (`width: 175px`, soft lavender), top tier (`width: 130px`, warm vanilla cream with strawberry drip icing).
- Golden candle standing `40px` tall with animated flickering SVG flame.
- Extinguish state: Flame smoothly scales to 0 over 150ms; animated SVG smoke particle curls upward; canvas confetti fires.

### 4.3 3D Love Letter Envelope
- Front body: Lavender-rose textured surface with angled pocket.
- Triangular Flap: Positioned at top, folded downward over pocket with golden wax seal button.
- Seal tap executes `transform: rotateX(180deg)` over 500ms; folded letter slides upward `translateY(-60px)` and expands into readable modal.

### 4.4 Polaroid Scrapbook Cards & Illustrated Fallbacks
- White photo paper container (`bg-white shadow-polaroid p-3 pb-8 rounded-sm`).
- Organic tilt angles (Card 1: `-2.5deg`, Card 2: `+3deg`, Card 3: `-1.5deg`, Card 4: `+2deg`).
- Washi tape decorative graphic at top edge.
- **Local Fallback Card:** If an image fails to load or is not provided, renders an elegant pastel SVG papercraft illustration (birthday cake, heart cluster, starry night) with caption, never a broken image icon.

---

## 5. Animation & Reduced-Motion Specifications

- Transitions use physical springs (`stiffness: 260, damping: 20`).
- When `prefers-reduced-motion: reduce` is detected:
  - Disable all 3D rotations, floating particle loops, and translation slides.
  - Replace scene transitions with an instant 150ms opacity cross-fade.
  - Disable continuous confetti loops.
