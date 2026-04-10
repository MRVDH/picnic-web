# Tasks: Section Navigation Badges

**Input**: Design documents from `/specs/003-section-nav-badges/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No test runner configured. Validation via `npm run lint && npx tsc --noEmit && npm run build`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure that ALL user stories depend on. Must be complete before any story work begins.

**Why foundational**: The section `id` attributes on `<section>` elements are required by US1 (scroll targets), US2 (sticky positioning context), and US3 (IntersectionObserver targets). Without these IDs, no story can function.

- [X] T001 Add `SECTION_ID_PREFIX` constant and `buildSectionId` helper function to `src/lib/types.ts`
- [X] T002 Add `id` attributes to `<section>` elements in `src/components/product-grid.tsx` using `buildSectionId(index)` for each section, and add `scroll-margin-top` CSS class to account for sticky header + badge bar height (FR-010)

**Checkpoint**: Section elements now have stable DOM IDs. All user stories can proceed.

---

## Phase 2: User Story 1 — Click Badge to Navigate to Section (Priority: P1) 🎯 MVP

**Goal**: Render a horizontal badge bar with one badge per section. Clicking a badge smooth-scrolls to that section.

**Independent Test**: Search for "tomaten", verify badge bar appears with section titles, click any badge and confirm the page smooth-scrolls to the corresponding section header (not hidden behind sticky elements).

**Covers**: FR-001, FR-002, FR-004, FR-007, FR-009, FR-010, FR-011

### Implementation for User Story 1

- [X] T003 [US1] Create `SectionNavBar` component in `src/components/section-nav-bar.tsx` — accepts `sections: SearchSection[]` prop, renders horizontal badge bar with one pill-shaped badge per section (active: `bg-picnic-red text-white`, inactive: `bg-gray-100 text-gray-700`), handles click events that call `scrollIntoView({ behavior: 'smooth', block: 'start' })` on the target section element via `buildSectionId`, uses `overflow-x: auto` for horizontal scrolling, returns `null` when sections array is empty
- [X] T004 [US1] Integrate `SectionNavBar` into `src/app/page.tsx` — import and render inside the sticky `<header>` element (after the existing header content div), pass `sections` from search state, only render when `searchState.status === "success"` and `sections.length > 0`
- [X] T005 [US1] Run validation: `npm run lint && npx tsc --noEmit && npm run build`

**Checkpoint**: Badge bar renders, badges are clickable, smooth-scroll works with correct offset. First badge is visually highlighted (static — not yet scroll-aware). MVP complete.

---

## Phase 3: User Story 2 — Sticky Badge Bar While Scrolling (Priority: P1)

**Goal**: The badge bar remains pinned below the site header when the user scrolls down through results.

**Independent Test**: Search for "tomaten", scroll down through several screens of results, verify the badge bar remains visible at the top below the site header at all scroll positions.

**Covers**: FR-003

### Implementation for User Story 2

- [X] T006 [US2] Verify sticky behavior of badge bar in `src/components/section-nav-bar.tsx` — since the badge bar is rendered inside the sticky `<header>` container (per R-003), it inherits sticky positioning automatically. Ensure the badge bar has appropriate border/background styling (`border-t border-card-border bg-white/95 backdrop-blur-sm`) to visually separate it from the header content and provide the same frosted glass effect. Adjust padding to match the header's horizontal rhythm (`px-6`).
- [X] T007 [US2] Run validation: `npm run lint && npx tsc --noEmit && npm run build`

**Checkpoint**: Badge bar sticks with the header during scroll. US1 + US2 together provide a fully functional navigation bar.

---

## Phase 4: User Story 3 — Active Badge Highlights Current Section (Priority: P2)

**Goal**: The active badge dynamically changes as the user scrolls through sections. The current section's badge is highlighted in Picnic red. The badge bar auto-scrolls to keep the active badge visible.

**Independent Test**: Search for "tomaten", scroll through different sections, verify that the highlighted (red) badge changes to match whichever section is currently at the top of the viewport. Click a badge, verify the active state updates after scroll completes.

**Covers**: FR-005, FR-006, FR-008

### Implementation for User Story 3

- [X] T008 [P] [US3] Create `useScrollSpy` hook in `src/hooks/use-scroll-spy.ts` — accepts `sectionCount: number`, uses `IntersectionObserver` to observe all section elements (found via `buildSectionId`), determines which section is nearest the top of the viewport, returns `activeSectionIndex: number` (defaults to `0`). Observer should use a `rootMargin` that accounts for the sticky header+badge bar height. Clean up observer on unmount and when `sectionCount` changes.
- [X] T009 [US3] Integrate `useScrollSpy` into `SectionNavBar` in `src/components/section-nav-bar.tsx` — call `useScrollSpy(sections.length)` to get `activeSectionIndex`, use it to conditionally apply active/inactive badge styles, add `ref` callback on each badge element, and when `activeSectionIndex` changes use `scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })` on the active badge element to auto-scroll the badge bar horizontally (FR-008)
- [X] T010 [US3] Run validation: `npm run lint && npx tsc --noEmit && npm run build`

**Checkpoint**: Full scroll-spy working. Active badge updates on scroll and on click-to-navigate. Badge bar auto-scrolls to keep active badge visible. All 3 user stories complete.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, edge case verification, code quality review.

- [X] T011 Verify edge cases in `src/components/section-nav-bar.tsx` — confirm badge bar is not rendered when sections is empty (FR-009), works correctly with exactly one section, handles long section titles without layout breakage, and horizontal scroll works with 10+ sections
- [X] T012 Run constitution compliance check — verify all new/modified files are under 300 lines, no deep nesting, no magic strings, all names follow conventions (verb-first camelCase functions, descriptive variables, kebab-case files, UPPER_SNAKE_CASE constants)
- [X] T013 Run full validation and manual test per `quickstart.md`: `npm run lint && npx tsc --noEmit && npm run build`, then start dev server and execute all 6 test scenarios from quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately. BLOCKS all user stories.
- **User Story 1 (Phase 2)**: Depends on Phase 1 completion.
- **User Story 2 (Phase 3)**: Depends on Phase 2 (US1) — badge bar must exist before verifying its sticky behavior.
- **User Story 3 (Phase 4)**: Depends on Phase 2 (US1) — badge bar must exist before adding scroll-spy to it. T008 (hook) can be created in parallel with US1/US2 since it's a separate file.
- **Polish (Phase 5)**: Depends on all user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational. Creates the badge bar and click-to-scroll.
- **US2 (P1)**: Depends on US1 (badge bar must exist). Adjusts sticky styling.
- **US3 (P2)**: Depends on US1 (badge bar must exist). T008 (useScrollSpy hook) has no dependency on US1 and can be written in parallel.

### Parallel Opportunities

- **T001 + T002**: Sequential (T002 depends on the constant from T001).
- **T008**: Can be written in parallel with T003-T007 (separate file, no dependencies).
- **T011 + T012**: Can run in parallel (independent verification tasks).

---

## Parallel Example: User Story 3

```bash
# The useScrollSpy hook (T008) can be created in parallel with US1/US2 work
# since it's an independent file with no dependencies on the badge bar component:
Task: T008 "Create useScrollSpy hook in src/hooks/use-scroll-spy.ts"
# runs in parallel with:
Task: T003 "Create SectionNavBar component in src/components/section-nav-bar.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational (T001-T002)
2. Complete Phase 2: User Story 1 (T003-T005)
3. **STOP and VALIDATE**: Badge bar renders, click-to-scroll works
4. Optionally start T008 (useScrollSpy) in parallel during validation

### Incremental Delivery

1. Foundational → Section IDs in place
2. Add US1 → Badge bar with click navigation → Validate (MVP!)
3. Add US2 → Sticky behavior confirmed → Validate
4. Add US3 → Scroll-spy + auto-scroll → Validate (Feature complete!)
5. Polish → Edge cases, constitution compliance, full test pass

---

## Notes

- No new npm dependencies needed — all features use native browser APIs
- All new files target well under 300 lines (constitution limit)
- `picnic-red` color token already exists in `globals.css` — no CSS changes needed
- The `buildSectionId` helper is the single shared utility between ProductGrid and useScrollSpy (DRY)
- `scroll-margin-top` on section elements is the key to FR-010 (offset compensation)
