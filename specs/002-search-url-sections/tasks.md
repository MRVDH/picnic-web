# Tasks: Search URL State and Section Headers

**Input**: Design documents from `/specs/002-search-url-sections/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No test runner is configured. Validation is `npm run lint && npx tsc --noEmit && npm run build`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new project initialization needed — this feature modifies an existing codebase. This phase is intentionally empty.

*(No setup tasks — the project already has all dependencies installed and configured.)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared type definitions and parser file split that MUST be complete before either user story can be implemented.

**Why blocking**: Both US1 and US2 depend on the updated `SearchApiResponse` type. US2 depends on the parser file being split to stay within the 300-line constitution limit. The file split must happen before rewriting the parser for section extraction.

- [x] T001 Add `SearchSection` type and update `SearchApiResponse` to include `sections` field in `src/lib/types.ts`. The `SearchSection` type has `title: string` and `products: Product[]`. The `SearchApiResponse` gains a `sections: SearchSection[]` field alongside the existing `products` and `query` fields. Also update the `SearchResult` type to include `sections: SearchSection[]`. See `data-model.md` for the exact type definitions.

- [x] T002 Extract PML helper functions from `src/lib/parse-fusion-search.ts` into a new `src/lib/pml-helpers.ts` file. Move these functions: `stripColorTags`, `cleanMarkdown`, `extractInnerColor`, `collectMarkdowns`, `findIconNodes`, and `findSellingUnitContainers`. Each function should be exported. Update `parse-fusion-search.ts` to import them from `pml-helpers.ts`. Ensure both files stay under 300 lines (constitution Principle III).

- [x] T003 Extract per-tile data extraction functions from `src/lib/parse-fusion-search.ts` into a new `src/lib/extract-tile-data.ts` file. Move these functions: `extractPromotionLabel`, `findTextStackChildren`, `extractTextStackInfo`, `extractUnavailabilityFromPml`, `extractOriginalPriceFromPml`, and the `SIZE_LABELS` constant. Also move the `SellingUnitTileContainer`, `RawSellingUnit`, `AnalyticsContext`, and `PmlNode` type aliases. Each function should be exported. Update `parse-fusion-search.ts` to import them. Verify all three files (`parse-fusion-search.ts`, `pml-helpers.ts`, `extract-tile-data.ts`) are under 300 lines.

- [x] T004 Run validation: `npm run lint && npx tsc --noEmit && npm run build`. Confirm all three parser files compile correctly and the existing search functionality still works (no behavioral changes yet — just a refactor).

**Checkpoint**: Types updated, parser split into 3 files under 300 lines each. No behavioral changes. Existing search still works.

---

## Phase 3: User Story 1 — Shareable Search URL (Priority: P1) MVP

**Goal**: Sync the search term to a `?q=` URL query parameter so the page state survives refresh, is shareable, and supports browser back/forward navigation.

**Independent Test**: Search for "tomaten", copy the URL (should contain `/?q=tomaten`), open in a new tab — same results appear. Press back/forward — URL and results stay in sync. Refresh — results persist. Clear search — URL returns to `/`.

### Implementation for User Story 1

- [x] T005 [US1] Add `initialQuery` prop to `SearchBar` component in `src/components/search-bar.tsx`. Add `initialQuery?: string` to `SearchBarProps`. Initialize `inputValue` state with `initialQuery ?? ""`. Add a `useEffect` that updates `inputValue` when `initialQuery` changes (for browser back/forward navigation updating the input). See `contracts/page-url-state.md` for the component contract.

- [x] T006 [US1] Update `src/app/page.tsx` to sync search state with URL query parameter. Changes: (1) Import `useSearchParams` and `useRouter` from `next/navigation`, and `Suspense` from React. (2) Extract the current `Home` component logic into a new inner `SearchPage` component that calls `useSearchParams()` to read `?q=`. (3) The exported `Home` component wraps `SearchPage` in `<Suspense fallback={<LoadingView />}>`. (4) In `SearchPage`, on mount, read `searchParams.get("q")` — if non-empty, trigger `handleSearch` automatically via a `useEffect`. (5) Update `handleSearch` to call `router.push("/?q=" + encodeURIComponent(query))` after setting loading state. (6) When search is cleared (empty query submitted), call `router.push("/")`. (7) Pass `initialQuery={searchParams.get("q") ?? ""}` to `SearchBar`. (8) Update `SearchState` to include `sections: SearchSection[]` in the success state (needed for US2, but the type must be present for the response). For now, store `sections` from the API response but continue passing `products` to `ResultsView`. See `contracts/page-url-state.md` and `research.md` R2 for the implementation pattern.

- [x] T007 [US1] Update `src/app/api/search/route.ts` to return `sections` in the response. For now (before US2 parser work), return an empty `sections: []` alongside the existing `products` and `query`. This ensures the response shape matches `SearchApiResponse` immediately. Import `parseFusionSearchPage` as before — it will be replaced in US2. Change the response from `{ products, query }` to `{ products, sections: [], query }`.

- [x] T008 [US1] Run validation: `npm run lint && npx tsc --noEmit && npm run build`. Then manually test: start the dev server, search for "tomaten", verify URL updates to `/?q=tomaten`. Open `/?q=tomaten` in a new tab — results should load automatically. Refresh the page — results persist. Clear the search — URL returns to `/`. Verify back/forward navigation works.

**Checkpoint**: User Story 1 is fully functional. URL state syncs with search. Shareable links work. Browser history works. Results still render as a flat grid (sections come in US2).

---

## Phase 4: User Story 2 — Section Headers in Search Results (Priority: P2)

**Goal**: Parse section headers from the Fusion API PML response and display products grouped under their section headers (e.g., "Tros- en pruimtomaten", "Cherrytomaten").

**Independent Test**: Search for "tomaten" and verify section headers appear above each product group. Verify "Opnieuw bestellen" appears as the first section. Verify duplicate sections show distinct titles (e.g., "In blik / Heinz" vs "Passata / Heinz"). Verify empty sections are not rendered. Verify total product count still displays correctly.

### Implementation for User Story 2

- [x] T009 [US2] Rewrite the public API in `src/lib/parse-fusion-search.ts` to extract sections. Replace `parseFusionSearchPage` with `parseFusionSearchSections` that returns `{ sections: SearchSection[], products: Product[] }`. Implementation: (1) Find the visual-sections container node by walking the PML tree for a node with ID containing `structured-selling-unit-search-result-visual-sections`. (2) Iterate its children to find section header blocks (ID pattern: `client-side-filtering-section-header-wrapper-{Name}`) and their adjacent product wrapper blocks (ID pattern: `client-side-filtering-section-wrapper-{Name}`). (3) For each header block, extract the section title from the RICH_TEXT markdown using `stripColorTags` from `pml-helpers.ts`. (4) For each product wrapper, extract selling-unit tiles using `findSellingUnitContainers` and convert them to `Product` objects using the existing tile extraction logic from `extract-tile-data.ts`. (5) Handle the "Opnieuw bestellen" re-order section separately — it's a sibling node outside visual-sections. Extract its products and prepend it as the first section. (6) Deduplicate: track seen product IDs across sections. Products in earlier sections take priority (first-occurrence wins). Remove duplicates from later sections. (7) Exclude sections with 0 products after deduplication. (8) Return flat `products` array as the deduplicated union of all section products. See `research.md` R1, R3, R4 for PML structure details and decisions.

- [x] T010 [US2] Update `src/app/api/search/route.ts` to use `parseFusionSearchSections` instead of `parseFusionSearchPage`. Change the import, call `parseFusionSearchSections(rawPage)`, destructure `{ sections, products }`, and return `{ products, sections, query }`. Remove the temporary `sections: []` from T007.

- [x] T011 [US2] Update `src/components/product-grid.tsx` to render sections with headers. Change props from `{ products: Product[] }` to `{ sections: SearchSection[] }`. For each section, render: (1) An `<h2>` element with the section title, styled to match the Picnic app (semi-bold, dark text, appropriate spacing/margin above each section). (2) The product grid below the header using the existing grid layout (`grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`). Import `SearchSection` from `types.ts`. See `contracts/page-url-state.md` for the component contract.

- [x] T012 [US2] Update `src/app/page.tsx` `ResultsView` to pass `sections` to `ProductGrid` instead of `products`. Change `<ProductGrid products={products} />` to `<ProductGrid sections={searchState.sections} />`. The total count display should continue using `products.length` from the flat array (already in `searchState`). Verify the `SearchState` success type includes both `products` and `sections`.

- [x] T013 [US2] Run validation: `npm run lint && npx tsc --noEmit && npm run build`. Then manually test: search for "tomaten", verify section headers appear ("Opnieuw bestellen", "Tros- en pruimtomaten", "Cherrytomaten", etc.). Verify no empty sections are shown. Verify total product count is correct. Verify duplicate sections have distinct titles. Verify URL state from US1 still works.

**Checkpoint**: User Stories 1 AND 2 are both fully functional. Search results display with section headers. URL state works. All acceptance scenarios pass.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, edge case handling, and validation across both stories.

- [x] T014 Verify all files are under 300 lines (constitution Principle III). Run `wc -l` on: `src/lib/parse-fusion-search.ts`, `src/lib/pml-helpers.ts`, `src/lib/extract-tile-data.ts`, `src/app/page.tsx`, `src/components/product-grid.tsx`, `src/components/search-bar.tsx`, `src/app/api/search/route.ts`, `src/lib/types.ts`. If any file exceeds 300 lines, extract logic into additional helper files.

- [x] T015 Verify edge cases: (1) URL with `?q=` (empty value) shows landing page. (2) URL with `?q=xyznotfound` shows "no results" with URL preserved. (3) Very long query string is handled gracefully. (4) API error still shows error view with URL preserved.

- [x] T016 Final validation: `npm run lint && npx tsc --noEmit && npm run build`. Confirm clean output with zero warnings and zero errors.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — can start immediately. BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion (types + file split).
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion. Can run in parallel with US1 if desired, but sequential is recommended since US2's page.tsx changes build on US1's page.tsx changes.
- **Polish (Phase 5)**: Depends on both user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2). No dependency on US2.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2). Has a soft dependency on US1 — US2's `page.tsx` task (T012) assumes the URL state changes from US1 (T006) are already in place. Recommended to complete US1 first.

### Within Each User Story

- Types must be ready (from Phase 2) before story-specific work begins
- API route changes can happen in parallel with component changes
- Page integration (T006 for US1, T012 for US2) should be last within each story
- Validation task is always last

### Parallel Opportunities

- T002 and T003 can run in parallel (different new files, splitting from the same source)
- T005 and T007 can run in parallel (different files: search-bar.tsx vs route.ts)
- T009 and T011 can run in parallel (different files: parse-fusion-search.ts vs product-grid.tsx)

---

## Parallel Example: Phase 2 (Foundational)

```
# After T001 (types), launch file split tasks together:
Task T002: "Extract PML helpers into src/lib/pml-helpers.ts"
Task T003: "Extract tile data functions into src/lib/extract-tile-data.ts"
```

## Parallel Example: User Story 1

```
# Launch SearchBar and API route updates together:
Task T005: "Add initialQuery prop to SearchBar in src/components/search-bar.tsx"
Task T007: "Update API route to return sections in src/app/api/search/route.ts"
# Then T006 (page.tsx) depends on both T005 and T007
```

## Parallel Example: User Story 2

```
# Launch parser rewrite and ProductGrid update together:
Task T009: "Rewrite parser for sections in src/lib/parse-fusion-search.ts"
Task T011: "Update ProductGrid for sections in src/components/product-grid.tsx"
# Then T010 (route.ts) depends on T009, T012 (page.tsx) depends on T010+T011
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (types + file split)
2. Complete Phase 3: User Story 1 (URL state sync)
3. **STOP and VALIDATE**: Test URL persistence, sharing, back/forward navigation
4. Search works exactly as before, but with URL state — deployable as MVP

### Incremental Delivery

1. Complete Foundational → Types ready, parser files clean
2. Add User Story 1 → URL state works → Deploy/Demo (MVP!)
3. Add User Story 2 → Section headers appear → Deploy/Demo
4. Polish → Verify edge cases, line counts, final build

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Validation is `npm run lint && npx tsc --noEmit && npm run build` (no test runner)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The parser file split (T002, T003) is a refactor with zero behavioral changes — existing search must still work after
