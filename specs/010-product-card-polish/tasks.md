# Tasks: Product Card Layout Polish

**Input**: Design documents from `/specs/010-product-card-polish/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No test framework exists in this project. No tests requested. All validation is manual via the browser.

**Organization**: Tasks are grouped by user story. This feature is a pure CSS/layout change to a single file (`src/components/product-card.tsx`). No setup or foundational phases needed — the project and component already exist.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: User Story 1 — Consistent Price Alignment (Priority: P1) 🎯 MVP

**Goal**: All product card prices appear at the same vertical position across a grid row, regardless of varying text content (subtitle, brand, name length).

**Independent Test**: Search for "tomaten" — all prices in each row should be at the same height. Compare cards with subtitles/brands to cards without.

### Implementation for User Story 1

- [X] T001 [US1] Add `mt-auto` bottom-anchor wrapper `<div>` around the price display and badges sections in `src/components/product-card.tsx` — this wrapper pushes price + badges to the card bottom
- [X] T002 [US1] Remove `mt-auto` from the badges container (currently on the `flex flex-wrap gap-1` div) in `src/components/product-card.tsx` — the new wrapper now handles bottom-anchoring
- [X] T003 [US1] Adjust `mb-*` margin classes on the unit quantity `<p>`, price `<div>`, and badges `<div>` in `src/components/product-card.tsx` to balance spacing within the new structure
- [ ] T004 [US1] Manual validation: search "tomaten" — verify prices in each row are vertically aligned across cards with varying text content (some have subtitles, brands, highlights; some do not)
- [ ] T005 [US1] Manual validation: search "roomboter" — verify the "Opnieuw bestellen" re-order section cards also have consistent price alignment
- [ ] T006 [US1] Manual validation: resize browser across breakpoints (2-col mobile → 5-col desktop) — verify price alignment holds at all grid widths

**Checkpoint**: Price alignment is consistent. All prices in a row appear at the same height. This is the MVP.

---

## Phase 2: User Story 2 — Visual Polish (Priority: P2)

**Goal**: Product cards have balanced spacing and a clean, polished appearance. No cramped or overly sparse areas.

**Independent Test**: View search results and verify balanced spacing between image, text, price, and badges. Cards should look clean and well-structured.

### Implementation for User Story 2

- [X] T007 [US2] Review and standardize spacing rhythm in the text content area (subtitle, name, brand row, unit quantity) in `src/components/product-card.tsx` — already consistent (`mb-0.5` throughout text elements)
- [X] T008 [US2] Ensure adequate spacing between the price display and badges within the bottom-anchor wrapper in `src/components/product-card.tsx` — `mt-2` for price, `mt-1.5` for badges
- [ ] T009 [US2] Manual validation: search "tomaten" — verify overall card appearance is clean, with balanced spacing between image area, text content, price, and badges
- [ ] T010 [US2] Manual validation: check edge cases — cards with no badges/subtitle/brand (minimal content), cards with bundle pricing (strikethrough), and cards with unavailability overlays all look correct

**Checkpoint**: Cards look polished with balanced spacing. No visual regressions.

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Verify no regressions, pass lint/build, confirm file size.

- [X] T011 Verify `src/components/product-card.tsx` remains under 300 lines (constitution Principle III) — 251 lines ✓
- [ ] T012 Verify cart action overlay (add button / quantity stepper) remains functional and correctly positioned in `src/components/product-card.tsx`
- [X] T013 Run `npm run lint` and fix any linting violations — PASS ✓
- [X] T014 Run `npm run build` and fix any build errors — PASS ✓

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 1)**: No dependencies — start immediately. This is the core fix.
- **User Story 2 (Phase 2)**: Depends on US1 — spacing polish builds on top of the restructured layout.
- **Polish (Phase 3)**: Depends on both user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies. Core layout restructure. Must complete first.
- **User Story 2 (P2)**: Depends on US1. Spacing refinements within the restructured layout.

### Within User Story 1

- T001 and T002 are tightly coupled (same structural change — adding wrapper and moving `mt-auto`). Execute together.
- T003 follows T001+T002 (spacing adjustment after the structural change).
- T004-T006 are manual validation after all code changes.

### Parallel Opportunities

- T004, T005, T006 can be done in parallel (independent validation scenarios)
- T009 and T010 can be done in parallel (independent visual checks)
- T013 and T014 can be done in parallel (lint vs build)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001-T003: Restructure card layout with `mt-auto` wrapper
2. **STOP and VALIDATE**: Search "tomaten" — prices should align across rows
3. This is the MVP — the core price alignment fix

### Incremental Delivery

1. User Story 1 (T001-T006) → Price alignment fixed → **MVP complete**
2. User Story 2 (T007-T010) → Visual polish applied → Cards look cleaner
3. Polish (T011-T014) → Lint, build, file size verified → Ready to ship

### Notes on Scope

- All tasks modify a single file: `src/components/product-card.tsx`
- No new files, no new components, no data model changes
- T001-T003 are the only code changes; everything else is validation
- US2 spacing adjustments are refinements on top of the US1 structural change — they can be very subtle
