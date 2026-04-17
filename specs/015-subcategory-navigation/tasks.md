# Tasks: Sub-category Navigation

**Input**: Design documents from `/specs/015-subcategory-navigation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/subcategories-api.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the new type and extract shared parser logic needed by both existing and new code

- [X] T001 Add `SubcategoriesApiResponse` type to `src/lib/category-types.ts` per data-model.md
- [X] T002 Extract shared `extractCategoryFromPmlItem` helper from `src/lib/parse-categories.ts` into a reusable function (DRY: both top-level and sub-category parsers need identical PML item extraction). The helper should be exported from `src/lib/parse-categories.ts` or a new shared file like `src/lib/parse-category-items.ts`

**Checkpoint**: Existing functionality unchanged, lint+build passes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the sub-category parser and API route — these are blocking prerequisites for the UI work

- [X] T003 [P] Create `src/lib/parse-subcategories.ts` — implement `parseSubcategoryPage(rawPage: unknown): CategoryItem[]` that finds the `core-L1-category-page-list` block via `findNodeByIdSubstring` and extracts sub-category items using the shared helper from T002. Also implement `extractPageTitle(rawPage: unknown): string | null` that reads `header.title` from the FusionPage
- [X] T004 [P] Create `src/app/api/categories/[categoryId]/subcategories/route.ts` — implement `GET` handler per contracts/subcategories-api.md: read `categoryId` from path params, read auth token, call `client.app.getPage("L1-category-page-root?category_id={categoryId}")`, parse with `parseSubcategoryPage`, extract title with `extractPageTitle`, return `{ title, subcategories }`. Handle 401 (TOKEN_EXPIRED) and 502 (upstream failure) error responses

**Checkpoint**: `GET /api/categories/{id}/subcategories` returns valid JSON, lint+build passes

---

## Phase 3: User Story 1 — Browse Sub-categories (Priority: P1) 🎯 MVP

**Goal**: Users can tap a top-level category to see its sub-categories in the same list-row layout, and navigate back

**Independent Test**: Tap any top-level category → sub-category list appears with back button and title heading → tap back → return to top-level categories

### Implementation for User Story 1

- [X] T005 [US1] Modify `src/components/category-grid.tsx` — add optional `onCategoryTap?: (category: CategoryItem) => void` prop to `CategoryGrid`. When provided, call it on row tap instead of the current no-op. Pass the callback through to individual category row buttons
- [X] T006 [US1] Modify `src/app/page.tsx` — add `CategoryNavState` type (`{ level: "top" } | { level: "l1"; categoryId: string; categoryName: string }`), add `categoryNav` state initialized to `{ level: "top" }`, and add `subcategoriesState` discriminated union state (`idle | loading | success | error`) per data-model.md display rules
- [X] T007 [US1] Modify `src/app/page.tsx` — add `useEffect` that fetches `/api/categories/${categoryNav.categoryId}/subcategories` when `categoryNav.level === "l1"`, handles success (set subcategories + title), handles TOKEN_EXPIRED (redirect to login per FR-008), handles error (set error message). Include cleanup/abort for cancelled navigations
- [X] T008 [US1] Modify `src/app/page.tsx` — update the idle-state JSX: when `categoryNav.level === "top"`, render existing `CategoryGrid` with `onCategoryTap` that sets `categoryNav` to `{ level: "l1", categoryId, categoryName }`. When `categoryNav.level === "l1"`, render: back button (← Terug), category title heading (FR-009), loading spinner (FR-004), error view with retry+back (FR-005), or sub-category `CategoryGrid` (FR-002). Hide shortcuts section when viewing sub-categories per spec assumptions
- [X] T009 [US1] Handle edge cases in `src/app/page.tsx` — empty sub-categories list shows appropriate message with back button (edge case from spec), leaf sub-category taps (L2 deep links) are no-ops (FR-006, check if `deepLinkTarget` contains `L2-category-page-root`)

**Checkpoint**: Full US1 flow works — tap category → loading → sub-categories → back. Lint+build passes. Run `npm run lint && npm run build`

---

## Phase 4: User Story 2 — Browse L2 Sub-categories (Priority: P2)

**Goal**: Users can drill from L1 sub-categories into L2 sub-categories for categories that have them

**Independent Test**: Research shows L2 pages contain products, not sub-categories. The current L1 items all link to L2 (leaf level). This story is effectively a **no-op** given the API structure — all L1 sub-category taps already lead to L2 (product level), which is out of scope. The leaf detection in T009 already handles this.

> **NOTE**: Based on research findings (R2, R3), the Picnic category hierarchy is strictly Top → L1 → L2(products). There are no L1 → L1 chains. All sub-categories at the L1 level link to L2 product pages. Therefore, US2 requires no additional implementation beyond what US1 delivers. If future API changes introduce deeper category nesting, the architecture from US1 can be extended.

- [X] T010 [US2] Verify leaf detection in `src/app/page.tsx` — confirm that sub-category items with `L2-category-page-root` in their `deepLinkTarget` are correctly treated as no-ops. No code changes expected; this is a verification task

**Checkpoint**: US2 verified — leaf sub-categories are properly handled as no-ops

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, validation, and final quality checks

- [X] T011 Ensure `src/app/api/debug-category/route.ts` is deleted (research artifact — should already be removed)
- [X] T012 Run `npm run lint && npm run build` — verify zero errors (SC-005)
- [X] T013 Self-refactor review of all changed files against constitution: verify < 300 lines per file, max 3 nesting levels, no magic strings, verb-first function names, no duplicated logic between `parse-categories.ts` and `parse-subcategories.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 and T002 from Setup — T003 and T004 can run in parallel
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion (needs API route and parser)
- **User Story 2 (Phase 4)**: Depends on Phase 3 (verification of US1 behavior)
- **Polish (Phase 5)**: Depends on all phases complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational — no dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 — verification only, no new implementation

### Within User Story 1

- T005 (component change) is independent of T006-T009 (page changes) but T006-T009 are sequential
- T005 can run in parallel with T006 since they modify different files
- T007 depends on T006 (needs state variables)
- T008 depends on T006 and T007 (needs state and fetch logic)
- T009 depends on T008 (needs sub-category rendering in place)

### Parallel Opportunities

- T003 and T004 can run in parallel (different files, no dependencies)
- T005 and T006 can run in parallel (different files)

---

## Parallel Example: User Story 1

```bash
# After Phase 2 is complete, launch in parallel:
Task: "Modify category-grid.tsx — add onCategoryTap prop" (T005)
Task: "Modify page.tsx — add CategoryNavState type and state" (T006)

# Then sequentially:
Task: "Add subcategories fetch useEffect" (T007)
Task: "Update idle-state JSX with navigation" (T008)
Task: "Handle edge cases" (T009)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T004)
3. Complete Phase 3: User Story 1 (T005-T009)
4. **STOP and VALIDATE**: `npm run lint && npm run build`, manual test drill-down
5. US1 delivers the complete sub-category browsing experience

### Incremental Delivery

1. Setup + Foundational → API ready
2. User Story 1 → Full drill-down navigation (MVP!)
3. User Story 2 → Verification only (no new code)
4. Polish → Cleanup and final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- US2 is effectively a verification task — research confirmed L2 = products, not more sub-categories
- Total: 13 tasks (2 setup, 2 foundational, 5 US1, 1 US2, 3 polish)
- Key DRY opportunity: shared PML item extraction between `parse-categories.ts` and `parse-subcategories.ts`
