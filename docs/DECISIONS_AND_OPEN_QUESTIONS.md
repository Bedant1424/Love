# Architecture Decisions & Open Questions

**Project:** Girlfriend Birthday Website  
**Focus:** Architectural Decision Records (ADRs), Risk Mitigations & User Input Reconciliation  
**Phase:** Specification Baseline (Updated with Contrast & Flow Corrections)  

---

## 1. Architectural Decision Records (ADRs)

### ADR-01: Framework & Bundler Selection (Repository Alignment)
- **Decision:** Build with **React 18.3.1**, **TypeScript 5.5.3**, **Tailwind CSS 3.4.1**, and **Vite 5.4.2**.
- **Rationale:** Strictly aligns with the existing repository configuration on `origin/main`. Avoids risky major version upgrades (React 19, Tailwind v4) that could cause plugin incompatibilities or build failures under a 24-hour deadline.

---

### ADR-02: Zero-Backend Static Architecture for GitHub Pages
- **Decision:** Architect the application entirely as a static client-side SPA hosted on GitHub Pages (`https://bedant1424.github.io/Love/`).
- **Rationale:**
  - The birthday is tomorrow; provisioning databases, authentication, or servers adds failure modes and maintenance burden.
  - A static SPA has zero server cost, near-zero latency worldwide via GitHub's CDN, and cannot crash under traffic.
  - All personal data is bundled into `src/data/content.ts`.

---

### ADR-03: Tap-to-Blow Primary Candle Extinguish Mechanism
- **Decision:** The primary candle extinguish mechanism is a direct touch/click on the candle flame. Microphone-based blow detection is strictly treated as an optional P2 progressive enhancement.
- **Rationale:**
  - Modern mobile browsers (particularly iOS Safari when opened from inside WhatsApp or iMessage in-app webviews) frequently block microphone permissions or display alarming security dialogs that interrupt the romantic atmosphere.
  - A responsive tap-to-blow gesture with realistic flame extinguish, rising smoke, sound chime, and confetti explosion is 100% reliable on every device.

---

### ADR-04: Strict Working P0 6-Chapter Flow
- **Decision:** Lock the launch-critical P0 flow as an exact 6-chapter sequence:
  ```
  Scene 1 (Greeting) → Scene 2 (Cake) → Scene 3 (Letter) → Scene 4 (Reasons) → Scene 5 (Gallery) → Scene 10 (Finale)
  ```
  Scene 5 has an explicit, visible primary button leading directly to Scene 10 (`"See Your Birthday Finale ✨"`).
- **Rationale:**
  - Guarantees zero dead ends, broken next buttons, or missing scene references.
  - Chapter progress bar displays `"Chapter X of 6"`, scaling only if optional P1/P2 scenes are activated.
  - Preserves original scene IDs (`Scene1Greeting`, `Scene2Cake`, `Scene3Letter`, `Scene4Reasons`, `Scene5Gallery`, `Scene10Finale`) for clean codebase organization.

---

### ADR-05: Git Safety & Remote Branch Ancestry
- **Decision:** Branch `feature/birthday-website-spec` directly from `origin/main` (`5992639`), bringing the documentation files over while preserving the initial local commit `675d1e7` on `docs/birthday-website-spec`.
- **Rationale:**
  - Guarantees complete commit ancestry with the remote repository.
  - Strictly avoids force-pushing, resetting, merging unverified histories, or discarding remote work.

---

### ADR-06: Mathematical Color Contrast & CTA Tokens
- **Decision:** Adjust primary CTA buttons to `#C2315D` (Berry Rose, **5.40:1** contrast with white) and `#7A4AC2` (Deep Lavender, **5.86:1** contrast with white). Pastel buttons (`#E85D83`, `#9F7AEA`) must use Dark Plum text (`#241530`, **5.16:1+** contrast).
- **Rationale:**
  - Corrects preliminary estimated figures where white on `#E85D83` (3.32:1) and white on `#9F7AEA` (3.26:1) failed WCAG AA normal text requirements.
  - Ensures 100% WCAG AA compliance across all light and dark scenes.

---

### ADR-07: Automated Predeploy Build Hook
- **Decision:** Configure `"predeploy": "npm run build"` in `package.json` scripts.
- **Rationale:**
  - `gh-pages -d dist` only pushes the contents of `dist/` and does not compile code on its own.
  - Adding the `predeploy` hook guarantees that running `npm run deploy` always compiles a fresh, typechecked production bundle before pushing to GitHub Pages.

---

## 2. User Input Reconciliation & Publication-Safe Fallbacks

The contradiction between candidate names ("Rose" / "Arya", "Bedant") and unconfirmed user inputs is formally resolved:
- **Unconfirmed Status:** All personal names, dates, letters, and memory captions are treated as **unconfirmed**.
- **Publication-Safe Defaults:** If the user deploys without customizing `content.ts`:
  - Recipient Name defaults to loving terms (e.g., *"Beautiful"*, *"My Love"*).
  - No raw brackets like `"[HER NAME]"` or `"[DATE]"` will appear in the UI.
  - Missing photos render charming illustrated SVG papercraft cards with heartfelt quotes.
  - Missing audio plays a bundled local acoustic chime or defaults cleanly to silence.

### Quick Confirmation Checklist (For Maximum Personalization):
1. **Preferred Recipient Name:** "Arya", "Rose", or custom?
2. **Exact Birthday Date & Timezone:** Target date for the countdown/birthday banner.
3. **Personal Photos:** 6 photos for the Polaroid gallery and 1 hero photo (placeholders provided).
4. **Love Letter Text:** Review and personalize the draft in `content.ts`.
5. **Background Music:** Preferred MP3 track or bundled acoustic piano chime.

---

## 3. Assumptions & Risk Matrix

| Risk / Assumption | Probability | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Asset 404s on GitHub Pages** | Low | Critical | `base: '/Love/'` strictly verified; hash-based routing prevents 404s on reload. |
| **Audio Blocked on iOS Safari** | High | Medium | Strictly gate audio initialization behind user tap on Scene 1 CTA; floating toggle. |
| **Missing Photos on Launch** | Medium | Low | Bundle high-quality romantic illustrated SVG fallbacks. |
| **Time Runs Short (<4 Hours)** | Medium | High | Hard launch gate: freeze scope, deploy P0 immediately. |
