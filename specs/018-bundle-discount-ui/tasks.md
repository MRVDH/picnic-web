# Tasks: Bundle Discount UI

**Input**: Design documents from `/specs/018-bundle-discount-ui/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No testing framework is configured. Tests are not included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Upgrade picnic-api and verify the build still works

- [x] T001 Update picnic-api dependency from ^4.1.0 to ^4.3.0 in package.json and run npm install
- [x] T002 Run `npm run build` and `npm run lint` to verify no breaking changes from the upgrade; fix any type errors or API changes introduced by picnic-api 4.3.0

**Checkpoint**: Project builds and lints cleanly with picnic-api 4.3.0

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared changes needed by multiple user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Add a "bundle" badge variant (red background, white text) to the Badge component in src/components/badge.tsx and add the variant to the Badge type in src/lib/types.ts
- [x] T004 [P] Update the BUNDLES_BUTTON decorator mapping in src/lib/parse-cart.ts to produce a badge with variant "bundle" and text "BundelBonus" instead of the current variant "info" with text "Bundel"

**Checkpoint**: Foundation ready — badge variant exists and cart parser produces "BundelBonus" badges

---

## Phase 3: User Story 5 — Update picnic-api Package (Priority: P1) 🎯 MVP

**Goal**: Verify picnic-api 4.3.0 is installed and the application runs without errors

**Independent Test**: Run `npm run build && npm run lint`; open the app and confirm pages load

*This story is satisfied by Phase 1 (T001, T002). No additional tasks needed.*

**Checkpoint**: picnic-api 4.3.0 installed and working

---

## Phase 4: User Story 4 — Remove Warning Banner (Priority: P1)

**Goal**: Remove the amber "Bundelkortingen zijn op dit moment niet zichtbaar" banner from the PDP

**Independent Test**: Open any product detail page and confirm no amber warning banner is visible

### Implementation

- [x] T005 [US4] Remove the amber warning banner div (lines 104-106: the `<div className="bg-amber-100 ...">` block) from src/app/product/[id]/page.tsx

**Checkpoint**: PDP loads with no bundle-discount warning banner

---

## Phase 5: User Story 1 — PDP Bundle Price Tiers (Priority: P1)

**Goal**: Display a horizontal price tier grid ("Vanaf 1: €1.19", "Vanaf 2: €1.17", etc.) on the PDP with the active tier highlighted based on cart quantity

**Independent Test**: Navigate to a bundle-eligible product, add items to cart, and verify the tier grid highlights the correct tier and the unit price updates

### Implementation

- [x] T006 [US1] Refactor the bundle display in src/components/product-price-section.tsx: replace the vertical list layout (the `bundles.length > 1` block) with a horizontal flex grid of tier boxes. Each box shows "Vanaf {quantity}" as a label and the per-unit price below. The component must accept cart quantity (or use cart context) to determine the active tier and apply a visually distinct background (e.g., darker/highlighted) to the active tier box. Inactive tiers show a lighter background. Prices in the active tier should use the discount color (red/dark red text). Render the grid even when only 1 bundle option exists (the base price tier). Use `formatPrice` for all price display. The grid should be responsive — horizontal row on desktop, wrapping on narrow screens.
- [x] T007 [US1] Update the PDP page component src/app/product/[id]/page.tsx to pass cart context data (current quantity for this product) to ProductPriceSection so the active tier can be determined. Import and use the `useCart` hook to get the quantity for the current product ID. Also update the unit price display in ProductInfoHeader (the €/l or €/kg value) to reflect the active bundle tier price when applicable — compute the effective unit price based on active tier and pass it as a prop or compute it within the component.

**Checkpoint**: PDP shows the tier grid matching the app design; active tier highlights correctly as cart quantity changes

---

## Phase 6: User Story 2 — PLP Tile Bundle Savings (Priority: P1)

**Goal**: PLP tiles show savings badge, strikethrough pricing, and dot indicators when bundle thresholds are active

**Independent Test**: Search for a bundle-eligible product, increment quantity from 1 to 3, verify savings badge amounts, price updates, and dot indicators at each step

### Implementation

- [x] T008 [US2] Verify the existing PLP bundle display works correctly after the picnic-api 4.3.0 upgrade by manually testing with a bundle-eligible product in src/components/product-card.tsx. If the savings badge ("€X.XX bespaard") does not appear or shows incorrect values, debug and fix the `getActiveBundlePrice` function and the `bundleProgress` computation. Ensure the `SavingsLabel` renders above the quantity stepper (not elsewhere), matching Image 2 and Image 3 from the spec. Verify the savings badge shows green text (currently uses `text-picnic-red` — update to green if needed to match the app design: green background with white text, positioned as a floating badge above the product image area).
- [x] T009 [US2] Update the SavingsLabel component in src/components/savings-label.tsx to match the app design from the reference images: green background badge with white text showing "€X.XX bespaard", positioned as a floating label. Currently it renders as inline red text — change to a green background pill/badge style. Update the parent component (CartActionOverlay in src/components/product-card.tsx) to position the savings label as a floating badge above the quantity stepper area.

**Checkpoint**: PLP tiles show correct savings badges, strikethrough pricing, and dot indicators matching the app design

---

## Phase 7: User Story 3 — Cart Line Item Bundle Badge (Priority: P2)

**Goal**: Cart line items display a "BundelBonus" badge and strikethrough pricing for bundle-discounted items

**Independent Test**: Add 3+ units of a bundle-eligible product, open cart, verify "BundelBonus" badge appears with correct strikethrough/discounted pricing

### Implementation

- [x] T010 [US3] Verify that cart line items in src/components/cart-item.tsx correctly display the "BundelBonus" badge (from T004) and strikethrough pricing after the picnic-api upgrade. The `PriceDisplay` component already handles strikethrough when `originalPrice > displayPrice` — confirm this works for bundle-discounted items. If the cart API now returns additional bundle-related data (e.g., per-line savings, bundle tier info), update the cart parser in src/lib/parse-cart.ts and the CartItem type in src/lib/types.ts to capture and display this data. Ensure the badge renders with the "bundle" variant styling (red background, white text) from T003.

**Checkpoint**: Cart shows "BundelBonus" badge and correct pricing for bundle-discounted items

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [x] T011 [P] Run `npm run build && npm run lint` and fix any errors across all modified files
- [x] T012 Run the full manual test scenario from specs/018-bundle-discount-ui/quickstart.md: verify PDP tier grid, PLP savings badges, cart bundle badges, and absence of warning banner
- [x] T013 Verify graceful degradation: test with a product that has no bundle thresholds and confirm no tier grid, no dots, no savings badge, and standard pricing display on PDP, PLP, and cart

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001-T002 must pass)
- **US5 (Phase 3)**: Satisfied by Phase 1
- **US4 (Phase 4)**: Can start after Phase 1 — independent of Phase 2
- **US1 (Phase 5)**: Depends on Phase 2 (needs badge variant for consistent styling)
- **US2 (Phase 6)**: Depends on Phase 1 (needs picnic-api 4.3.0 data); can run parallel to US1
- **US3 (Phase 7)**: Depends on Phase 2 (needs "bundle" badge variant and cart parser update)
- **Polish (Phase 8)**: Depends on all story phases complete

### User Story Dependencies

- **US5 (P1)**: Satisfied by setup — no story-specific tasks
- **US4 (P1)**: Independent — just banner removal
- **US1 (P1)**: Needs cart context for active tier — independent of other stories
- **US2 (P1)**: Needs picnic-api 4.3.0 data — independent of other stories
- **US3 (P2)**: Needs badge variant from Phase 2 — independent of US1/US2

### Parallel Opportunities

- T003 and T004 can run in parallel (different files)
- US4 (T005) can run in parallel with Phase 2 (T003, T004)
- US1 (T006-T007) and US2 (T008-T009) can run in parallel after Phase 2
- T011 can run in parallel with other polish tasks

---

## Parallel Example: Phase 2

```bash
# These tasks touch different files and can run simultaneously:
Task: "Add bundle badge variant in src/components/badge.tsx"
Task: "Update BUNDLES_BUTTON mapping in src/lib/parse-cart.ts"
```

## Parallel Example: User Stories

```bash
# After Phase 2, US1 and US2 can proceed in parallel:
Task: "Refactor PDP bundle display in src/components/product-price-section.tsx" (US1)
Task: "Verify PLP bundle display in src/components/product-card.tsx" (US2)
```

---

## Implementation Strategy

### MVP First (US5 + US4 + US1)

1. Complete Phase 1: Setup (upgrade picnic-api)
2. Complete Phase 2: Foundational (badge variant + cart parser)
3. Complete US4: Remove warning banner
4. Complete US1: PDP tier grid
5. **STOP and VALIDATE**: Test PDP independently — tier grid works, no banner
6. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Add US4 + US5 → Banner removed, API upgraded → Deploy
3. Add US1 → PDP tier grid works → Deploy
4. Add US2 → PLP savings badges work → Deploy
5. Add US3 → Cart bundle badges work → Deploy
6. Polish → Final validation → Deploy

---

## Notes

- No test tasks included — project has no testing framework configured
- PLP bundle display (US2) is largely pre-built; tasks focus on verification and design alignment
- Cart bundle display (US3) relies on API-provided data; task focuses on verification after upgrade
- The `parse-cart.ts` file (472 lines) exceeds the 300-line constitution limit — pre-existing, out of scope
