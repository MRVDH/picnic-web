# Tasks: Snel Naar Category Navigation

**Input**: Design documents from `/specs/017-snel-naar-navigation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Create the foundational utility needed by all user stories

- [x] T001 Create deep-link parser utility `parseCategoryIdFromDeepLink(target: string): string | null` in src/lib/parse-deep-link.ts

**Checkpoint**: Deep-link parsing utility ready for use in navigation wiring.

---

## Phase 2: User Story 1 - Navigate to a "Snel naar" category (Priority: P1) 🎯 MVP

**Goal**: Make shortcut tiles clickable so they navigate to the corresponding category page.

**Independent Test**: Tap any "Snel naar" tile on the home page → verify a category page loads with correct content. Use browser back button → verify return to home page.

### Implementation for User Story 1

- [x] T002 [US1] Add `onShortcutTap` callback prop to `ShortcutListProps` and thread it to `ShortcutRow` in src/components/shortcut-list.tsx
- [x] T003 [US1] Wire `onClick={() => onShortcutTap?.(shortcut)}` on the `ShortcutRow` button element in src/components/shortcut-list.tsx
- [x] T004 [US1] Add `onShortcutTap` prop to `CategoryBrowserProps` and pass it through to `<ShortcutList>` in src/app/page.tsx
- [x] T005 [US1] Create `handleShortcutTap` callback using `parseCategoryIdFromDeepLink` and `router.push` in src/app/page.tsx
- [x] T006 [US1] Pass `handleShortcutTap` as `onShortcutTap` to `<CategoryBrowser>` in src/app/page.tsx

**Checkpoint**: Shortcut tiles navigate to category pages. Browser back/forward works. Invalid deep links are silently ignored.

---

## Phase 3: User Story 2 - Visual feedback on shortcut interaction (Priority: P2)

**Goal**: Ensure shortcut tiles show consistent interactive visual feedback (hover, active, cursor) matching regular category tiles.

**Independent Test**: Hover over a shortcut tile → verify pointer cursor and hover state. Click → verify active/pressed state.

### Implementation for User Story 2

- [x] T007 [US2] Verify and align hover/active/cursor styles on `ShortcutRow` button to match `CategoryGrid` tile styles in src/components/shortcut-list.tsx

**Checkpoint**: Shortcut tiles have the same interactive affordances as category tiles.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Validation and cleanup

- [x] T008 Run `npm run lint` and fix any lint errors
- [x] T009 Manual validation: verify all "Snel naar" tiles navigate correctly per quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **User Story 1 (Phase 2)**: Depends on T001 (deep-link parser)
- **User Story 2 (Phase 3)**: No dependency on US1 (independent CSS/style work), but logically follows
- **Polish (Phase 4)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 1 (T001). No dependency on US2.
- **User Story 2 (P2)**: Independent of US1. Can be done in parallel if desired.

### Within User Story 1

- T002 and T003 modify the same file (shortcut-list.tsx) — must be sequential
- T004, T005, T006 modify the same file (page.tsx) — must be sequential
- T002-T003 (shortcut-list.tsx) and T004-T006 (page.tsx) are in different files but T004-T006 depend on the prop added in T002

### Parallel Opportunities

- T007 (US2) can run in parallel with T004-T006 (US1) since they modify different aspects of different files

---

## Parallel Example: User Story 1

```bash
# After T001 (setup), the shortcut-list.tsx and page.tsx changes are sequential within each file:
# Step 1: T002 + T003 (shortcut-list.tsx changes)
# Step 2: T004 + T005 + T006 (page.tsx changes)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Create deep-link parser (T001)
2. Complete Phase 2: Wire navigation on shortcut tiles (T002-T006)
3. **STOP and VALIDATE**: Tap shortcuts → verify category pages load
4. Deploy/demo if ready

### Incremental Delivery

1. T001 → Deep-link parser ready
2. T002-T006 → Shortcuts navigate to categories (MVP!)
3. T007 → Visual polish on interaction states
4. T008-T009 → Lint clean + manual validation

---

## Notes

- Total: 9 tasks (1 setup, 5 US1, 1 US2, 2 polish)
- This is a small feature — all tasks can be completed sequentially in one session
- The deep-link target format from the Picnic API is not documented; T001 implementation should handle common URI patterns and log unrecognized formats for debugging
- Commit after each phase checkpoint
