# NAGARJUNA TRADERS — DESIGN SYSTEM SPECIFICATION

**Document Reference:** `docs/design-system.md`  
**Version:** 1.0.0  
**Design Philosophy:** Festive Indian Retail Authenticity + High-Performance Mobile Ergonomics  
**Informed By:** `leonxlnx/taste-skill` and `nextlevelbuilder/ui-ux-pro-max`

---

## 1. Color System & Design Tokens

The palette celebrates the joy of Diwali (sparks, diyas, marigold garlands) anchored by a deep night sky background that maximizes contrast, reduces OLED battery drain on mobile devices, and avoids generic AI-purple clichés.

### 1.1 Core Palette

```
+-----------------------------------------------------------------------------------+
|  BG Default     Surface Card    Primary Accent    Crimson Spark    Pure Ivory     |
|   #0F0E13         #1A1822          #FF8800           #E63946         #F9FAFB      |
|  (Night Sky)    (Obsidian)       (Marigold)       (Firecracker)    (Body Text)    |
+-----------------------------------------------------------------------------------+
```

| Token Name | Hex Code | Tailwind Class | Contrast Ratio vs BG | Purpose / Usage |
|---|---|---|:---:|---|
| `--color-bg-base` | `#0F0E13` | `bg-[#0F0E13]` | N/A | Global body and page background. |
| `--color-bg-surface` | `#1A1822` | `bg-[#1A1822]` | 1.3:1 | Primary card containers, modals, and sheets. |
| `--color-bg-elevated` | `#242130` | `bg-[#242130]` | 1.8:1 | Dropdowns, hover states, input backgrounds. |
| `--color-primary` | `#FF8800` | `bg-amber-500` / `#FF8800` | 8.2:1 (with black text) | Primary interactive actions, active pills, highlights. |
| `--color-primary-hover`| `#E67A00` | `hover:bg-[#E67A00]` | 7.6:1 | Hover state for primary CTAs. |
| `--color-accent` | `#E63946` | `text-[#E63946]` | 5.1:1 | Festival badges, special sparkler badges, alerts. |
| `--color-text-primary`| `#F9FAFB` | `text-gray-50` | 17.5:1 | High-contrast headlines, product titles, prices. |
| `--color-text-muted` | `#9CA3AF` | `text-gray-400` | 6.8:1 | Pack specifications, descriptions, helper copy. |
| `--color-border-subtle`| `rgba(255,255,255,0.08)` | `border-white/10` | N/A | Crisp component borders, card outlines. |
| `--color-border-focus` | `#FF8800` | `focus:border-[#FF8800]`| N/A | Focus outline for accessible keyboard navigation. |

### 1.2 Semantic Status Tokens (Order & Payment States)

All status tokens are paired with high-contrast text and explicit icon glyphs to guarantee accessibility without relying on color perception alone.

| State | Background Tint | Border Color | Text Color | Icon / Glyph |
|---|---|---|---|:---:|
| **Submitted / Unpaid** | `bg-gray-800/60` | `border-gray-700` | `text-gray-300` | ○ (Clock) |
| **Payment Pending** | `bg-amber-950/40` | `border-amber-600/50`| `text-amber-400` | ⏳ (Hourglass) |
| **Verified Token** | `bg-blue-950/40` | `border-blue-600/50` | `text-blue-400` | ◈ (Shield Check) |
| **Confirmed / Ready** | `bg-emerald-950/40` | `border-emerald-600/50`| `text-emerald-400` | ✓ (Check Circle) |
| **Completed** | `bg-teal-950/40` | `border-teal-600/50` | `text-teal-300` | ★ (Solid Star) |
| **Cancelled / Failed**| `bg-rose-950/40` | `border-rose-600/50` | `text-rose-400` | ✕ (Cross) |

---

## 2. Typography Hierarchy

- **Headline Font:** `Outfit`, sans-serif (Geometric, warm, celebratory, highly legible at large scales).
- **Body Font:** `Inter` or `system-ui`, sans-serif (Neutral, ultra-clear at 14px–16px across Android and iOS).
- **Tabular / Monospace Font:** `JetBrains Mono` or `ui-monospace` (Strictly used for order numbers, UTRs, and paise calculations to ensure column number alignment).

```css
/* CSS Token Mapping */
--font-display: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Type Scale

| Level | Size / Line-Height | Tracking | Font Weight | Usage |
|---|---|---|---|---|
| **Display Hero** | `32px / 1.1` (`md: 44px`) | `-0.02em` | Bold (`700`) | Home page main banner. |
| **Heading 1** | `24px / 1.2` (`md: 32px`) | `-0.015em`| SemiBold (`600`) | Category titles, modal headers. |
| **Heading 2** | `18px / 1.3` (`md: 20px`) | `-0.01em` | SemiBold (`600`) | Product names, section dividers. |
| **Body Large** | `16px / 1.5` | `normal` | Regular (`400`) | Primary body copy, input fields. |
| **Body Small** | `14px / 1.4` | `normal` | Regular (`400`) | Pack specifications, cart summaries. |
| **Microcopy** | `12px / 1.3` | `+0.01em` | Medium (`500`) | Badges, legal disclaimers, helper text. |
| **Price Hero** | `20px / 1.0` (`md: 24px`) | `-0.02em` | Bold (`700`, Mono) | Product card selling prices. |

---

## 3. Spacing, Elevation & Layout Mechanics

### 3.1 Spatial Grid (4px Base Scale)
- `space-1`: `4px`
- `space-2`: `8px`
- `space-3`: `12px`
- `space-4`: `16px` (Standard mobile screen gutter)
- `space-6`: `24px`
- `space-8`: `32px` (Section separation)
- `space-12`: `48px`

### 3.2 Responsive Container Breakpoints
- **Mobile Compact:** `360px` – `414px` (`w-full px-4`)
- **Tablet:** `768px` (`max-w-2xl mx-auto px-6`)
- **Desktop:** `1024px` – `1280px` (`max-w-7xl mx-auto px-8`)

### 3.3 Elevation & Surface Strategy
Following the Taste Skill anti-slop mandate: **Zero blurry black drop shadows.**
- Base Cards: `1px solid rgba(255, 255, 255, 0.08)` on `#1A1822`.
- Active / Elevated: `1px solid rgba(255, 136, 0, 0.3)` on `#242130` with `box-shadow: 0 4px 16px -2px rgba(0,0,0,0.5)`.

---

## 4. Component Library & Interactive Patterns

### 4.1 Buttons

```html
<!-- Primary Action (48px Height, Minimum Touch Compliant) -->
<button class="h-12 px-6 rounded-xl bg-[#FF8800] hover:bg-[#E67A00] text-black font-semibold text-base transition-transform active:scale-[0.98] flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#FF8800] focus:ring-offset-2 focus:ring-offset-[#0F0E13]">
  <span>Add to Cart</span>
</button>
```

- **Minimum Size:** `48px` height for all mobile CTAs (surpassing 44×44px requirement).
- **Tactile Push:** `active:scale-[0.98]` applied to all buttons.
- **CTA Wrap Ban:** `whitespace-nowrap` enforced. Labels kept concise (max 3 words).

### 4.2 Product Catalogue Card

```
+-----------------------------------------------------------+
| [Category Badge: SKYSHOTS]                  [STOCK: OK]   |
|                                                           |
| Skyshot - Bigboss (3 pcs)                                 |
| Aerial pipe shells with crackling burst                   |
|                                                           |
| ₹350                       [ - ]  [ 1 ]  [ + ]            |
| (35,000 paise)             48px touch stepper             |
+-----------------------------------------------------------+
```

- **Variant Selector:** Interactive segmented pill control (`h-10`) allowing immediate switching between sizes (e.g. `Medium: ₹150` vs `Large: ₹200`).
- **Quantity Stepper:** Heavyweight `+` and `-` buttons with `48×48px` tap targets. Direct keyboard input supported on the numeric input (`JetBrains Mono`).

### 4.3 Form Inputs

- **Label Placement:** Strictly above inputs (`block text-sm font-medium text-gray-300 mb-1.5`).
- **Touch Targets:** Input height `h-12` (48px).
- **Validation:** Instant inline error rendering below input (`text-xs text-rose-400 mt-1 flex items-center gap-1`).
- **No Floating Labels / No Placeholder-as-Label:** Inputs have clear static labels and distinct helper examples.

### 4.4 Mobile Floating Cart Bar

On mobile screens (`< 768px`), a fixed bottom glass bar (`h-16`) docks to the bottom viewport:
- Left: Item count and total in ₹ (e.g., `4 Items • ₹1,240.00`).
- Right: Primary CTA button (`View Cart & Book` or `Review Estimate`).
- Ensures zero layout shift and high checkout discoverability.

### 4.5 Portfolio Demo Banner & Simulated Modal Tokens

- **Portfolio Demo Banner:**
  - Background: `bg-amber-950/40 border border-amber-800/40`
  - Text: `text-xs text-amber-200` with bold headline: *"Portfolio Demo Only. No real orders, fireworks sales, delivery, or payments are processed."*
- **Fixed ₹100 Token Badge:**
  - Token amount: `10000` integer paise (`₹100.00`).
  - Visual: `px-1.5 py-0.5 rounded bg-amber-500/10 text-festive-amber border border-amber-500/20`.
- **Simulated Payment Gateway Modal:**
  - Backdrop: `bg-black/70 backdrop-blur-sm fixed inset-0 z-50`.
  - Pending State: Spin animation on amber circle with explanatory guidance.
  - Test Success CTA: `bg-emerald-600 hover:bg-emerald-500 text-white font-semibold`.
  - Test Failure CTA: `bg-red-950/60 hover:bg-red-900/60 text-red-200 border border-red-800/50`.
- **Demo Order Confirmation Card:**
  - Success Icon: 64px emerald circle with white checkmark.
  - Reference Badge: `DEMO-NT-XXXX` formatted in bold monospace.
  - One-click copy summary button and start new order action.

---

## 5. Accessibility & Inclusivity Invariants

1. **Color Contrast:** All body text meets WCAG AA 4.5:1 minimum; all large display text meets 3:1 minimum.
2. **Focus Visibility:** Standard `focus-visible:ring-2 focus-visible:ring-[#FF8800] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0E13]` on all interactives.
3. **Screen Readers:** ARIA labels on all quantity steppers (`aria-label="Increase quantity of Skyshot Bigboss"`, `aria-live="polite"` on cart balance totals).
4. **Motion Restraint:** All transitions degrade to `transition: none` and static layout when `@media (prefers-reduced-motion: reduce)` is enabled.

