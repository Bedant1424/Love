# Changelog: LeadFlow Proposal

All notable changes to the LeadFlow Software Proposal and its underlying framework will be documented in this file.

## [v1.0] - 2026-07-11
### Added
- **Release Package v1.0:** Generated the final production release deliverables inside the `exports/` directory, including unified A4 PDF, editable PowerPoint PPTX, interactive HTML presentation portal, and optimized raw page SVGs.
- **Payment Milestones (Page 12):** Added a structured implementation fee and payment schedule block (50% Upfront Commitment / 50% UAT & Go-Live).
- **Confidence Pillars Grid (Page 15):** Replaced the redundant operational comparison graphic with a clean 2x2 grid of detailed cards highlighting core advantages (Purpose-built, simple implementation, transparent pricing, partnership).
- **Proposal Narrative Arc:** Integrated a formal three-act layout summary into `03_PROPOSAL_STRUCTURE.md` representing the problem (Act I), solution (Act II), and decision/onboarding (Act III) progression.
- **Interactive Presentation Portal:** Created `index.html` in the HTML export directory with sidebar indexing and keyboard/click navigation for seamless review.

### Changed
- **Framework v1.1 Upgrades:** Successfully overhauled the framework files across three alignment batches:
  - Batch 1 (Design tokens): Standardized page margins (`42pt` margins, `511pt` width) and corner radii (`12pt` primary / `8pt` secondary cards) across brand guidelines and rules.
  - Batch 2 (Blueprints): Re-mapped narrative sequences and checklists in structure, content, and checklist documents to match actual approved page titles.
  - Batch 3 (Visual briefs): Pruned all 9 non-generated diagrams and obsolete mockup page mappings from visual briefs.
- **Page 12 Balance:** Adjusted visual caption positioning to `y=608` to frame the milestone cards, preserving the takeaway card at `y=640` without visual crowding.
- **Page 15 Balance:** Positioned visual caption at `y=568` to balance the new 2x2 pillars grid.

### Fixed
- **Narrative loops:** Removed redundant Excel-to-WhatsApp comparison blocks from Page 15.
- **Blueprint conflicts:** Resolved design token conflicts between the old design guidelines (web-based `64px` margins and `1200px` content width) and actual SVG output.
