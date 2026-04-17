# Tasks: Cart Credit Settlement Display

**Input**: Design documents from `/specs/012-cart-credit-summary/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: No test framework is installed. Tests are not included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Discover the API field name and add the `creditSettlement` field to the type system and parser — the shared foundation all user stories depend on

- [x] T001 Discover the exact raw API field name for credit settlement by adding temporary logging in `src/lib/parse-cart.ts` — inside `parseCartResponse`, after the `isObject(rawData)` check (line ~362), add `console.log("Raw cart keys:", Object.keys(rawData as Record<string, unknown>))` and `console.log("Raw cart fees:", (rawData as Record<string, unknown>)["fees"])`. Run the app with `npm run dev`, load the cart page with an account that has Picnic credit, check the server console output, then remove the logging lines
- [x] T002 Add `creditSettlement: number` field to the `CartData` type in `src/lib/types.ts` — insert after `membershipSavings: number` (line ~332), with JSDoc comment `/** Picnic credit (tegoed) applied to this order, in cents. 0 when no credit applied. */`
- [x] T003 Extract `creditSettlement` from raw API response in `src/lib/parse-cart.ts` — in `parseCartResponse`, after the `membershipSavings` extraction (line ~386), add `const creditSettlement = asNumber(rawData["<discovered_field_name>"]);` using the field name found in T001. Add `creditSettlement` to the return object (line ~423-433). Also add `creditSettlement: 0` to `emptyCartData()` (line ~436-447)

**Checkpoint**: `CartData` type includes `creditSettlement`. Parser extracts the value from the raw API response. `emptyCartData()` returns `0` for the field. Verify with `npm run lint && npm run build`.

---

## Phase 2: User Story 1 — View Picnic Credit Settlement in Cart Summary (Priority: P1) 🎯 MVP

**Goal**: When a user with Picnic credit views their cart, the order summary ("Besteloverzicht") displays a "Verrekening Picnic Tegoed" line showing the credit amount as a green deduction (minus prefix), consistent with how discounts and membership savings are displayed. The line is hidden when no credit is applied.

**Independent Test**: Log in with an account that has Picnic credit, add items to cart, view the cart page. The "Verrekening Picnic Tegoed" row should appear in green text with a minus prefix, after "Picnic-lidmaatschapsbesparing" and before "Minimale bestelwaarde" / "Totaal". Log in with an account without credit — the row should not appear.

### Implementation for User Story 1

- [x] T004 [P] [US1] Add `creditSettlement` prop to `OrderSummaryProps` type and destructure it in the `OrderSummary` function signature in `src/components/order-summary.tsx` — add `creditSettlement: number;` to the props type (after `membershipSavings`, line ~10) and add `creditSettlement` to the destructured props (line ~36)
- [x] T005 [P] [US1] Pass `creditSettlement={cart.creditSettlement}` prop to the `OrderSummary` component in `src/app/cart/page.tsx` — add it to the existing prop list in `CartPageContent` (between `membershipSavings` and `minimumOrderValue`, around line ~310-311)
- [x] T006 [US1] Add the credit settlement deduction row to `OrderSummary` in `src/components/order-summary.tsx` — insert after the membership savings row (after line ~78) and before the minimum order value row (line ~80). Render conditionally when `creditSettlement > 0`: a `div` with `className="flex justify-between text-picnic-green"`, containing a `span` with text "Verrekening Picnic Tegoed" and a `span` with `−{formatPrice(creditSettlement)}` (using Unicode minus `−` and the existing `formatPrice` utility, matching the discount and membership savings row pattern)

**Checkpoint**: Credit settlement line appears in the cart order summary for accounts with Picnic credit. Line is hidden when credit is zero or absent. Visual style matches existing deduction rows (green text, minus prefix). Verify with `npm run lint && npm run build`.

---

## Phase 3: User Story 2 — Credit Settlement Included in Total Calculation Display (Priority: P2)

**Goal**: The credit settlement line is positioned correctly relative to other line items so the total is visually consistent with all displayed adjustments. Users can trace the math: articles − discounts + deposits − membership savings − credit settlement = total.

**Independent Test**: On an account with Picnic credit, view the cart summary and manually verify that the sum of all visible line items (articles, minus discounts, plus deposits, minus membership savings, minus credit settlement) is consistent with the displayed total. The credit line appears between the other adjustments and the total row.

### Implementation for User Story 2

> **Note**: T006 (from US1) already positions the credit settlement row after membership savings and before minimum order value / total. This means the correct positioning per FR-006 is already implemented. US2 is a verification and acceptance phase for the visual consistency requirement (SC-004).

- [x] T007 [US2] Verify credit settlement row positioning and total consistency in `src/components/order-summary.tsx` — confirm that the row added in T006 appears after membership savings (line ~78) and before the minimum order value indicator (line ~80-95), which is before the total separator and total row (line ~97-101). Verify the total displayed (`totalPrice` from `checkout_total_price`) already includes the credit deduction (the API handles the math). Run `npm run build` to validate no type errors.

**Checkpoint**: Both user stories are complete. The credit settlement line is correctly positioned in the visual hierarchy, and the total is consistent with all displayed line items.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all edge cases and build verification

- [x] T008 [P] Run `npm run lint` and fix any linting errors across all modified files (`src/lib/types.ts`, `src/lib/parse-cart.ts`, `src/components/order-summary.tsx`, `src/app/cart/page.tsx`)
- [x] T009 [P] Run `npm run build` and verify successful compilation with no type errors
- [ ] T010 Run quickstart.md validation — manually verify all scenarios from `specs/012-cart-credit-summary/quickstart.md` (Verification section): (1) credit account shows green deduction row, (2) non-credit account shows no row, (3) cart modifications update the credit amount, (4) row appears in correct position relative to other summary lines

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately. T001 must complete before T003 (field name discovery). T002 and T001 can run in parallel. T003 depends on both T001 (field name) and T002 (type definition).
- **User Story 1 (Phase 2)**: Depends on T002 (type) and T003 (parser). T004 and T005 can run in parallel. T006 depends on T004 (prop must exist in type before rendering).
- **User Story 2 (Phase 3)**: Depends on US1 completion (T006 must have placed the row).
- **Polish (Phase 4)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1) — no dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (the row positioning from T006 is what US2 validates)

### Within Each User Story

- US1: T004 and T005 in parallel (different files), then T006 (depends on T004 for prop type)
- US2: Single verification task (T007)

### Parallel Opportunities

- T001 and T002 can run in parallel (discovery vs. type definition — different files)
- T004 and T005 can run in parallel (component props type vs. page prop passing — different files)
- T008 and T009 can run in parallel (lint vs. build — independent commands)

---

## Parallel Example: User Story 1

```text
# After Setup (Phase 1) is complete, launch these in parallel:
Task T004: "Add creditSettlement prop to OrderSummaryProps in src/components/order-summary.tsx"
Task T005: "Pass creditSettlement prop to OrderSummary in src/app/cart/page.tsx"

# Then sequentially:
Task T006: "Add credit settlement deduction row to OrderSummary in src/components/order-summary.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001 → T002 + T001 parallel, then T003)
2. Complete Phase 2: User Story 1 (T004 + T005 parallel, then T006)
3. **STOP and VALIDATE**: Credit settlement line appears for credit accounts, hidden otherwise
4. Build succeeds, lint passes

### Incremental Delivery

1. Setup → API field discovered, type and parser updated
2. Add User Story 1 → Credit settlement row visible in cart summary (MVP!)
3. Add User Story 2 → Positioning and total consistency verified
4. Polish → Final lint/build/manual validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No test framework installed; validation is via `npm run lint`, `npm run build`, and manual browser inspection
- All tasks modify existing files; no new files are created
- T001 (API field discovery) is a prerequisite for T003 — the exact field name placeholder `<discovered_field_name>` in T003 must be replaced with the actual field name found during T001
- Commit after each phase for clean incremental history
