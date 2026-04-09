# Tasks: PLP Cart Actions

**Input**: Design documents from `/specs/007-plp-cart-actions/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/cart-mutation-api.md, quickstart.md

**Tests**: No test framework is configured. Validation is via ESLint and manual browser testing.

**Organization**: Tasks are grouped by user story to enable independent implementation. User Stories 1 & 2 share the same foundational infrastructure (cart context, mutation queue, API route) and are both P1, so they are combined into a single phase since the stepper inherently supports both add and adjust flows.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)

---

## Phase 1: Setup (Shared Types & Utilities)

**Purpose**: New types and pure utility functions with no React dependencies

- [x] T001 [P] Add new types to `src/lib/types.ts`: `CartMutationRequest`, `BundleProgress`, `BundleThreshold`, `CartContextState`, `CartContextActions`
- [x] T002 [P] Create `src/lib/mutation-queue.ts`: per-product sequential mutation queue utility (pure function, no React)

**Checkpoint**: Types compile, mutation queue logic is self-contained

---

## Phase 2: Foundational (API Route + Cart Context)

**Purpose**: Server-side mutation endpoint and client-side cart state management — blocks all UI work

**⚠️ CRITICAL**: No UI component work can begin until this phase is complete

- [x] T003 Add `POST` handler to `src/app/api/cart/route.ts`: read auth token, validate body (`productId`, `action`, `count`), call `sendRequest("POST", "/cart/add_product" | "/cart/remove_product", ...)`, parse response with `parseCartResponse`, return `CartData` or error (400/401/502)
- [x] T004 Create `src/contexts/cart-context.tsx`: `CartProvider` + `useCart` hook — holds `quantities` map, `totalPrice`, `totalCount`, `bundleData` map, `isLoading`; exposes `addProduct`, `removeProduct`, `getQuantity`, `getBundleProgress`; uses mutation queue from T002; implements optimistic updates with rollback on failure

**Checkpoint**: `POST /api/cart` responds correctly via curl/browser; `CartProvider` can be mounted and `useCart` returns state

---

## Phase 3: User Stories 1 & 2 — Add & Adjust Quantity (Priority: P1) 🎯 MVP

**Goal**: Users can add products to cart, increment/decrement quantity, and remove products — all from search result cards. Header badge updates reactively.

**Independent Test**: Search for "roomboter", tap add on a product → stepper appears with "1". Tap plus → "2". Tap minus twice → stepper disappears, add button returns. Header price badge updates after each action.

### UI Components (can be created in parallel)

- [x] T005 [P] [US1/US2] Create `src/components/quantity-stepper.tsx`: minus button, count display, plus button in a rounded overlay container. Props: `quantity`, `maxCount`, `onIncrement`, `onDecrement`. Plus disabled when `quantity >= maxCount`.
- [x] T006 [P] [US1/US2] Create `src/components/cart-toast.tsx`: global fixed-position toast component for error feedback. Shows "Er ging iets mis. Probeer het opnieuw." on cart mutation failure, auto-dismisses after 3 seconds.

### Integration

- [x] T007 [US1/US2] Modify `src/components/product-card.tsx`: import `useCart`; for each product, call `getQuantity(product.id)` to determine state; if quantity === 0 and product is available, show add button; if quantity > 0, show `QuantityStepper`; wire `onIncrement` → `addProduct(product.id)`, `onDecrement` → `removeProduct(product.id)`. Position the control as an overlay on the bottom of the product image area.
- [x] T008 [US1/US2] Modify `src/app/page.tsx`: wrap page content with `<CartProvider>`. On mount, fetch `GET /api/cart` to initialize cart quantities so existing cart items show correct steppers.
- [x] T009 [US1/US2] Modify `src/components/shared-header.tsx`: optionally consume `useCart` context (when available inside `CartProvider`); update cart badge `totalPrice` reactively from context instead of only from its own fetch. Fall back to existing behavior when context is not available.

**Checkpoint**: Full add/adjust/remove flow works from search results. Header badge updates. Error toast shows on failure. Rapid taps are queued correctly.

---

## Phase 4: User Story 3 — Bundle Discount Indicators (Priority: P2)

**Goal**: Products with bundle pricing show dot progress indicators and savings labels on the quantity stepper. Price on card updates to discounted price when threshold is met.

**Independent Test**: Currently no products have active bundles in the API, so test with mock data injected in cart context. Verify: dots appear and fill as quantity changes, savings label appears at threshold, price color changes to red.

### UI Components (can be created in parallel)

- [x] T010 [P] [US3] Create `src/components/bundle-dots.tsx`: renders a row of dots below the quantity count. Props: `totalDots`, `filledDots`. Filled dots are solid, unfilled are outlined/hollow.
- [x] T011 [P] [US3] Create `src/components/savings-label.tsx`: renders "€X.XX bespaard" label above the quantity stepper. Props: `savingsInCents`. Formats cents to euros (e.g., 8 → "€0.08"). Only renders when `savingsInCents > 0`.

### Integration

- [x] T012 [US3] Modify `src/components/quantity-stepper.tsx`: accept optional `bundleProgress: BundleProgress | null` prop and `regularPrice: number` prop. When `bundleProgress` is present, compute `nextUnmetThreshold`, `activeThreshold`, `savings`, `dotsTotal`, `dotsFilled` per data-model transformation rules. Render `BundleDots` below count. Render `SavingsLabel` above stepper when savings > 0.
- [x] T013 [US3] Modify `src/components/product-card.tsx`: pass `getBundleProgress(product.id)` and `product.displayPrice` to `QuantityStepper`. When an active bundle threshold applies, display the discounted price in red alongside (or replacing) the regular price.
- [x] T014 [US3] Extend `src/contexts/cart-context.tsx`: implement on-demand bundle data fetching — (a) on initial cart load, fetch bundle data for products already in cart; (b) on first `addProduct` call for a new product, fetch bundle data. Store in `bundleData` map. Gracefully handle fetch failures (leave product without bundle data).

**Checkpoint**: Bundle dots, savings label, and discounted price render correctly with mock data. Graceful degradation when no bundle data exists.

---

## Phase 5: User Story 4 — Cart State Persistence Across Searches (Priority: P2)

**Goal**: Cart quantities persist correctly when the user performs new searches or navigates between results.

**Independent Test**: Add products from search "roomboter", search "melk", search "roomboter" again — quantities are correct. Change quantity on a product appearing in multiple sections — all instances update.

- [x] T015 [US4] Verify `CartProvider` placement in `src/app/page.tsx` persists across search query changes (provider must not unmount/remount on query change). If it does remount, lift provider higher or preserve state via ref/key strategy.
- [x] T016 [US4] Verify cross-section reactivity: because all `ProductCard` instances consume the same `useCart` context and look up quantity by `product.id`, duplicate products across sections should already reflect changes. Add a manual test scenario and fix if not working.

**Checkpoint**: Quantities survive search changes. Duplicate product cards stay in sync.

---

## Phase 6: Polish & Validation

**Purpose**: Final cleanup, lint pass, and manual testing

- [x] T017 [P] Run `npm run lint` and fix all errors/warnings
- [x] T018 [P] Verify all files stay under 300 lines (constitution III)
- [ ] T019 Manual browser testing: run through all acceptance scenarios from spec.md (US1 §1-3, US2 §1-4, US3 §1-4, US4 §1-2, edge cases)
- [ ] T020 Verify toast error feedback with simulated network failure (e.g., disable network in DevTools)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (types + mutation queue) — BLOCKS all UI work
- **Phase 3 (US1/US2)**: Depends on Phase 2 (API route + cart context)
- **Phase 4 (US3)**: Depends on Phase 3 (stepper must exist before adding bundle UI)
- **Phase 5 (US4)**: Depends on Phase 3 (cart state must exist before testing persistence)
- **Phase 6 (Polish)**: Depends on all previous phases

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel (different files)
- **Phase 3**: T005 and T006 can run in parallel (different files, no dependencies)
- **Phase 3**: T007-T009 are sequential (T007 needs T005; T008-T009 need T004)
- **Phase 4**: T010 and T011 can run in parallel (different files)
- **Phase 4**: T012-T014 are sequential (T012 needs T010/T011; T013 needs T012; T014 extends T004)
- **Phase 5**: T015 and T016 can be done together
- **Phase 6**: T017 and T018 can run in parallel

### Within Each Phase

- Types/utilities before components
- Components before integration
- Integration before validation

---

## Implementation Strategy

### MVP First (Phase 1 → 2 → 3)

1. Complete Phase 1: Types + mutation queue
2. Complete Phase 2: API route + cart context
3. Complete Phase 3: Stepper + product card + page + header integration
4. **STOP and VALIDATE**: Full add/adjust/remove works, header updates, error handling works
5. This delivers US1 + US2 (both P1) — the core shopping experience

### Incremental Delivery

1. Phase 1-3 → MVP: add/remove/adjust products from search results
2. Phase 4 → Bundle indicators (activates when API returns data)
3. Phase 5 → Persistence verification (likely works out of the box)
4. Phase 6 → Polish and validation

---

## Notes

- [P] tasks = different files, no dependencies between them
- All prices are in cents (integer arithmetic, no floating-point)
- All user-facing text is in Dutch
- Bundle UI is built against known data shapes but currently no products have active bundles — test with mock data
- Constitution: max 300 lines per file, SRP, no deep nesting, no magic numbers
- Commit after each task or logical group
