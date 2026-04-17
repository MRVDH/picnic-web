# Tasks: Cart Delivery Slot Selection

**Input**: Design documents from `/specs/013-cart-delivery-slots/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/delivery-slots-api.md, quickstart.md

**Tests**: No test framework installed. Validation via `npm run lint` and `npm run build` only.

**Organization**: Tasks are grouped by user story (US1: View Slot Banner, US2: Select/Change Slot) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1 or US2)
- Include exact file paths in descriptions

## Path Conventions

- Next.js App Router single-project: `src/` at repository root
- Components: `src/components/`
- Lib/utilities: `src/lib/`
- API routes: `src/app/api/`
- Pages: `src/app/`

---

## Phase 1: Setup

**Purpose**: Runtime discovery and branch setup

- [ ] T001 Create feature branch `013-cart-delivery-slots` from current branch
- [ ] T002 Add temporary `console.log` in `src/lib/parse-cart.ts` inside `parseCartResponse` to log `rawData["selected_slot"]` and `rawData["delivery_slots"]` count, then load cart page to confirm field structure and `state` value. Remove logging after verification.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, utilities, and parsing logic that BOTH user stories depend on. Must complete before any user story work.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 [P] Create delivery slot types in `src/lib/delivery-slot-types.ts`: `DeliverySlotData`, `SelectedSlotData`, `SlotDayGroup`, `DeliverySlotPickerData`, `SetDeliverySlotRequest` — per data-model.md
- [ ] T004 [P] Create date formatting utility in `src/lib/format-delivery-window.ts`: `formatBannerText`, `formatDayTabLabel`, `formatTime`, `getRelativeDayLabel` with Dutch day names and month abbreviations, `NO_SLOT_TEXT` constant — per research.md R4
- [ ] T005 Create delivery slot parser in `src/lib/parse-delivery-slots.ts`: `parseRawSlot`, `parseSelectedSlot`, `identifyGreenSlotIds` (paired window_start heuristic per research.md R3), `groupSlotsByDay`, `parseDeliverySlotsPicker` — uses type guards from `src/lib/type-guards.ts`, types from T003, formatting from T004
- [ ] T006 Add `selectedSlot: SelectedSlotData | null` and `deliveryBannerText: string` fields to `CartData` in `src/lib/types.ts` — import `SelectedSlotData` from `src/lib/delivery-slot-types.ts`, add re-export
- [ ] T007 Integrate delivery slot extraction into `src/lib/parse-cart.ts`: import `parseSelectedSlot` from `src/lib/parse-delivery-slots.ts` and `formatBannerText`, `NO_SLOT_TEXT` from `src/lib/format-delivery-window.ts`. Add ~5 lines to `parseCartResponse` to extract `selectedSlot` and compute `deliveryBannerText`. Update `emptyCartData()` with defaults (`null`, `"Kies je bezorgmoment"`).
- [ ] T008 Run `npm run lint && npm run build` to verify foundational changes compile without errors

**Checkpoint**: Foundation ready — all types, parsing, and formatting are in place. User story implementation can begin.

---

## Phase 3: User Story 1 — View Current Delivery Slot on Cart Page (Priority: P1)

**Goal**: When a user views their cart, they see a delivery slot banner at the top showing their current delivery window or a prompt to choose one. Icons match the native Picnic app. This delivers immediate value without requiring any slot selection interaction.

**Independent Test**: Load the cart page — the banner shows "Kies je bezorgmoment" (if no explicit slot selected via Picnic app) or a formatted time window like "Morgen 14:40 - 15:40" (if a slot was explicitly selected). The banner includes a truck/clock icon on the left and a three-dot menu on the right. Tapping the banner does nothing yet (US2 adds the picker).

### Implementation for User Story 1

- [ ] T009 [US1] Create `src/components/delivery-slot-banner.tsx`: `DeliverySlotBanner` component with props `bannerText: string`, `isExplicit: boolean`, `onTap: () => void`. Layout: truck icon with clock overlay (inline SVG) on left, banner text (bold when explicit, regular when prompt) in center, three-dot menu icon on right. White background, subtle border, rounded corners, full-width clickable. Match native Picnic app visual style per FR-002.
- [ ] T010 [US1] Wire banner into cart page in `src/app/cart/page.tsx`: import `DeliverySlotBanner`, render it in `CartPageContent` above the items list. Pass `cart.deliveryBannerText` and `cart.selectedSlot?.isExplicitSelection ?? false`. For now, `onTap` is a no-op (US2 will add the picker). Ensure `reconcileFromServer` is accessible to `CartPageContent` (pass as prop if needed — required for US2).
- [ ] T011 [US1] Run `npm run lint && npm run build` to verify US1 compiles without errors

**Checkpoint**: User Story 1 is complete. The delivery slot banner is visible on the cart page, correctly showing the slot status. The banner is clickable but does not open a picker yet.

---

## Phase 4: User Story 2 — Select or Change Delivery Slot (Priority: P2)

**Goal**: Tapping the delivery banner opens a modal slot picker with day tabs, green-choice grouping, and single-tap slot selection. After selecting a slot, the modal closes and the cart banner updates. This enables the full delivery slot selection workflow.

**Independent Test**: Tap the banner → picker opens showing loading state → day tabs and grouped slots appear → tap a day tab → slots update for that day → tap a slot → loading spinner on slot → modal closes → banner shows new time window. Tap banner again → picker shows "Geselecteerd door jou" section for the selected slot. Tap X → modal closes without changes.

### Implementation for User Story 2

- [ ] T012 [P] [US2] Create API route `src/app/api/cart/delivery-slots/route.ts` with GET handler: read auth token, build Picnic client, call `sendRequest("GET", "/cart/delivery_slots", null, false)`, parse with `parseDeliverySlotsPicker`, return JSON. Follow same `sendRequest` cast pattern and error handling as `src/app/api/cart/route.ts`. Handle 401 (TOKEN_EXPIRED) and 502 (upstream failure) per contract.
- [ ] T013 [US2] Add POST handler to `src/app/api/cart/delivery-slots/route.ts`: validate `slotId` in request body, call `sendRequest("POST", "/cart/set_delivery_slot", { slot_id: slotId }, false)`, parse with `parseCartResponse`, return full `CartData`. Handle 400 (missing slotId), 401, 502 per contract.
- [ ] T014 [US2] Create `src/components/delivery-slot-picker.tsx`: `DeliverySlotPicker` component with props `isOpen: boolean`, `onClose: () => void`, `onSlotSelected: (updatedCart: CartData) => void`. Internal state machine: LOADING → READY → SELECTING → close/ERROR. On open: fetch `GET /api/cart/delivery-slots`. Layout sections: (1) header with "Kies je bezorgmoment", "Altijd gratis bezorgd!", X close button; (2) horizontally scrollable day tabs; (3) slot list for selected day with conditional grouping (see below). Each slot row shows time window, leaf icon if green, checkmark if selected. Tapping a slot: show spinner on that slot, disable all slots, POST to API, on success call `onSlotSelected`, on failure show error with retry.
- [ ] T015 [US2] Implement slot grouping logic in picker (within `src/components/delivery-slot-picker.tsx`): When selected slot is on current day tab, show "Geselecteerd door jou" section (selected slot with green checkmark) + "Of kies een ander moment" section (remaining slots with leaf icons on green ones). When no selection on current day, show "Groenste keuze voor jouw buurt" (green slots with leaf icon) + "Of kies een ander moment" (regular slots). Hide "Groenste keuze" section when no green slots exist for that day.
- [ ] T016 [US2] Wire picker into cart page in `src/app/cart/page.tsx`: import `DeliverySlotPicker`, add `isPickerOpen` state to `CartPageContent`, update `DeliverySlotBanner` `onTap` to open picker, render `DeliverySlotPicker` with `onSlotSelected` calling `reconcileFromServer` and closing the picker.
- [ ] T017 [US2] Handle edge cases: (1) no available slots — banner still renders, picker shows empty state message; (2) expired selected slot — revert to "Kies je bezorgmoment"; (3) single day — day tab row shows one tab, auto-selected; (4) API error on slot selection — show error message in picker, retain previous selection, allow retry or dismiss.
- [ ] T018 [US2] Run `npm run lint && npm run build` to verify US2 compiles without errors

**Checkpoint**: User Stories 1 AND 2 are both fully functional. The complete delivery slot selection workflow works end-to-end.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, edge case hardening, and cleanup

- [ ] T019 Verify all edge cases from spec.md: no slots available, expired selected slot, single-day availability, no green-choice slots for a day, API failure during selection
- [ ] T020 Verify constitution compliance: check all new files are under 300 lines, check naming conventions, check no deep nesting (max 3 levels), check no magic strings (all labels are constants or from API)
- [ ] T021 Run full validation: `npm run lint && npm run build` — both must pass with zero errors
- [ ] T022 Manual validation per quickstart.md: load cart → verify banner text → open picker → verify day tabs → verify green/regular grouping → select slot → verify banner updates → reopen picker → verify "Geselecteerd door jou" section → close with X → verify no change

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 completion — no dependency on US2
- **US2 (Phase 4)**: Depends on Phase 2 completion — builds on US1 (banner must exist for picker to attach to)
- **Polish (Phase 5)**: Depends on both US1 and US2

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2). Depends only on foundational types/parsing/formatting.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2). Depends on US1 for the banner component (T009) that triggers the picker. T012 (API route) can be built in parallel with US1 tasks.

### Within Each User Story

- US1: Banner component (T009) → page wiring (T010) → lint/build (T011)
- US2: API route GET (T012, parallelizable with US1) → API route POST (T013) → picker component (T014) → grouping logic (T015) → page wiring (T016) → edge cases (T017) → lint/build (T018)

### Parallel Opportunities

- **Phase 2**: T003 (types) and T004 (formatter) can run in parallel — different files, no dependencies
- **Phase 3+4 overlap**: T012 (API route) can start in parallel with T009 (banner) — different files
- **Within Phase 4**: Once T012-T013 are done, T014 can begin

---

## Parallel Example: Phase 2

```
# These can run simultaneously (different files, no dependencies):
Task T003: "Create delivery slot types in src/lib/delivery-slot-types.ts"
Task T004: "Create date formatting utility in src/lib/format-delivery-window.ts"
```

## Parallel Example: US1 + US2 Overlap

```
# T012 can run in parallel with T009-T010 (different files):
Task T009: "[US1] Create delivery-slot-banner.tsx"
Task T012: "[US2] Create API route delivery-slots/route.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T008)
3. Complete Phase 3: User Story 1 (T009-T011)
4. **STOP and VALIDATE**: Banner shows correct slot status on cart page
5. Deploy/demo if ready — delivers immediate user value

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Validate banner → Deploy (MVP — users see slot status)
3. Add User Story 2 → Validate picker → Deploy (full feature — users can select slots)
4. Polish → Final validation → Complete

### Single Developer Strategy

1. Phase 1 → Phase 2 (T003+T004 in parallel) → T005 → T006 → T007 → T008
2. Phase 3: T009 → T010 → T011
3. Phase 4: T012 → T013 → T014 → T015 → T016 → T017 → T018
4. Phase 5: T019 → T020 → T021 → T022
