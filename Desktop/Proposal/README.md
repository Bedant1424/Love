# LeadFlow Proposal Release Package

This repository contains the complete LeadFlow Software Proposal (v1.0) prepared for **Suryavanshi Finserv** and the underlying proposal generation framework (v1.1).

---

## Technical Specifications
* **Proposal Version:** v1.0 — FINAL
* **Framework Version:** v1.1
* **Target Client:** Suryavanshi Finserv
* **Primary Scope:** Cloud Recruitment Operations Platform (React + Supabase PWA)
* **Investment:** ₹25,000 fixed price (₹20,000 Development, ₹5,000 Setup & Deployment)

---

## Folder Structure

```
Proposal/
├── 00_CONTEXT_LOOP_PROTOCOL.md      # Cognitive protocol rules
├── 00_PROJECT_BRIEF.md              # Client requirements and scope
├── 01_BRAND_GUIDELINES.md           # Brand colors, typography, tagline
├── 02_DESIGN_SYSTEM.md              # Grid, margins, and spacing tokens
├── 03_PROPOSAL_STRUCTURE.md         # 17-page index & narrative arc
├── 04_CONTENT_STRATEGY.md           # Copywriting rules and vocabulary
├── 05_VISUAL_REQUIREMENTS.md        # Mockup and graphic briefs
├── 06_UI_MOCKUPS.md                 # UI mockups detail guides
├── 07_DIAGRAMS.md                   # Diagram structures and rules
├── 09_CHECKLIST.md                  # Release gate checklists
├── 10_CREATIVE_DIRECTION.md         # Storytelling rhythm guidelines
├── 11_PRODUCT_REFERENCE.md          # Technical specifications
├── 12_PAGE_GENERATION_RULES.md      # SVG builder layout parameters
├── CHANGELOG.md                     # History of framework and pages
├── README.md                        # Package documentation (this file)
├── FINAL_QA_REPORT.md               # RC-1 consolidated audit
├── FRAMEWORK_ALIGNMENT_REPORT.md    # Blueprint mismatch review
├── PROPOSAL_RECONCILIATION_REPORT.md# Outstanding defect registry
├── RELEASE_VALIDATION_REPORT.md     # Release gate validation checks
├── RELEASE_REPORT.md                # Final release summary
│
├── exports/                         # Compiled release package
│   ├── LeadFlow-Proposal-v1.0.pdf   # Main printable presentation PDF
│   ├── LeadFlow-Proposal-v1.0.pptx  # Editable vector PowerPoint presentation
│   │
│   ├── LeadFlow-Proposal-v1.0-svg/  # Optimized page SVGs (page01-page17)
│   │   ├── page01.svg
│   │   └── ...
│   │
│   └── LeadFlow-Proposal-v1.0-html/ # Interactive web-based presentation portal
│       ├── index.html               # Presentation viewer with keyboard navigation
│       ├── page01.html              # Individual HTML views
│       ├── page01.svg
│       └── ...
│
└── proposal/                        # Original source documents
    ├── components/                  # Reusable SVG layout components
    └── pages/                       # Raw source page markdown and SVGs
```

---

## Export Formats & Deliverables

The proposal is exported in four formats inside the `exports/` directory to suit different client needs:

1. **LeadFlow-Proposal-v1.0.pdf**
   * *Best For:* Printing, formal review, and direct email distribution.
   * *A4 Layout:* Fixed-layout PDF exported directly via PowerPoint COM automation preserving SVG vector properties.
2. **LeadFlow-Proposal-v1.0.pptx**
   * *Best For:* Live digital presentations and editing text or layouts.
   * *Vector Shapes:* Uses PowerPoint's native SVG rendering to retain infinite zoom capability without pixelation.
3. **LeadFlow-Proposal-v1.0-html/**
   * *Best For:* Quick interactive review in any standard browser.
   * *Viewer:* Contains `index.html`, which features a left-side table of contents, a slide viewer pane, and keyboard navigation (left/right arrows).
4. **LeadFlow-Proposal-v1.0-svg/**
   * *Best For:* Designers and engineers.
   * *Optimized:* Contains raw, UTF-8 encoded SVG pages with embedded styling, Poppins/Inter font-family mappings, and structured coordinates.

---

## Generation & Compilation Pipeline

The release package was built and compiled using the following automated workflow:

1. **Validation Check (`run_validation.py`):**
   * Checks that all 17 page directories exist.
   * Verifies that each contains a matching `.md` and `.svg`.
   * Parses all SVGs using XML parsers to confirm valid structure.
   * Confirms that no temporary compiler artifacts remain.
   * Checks that the component library is complete.
2. **Asset Compilation (`run_exports.py`):**
   * Creates the `exports/` subdirectory.
   * Copies raw SVGs to the `svg` and `html` exports folders.
   * Generates individual HTML page wraps and the main `index.html` navigation portal.
   * Automates PowerPoint via COM objects on Windows to create a new custom A4 presentation, insert each SVG page-by-page as a scalable vector graphic, save the `.pptx` presentation, and run PowerPoint's PDF layout exporter.
