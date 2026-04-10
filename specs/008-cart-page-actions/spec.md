# Feature Specification: Cart Page Product Actions

**Feature Branch**: `008-cart-page-actions`  
**Created**: 2026-04-09  
**Status**: Draft  
**Input**: User description: "Let's add cart product actions to the cart page. Try to reuse functionality from the cart actions of the PLP as much as possible."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Adjust Product Quantity on Cart Page (Priority: P1)

A shopper viewing their cart wants to increase or decrease the quantity of a product directly on the cart page, without leaving to search for the product again. Each cart item shows a quantity stepper (minus, count, plus) that allows them to adjust the quantity. Changes are reflected immediately (optimistic) and the cart totals (price, item count, order summary) update reactively.

**Why this priority**: This is the core interaction — without quantity adjustment, the cart page is purely informational. Every grocery app allows inline quantity changes on the cart page; this is table-stakes functionality.

**Independent Test**: Navigate to the cart page with items already in the cart. Tap the plus button on a product — the count increments, the cart total updates. Tap the minus button — the count decrements. The header badge and order summary reflect the new totals after each action.

**Acceptance Scenarios**:

1. **Given** a cart with 2 units of a product, **When** the user taps plus on that item, **Then** the displayed quantity changes to 3, the line price updates, and the cart total increases accordingly.
2. **Given** a cart item at quantity 1, **When** the user taps minus, **Then** the item is removed from the cart and disappears from the cart item list.
3. **Given** a cart item at its maximum allowed quantity, **When** the user views the stepper, **Then** the plus button is visually disabled and non-functional.
4. **Given** a cart item that is unavailable, **When** the user views the cart, **Then** no quantity stepper is shown for that item (it remains read-only with the existing unavailability overlay).

---

### User Story 2 - Remove Product from Cart (Priority: P1)

A shopper wants to remove a product entirely from their cart. When the quantity reaches zero (by tapping minus at quantity 1), the product is removed from the cart list. The cart totals, order summary, and header badge update reactively. If the cart becomes empty, the user sees an empty-cart state.

**Why this priority**: Removing items is as critical as adjusting quantity — users need to be able to undo accidental additions or change their mind. This is inherently tied to US1 (the stepper handles both adjust and remove).

**Independent Test**: Add a single unit of a product to the cart via the PLP. Navigate to the cart page. Tap minus once — the product disappears from the cart list. If it was the last item, the empty cart state appears.

**Acceptance Scenarios**:

1. **Given** a cart with a single item at quantity 1, **When** the user taps minus, **Then** the item is removed and the empty cart view is displayed.
2. **Given** a cart with 3 items, **When** the user removes one item entirely, **Then** the remaining 2 items are still displayed correctly with updated totals.
3. **Given** a cart that transitions from items to empty, **When** the user views the empty state, **Then** a clear message is shown (e.g., "Je winkelwagen is leeg") with guidance to search for products.

---

### User Story 3 - Reactive Cart Totals and Order Summary (Priority: P2)

When the shopper adjusts quantities or removes items, all cart page components that display totals must update reactively: the order summary (subtotal, discounts, deposits, total), the minimum order indicator progress bar, the header cart badge, and the checkout CTA. The user should not need to refresh the page to see updated totals.

**Why this priority**: While the stepper UI itself (US1/US2) is the core MVP, the totals updating reactively is what makes the experience feel complete. Without this, users must refresh to see correct totals, which is confusing.

**Independent Test**: On the cart page, adjust a product's quantity several times rapidly. Observe that the order summary, minimum order indicator, and header badge all reflect the latest state without page refresh or manual action.

**Acceptance Scenarios**:

1. **Given** a cart with items, **When** the user increments a product, **Then** the order summary total increases, and the minimum order indicator bar progresses.
2. **Given** a cart where quantity changes cause a discount threshold to be met or lost, **When** the user views the order summary, **Then** the discount amount updates accordingly.
3. **Given** rapid successive taps on the stepper, **When** mutations complete, **Then** the final server-confirmed totals are shown (no stale intermediate states persist).

---

### User Story 4 - Error Handling and Recovery (Priority: P2)

When a cart mutation fails (network error, server error), the user sees a toast notification in Dutch ("Er ging iets mis. Probeer het opnieuw."), the optimistic quantity change is rolled back to the last confirmed state, and the cart remains functional for further interactions.

**Why this priority**: Error handling ensures the cart doesn't enter a broken state. While not the primary happy-path interaction, it's essential for reliability.

**Independent Test**: Simulate a network failure (e.g., disable network in DevTools), tap plus on a cart item. The quantity briefly increases, then rolls back. A toast message appears and auto-dismisses.

**Acceptance Scenarios**:

1. **Given** a network error occurs during a cart mutation, **When** the mutation fails, **Then** the item's quantity rolls back to the server-confirmed value and a toast appears.
2. **Given** a failed mutation, **When** the toast auto-dismisses after a few seconds, **Then** the user can retry the action normally.
3. **Given** multiple rapid taps followed by a failure, **When** the queue processes, **Then** only the failed mutation is rolled back; prior successful mutations remain applied.

---

### Edge Cases

- What happens when a product becomes unavailable between page load and a quantity change? The server response will include the updated unavailability status; the item should be re-rendered with the unavailability overlay and the stepper removed.
- What happens when two browser tabs have the cart page open and one changes quantities? The other tab's state will be stale until its next mutation or page refresh. No cross-tab synchronization is required.
- What happens when the user navigates from PLP (with cart state) to the cart page? The cart page must fetch its own fresh state; it should not rely on PLP state surviving navigation.
- What happens if the cart response returns a quantity different from what was expected (e.g., server capped the quantity)? The reconciliation from the server response should override the optimistic local state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each available cart item on the cart page MUST display a quantity stepper with minus, count, and plus controls, positioned inline on the right side of the item row (replacing the current static quantity text).
- **FR-002**: The quantity stepper MUST reuse the existing stepper component built for the PLP.
- **FR-003**: Tapping plus MUST increment the product quantity by 1, with an optimistic UI update.
- **FR-004**: Tapping minus MUST decrement the product quantity by 1, with an optimistic UI update.
- **FR-005**: When quantity reaches 0, the product MUST be removed from the displayed cart item list.
- **FR-006**: The plus button MUST be disabled when quantity reaches the product maximum allowed count.
- **FR-007**: Unavailable cart items MUST NOT show a quantity stepper.
- **FR-008**: Cart mutations MUST use the same API endpoint and mutation queue pattern as the PLP cart actions.
- **FR-009**: On mutation failure, the quantity MUST roll back to the last server-confirmed value.
- **FR-010**: On mutation failure, a toast notification MUST appear with the message "Er ging iets mis. Probeer het opnieuw."
- **FR-011**: The order summary, minimum order indicator, header badge, and checkout CTA MUST update reactively when quantities change.
- **FR-012**: When the last item is removed from the cart, the page MUST transition to an empty cart state.
- **FR-013**: The cart page MUST fetch fresh cart data on mount (not rely on state from other pages).
- **FR-014**: The cart page MUST reuse the existing cart context and mutation infrastructure to manage cart state.
- **FR-015**: The maximum allowed count for each cart item MUST be extracted from the cart API response and included in the cart item data model so the stepper can enforce quantity limits.

### Key Entities

- **CartItem**: An item in the user's cart with product ID, name, quantity, price, availability status, and maximum allowed count (extracted from API response).
- **CartData**: The full cart state including items, totals (price, count, discount, deposits), minimum order value, and suggestion products.
- **QuantityStepper**: Reusable UI control with minus/count/plus, already built for the PLP.
- **MutationQueue**: Per-product sequential queue ensuring rapid taps are processed in order, with rollback on failure.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can adjust product quantities on the cart page without navigating away — task completion under 2 seconds per adjustment.
- **SC-002**: Cart totals (price, count, summary) update within 1 second of a quantity change, before the server response arrives (optimistic).
- **SC-003**: Removing the last item from the cart correctly transitions to the empty cart state on 100% of attempts.
- **SC-004**: Failed mutations roll back to the correct quantity on 100% of failure scenarios, with no stale or incorrect quantities persisting.
- **SC-005**: The existing PLP cart actions continue to work identically — no regressions from this feature.
- **SC-006**: All user-facing text remains in Dutch.

## Assumptions

- The existing `QuantityStepper` component, cart context, mutation queue, and cart toast can be reused directly or with minimal adaptation for the cart page.
- The cart API route already supports add and remove operations and returns the full updated cart data — no backend changes are needed.
- The current cart item data model does not include a maximum allowed count field; it will be extracted from the `max_count` field in the cart API response during parsing.
- The cart page currently does not use shared cart state management; it will need to be integrated with the existing cart context provider.
- Bundle discount indicators (dots, savings labels) are out of scope for the cart page in this feature, since no products currently have active bundle data from the API.
- The "Niets vergeten?" suggestion slider does not need cart actions (it links to product pages, not inline add-to-cart).

## Clarifications

### Session 2026-04-09

- Q: Where should the quantity stepper appear on each cart item row? → A: Inline on the right side of the row, replacing the current static quantity text.
- Q: How should maxCount be determined for cart items? → A: Extract `max_count` from the cart API response during parsing, add to CartItem type.
