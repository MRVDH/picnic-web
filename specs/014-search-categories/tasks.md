# Tasks: Search Page Category Browsing

**Input**: Design documents from `/specs/014-search-categories/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/categories-api.md, quickstart.md

**Tests**: No test framework configured. Validation via `npm run lint` and `npm run build` only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. US1 (Browse Categories) is the MVP. US2 (Navigate to Category Products) is deferred — tiles are tappable but navigation is a placeholder (see research.md R6).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- Next.js App Router single-project: `src/` at repository root
- Components: `src/components/`
- Lib/utilities: `src/lib/`
- API routes: `src/app/api/`
- Pages: `src/app/`

---

## Phase 1: Setup

**Purpose**: Branch verification and cleanup of research artifacts

- [x] T001 Verify branch `014-search-categories` is checked out and clean
- [x] T002 Delete `src/app/api/debug/route.ts` if it exists — temporary research endpoint, must not ship to production

---

## Phase 2: Foundational (Types + Parser)

**Purpose**: Shared types and PML parsing logic that both the API route and UI depend on. Must complete before any user story work.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 [P] Create `CategoryItem` and `CategoriesApiResponse` types in `src/lib/category-types.ts` — `CategoryItem` has fields: `id` (string), `name` (string), `imageId` (string), `deepLinkTarget` (string). `CategoriesApiResponse` wraps `{ categories: CategoryItem[] }`. Per data-model.md.
- [x] T004 [P] Create `parseCategoryPage(rawPage: unknown): CategoryItem[]` in `src/lib/parse-categories.ts` — use `findNodeByIdSubstring` from `src/lib/pml-helpers.ts` to find the `"category-tree-wrapper-list"` block, iterate its children filtering by `type === "PML"` and `id` prefix `"core-list-item-category-"`, extract name from `accessibilityLabel`, imageId via `collectPropertyValues("source")`, deepLinkTarget from `onPress.target`. Filter out items with missing name or imageId. Per research.md R7 and quickstart.md section 2.
- [x] T005 Run `npm run lint && npm run build` to verify foundational types and parser compile

**Checkpoint**: Types and parser are in place. API route and UI can be built.

---

## Phase 3: User Story 1 — Browse All Product Categories (Priority: P1) MVP

**Goal**: Replace the empty "Welkom bij Picnic Web" landing page with a browsable category grid showing all ~26 grocery categories with images and names. Categories are fetched from the Picnic API and displayed in a responsive grid.

**Independent Test**: Load the home page while logged in with no search query active. Verify category tiles appear with correct images, names, and responsive layout. Verify loading spinner shows during fetch. Verify error state with retry on API failure. Verify categories hide when a search query is entered and reappear when cleared.

**Note**: The "Deze week" promotional section from the spec is not available in the API response (research.md R3). Only the "Alle categorieën" section is implemented.

### Implementation for User Story 1

- [x] T006 [P] [US1] Create API route GET handler in `src/app/api/categories/route.ts` — read auth token via `readAuthToken` from `src/lib/auth.ts`, build Picnic client via `buildPicnicClient`, call `client.app.getPage("empty-search-page-root")`, parse with `parseCategoryPage`, return `{ categories }` as JSON. Handle 401 (missing/expired token with `TOKEN_EXPIRED` code) and 502 (upstream failure with Dutch error message). Follow same pattern as `src/app/api/search/route.ts`. Per contracts/categories-api.md.
- [x] T007 [P] [US1] Create `CategoryGrid` and `CategoryTile` components in `src/components/category-grid.tsx` — `CategoryGrid` accepts `{ categories: CategoryItem[] }`, renders "Alle categorieën" heading and responsive grid (`grid-cols-2` mobile, `sm:grid-cols-3` tablet, `md:grid-cols-4`, `lg:grid-cols-5` desktop). `CategoryTile` renders category image via `next/image` + `buildImageUrl` from `src/lib/image-url.ts` in a rounded container, category name with `line-clamp-2`, and a click handler (no-op placeholder for US2). Per quickstart.md section 4.
- [x] T008 [US1] Modify `src/app/page.tsx` to integrate categories into the home page: (1) Import `CategoryGrid` from `src/components/category-grid.tsx` and `CategoryItem` from `src/lib/category-types.ts`. (2) Add `CategoriesState` discriminated union type (idle | loading | success | error). (3) Add `categoriesState` + `setCategoriesState` state. (4) Add `useEffect` to fetch `/api/categories` when `searchState.status === "idle"`, handle `TOKEN_EXPIRED` redirect, error state, and success state. (5) Replace `<LandingView />` in JSX with conditional rendering: `<LoadingSpinner />` during loading, `<ErrorView />` on error, `<CategoryGrid />` on success. (6) Remove `LandingView` and `PicnicLogo` inline functions (no longer needed). Per quickstart.md "Files to Modify" section.
- [x] T009 [US1] Run `npm run lint && npm run build` to verify US1 compiles with zero errors

**Checkpoint**: User Story 1 is fully functional. Home page displays category grid with images and names. Loading, error, and idle→search transitions work correctly.

---

## Phase 4: User Story 2 — Navigate to Category Products (Priority: P2)

**Goal**: When a user taps a category tile, they navigate to a product listing for that category.

**Independent Test**: Tap any category tile and verify the user is taken to a product listing filtered by that category. The category name is displayed as a heading and relevant products are shown. Browser back returns to the home page with categories visible.

**Status**: Deferred to a separate feature/sprint. Per research.md R6, implementing the category detail page requires a new parser for `L1-category-page-root` and is a significant piece of work. The click handler in `CategoryTile` is a no-op placeholder. The `deepLinkTarget` field in `CategoryItem` stores the navigation target for future use.

### Implementation for User Story 2

- [ ] T010 [US2] Implement category navigation in `CategoryTile` click handler in `src/components/category-grid.tsx` — parse `category_id` from `deepLinkTarget` using regex `/category_id=([^,&]+)/`, navigate to category product listing page. Requires: new API route for category products, new parser for `L1-category-page-root` FusionPage, new category detail page component. **NOTE: This task is deferred — it may warrant its own feature spec.**

**Checkpoint**: User Story 2 is deferred. Tile click handler is a no-op placeholder.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Constitution compliance check and final validation

- [x] T011 Verify constitution compliance across all new/modified files: all files under 300 lines, verb-first camelCase functions, PascalCase types, kebab-case file names, UPPER_SNAKE_CASE constants, no deep nesting (max 3 levels), no magic strings, error handling is explicit (no swallowed catches)
- [x] T012 Run full validation: `npm run lint && npm run build` — both must pass with zero errors (SC-005)
- [ ] T013 Manual validation per quickstart.md verification section: (1) Load home page while logged in → category grid appears with images and names. (2) Verify all ~26 categories displayed in API order (SC-002). (3) Verify category images load from CDN via `buildImageUrl`. (4) Verify responsive layout: 2 cols at 320px, 3 at 768px, 4-5 at 1280px (SC-003). (5) Type a search query → categories disappear, search results appear (FR-007). (6) Clear the search query → categories reappear. (7) Page loads within 2 seconds on standard connection (SC-001).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — T006 and T007 can run in parallel, T008 depends on both
- **US2 (Phase 4)**: Depends on Phase 3 — DEFERRED to future feature spec
- **Polish (Phase 5)**: Depends on Phase 3 completion

### Within User Story 1

```
T003 (types) ──┐
               ├──> T006 (API route) ──┐
T004 (parser) ─┘                       ├──> T008 (page wiring) ──> T009 (build check)
               └──> T007 (grid UI) ────┘
```

### Parallel Opportunities

- **Phase 2**: T003 (types) and T004 (parser) — different files, no dependencies
- **Phase 3**: T006 (API route) and T007 (grid component) — different files, both depend only on Phase 2 types

---

## Parallel Example: User Story 1

```bash
# After Phase 2 completes, launch API route and UI component in parallel:
Task: "Create API route GET handler in src/app/api/categories/route.ts"
Task: "Create CategoryGrid and CategoryTile in src/components/category-grid.tsx"

# After both complete, wire into page:
Task: "Modify src/app/page.tsx to integrate categories"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational types + parser (T003-T005)
3. Complete Phase 3: User Story 1 — API route, grid component, page integration (T006-T009)
4. **STOP and VALIDATE**: Test US1 independently per acceptance scenarios
5. Complete Phase 5: Polish & final validation (T011-T013)
6. Ready to merge

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP)
3. User Story 2 → Deferred to separate feature spec (requires new parser, new page, significant work)

---

## Notes

- [P] tasks = different files, no dependencies between them
- [US1]/[US2] labels map tasks to specific user stories for traceability
- US2 (category navigation) is explicitly deferred per research.md R6 — the `deepLinkTarget` field preserves the navigation target for future implementation
- FR-001 (Deze week section) cannot be implemented with current endpoint — dropped per research.md R3
- All new files are well under the 300-line constitution limit (largest is parse-categories.ts at ~99 lines)
- No test tasks included — no test framework is configured in this project
