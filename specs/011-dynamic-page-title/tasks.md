# Tasks: Dynamic Page Titles

**Input**: Design documents from `/specs/011-dynamic-page-title/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: No test framework is installed. Tests are not included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared constants and the `usePageTitle` hook that all user stories depend on

- [x] T001 Add title constants (`APP_NAME`, `TITLE_SEPARATOR`, `MAX_TITLE_CONTEXT_LENGTH`) to `src/lib/constants.ts`
- [x] T002 Create `usePageTitle` custom hook in `src/hooks/use-page-title.ts` — accepts optional `pageContext` string, sets `document.title` with format `"[context] - Picnic Web"`, handles truncation at 60 chars with ellipsis, falls back to `"Picnic Web"` when no context provided
- [x] T003 Update root layout static metadata title from `"Picnic Web — Product Search"` to `"Picnic Web"` in `src/app/layout.tsx`

**Checkpoint**: Shared hook and constants ready. Root layout shows updated default title. User story implementation can begin.

---

## Phase 2: User Story 1 — Product Page Shows Product Name in Browser Tab (Priority: P1) 🎯 MVP

**Goal**: When a user navigates to a product detail page, the browser tab displays the product name (e.g., "Halfvolle melk - Picnic Web"). During loading, the title falls back to "Picnic Web". Invalid/missing products also fall back.

**Independent Test**: Navigate to `/product/{any-id}` and verify the browser tab shows `"{product name} - Picnic Web"` once loaded, and `"Picnic Web"` while loading or on error/not-found.

### Implementation for User Story 1

- [x] T004 [US1] Add `usePageTitle` call to `ProductPage` component in `src/app/product/[id]/page.tsx` — derive `pageContext` from `pageState`: use `pageState.product.name` when status is `"success"`, `undefined` otherwise. Import `usePageTitle` from `@/hooks/use-page-title`.

**Checkpoint**: Product detail pages display dynamic titles. Title shows "Picnic Web" during loading, updates to product name on success, stays as fallback on error/not-found. Verify with `npm run lint && npm run build`.

---

## Phase 3: User Story 2 — Static Pages Show Descriptive Titles (Priority: P2)

**Goal**: The login page shows "Inloggen - Picnic Web", the cart page shows "Winkelwagen - Picnic Web", the home page (without search) shows "Picnic Web", and the error page falls back to "Picnic Web".

**Independent Test**: Navigate to `/login`, `/cart`, `/`, and trigger an error — verify each browser tab shows the expected title.

### Implementation for User Story 2

- [x] T005 [P] [US2] Add `usePageTitle("Inloggen")` call to `LoginForm` component in `src/app/login/page.tsx` — import `usePageTitle` from `@/hooks/use-page-title`
- [x] T006 [P] [US2] Add `usePageTitle("Winkelwagen")` call to `CartPage` component in `src/app/cart/page.tsx` — import `usePageTitle` from `@/hooks/use-page-title`
- [x] T007 [P] [US2] Add `usePageTitle()` call (no argument, uses fallback) to `Error` component in `src/app/error.tsx` — import `usePageTitle` from `@/hooks/use-page-title`
- [x] T008 [US2] Add `usePageTitle` call to `SearchPage` component in `src/app/page.tsx` — pass `urlQuery || undefined` as `pageContext` so the home page without a search query shows "Picnic Web". Import `usePageTitle` from `@/hooks/use-page-title`.

**Checkpoint**: All static pages display correct titles. Home page shows "Picnic Web" when no search is active. Login shows "Inloggen - Picnic Web". Cart shows "Winkelwagen - Picnic Web". Error shows "Picnic Web". Verify with `npm run lint && npm run build`.

---

## Phase 4: User Story 3 — Search Results Page Shows Search Query in Title (Priority: P3)

**Goal**: When a user performs a search, the browser tab title updates to show the search query (e.g., "melk - Picnic Web"). Clearing the search reverts to "Picnic Web". Long queries are truncated.

**Independent Test**: Enter a search query on `/` and verify the browser tab shows `"{query} - Picnic Web"`. Clear the query and verify it reverts to `"Picnic Web"`. Enter a 100+ character query and verify truncation with ellipsis.

### Implementation for User Story 3

> **Note**: T008 (from US2) already integrates `usePageTitle` into the `SearchPage` component with `urlQuery || undefined`. This means the search title behavior is already functional after US2 is complete — when `urlQuery` has a value, it becomes the page context. This phase serves as explicit verification and acceptance of that behavior.

- [x] T009 [US3] Verify search title behavior in `src/app/page.tsx` — confirm that the `usePageTitle(urlQuery || undefined)` call from T008 correctly: (1) shows `"{query} - Picnic Web"` when searching, (2) reverts to `"Picnic Web"` when query is cleared, (3) truncates queries over 60 characters with ellipsis. Run `npm run build` to validate.

**Checkpoint**: All three user stories are complete. Every page in the application displays a correct, dynamic browser tab title.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all pages and build verification

- [x] T010 Run `npm run lint` and fix any linting errors across all modified files
- [x] T011 Run `npm run build` and verify successful compilation with no type errors
- [x] T012 Run quickstart.md validation — manually verify all title expectations listed in `specs/011-dynamic-page-title/quickstart.md` (Verification section): `/` → "Picnic Web", `/?q=melk` → "melk - Picnic Web", `/login` → "Inloggen - Picnic Web", `/cart` → "Winkelwagen - Picnic Web", `/product/{id}` → "{name} - Picnic Web", error → "Picnic Web"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately. T001 → T002 (hook depends on constants). T003 is independent of T001/T002.
- **User Story 1 (Phase 2)**: Depends on T002 (hook must exist)
- **User Story 2 (Phase 3)**: Depends on T002 (hook must exist). Independent of US1.
- **User Story 3 (Phase 4)**: Depends on T008 (search page hook call from US2)
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1) — no dependencies on other stories
- **User Story 2 (P2)**: Can start after Setup (Phase 1) — no dependencies on other stories. Can run in parallel with US1.
- **User Story 3 (P3)**: Depends on US2 (T008 adds the hook call to `SearchPage` that enables search titles). This is by design — US3's search behavior is a natural extension of US2's home page title setup.

### Within Each User Story

- US1: Single task (T004) — product page hook integration
- US2: Three parallel tasks (T005, T006, T007) for login/cart/error, then T008 for home/search
- US3: Single verification task (T009) — confirms search behavior from T008

### Parallel Opportunities

- T001 and T003 can run in parallel (different files)
- T005, T006, T007 can all run in parallel (different files, no dependencies between them)
- US1 (Phase 2) and US2 (Phase 3) can run in parallel after Setup completes (different page files)

---

## Parallel Example: User Story 2

```text
# After Setup (Phase 1) is complete, launch these in parallel:
Task T005: "Add usePageTitle('Inloggen') to LoginForm in src/app/login/page.tsx"
Task T006: "Add usePageTitle('Winkelwagen') to CartPage in src/app/cart/page.tsx"
Task T007: "Add usePageTitle() to Error in src/app/error.tsx"

# Then sequentially:
Task T008: "Add usePageTitle(urlQuery || undefined) to SearchPage in src/app/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001 → T002, T003)
2. Complete Phase 2: User Story 1 (T004)
3. **STOP and VALIDATE**: Product pages show dynamic titles
4. Build succeeds, lint passes

### Incremental Delivery

1. Setup → Constants + hook + layout update ready
2. Add User Story 1 → Product pages have dynamic titles (MVP!)
3. Add User Story 2 → Login, cart, home, error pages have titles
4. Add User Story 3 → Search queries reflected in titles
5. Polish → Final lint/build/manual validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No test framework installed; validation is via `npm run lint`, `npm run build`, and manual browser inspection
- All tasks modify existing files except T002 (new file: `src/hooks/use-page-title.ts`)
- Commit after each phase for clean incremental history
