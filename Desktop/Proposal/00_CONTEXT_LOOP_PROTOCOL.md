# LeadFlow Proposal
## 00_CONTEXT_LOOP_PROTOCOL.md

---

# Purpose

This document serves as the universal execution protocol for the entire LeadFlow ecosystem. It defines the core cognitive framework and standard operating procedures that govern how AI agents think and execute tasks.

This protocol governs:
- Proposal generation
- Software development
- Product planning
- UI/UX design
- Documentation
- Quality Assurance (QA)
- Debugging
- Architecture reviews
- Automation workflows

Rather than defining *what* to build, this document defines *how* an AI agent must think, analyze, validate, and execute work throughout the lifecycle of the project.

---

# 1. System Boot Sequence

Every task execution thread must initialize by running the following boot checklist. Do not execute code modifications, content generation, or workspace changes before this sequence completes.

```
┌────────────────────────────────────────────────────────┐
│                   BOOT_SEQUENCE                        │
├────────────────────────────────────────────────────────┤
│ 1. Read Task Description                              │
│ 2. Scan Workspace Files (Active Context)              │
│ 3. Verify Constraints & Exclusions                    │
│ 4. Initialize Local Memory Registers                   │
│ 5. Map Dependencies & Target Paths                     │
└────────────────────────────────────────────────────────┘
```

- **[BOOT-01] Read Input:** Parse the request to extract the core objective, explicit constraints, and target deliverables.
- **[BOOT-02] Scan Context:** List and read all workspace files linked to the task. Never assume local state.
- **[BOOT-03] Identify Constraints:** Catalog what must **not** be done (e.g. banned tools, out-of-scope features, size limits).
- **[BOOT-04] Dependency Map:** Identify files that will be affected by changes to prevent broken links or broken imports.

---

# 2. Local State Registers

The AI Agent must maintain an internal state register throughout execution. If interrupted or when switching files, verify that this state is preserved:

* **REG_CURRENT_OBJECTIVE:** The exact outcome currently being pursued.
* **REG_ACTIVE_CONSTRAINTS:** Banned actions, language rules, or technical limits.
* **REG_COMPLETED_STEPS:** Chronological log of validated actions.
* **REG_PENDING_STEPS:** Remaining actions required for final delivery.
* **REG_LAST_VALIDATION:** Details of the most recent tests or lint checks.

---

# 3. Core Execution Loop

Tasks must be executed in iterative, atomic cycles. Never perform multi-step modifications without validation between steps.

```
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  ▼                                                  │
┌──────────────┐    ┌──────────────┐    ┌────────────┴─┐
│  Define Goal │───>│  Verify Plan │───>│ Atomic Edit  │
└──────────────┘    └──────────────┘    └────────────┬─┘
                                                     │
                                                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Transition  │<───│  Log State   │<───│ Validate Edit│
└──────────────┘    └──────────────┘    └──────────────┘
```

1. **Iterate:** Break the task into the smallest possible self-contained steps.
2. **Review:** Assess the plan against local constraints before making edits.
3. **Modify:** Execute the atomic change (file edit, file creation, command execution).
4. **Validate:** Test the output immediately (compile, lint, check visual flow, verify links).
5. **Freeze:** Commit or mark the step as complete only after validation passes.
6. **Loop:** Proceed to the next step.

---

# 4. Domain-Specific Protocols

Select and bind the appropriate execution rules based on the task domain.

## Protocol A: Proposal & Document Generation
- **Target:** Pitch decks, business proposals, specifications.
- **Rules:**
  * **Value-First:** Focus on business outcomes and metrics before explaining backend details.
  * **Storytelling Rhythm:** Alternate between context, visualization, and quantitative benefit.
  * **Skim-Friendly Layout:** Headlines, concise text blocks, and structured visual placeholders must explain the page in under 20 seconds.
  * **Format Limits:** No paragraph may exceed 3 lines. Keep headings clean and hierarchically strict.

## Protocol B: Software Development & Coding
- **Target:** Script writing, frontend/backend engineering, database configuration.
- **Rules:**
  * **No Premature Implementation:** Never write code before verifying existing imports, schemas, and dependencies.
  * **Type Strictness:** Enforce clean TypeScript/Type boundaries. Avoid arbitrary types.
  * **Atomic Edits:** Use narrow search-and-replace edits. Never replace entire files to make minor updates.
  * **Compilation Guard:** Every file modification must compile successfully without syntax or dependency errors.

## Protocol C: UI/UX & Layout Design
- **Target:** Visual layouts, stylesheets, mockup descriptions.
- **Rules:**
  * **Whitespace Design:** Whitespace must be treated as a functional component. Avoid visual crowding.
  * **Focal Point:** Every layout view must contain exactly one dominant focal point.
  * **Aesthetic Guard:** If a layout choice improves visual style but reduces readability or usability, prioritize clarity.
  * **Color Restraint:** Never use more than three accent colors in a single interface view.

## Protocol D: Debugging & Diagnostics
- **Target:** Crash resolution, logic errors, compile failures.
- **Rules:**
  * **State Reproduction:** Do not edit code before identifying the exact path, inputs, and state that caused the failure.
  * **Root Cause Focus:** Resolve the underlying structural bug rather than adding wrapper patches or conditional bypasses.
  * **Regression Testing:** Verify that fixing the bug does not break unrelated components.

## Protocol E: Documentation & Knowledge Bases
- **Target:** API references, user manuals, setup guides.
- **Rules:**
  * **No Hallucination:** Document only features, settings, and functions that exist in the active codebase or product reference.
  * **Instruction Clarity:** Write step-by-step procedures in the imperative active voice.
  * **Cross-Reference Safety:** Use absolute relative paths to verify all internal links are valid.

---

# 5. Blocker & Exception Handling

When execution encounters a failure (e.g. compile errors, permission denials, missing dependencies, or ambiguous instructions):

```
┌────────────────────────────────────────────────────────┐
│                   INTERRUPT_VECTOR                     │
├────────────────────────────────────────────────────────┤
│ 1. Halt active execution loop.                         │
│ 2. Capture and log exact error state / register dump.  │
│ 3. Rollback unvalidated workspace modifications.        │
│ 4. Formulate proposed solutions / alternative paths.   │
│ 5. Request explicit user decision / permission elevation.│
└────────────────────────────────────────────────────────┘
```

- **Rollback:** If an edit fails validation, restore the target file to the last frozen state.
- **Isolate:** Do not attempt to fix unrelated bugs while diagnostic routines are running.

---

# 6. Validation Gates

No task is complete until it passes the following diagnostic checks:

* **Gate 1: Link & Reference Check:** Verify that every file reference, code import, and markdown link resolves to a valid file path.
* **Gate 2: Constraint Audit:** Verify that no active constraints or banned patterns (e.g., promotional buzzwords, duplicate code blocks) have been introduced.
* **Gate 3: Standard compliance:** Verify compliance with the target domain protocols (e.g., maximum paragraph lengths, grid alignments).

---

# 7. Decision Log

Every task execution thread must maintain a local decision log. The AI agent is required to record the following information upon task completion:

- **Major decisions made:** Structural, architectural, or design choices finalized during the task.
- **Assumptions accepted:** Hypotheses or contextual constraints assumed to be true for execution.
- **Assumptions rejected:** Potential assumptions or design paths analyzed and intentionally discarded.
- **Files modified:** A list of all files created, modified, or deleted.
- **Trade-offs chosen:** Balanced selections made between speed, quality, simplicity, or performance.
- **Outstanding risks:** Identified limitations, technical debt, or potential downstream failures.

Future tasks and downstream execution threads must preserve these decisions. They cannot be modified or reversed unless an intentional revision is explicitly approved.

---

# 8. Exit & Completion Criteria

Signal execution completion only when:
1. All requested files have been updated and verified.
2. The workspace is free of temporary logs, scratch files, or locks.
3. Every check in Section 6 passes.
4. Deliverables are presented alongside:
   - File paths updated.
   - Summary of modification metrics.
   - Remaining roadmap items (if any).
   - The completed Decision Log (as defined in Section 7).

---
**CLP SYSTEM RUNNING [STATUS: ACTIVE]**
