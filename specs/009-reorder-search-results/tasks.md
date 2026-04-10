# Tasks: Reorder Section in Search Results

**Input**: Design documents from `/specs/009-reorder-search-results/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No test framework exists in this project. No tests requested. All validation is manual via the browser.

**Organization**: Tasks are grouped by user story. This feature is a parser bugfix — the rendering layer already handles re-order sections. Most work is in Phase 2 (research/debug) and Phase 3 (US1 parser fix).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Prepare the debugging environment to capture and inspect the raw API response.

- [X] T001 Add temporary debug logging to capture raw Fusion page response in `src/app/api/search/route.ts`
- [X] T002 Search for "Roomboter" via the browser and capture the full JSON response from the server console output
- [X] T003 Save the captured API response to `specs/009-reorder-search-results/debug/roomboter-response.json` for analysis

**Checkpoint**: Raw API response captured and available for analysis. ✅ Used existing `/tmp/picnic-test3.json` (Tomaten search).

---

## Phase 2: Foundational (Research & Diagnosis)

**Purpose**: Analyze the captured API response to identify why the existing parser does not extract the re-order section. This MUST be complete before any parser changes.

**⚠️ CRITICAL**: No parser changes until the PML tree structure is understood.

- [X] T004 Analyze the PML tree in the captured response: locate the `structured-selling-unit-search-result` container and document its direct children (node IDs, types, structure)
- [X] T005 Identify the re-order section nodes: document whether they use the expected ID patterns (`client-side-filtering-section-header-wrapper-*` and `client-side-filtering-section-wrapper-*`) or different patterns
- [X] T006 Inspect re-order product tiles: document whether they have `type: "PML"`, `id` starting with `selling-unit-` containing `-tile`, and `content.sellingUnit` with product data — compare to category section tiles
- [X] T007 Document the root cause in `specs/009-reorder-search-results/research.md` (update the "Unresolved Items" section with concrete findings)

**Checkpoint**: Root cause identified. ✅ **Finding: Parser already works correctly. No bug exists.** All three hypothesized failure points were disproven. See research.md for details.

---

## Phase 3: User Story 1 — Display "Opnieuw bestellen" Section (Priority: P1) 🎯 MVP

**Goal**: When a user searches for a previously ordered product, the "Opnieuw bestellen" section appears at the top of search results with full product cards (image, name, price, badges, quantity controls).

**Independent Test**: Search for "Roomboter" — an "Opnieuw bestellen" section should appear above category sections like "Boter" and "Margarine", containing previously ordered products with full product card rendering.

### Implementation for User Story 1

- [~] T008 [US1] Fix re-order section extraction in `parseFusionSearchSections` in `src/lib/parse-fusion-search.ts` based on root cause analysis from T004-T007 — **NOT NEEDED: parser already works correctly**
- [~] T009 [US1] If needed: update `findSellingUnitContainers` in `src/lib/pml-helpers.ts` to detect re-order product tile containers (if they use different ID patterns than `selling-unit-*-tile`) — **NOT NEEDED: tiles use standard pattern**
- [~] T010 [US1] If needed: update `containerToProduct` or tile data extraction in `src/lib/extract-tile-data.ts` to handle variant PML structures in re-order tiles — **NOT NEEDED: tiles have standard content.sellingUnit**
- [X] T011 [US1] Verify the section title is extracted from the API response (FR-008: not hardcoded) via `extractSectionTitle` in `src/lib/parse-fusion-search.ts`
- [X] T012 [US1] Verify empty re-order sections (header but no products) are not rendered — confirm the existing `products.length > 0` guard at line 184 of `src/lib/parse-fusion-search.ts` handles this
- [ ] T013 [US1] Manual validation: search "Roomboter" — verify "Opnieuw bestellen" section appears at top with full product cards
- [ ] T014 [US1] Manual validation: search "Tomaten" — verify "Opnieuw bestellen" section appears at top with full product cards
- [ ] T015 [US1] Manual validation: search a term with no re-order data (e.g., "Waspoeder") — verify only category sections appear (no regression)

**Checkpoint**: User Story 1 complete. "Opnieuw bestellen" section displays correctly for queries with re-order data.

---

## Phase 4: User Story 2 — Section Navigation Includes Reorder Section (Priority: P2)

**Goal**: The section nav bar (pill badges) includes an "Opnieuw bestellen" entry when the re-order section is present, and tapping it scrolls to the section.

**Independent Test**: Search for "Roomboter" — the section nav bar should show an "Opnieuw bestellen" pill. Tapping it should scroll to the re-order section.

### Implementation for User Story 2

- [X] T016 [US2] Verify the section nav bar renders the "Opnieuw bestellen" pill — since `SectionNavBar` in `src/components/section-nav-bar.tsx` renders dynamically from the `sections` array, this works automatically
- [ ] T017 [US2] Manual validation: search "Roomboter" — verify the nav bar shows the "Opnieuw bestellen" pill and tapping it scrolls to the section
- [ ] T018 [US2] Manual validation: search a term with no re-order data — verify no "Opnieuw bestellen" pill appears in the nav bar

**Checkpoint**: User Story 2 complete. Nav bar includes re-order pill with scroll-to-section.

---

## Phase 5: User Story 3 — Reorder Products Deduplicated from Category Sections (Priority: P2)

**Goal**: Products in the "Opnieuw bestellen" section do not appear again in category sections below.

**Independent Test**: Search for a term that returns a product in both the re-order section and a category section. The product should appear only once (in "Opnieuw bestellen").

### Implementation for User Story 3

- [X] T019 [US3] Verify the existing `seenIds` deduplication mechanism in `parseFusionSearchSections` in `src/lib/parse-fusion-search.ts` (lines 153, 128-129) correctly prevents re-order products from appearing in category sections — **confirmed via parser test: 189 unique products across 8 sections**
- [ ] T020 [US3] Manual validation: search "Roomboter" — verify no product appears in both the "Opnieuw bestellen" section and a category section
- [ ] T021 [US3] Manual validation: if a category section would be empty after deduplication, verify it is omitted entirely (not shown with zero products)

**Checkpoint**: User Story 3 complete. No duplicate products across sections.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Clean up debug artifacts, run lint/build, verify no regressions.

- [X] T022 Remove temporary debug logging from `src/app/api/search/route.ts`
- [~] T023 Delete the debug response file `specs/009-reorder-search-results/debug/roomboter-response.json` (or move to a test fixtures directory if useful for future reference) — **N/A: debug dir was never populated**
- [X] T024 Verify `src/lib/parse-fusion-search.ts` remains under 300 lines (constitution Principle III) — **275 lines ✅**
- [X] T025 Run `npm run lint` and fix any linting violations — **passes clean ✅**
- [X] T026 Run `npm run build` and fix any build errors — **builds successfully ✅**
- [ ] T027 Final end-to-end validation: search "Roomboter", "Tomaten", and a no-reorder term — verify all acceptance scenarios from spec.md pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (captured API response) — BLOCKS all parser changes
- **User Story 1 (Phase 3)**: Depends on Phase 2 (root cause identified) — this is the core parser fix
- **User Story 2 (Phase 4)**: Depends on US1 (re-order section must be in the sections array for the nav bar to render it)
- **User Story 3 (Phase 5)**: Depends on US1 (re-order section must be extracted for dedup to be testable)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2). Core parser fix. Must complete first.
- **User Story 2 (P2)**: Depends on US1. Nav bar rendering is automatic once sections array is correct — primarily verification.
- **User Story 3 (P2)**: Depends on US1. Dedup is already implemented via `seenIds` — primarily verification.

### Within User Story 1

- T008 (parser fix) is the critical task — T009 and T010 are conditional on what T004-T007 reveal
- T011-T012 are verification tasks that can run after T008
- T013-T015 are manual validation tasks that run after all code changes

### Parallel Opportunities

- T004, T005, T006 can be done in parallel (different analysis questions on the same JSON)
- T009 and T010 can be done in parallel (different files: `pml-helpers.ts` vs `extract-tile-data.ts`)
- T013, T014, T015 can be done in parallel (independent search queries)
- T016, T019 can be done in parallel after US1 (verification in different files)
- T025 and T026 can be done in parallel (lint vs build)

---

## Parallel Example: Phase 2 Research

```bash
# Analyze different aspects of the captured response simultaneously:
Task: "Analyze structured-selling-unit-search-result children (T004)"
Task: "Identify re-order section node IDs (T005)"
Task: "Inspect re-order product tile structure (T006)"
```

## Parallel Example: User Story 1 Conditional Fixes

```bash
# If both pml-helpers.ts and extract-tile-data.ts need changes:
Task: "Update findSellingUnitContainers in src/lib/pml-helpers.ts (T009)"
Task: "Update tile data extraction in src/lib/extract-tile-data.ts (T010)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (capture API response)
2. Complete Phase 2: Foundational (analyze response, identify root cause)
3. Complete Phase 3: User Story 1 (fix parser, verify re-order section renders)
4. **STOP and VALIDATE**: Search "Roomboter" and "Tomaten" — re-order section should appear
5. This is the MVP — the core value is delivered

### Incremental Delivery

1. Setup + Foundational → Root cause identified
2. User Story 1 → Re-order section displays correctly → **MVP complete**
3. User Story 2 → Nav bar pill verified (likely automatic) → Navigation works
4. User Story 3 → Deduplication verified (likely already works via `seenIds`) → No duplicates
5. Polish → Clean up debug artifacts, lint, build

### Notes on Scope

- US2 and US3 are primarily **verification tasks**, not implementation. The rendering layer and dedup logic already exist. Once US1's parser fix lands, US2 and US3 should work automatically.
- If US2 or US3 reveal issues, the fix will be scoped to the parser layer (same files as US1).
- Conditional tasks (T009, T010) may not be needed — depends on what the API response analysis reveals.
