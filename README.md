# Project: Girlfriend Birthday Website (Project Rose Arya) 🌸💕

A personalized, mobile-first, romantic birthday website for Arya / Rose, crafted with lavender and blush-pink design tokens, warm cream reading parchment, restrained midnight-plum cinematic reveals, tactile physical interactions, and heartfelt memories.

Hosted statically on GitHub Pages: [https://bedant1424.github.io/Love/](https://bedant1424.github.io/Love/)

---

## 📚 Project Documentation Suite

This repository is currently in the **Documentation-First Specification Phase**. Implementation will begin upon approval of this specification suite.

All architecture, product requirements, design tokens, interaction mechanics, and release playbooks are documented in the [`docs/`](file:///c:/Users/17042/Desktop/ROSE%20Arya/docs) directory on branch `feature/birthday-website-spec`:

1. **[`docs/INVESTIGATION.md`](file:///c:/Users/17042/Desktop/ROSE%20Arya/docs/INVESTIGATION.md)**  
   *Empirical Git state & ancestry audit, reference video audit, UI skills inspection, public research benchmarks, and verified WCAG contrast recalculations.*
2. **[`docs/PRD.md`](file:///c:/Users/17042/Desktop/ROSE%20Arya/docs/PRD.md)**  
   *Product Requirements Document: Goals, audience persona, exact working 6-chapter P0 flow, direct Scene 5 to Scene 10 route, dynamic progress counter, NFRs, and acceptance criteria.*
3. **[`docs/DESIGN_SYSTEM.md`](file:///c:/Users/17042/Desktop/ROSE%20Arya/docs/DESIGN_SYSTEM.md)**  
   *Romantic Lavender & Blush Papercraft design system: Semantic color tokens (`lavender`, `rose`, `cream`, `midnight plum`), mathematically recalculated WCAG AA contrast standards (Berry Rose `#C2315D` at 5.4:1), typography hierarchy (`Pacifico`, `Quicksand`, `Caveat`), descender clearance rules, and SVG fallback cards.*
4. **[`docs/REFERENCE_ANALYSIS.md`](file:///c:/Users/17042/Desktop/ROSE%20Arya/docs/REFERENCE_ANALYSIS.md)**  
   *Analysis of 4 starting reference archetypes (Cinematic, Lavender, Animated Cake, Soft Pink Card) with evidence vs. recommendations vs. new ideas, plus 5 verified interactive benchmarks.*
5. **[`docs/COPYWRITING_AND_CONTENT.md`](file:///c:/Users/17042/Desktop/ROSE%20Arya/docs/COPYWRITING_AND_CONTENT.md)**  
   *Scene-by-scene romantic copy, publication-safe defaults, zero raw bracket text in UI, SVG memory card fallbacks, and typed `content.ts` data schema.*
6. **[`docs/INTERACTION_SPEC.md`](file:///c:/Users/17042/Desktop/ROSE%20Arya/docs/INTERACTION_SPEC.md)**  
   *Navigation state machines, user-gesture audio autoplay policy, tap-to-blow candle extinguish mechanics, 3D envelope opening, Polaroid lightboxes, reduced-motion fallbacks, and preserved original Scene IDs.*
7. **[`docs/ARCHITECTURE.md`](file:///c:/Users/17042/Desktop/ROSE%20Arya/docs/ARCHITECTURE.md)**  
   *Technical architecture aligned with repository baseline (React 18.3.1 + Tailwind 3.4.1 + Vite 5.4.2), predeploy build hook configuration, and GitHub Pages (`base: '/Love/'`) routing constraints.*
8. **[`docs/IMPLEMENTATION_PLAN.md`](file:///c:/Users/17042/Desktop/ROSE%20Arya/docs/IMPLEMENTATION_PLAN.md)**  
   *24-hour delivery schedule divided into 4 sequential milestones, task breakdowns, dependency graph, and explicit launch cutoffs.*
9. **[`docs/QA_AND_RELEASE.md`](file:///c:/Users/17042/Desktop/ROSE%20Arya/docs/QA_AND_RELEASE.md)**  
   *QA Playbook: Pre-flight build commands, functional test matrix (FT-01 through FT-16), mobile responsive tests (320px–430px), accessibility audit, in-app webview checks, and final release checklist.*
10. **[`docs/DECISIONS_AND_OPEN_QUESTIONS.md`](file:///c:/Users/17042/Desktop/ROSE%20Arya/docs/DECISIONS_AND_OPEN_QUESTIONS.md)**  
    *Architectural Decision Records (ADR-01 to ADR-07), risk mitigations, and user input reconciliation.*
11. **[`docs/DOCUMENTATION_REVIEW.md`](file:///c:/Users/17042/Desktop/ROSE%20Arya/docs/DOCUMENTATION_REVIEW.md)**  
    *Cross-document consistency audit confirming 100% requirement alignment, empirical command evidence, and zero contradictions.*

---

## 🎯 The Working P0 Launch Flow (6 Active Chapters)

The launch-critical experience is locked into an exact 6-chapter sequence:
```
Scene 1 (Greeting) → Scene 2 (Cake) → Scene 3 (Letter) → Scene 4 (Reasons) → Scene 5 (Gallery) → Scene 10 (Finale)
```

- **Scene 1 (Opening Greeting):** Personal greeting, floating hearts, start button.
- **Scene 2 (Birthday Moment & Cake):** Midnight plum atmosphere, layered cake, tap-to-blow candle, confetti explosion.
- **Scene 3 (The Love Letter):** 3D folding envelope with wax seal, readable parchment modal.
- **Scene 4 (Reasons I Love You):** Interactive deck of 6 heart-badged compliment cards.
- **Scene 5 (Memories Gallery):** Polaroid scrapbook with organic tilts, accessible lightbox, and direct primary action `"See Your Birthday Finale ✨"` leading directly to Scene 10.
- **Scene 10 (Grand Finale & Reveal):** Hero photo frame, emotional declaration, celebratory confetti fireworks, and a non-destructive `"Replay Our Story 🔄"` action.
- **Global:** User-gesture background audio controller with mute toggle, chapter progress bar (`Chapter X of 6`), and GitHub Pages deployment.

*Optional enhancements (Scene 6 Timeline, Scene 8 Gifts, Scene 7 Quiz, Scene 9 Coupons) remain modular and can be enabled without breaking the core flow.*

---

## 🚀 Future Implementation Workflow

Once this documentation is approved:
1. Work on branch `feature/birthday-website-spec` (rooted in `origin/main`).
2. Install exact dependencies: `react: ^18.3.1`, `tailwindcss: ^3.4.1`, `vite: ^5.4.2`, `motion: ^11.11.17`, `canvas-confetti: ^1.9.4`.
3. Implement components following [`docs/ARCHITECTURE.md`](file:///c:/Users/17042/Desktop/ROSE%20Arya/docs/ARCHITECTURE.md).
4. Run verification tests per [`docs/QA_AND_RELEASE.md`](file:///c:/Users/17042/Desktop/ROSE%20Arya/docs/QA_AND_RELEASE.md).
5. Add `"predeploy": "npm run build"` to `package.json` during Milestone 1, then deploy to GitHub Pages via `npm run deploy`.
