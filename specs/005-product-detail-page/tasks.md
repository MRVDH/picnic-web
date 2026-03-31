# Tasks: Product Detail Page

**Input**: Design documents from `/specs/005-product-detail-page/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/product-detail-api.md, quickstart.md  
**Tests**: No test framework configured. Test tasks are omitted.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Directory structure and route scaffolding

- [X] T001 Create directory `src/app/product/[id]/` for the product detail page route
- [X] T002 [P] Create directory `src/app/api/product/[id]/` for the product detail API route

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, PML helper extensions, and parser — MUST be complete before any user story UI work

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [US1] Add ProductDetail types to `src/lib/types.ts` — add `ProductDetail`, `AllergenInfo`, `ProductInfoSection`, `ProductPromotion`, `BundleOption`, `SliderProduct` interfaces and any constants (node ID constants as UPPER_SNAKE_CASE) per data-model.md
- [X] T004 [P] [US1] Extend `src/lib/pml-helpers.ts` — add `findNodeById(obj, id)` (exact match), `findNodeByIdPrefix(obj, prefix)` (prefix match), and `collectPropertyValues(node, key)` (recursive deep property search) per research.md R-004
- [X] T005 [US1] Create `src/lib/parse-fusion-product.ts` — implement the Fusion product page parser. Primary export: `parseProductDetailPage(rawPage, productId): ProductDetail`. Must extract all fields defined in data-model.md using the node IDs from research.md R-001. Follow the same pattern as `parse-fusion-search.ts`: use `pml-helpers.ts` utilities, not `jsonpath-plus`. Allergen categorization must track "Bevat" / "Bevat mogelijk" headings per R-006. Accordion sections extracted from `accordion-list` node. Bundles from `product-page-bundles-*` prefix. Similar products from `alternatives-container`. Price extraction with multi-step fallback per R-001. Keep under 300 lines; extract focused helper functions as needed.
- [X] T006 [US1] Create `src/app/api/product/[id]/route.ts` — implement `GET` handler following the pattern in `src/app/api/search/route.ts`: `readAuthToken` -> `buildPicnicClient` -> `sendRequest("GET", "/pages/product-details-page-root?id=...")` -> `parseProductDetailPage` -> return JSON. Error responses: 401/TOKEN_EXPIRED for auth errors, 404 for product not found, 502 for API failures. Per contracts/product-detail-api.md.

**Checkpoint**: API route returns correctly parsed `ProductDetail` JSON for any valid product ID. Foundation ready for UI.

---

## Phase 3: User Story 1 — View Product Detail Page (Priority: P1) MVP

**Goal**: User navigates to `/product/{id}` and sees the full product detail page with all available sections.

**Independent Test**: Navigate to `http://localhost:3000/product/s1001524` (or any valid product ID) and verify all sections render with correct data from the API.

### Implementation for User Story 1

- [X] T007 [P] [US1] Create `src/components/product-gallery.tsx` — image gallery component. Props: `imageIds: string[]`. Displays main image prominently; when multiple images, shows thumbnail strip below. Clicking a thumbnail switches the main image (`useState` for selected index). When `imageIds` is empty, show a placeholder. Use `buildImageUrl` from `image-url.ts`. FR-003.
- [X] T008 [P] [US1] Create `src/components/product-info-header.tsx` — product identity component. Props: `name: string, brand: string, unitQuantity: string, unitPrice: string | null`. Displays product title, brand, weight/volume, and unit price. FR-004.
- [X] T009 [P] [US1] Create `src/components/product-price-section.tsx` — price and promotion component. Props: `displayPrice: number, promotion: ProductPromotion | null, bundles: BundleOption[]`. Shows selling price in euros (divide cents by CENTS_DIVISOR). Shows promotion label badge when active. Shows bundle options table when available. FR-005, FR-006, FR-015.
- [X] T010 [P] [US1] Create `src/components/product-description.tsx` — description block component. Props: `description: string | null`. Renders description text when non-null. FR-008.
- [X] T011 [P] [US1] Create `src/components/product-highlights.tsx` — highlights list component. Props: `highlights: string[]`. Renders a list of highlight phrases. FR-007.
- [X] T012 [P] [US1] Create `src/components/allergen-badges.tsx` — allergen display component. Props: `allergens: AllergenInfo`. Renders confirmed allergens as visual badges, "bevat mogelijk" allergens separately with clear label. Omit section entirely when both arrays empty. FR-009.
- [X] T013 [P] [US1] Create `src/components/accordion-section.tsx` — collapsible section component. Props: `title: string, content: string`. Starts collapsed. Click header to toggle expand/collapse. Renders content as text; delegates to `NutritionTable` when title matches "Voedingswaarde". FR-010.
- [X] T014 [P] [US1] Create `src/components/nutrition-table.tsx` — voedingswaarde table renderer. Props: `content: string`. Parses markdown table syntax (`| col | col |`) into HTML table rows. Falls back to raw text when format is unrecognized. FR-011, research R-003.
- [X] T015 [P] [US1] Create `src/components/product-slider.tsx` — horizontal scrollable product slider. Props: `title: string, products: SliderProduct[]`. Renders a title and horizontally scrollable row of `ProductSliderCard` items. FR-012, FR-013.
- [X] T016 [P] [US1] Create `src/components/product-slider-card.tsx` — compact card for slider items. Props: `product: SliderProduct, href: string`. Displays image, name, price, unit quantity. Wraps in Next.js `Link` for navigation. Used inside `ProductSlider`.
- [X] T017 [US1] Create `src/app/product/[id]/page.tsx` — product detail page. `"use client"` component. Receives `{ params: Promise<{ id: string }> }` (Next.js 16 async params). Fetches from `/api/product/{id}`. Manages loading/error/success state (discriminated union like `page.tsx`). On TOKEN_EXPIRED, redirect to `/login?expired=true`. Composes all section components in order per FR-023: ProductGallery -> ProductInfoHeader -> ProductPriceSection -> ProductDescription + ProductHighlights -> AllergenBadges -> AccordionSection(s) -> ProductSlider("Similar products"). Omit sections with no data per FR-016. FR-020 for error display.

**Checkpoint**: User Story 1 is fully functional — navigating to `/product/{id}` shows the complete product detail page with all available sections, loading state, and error handling.

---

## Phase 4: User Story 2 — Navigate from Search Results to Product Detail (Priority: P1)

**Goal**: Product cards in search results become clickable links to the product detail page.

**Independent Test**: Perform a search, click a product card, verify the correct detail page loads, press browser back to return to search results.

### Implementation for User Story 2

- [X] T018 [US2] Modify `src/components/product-card.tsx` — add optional `href?: string` prop. When `href` is provided, wrap the card content in a Next.js `Link` component. Add hover styles (cursor pointer, subtle highlight) when `href` is present. Keep backward-compatible (cards without `href` remain non-interactive). Per research R-007.
- [X] T019 [US2] Modify `src/components/product-grid.tsx` — pass `href={`/product/${product.id}`}` to each `ProductCard` so search result cards link to the product detail page. FR-017.

**Checkpoint**: User Story 2 is functional — clicking any search result card navigates to the product detail page. Browser back returns to search results. FR-022.

---

## Phase 5: User Story 3 — Navigate Between Related Products (Priority: P2)

**Goal**: Product cards in the "similar products" slider are clickable links to other product detail pages.

**Independent Test**: Navigate to a product with similar products, click one in the slider, verify the new detail page loads.

### Implementation for User Story 3

- [X] T020 [US3] Verify `src/components/product-slider-card.tsx` already passes `href` to a `Link` (done in T016). Verify `src/components/product-slider.tsx` constructs `/product/{id}` hrefs for each slider product. If not already done, wire the `href` prop through. Ensure clicking a similar product in the slider navigates to its detail page. FR-018.

**Checkpoint**: User Story 3 is functional — clicking products in the similar products slider navigates to that product's detail page. Browser back navigation works through the chain. FR-022.

---

## Phase 6: User Story 4 — Handle Missing or Unavailable Product Data (Priority: P2)

**Goal**: Page gracefully omits missing sections and shows clear error states for invalid products or API failures.

**Independent Test**: Navigate to a product with sparse data and verify missing sections are cleanly omitted. Navigate to an invalid product ID and verify the error message.

### Implementation for User Story 4

- [X] T021 [US4] Review `src/app/product/[id]/page.tsx` error states — ensure "Product not found" message for 404, helpful error message with retry for 502/network errors, redirect to login for TOKEN_EXPIRED. Verify all section components handle empty/null data by rendering nothing (already enforced by FR-016 conditional rendering in T017). Add any missing edge case handling: malformed product ID, zero images (placeholder shown by gallery), etc. FR-020, FR-021.

**Checkpoint**: User Story 4 is functional — missing data results in clean omissions, invalid products show error messages, expired auth redirects to login.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Lint compliance, build validation, final review

- [X] T022 Run `npm run lint` and fix any violations across all new and modified files
- [X] T023 Run `npm run build` and fix any type errors or build failures
- [X] T024 Self-refactor review against constitution.md — verify all files under 300 lines, no magic strings, verb-first camelCase, SRP, no deep nesting (max 3 levels)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (directories exist). T003 and T004 can run in parallel. T005 depends on T003 + T004. T006 depends on T005. **BLOCKS all user story UI work.**
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion. All component tasks (T007–T016) can run in parallel. T017 (page) depends on all components.
- **User Story 2 (Phase 4)**: Depends on Phase 2. Can run in parallel with US1 (different files). T019 depends on T018.
- **User Story 3 (Phase 5)**: Depends on T016 (slider card component from US1). Lightweight verification task.
- **User Story 4 (Phase 6)**: Depends on T017 (page component from US1). Review and edge case hardening.
- **Polish (Phase 7)**: Depends on all user stories being complete.

### Parallel Opportunities

```
Phase 2 (parallel):
  T003 (types)  ─┐
  T004 (helpers) ─┤── T005 (parser) ── T006 (API route)
                  │
Phase 3 (parallel after Phase 2):
  T007 (gallery)          ─┐
  T008 (info header)      ─┤
  T009 (price section)    ─┤
  T010 (description)      ─┤
  T011 (highlights)       ─┤── T017 (page.tsx)
  T012 (allergen badges)  ─┤
  T013 (accordion)        ─┤
  T014 (nutrition table)  ─┤
  T015 (slider)           ─┤
  T016 (slider card)      ─┘

Phase 4 (parallel with Phase 3):
  T018 (product-card mod) ── T019 (product-grid mod)

Phase 5 (after T016):
  T020 (verify slider linking)

Phase 6 (after T017):
  T021 (error handling review)

Phase 7 (after all):
  T022 ── T023 ── T024
```

### Implementation Strategy

**MVP First (User Stories 1 + 2)**:

1. Complete Phase 1: Setup (directories)
2. Complete Phase 2: Foundation (types, helpers, parser, API route)
3. Complete Phase 3: User Story 1 (all components + page)
4. Complete Phase 4: User Story 2 (make search cards clickable)
5. **VALIDATE**: Search -> click product -> see detail page -> back to search
6. Continue to Phase 5 + 6 for polish

**Total**: 24 tasks across 7 phases
