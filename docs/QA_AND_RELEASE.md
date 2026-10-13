# Quality Assurance (QA) & Release Playbook

**Project:** Girlfriend Birthday Website  
**Target Recipient:** Arya / Rose (Handled with publication-safe fallbacks)  
**Live Target URL:** `https://bedant1424.github.io/Love/`  
**Quality Philosophy:** Zero Crashing Bugs, High Emotional Warmth, Flawless Mobile Ergonomics  

---

## 1. Build Verification & Pre-Flight Commands

Before any deployment or user review, the project must pass strict command-line verifications:

```bash
# 1. Typecheck: Ensure strict TypeScript compilation with zero errors
npm run typecheck
# (Maps to: tsc --noEmit -p tsconfig.app.json)

# 2. Production Build: Compile optimized bundles with Vite
npm run build
# (Maps to: vite build)

# 3. Local Production Preview: Audit production bundle locally
npm run preview
# (Opens local server serving dist/ build)

# 4. Deploy to GitHub Pages (Automated via predeploy in Milestone 1):
npm run deploy
# (In Milestone 1, predeploy hook executes "npm run build" THEN "gh-pages -d dist")
# (Manual fallback before Milestone 1: npm run build && npm run deploy)
```

### Pre-Flight Criteria
- [ ] Build completes with exit code 0.
- [ ] No TypeScript warnings or `any` type violations.
- [ ] Total JavaScript bundle size < 250KB gzipped.
- [ ] No absolute path references (`/assets/...`) that break on subpath hosting (`/Love/`).
- [ ] Predeploy script is configured in Milestone 1 so `npm run deploy` automatically builds `dist/`.

---

## 2. Functional Test Matrix (P0 Core Flow)

| ID | Test Scenario | Expected Outcome | Priority |
| :--- | :--- | :--- | :--- |
| **FT-01** | **Scene 1 (Greeting):** Initial page load | Hero displays romantic greeting; ambient hearts float gently; audio does NOT play automatically (autoplay policy). | P0 |
| **FT-02** | **Scene 1 (Greeting):** Tap "Begin Our Story" | Sound effect chimes; background music initializes smoothly; view transitions to Scene 2. | P0 |
| **FT-03** | **Audio Controller:** Floating toggle tap | Tapping speaker icon pauses music; icon switches to muted; tapping again resumes smoothly without audio pops. | P0 |
| **FT-04** | **Scene 2 (Cake):** Background transition | Screen smoothly darkens into midnight plum atmosphere (`#160B1F`) over 800ms. | P0 |
| **FT-05** | **Scene 2 (Cake):** Candle extinguish tap | Tapping candle flame immediately turns flame off, releases smoke particle, plays puff sound, triggers confetti explosion, and reveals post-extinguish copy. | P0 |
| **FT-06** | **Scene 2 (Cake):** Advance button | "Open Your Birthday Letter" button pulses and unlocks only after candle is extinguished. | P0 |
| **FT-07** | **Scene 3 (Envelope):** Wax seal tap | Envelope triangular flap executes 3D flip (`rotateX: 180deg`); folded parchment slides out and expands into readable modal. | P0 |
| **FT-08** | **Scene 3 (Letter):** Reading legibility | Parchment modal displays high-contrast dark text (`#2D2635` on `#FAF7F2`, 13.64:1 contrast); internal scroll works smoothly on mobile. | P0 |
| **FT-09** | **Scene 4 (Reasons):** Card interactions | Tapping any of the 6 compliment cards reveals the memory back; counter updates ("6 of 6 reasons discovered"). | P0 |
| **FT-10** | **Scene 5 (Polaroids):** Lightbox opening | Tapping any tilted Polaroid opens high-res lightbox with dim backdrop, memory caption, and date pill. | P0 |
| **FT-11** | **Scene 5 (Polaroids):** Direct P0 Exit | Action button reads "See Your Birthday Finale ✨" and clicking navigates directly to Scene 10 (no dead ends). | P0 |
| **FT-12** | **Progress Bar:** Display in P0 | Displays "Chapter X of 6" across the active scenes; no ghost references to missing Scenes 6–9. | P0 |
| **FT-13** | **Media Fallback:** Missing photo test | When image files are missing, component renders charming SVG papercraft card without broken image icons. | P0 |
| **FT-14** | **Media Fallback:** Missing audio test | When MP3 file is missing, player falls back to bundled acoustic chime or disables cleanly without console errors. | P0 |
| **FT-15** | **Content Fallback:** No bracket strings | UI is audited to guarantee zero literal bracket strings like `"[HER NAME]"` or `"[DATE]"` appear. | P0 |
| **FT-16** | **Scene 10 (Finale):** Climax & Replay | Grand celebratory confetti shower fires; hero photo renders cleanly; clicking "Replay" scrolls smoothly back to Scene 1. | P0 |

---

## 3. Responsive & Device Verification Matrix

| Viewport / Device | Width & Height | Critical Checkpoints | Target Status |
| :--- | :--- | :--- | :--- |
| **iPhone SE / Small Phone** | `320px x 568px` | Zero horizontal scroll; cake scales down cleanly without overflowing; love letter font remains readable (≥16px); touch buttons remain ≥44px tall. | MUST PASS |
| **iPhone 14/15/16 Pro** | `393px x 852px` | Primary target viewport. Full cake renders centered; 2-column Polaroid grid displays with organic tilt; dynamic island chrome causes no layout jumping (`100dvh`). | MUST PASS |
| **Android Flagship** (Pixel / Galaxy) | `412px x 915px` | Chrome mobile address bar retracts smoothly without content popping; WebAudio plays cleanly without stutter. | MUST PASS |
| **iPad / Tablet** | `768px x 1024px` | Content stays comfortably centered in maximum readable column (`max-w-xl`); 3-column Polaroid gallery. | MUST PASS |
| **Desktop / Laptop** | `1440px x 900px` | Centered narrative container (`max-w-2xl mx-auto`); mouse hover states active on cards and buttons. | MUST PASS |

---

## 4. Accessibility (WCAG 2.1 AA) Recalculated Audit

1. **Color Contrast Verification:**
   - Body text on cream parchment: `#2D2635` on `#FAF7F2` -> Ratio **13.64:1** (WCAG AAA Pass).
   - Headings on lavender tint: `#523685` on `#F7F4FD` -> Ratio **9.44:1** (WCAG AAA Pass).
   - Primary Rose CTA: `#FFFFFF` on `#C2315D` -> Ratio **5.40:1** (WCAG AA Pass).
   - Primary Lavender CTA: `#FFFFFF` on `#7A4AC2` -> Ratio **5.86:1** (WCAG AA Pass).
   - Dark text on pastel buttons: `#241530` on `#E85D83` -> Ratio **5.16:1** (WCAG AA Pass).
   - Cinematic text on midnight plum: `#FAF7F2` on `#160B1F` -> Ratio **17.84:1** (WCAG AAA Pass).
2. **Keyboard Navigation:**
   - All interactive elements (`<button>`, `<a>`) reachable via `Tab` key with visible focus ring.
   - Lightbox traps keyboard focus; `Escape` key closes modal; `ArrowLeft`/`ArrowRight` cycles photos.
3. **Reduced Motion Audit:**
   - When `prefers-reduced-motion: reduce` is enabled, all 3D rotations, continuous particle loops, and translation slides are disabled.

---

## 5. Live Deployment Smoke Test Checklist

Once deployed to `https://bedant1424.github.io/Love/`:

- [ ] **URL Accessibility:** Page loads at `https://bedant1424.github.io/Love/` with HTTPS green lock.
- [ ] **Base Path Integrity:** No 404 errors in browser console for CSS, JS, audio, or images.
- [ ] **Direct Reload Check:** Refreshing the page while on `#scene-3` does NOT trigger a GitHub 404 error.
- [ ] **Predeploy Build Verification:** `dist/` contains freshly compiled assets from the latest commit.
- [ ] **Audio Playback:** Tapping "Begin Our Story" starts the music stream without errors.
- [ ] **Candle Blow:** Flame extinguishes on mobile touch; confetti fires smoothly.
- [ ] **Letter Legibility:** The love letter is fully readable and formatted properly.
- [ ] **Direct Scene 5 → Scene 10 Route:** Clicking "See Your Birthday Finale ✨" in Scene 5 opens Scene 10 directly.
