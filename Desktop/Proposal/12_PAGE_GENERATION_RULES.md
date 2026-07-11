# LeadFlow Proposal
## 12_PAGE_GENERATION_RULES.md

---

# Purpose

This document defines the standard operating procedure for generating every page of the LeadFlow proposal.

It is intended exclusively for the AI generating the proposal.

It does not define product requirements, design, branding, or proposal content.

Instead, it defines the workflow that must be followed before, during, and after generating every proposal page.

The objective is to ensure that every page is consistent, high quality, and aligned with the Proposal Framework.

---

# Proposal Framework

Before generating any page, read and understand every framework document.

The framework consists of:

- 00_PROJECT_BRIEF.md
- 01_BRAND_GUIDELINES.md
- 02_DESIGN_SYSTEM.md
- 03_PROPOSAL_STRUCTURE.md
- 04_CONTENT_STRATEGY.md
- 05_VISUAL_REQUIREMENTS.md
- 06_UI_MOCKUPS.md
- 07_DIAGRAMS.md
- 09_CHECKLIST.md
- 10_CREATIVE_DIRECTION.md
- 11_PRODUCT_REFERENCE.md

Never generate a page without first referencing the complete framework.

---

# One Page At A Time

Generate only one proposal page.

Never generate multiple pages in one response.

Stop after completing the requested page.

Wait for approval before continuing.

---

# Understand The Story

Before generating a page, determine:

- What happened on the previous page.
- What this page should accomplish.
- What question this page answers.
- What curiosity it should create for the next page.

Every page must naturally connect to the next.

---

# One Objective Per Page

Every page should communicate one primary idea.

Do not combine unrelated concepts.

If additional information is useful, move it to another page.

---

# Standard Page Structure

Every page should follow this structure.

1. Page Title

2. Supporting Introduction

3. Primary Content

4. Visual Placeholder

5. Key Takeaway

Maintain this structure throughout the proposal.

---

# Content Generation Rules

Use business language.

Write for decision-makers.

Explain value before technology.

Prefer clarity over cleverness.

Avoid unnecessary technical detail.

Do not repeat information already explained on previous pages.

---

# Visual Rules

Every page should contain one dominant visual.

Examples:

- Dashboard mockup
- Workflow
- Timeline
- Comparison
- Diagram
- Cards

Do not place multiple competing visuals on one page.

---

# Writing Rules

Paragraphs

Maximum three lines.

Sentences

Short and direct.

Avoid repetition.

Avoid filler.

Avoid generic AI wording.

Every sentence should contribute to the page objective.

---

# Layout Rules

Respect the LeadFlow Design System and the Component Library under `proposal/components/`.

Maintain:

- Margins (42pt left, 553pt right)
- Typography (Poppins for headings, Inter for body and labels)
- White space (8pt spacing system)
- Card styles (White, 12pt corner radius for primary panels rx="12", 8pt corner radius for secondary cards rx="8", Slate 200 border, soft shadow)
- Icon usage (Monochrome LeadFlow Blue Lucide-style SVG paths)
- Color palette (LeadFlow Blue primary, neutral Slate backgrounds)
- Visual hierarchy

### Component Library Integration:
Every future proposal page must reuse the master components defined in `proposal/components/` instead of recreating them from scratch:
- `header.svg`: Page headers (brand and section metadata)
- `footer.svg`: Centered confidential notice and page index
- `section_header.svg`: Section hero headers (title and subtitle)
- `takeaway.svg`: Highlighted callout takeaways at the bottom of the page
- `icon_card.svg`: Unified grid layouts (both 2-column value grids and 3-column challenge grids)
- `workflow_card.svg`: Vertical workflow step indicators
- `metric_card.svg`: Business impact indicators
- `comparison_layout.svg`: Parallel workflow comparisons

### Reusable Takeaway Sizing Formula:
The Takeaway component height must be calculated dynamically based on the text layout to ensure it does not overflow or clip:
- Formula: `cardHeight = max(minHeight, textHeight + topPadding + bottomPadding)`
- Standards: `minHeight = 64pt`, `topPadding = 16pt`, `bottomPadding = 16pt`
- Adjust the `y` coordinate of the component to preserve the minimum `32pt` footer safe area above the footer at `y=822` (maximum y-coordinate of the card bottom is `y=790`).
- Layout Positions:
  - Pages 02–11 (Standard): Use `y="722"` (for 64pt height) or adjust up (`y="710"` for 80pt, `y="694"` for 96pt) to protect the footer.
  - Pages 12–17 (Extended content area): Takeaways are positioned at `y="640"` to accommodate taller visual content blocks above them.

---

# Product Rules

All product descriptions must follow:

11_PRODUCT_REFERENCE.md

Do not invent features.

Do not promise roadmap items.

Do not contradict the defined product scope.

---

# Creative Rules

Every page must follow:

10_CREATIVE_DIRECTION.md

Maintain:

- Premium SaaS presentation
- Executive readability
- Calm visual rhythm
- Professional tone
- Consistent storytelling

---

# Proposal Rules

Follow:

03_PROPOSAL_STRUCTURE.md

Do not:

- Skip pages
- Merge unrelated pages
- Change page order
- Add additional proposal sections

---

# Visual Placeholders

Do not generate actual visuals.

Instead include placeholders.

Example:

[Visual Placeholder]

Manager Dashboard Mockup

Purpose:

Show the manager's overview with KPIs, batch summary, analytics, and recent activity.

This placeholder will later be replaced with a finalized mockup.

---

# Internal Self Review

After generating a page, perform a silent review.

Verify:

✓ Correct objective

✓ Correct page order

✓ No duplicated information

✓ Business language

✓ One dominant visual

✓ Consistent terminology

✓ Premium tone

✓ Product accuracy

✓ Proposal consistency

If any issue is found, revise the page before presenting it.

---

# Output Format

Every generated page should contain:

Page Number

Page Title

Page Objective

Page Content

Visual Placeholder

Key Takeaway

Design Notes (optional)

---

# Stop Rule

After generating the page:

Stop.

Do not generate the next page.

Wait for user approval.

---

# Hallucination Prevention

Never invent:

- Features
- Screens
- Technologies
- Pricing
- Workflows
- Statistics
- Business claims

If information is unavailable, remain consistent with the existing Proposal Framework.

---

# Final Principle

Quality is more important than speed.

It is better to produce one exceptional proposal page than several average ones.

Every page should feel like it belongs to the same premium SaaS presentation and should move the client one step closer to approving the project.
