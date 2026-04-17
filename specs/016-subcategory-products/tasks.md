# Tasks: Subcategory Product Listing

**Input**: Design documents from `/specs/016-subcategory-products/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/products-api.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Export shared parser function and add response type needed by all stories

- [X] T001 Export `containerToProduct` function from `src/lib/parse-fusion-search.ts` (add `export` keyword; no logic changes)
- [X] T002 [P] Add `CategoryProductsApiResponse` type to `src/lib/types.ts` per data-model.md (`{ title: string | null; products: Product[] }`)

**Checkpoint**: Existing functionality unchanged, lint+build passes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the L2 product parser and API route — blocking prerequisites for all UI work

- [X] T003 [P] Create `src/lib/parse-category-products.ts` — implement `parseCategoryProductPage(rawPage: unknown): Product[]` that calls `findSellingUnitContainers(rawPage)` from `pml-helpers.ts` and maps each container through `containerToProduct()` from `parse-fusion-search.ts`. Deduplicate by product ID. Reuse `extractPageTitle()` from `parse-subcategories.ts` for the title
- [X] T004 [P] Create `src/app/api/categories/[categoryId]/products/route.ts` — implement `GET` handler per contracts/products-api.md: read auth token, call `client.app.getPage("L2-category-page-root?category_id={categoryId}")`, parse with `parseCategoryProductPage`, extract title with `extractPageTitle`, return `{ title, products }`. Handle 401 (TOKEN_EXPIRED) and 502 (upstream failure)

**Checkpoint**: `GET /api/categories/{id}/products` returns valid JSON, lint+build passes

---

## Phase 3: User Story 1 — View Products in a Sub-category (Priority: P1) 🎯 MVP

**Goal**: Users can tap a leaf sub-category to see its products displayed in the same layout as search results

**Independent Test**: Tap any sub-category from L1 view → product grid appears with same card layout as search results → back button returns to sub-category list

### Implementation for User Story 1

- [X] T005 [US1] Modify `src/components/subcategory-view.tsx` — add optional `onSubcategoryTap?: (category: CategoryItem) => void` prop to `SubcategoryView`. When provided, make `SubcategoryRow` a tappable button that calls the callback
- [X] T006 [US1] Create `src/components/category-products-view.tsx` — implement `CategoryProductsView` component with props `{ categoryName: string; state: CategoryProductsState; onBack: () => void; onRetry: () => void }`. Renders: back button ("Terug"), category name heading, loading spinner, error view with retry, empty message, or `ProductGrid` (flat mode with `products` prop) for the product listing
- [X] T007 [US1] Modify `src/app/page.tsx` — extend `CategoryNavState` to include `{ level: "l2"; categoryId: string; categoryName: string; parentCategoryId: string; parentCategoryName: string }`. Add `categoryProductsState` discriminated union state (idle | loading | success | error)
- [X] T008 [US1] Modify `src/app/page.tsx` — add `useEffect` that fetches `/api/categories/${categoryNav.categoryId}/products` when `categoryNav.level === "l2"`, handles success/error/TOKEN_EXPIRED, includes AbortController cleanup
- [X] T009 [US1] Modify `src/app/page.tsx` — update idle-state JSX: when `categoryNav.level === "l1"`, pass `onSubcategoryTap` to `SubcategoryView` that sets nav to L2 (storing parent context). When `categoryNav.level === "l2"`, render `CategoryProductsView`. Back from L2 restores L1 nav with cached subcategories (no re-fetch)

**Checkpoint**: Full drill-down works: categories → sub-categories → products → back → back. Lint+build passes

---

## Phase 4: User Story 2 — Cart Actions on Sub-category Products (Priority: P2)

**Goal**: Users can add products to cart from the sub-category product listing

**Independent Test**: Navigate to sub-category products → tap add-to-cart → toast appears → quantity controls show

### Implementation for User Story 2

- [X] T010 [US2] Verify cart actions work in `src/components/category-products-view.tsx` — `ProductGrid` → `ProductCard` already includes cart overlay via `CartProvider`. Ensure the `CategoryProductsView` is rendered inside `CartProvider` scope in `src/app/page.tsx` (it should already be, since `CartProvider` wraps the entire page). This is a verification task; no code changes expected unless cart actions don't work

**Checkpoint**: Cart add/increment/decrement works on sub-category products identical to search results

---

## Phase 5: User Story 3 — Empty and Error States (Priority: P3)

**Goal**: Graceful handling of errors, empty results, and auth expiry

**Independent Test**: Simulate API error → error view with retry and back. Empty sub-category → friendly message

### Implementation for User Story 3

- [X] T011 [US3] Verify error and empty states in `src/components/category-products-view.tsx` — confirm error view shows retry + back button, empty state shows friendly message, TOKEN_EXPIRED triggers redirect. These should already be implemented in T006; this is a verification/polish task

**Checkpoint**: All error/empty/auth-expiry scenarios handled

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, validation, and constitution compliance

- [X] T012 Run `npm run lint && npm run build` — verify zero errors
- [X] T013 Self-refactor review: all changed files < 300 lines, no unused imports, no magic strings, no duplicated logic, max 3 nesting levels

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 (exported function) — T003 and T004 can run in parallel
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion (needs API route and parser)
- **User Story 2 (Phase 4)**: Depends on US1 (needs product listing rendered to verify cart)
- **User Story 3 (Phase 5)**: Depends on US1 (needs product listing to verify edge cases)
- **Polish (Phase 6)**: Depends on all phases complete

### Within User Story 1

- T005 (subcategory-view change) is independent of T006 (new component) — can run in parallel
- T007 depends on T006 (needs the new component type)
- T008 depends on T007 (needs state variables)
- T009 depends on T005, T006, T007, T008 (integrates everything)

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T003 and T004 can run in parallel (different files, both depend on T001)
- T005 and T006 can run in parallel (different files)

---

## Parallel Example: User Story 1

```bash
# After Phase 2 is complete, launch in parallel:
Task: "Modify subcategory-view.tsx — add onSubcategoryTap prop" (T005)
Task: "Create category-products-view.tsx" (T006)

# Then sequentially:
Task: "Extend CategoryNavState + add products state" (T007)
Task: "Add products fetch useEffect" (T008)
Task: "Update idle-state JSX with L2 navigation" (T009)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T004)
3. Complete Phase 3: User Story 1 (T005-T009)
4. **STOP and VALIDATE**: `npm run lint && npm run build`, test full drill-down
5. US1 delivers the complete product browsing experience

### Incremental Delivery

1. Setup + Foundational → API ready
2. User Story 1 → Full drill-down to products (MVP!)
3. User Story 2 → Cart actions verified (likely no-op)
4. User Story 3 → Error handling verified (likely no-op)
5. Polish → Cleanup and final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- US2 and US3 are primarily verification tasks — cart actions and error handling are inherited from reused components
- Total: 13 tasks (2 setup, 2 foundational, 5 US1, 1 US2, 1 US3, 2 polish)
- Key DRY opportunity: `containerToProduct` shared between search parser and L2 category parser
