# Tasks: Cart Page Product Actions

**Input**: Design documents from `/specs/008-cart-page-actions/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: No automated test tasks included; feature spec requests manual validation flows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm local implementation baseline and manual validation flow for this feature

- [X] T001 Validate cart feature scripts and lint command coverage in `package.json`
- [X] T002 Confirm and finalize manual validation checklist entries for cart actions in `specs/008-cart-page-actions/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared cart data and header prerequisites required by all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Add `maxCount: number` to `CartItem` in `src/lib/types.ts`
- [X] T004 [P] Extract `max_count` into `CartItem.maxCount` in `src/lib/parse-cart.ts`
- [X] T005 Add optional cart badge override props to `SharedHeader` in `src/components/shared-header.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Adjust Product Quantity on Cart Page (Priority: P1) 🎯 MVP

**Goal**: Let shoppers increment/decrement available cart items inline with a reusable quantity stepper and optimistic feedback.

**Independent Test**: On `/cart`, tapping plus increments quantity and tapping minus decrements quantity; the line item and visible count update immediately.

### Implementation for User Story 1

- [X] T006 [P] [US1] Refactor cart item row structure to keep product link separate from controls in `src/components/cart-item.tsx`
- [X] T007 [US1] Add `onIncrement` and `onDecrement` callback props to `CartItemCard` in `src/components/cart-item.tsx`
- [X] T008 [US1] Render `QuantityStepper` for available items using `item.quantity` and `item.maxCount` in `src/components/cart-item.tsx`
- [X] T009 [P] [US1] Add cart page mutation queue, confirmed snapshot refs, and POST mutation helper in `src/app/cart/page.tsx`
- [X] T010 [US1] Implement optimistic increment/decrement handlers with per-product queue enqueueing in `src/app/cart/page.tsx`
- [X] T011 [US1] Wire `CartPageContent` to pass cart action callbacks into each `CartItemCard` in `src/app/cart/page.tsx`

**Checkpoint**: User Story 1 is functional and independently testable

---

## Phase 4: User Story 2 - Remove Product from Cart (Priority: P1)

**Goal**: Remove products inline by decrementing to zero and transition to empty state when the last item is removed.

**Independent Test**: With a cart item at quantity 1, tapping minus removes it from the list; if it was the last item, the empty-cart state appears.

### Implementation for User Story 2

- [X] T012 [US2] Update optimistic decrement flow to remove an item when its quantity reaches zero in `src/app/cart/page.tsx`
- [X] T013 [US2] Reconcile server cart responses so removed lines stay removed after queue settlement in `src/app/cart/page.tsx`
- [X] T014 [US2] Transition cart page state to empty when `totalCount` becomes zero after optimistic or confirmed updates in `src/app/cart/page.tsx`

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Reactive Cart Totals and Order Summary (Priority: P2)

**Goal**: Keep order summary, minimum-order indicator, header badge, and checkout context in sync with local cart mutations without refresh.

**Independent Test**: Rapid quantity changes on `/cart` update order summary values, minimum-order progress, and header cart badge to the latest state.

### Implementation for User Story 3

- [X] T015 [US3] Store mutable cart data in local page state and derive all cart subcomponent props from that state in `src/app/cart/page.tsx`
- [X] T016 [US3] Reconcile full `CartData` from every successful mutation to refresh totals, deposits, and suggestions in `src/app/cart/page.tsx`
- [X] T017 [US3] Pass reactive `totalPrice` and `totalCount` from cart page into `SharedHeader` in `src/app/cart/page.tsx`
- [X] T018 [US3] Use header badge override values before context/fetch fallback logic in `src/components/shared-header.tsx`

**Checkpoint**: User Stories 1, 2, and 3 are independently functional

---

## Phase 6: User Story 4 - Error Handling and Recovery (Priority: P2)

**Goal**: Roll back failed optimistic changes and show Dutch toast feedback while keeping cart actions usable.

**Independent Test**: Simulate offline mode, tap plus, confirm optimistic change rolls back and toast shows `Er ging iets mis. Probeer het opnieuw.`

### Implementation for User Story 4

- [X] T019 [US4] Add cart toast visibility/message state and render `CartToast` at page level in `src/app/cart/page.tsx`
- [X] T020 [US4] Roll back failed product mutations to the last confirmed cart snapshot in `src/app/cart/page.tsx`
- [X] T021 [US4] Trigger Dutch error toast from mutation queue settlement error handling in `src/app/cart/page.tsx`
- [X] T022 [US4] Ensure cart action handlers remain reusable after rollback so users can retry immediately in `src/app/cart/page.tsx`

**Checkpoint**: All user stories are independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final quality pass across all user stories

- [X] T023 [P] Run lint and resolve feature-related issues in `src/app/cart/page.tsx`
- [X] T024 [P] Run lint and resolve feature-related issues in `src/components/cart-item.tsx`
- [X] T025 [P] Run lint and resolve feature-related issues in `src/components/shared-header.tsx`
- [ ] T026 Execute full manual validation checklist and capture outcomes in `specs/008-cart-page-actions/quickstart.md`

---

## Phase 8: Minimum Order Indicator Rework

**Purpose**: Replace standalone `MinimumOrderIndicator` progress bar with a compact line item inside `OrderSummary`

- [X] T027 Add `minimumOrderValue: number | null` prop to `OrderSummaryProps` and render as a line item in `src/components/order-summary.tsx`. Shows "Minimale bestelwaarde" with formatted value; green checkmark when threshold met.
- [X] T028 Remove `MinimumOrderIndicator` import and usage from `src/app/cart/page.tsx`; pass `minimumOrderValue={cart.minimumOrderValue}` to `OrderSummary`.
- [X] T029 Delete `src/components/minimum-order-indicator.tsx` (no other consumers).
- [X] T030 Lint and typecheck all modified files — 0 errors.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Stories (Phases 3-6)**: Depend on Foundational completion
- **Polish (Phase 7)**: Depends on all target user stories being complete

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational; no user-story dependencies
- **US2 (P1)**: Depends on US1 cart action handlers (decrement-to-zero behavior)
- **US3 (P2)**: Depends on US1 mutation/reconciliation flow; integrates with US2 removals
- **US4 (P2)**: Depends on US1 queue flow and US3 reconciliation state

### Within Each User Story

- Component/API shape changes before handler wiring
- Optimistic updates before reconciliation refinements
- Reconciliation before error recovery and polish

### Parallel Opportunities

- Foundational: `T003` and `T004` can run together
- US1: `T006` and `T009` can run together, then merge in `T011`
- Polish: `T023`, `T024`, and `T025` can run together

---

## Parallel Example: User Story 1

```bash
# Workstream A (component structure)
Task: "T006 [US1] Refactor cart item row structure in src/components/cart-item.tsx"

# Workstream B (page mutation infrastructure)
Task: "T009 [US1] Add mutation queue and confirmed snapshot refs in src/app/cart/page.tsx"
```

## Parallel Example: User Story 3

```bash
# After foundational + US1 queue plumbing is done
Task: "T015 [US3] Derive all cart subcomponent props from local cart state in src/app/cart/page.tsx"
Task: "T018 [US3] Apply header badge override precedence in src/components/shared-header.tsx"
```

## Parallel Example: User Story 4

```bash
# Shared file sequencing required; split by focused edits then merge
Task: "T019 [US4] Add CartToast state/render in src/app/cart/page.tsx"
Task: "T020 [US4] Add rollback-to-confirmed snapshot logic in src/app/cart/page.tsx"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (US1)
3. Validate US1 independent test on `/cart`
4. Demo MVP quantity adjustment flow

### Incremental Delivery

1. Deliver US1 (adjust quantity)
2. Add US2 (remove at zero + empty state)
3. Add US3 (reactive totals + header badge)
4. Add US4 (rollback + toast recovery)
5. Finish with Phase 7 lint/manual validation

### Parallel Team Strategy

1. Developer A: `src/components/cart-item.tsx` tasks (`T006-T008`)
2. Developer B: `src/app/cart/page.tsx` queue/state tasks (`T009-T017`, `T019-T022`)
3. Developer C: `src/components/shared-header.tsx` badge override tasks (`T005`, `T018`, `T025`)

---

## Notes

- All tasks use exact file paths and strict checklist format
- Story labels are applied only to user story phases
- Manual independent tests are defined per story in phase headers
- Keep all user-facing strings Dutch in modified files
