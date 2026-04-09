# Feature Specification: PLP Cart Actions

**Feature Branch**: `007-plp-cart-actions`  
**Created**: 2026-04-09  
**Status**: Draft  
**Input**: User description: "Let's work on the product cart actions on the PLP (search results). The cart page and PDP are out of scope for now."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a product to the cart from search results (Priority: P1)

A user searches for a product (e.g., "Roomboter") and sees the search results. Each available product card shows an add-to-cart control. When the user taps the add button on a product that is not yet in the cart, the product is added with a quantity of 1. The card transitions from showing a single add button to showing a quantity stepper with minus/plus buttons and the current count (1) displayed between them. The quantity stepper overlays the bottom of the product image area.

**Why this priority**: This is the core shopping action. Without the ability to add products to the cart, no other cart-related functionality has value.

**Independent Test**: Can be fully tested by performing a search, tapping the add button on any product card, and verifying the product appears in the cart with quantity 1. Delivers the fundamental "add to cart" value.

**Acceptance Scenarios**:

1. **Given** a search result showing products with none in the cart, **When** the user taps the add button on a product, **Then** the product is added to the cart with quantity 1, and the card shows a quantity stepper displaying "1" with minus and plus buttons.
2. **Given** a search result showing products, **When** the user adds a product to the cart, **Then** the cart badge in the header updates to reflect the new cart total price.
3. **Given** an unavailable product in the results, **When** the user views that product card, **Then** no add-to-cart control is shown for that product.

---

### User Story 2 - Adjust product quantity from search results (Priority: P1)

After adding a product, the user can increase or decrease the quantity using the plus and minus buttons on the quantity stepper. Tapping plus increments the count by 1. Tapping minus decrements by 1. When the quantity reaches 0, the stepper disappears and the card returns to showing the initial add button. The quantity cannot exceed the product's maximum allowed count.

**Why this priority**: Equally critical as adding — users must be able to adjust quantities and remove items without leaving the search results.

**Independent Test**: Can be tested by adding a product, tapping plus several times to increase quantity, tapping minus to decrease, and finally removing the product by decrementing to 0. Verify the displayed count matches at each step.

**Acceptance Scenarios**:

1. **Given** a product in the cart with quantity 1, **When** the user taps the plus button, **Then** the displayed quantity increases to 2 and the cart is updated.
2. **Given** a product in the cart with quantity 1, **When** the user taps the minus button, **Then** the product is removed from the cart (quantity goes to 0), the stepper disappears, and the initial add button is shown again.
3. **Given** a product in the cart at its maximum allowed count, **When** the user taps the plus button, **Then** nothing happens (the plus button is visually disabled or non-interactive).
4. **Given** a product in the cart with quantity 3, **When** the user taps minus, **Then** the quantity decreases to 2 and the cart total updates accordingly.

---

### User Story 3 - Bundle discount indicator on product card (Priority: P2)

Some products offer bundle discounts (e.g., "buy 3, save per unit"). When such a product is in the cart, the quantity stepper shows dot indicators below the count to communicate the bundle tiers. Each dot represents one unit toward the bundle threshold. Filled dots represent the current quantity; unfilled dots represent the remaining units needed to reach the next bundle discount. When the user reaches a bundle quantity that unlocks a savings amount, a label showing the amount saved (e.g., "€0.08 bespaard") appears above the quantity stepper. The product's displayed price on the card updates to reflect the per-unit bundle price when the discount is active.

**Why this priority**: Bundle discounts incentivize higher quantities and are a key part of the Picnic shopping experience, but the core add/remove functionality must work first.

**Independent Test**: Can be tested by searching for a product that has bundle pricing, adding it to the cart, increasing the quantity past a bundle threshold, and verifying: (a) dots appear and fill as quantity increases, (b) the "bespaard" label appears when the threshold is met, (c) the displayed price changes to the discounted price.

**Acceptance Scenarios**:

1. **Given** a product with a bundle option (e.g., buy 3 for a discount) is in the cart with quantity 1, **When** the user views the quantity stepper, **Then** dot indicators are shown: 1 filled dot and remaining unfilled dots up to the bundle quantity.
2. **Given** a bundle product in the cart with quantity 2 (bundle threshold is 3), **When** the user taps plus to reach quantity 3, **Then** all dots become filled, the "amount saved" label appears (e.g., "€0.08 bespaard"), and the product's displayed price updates to the bundle price.
3. **Given** a bundle product in the cart at the bundle quantity, **When** the user taps minus to go below the threshold, **Then** the savings label disappears and the displayed price reverts to the regular price.
4. **Given** a product without any bundle options, **When** the product is in the cart, **Then** no dot indicators or savings label are shown — only the plain quantity stepper.

---

### User Story 4 - Cart state persistence across search queries (Priority: P2)

When a user performs a new search or navigates back to previous search results, the product cards correctly reflect the current cart state. Products already in the cart show their quantity steppers with the correct count. The user does not lose cart context when browsing different search results.

**Why this priority**: Essential for a seamless shopping experience, but depends on the core add/remove functionality being in place.

**Independent Test**: Can be tested by adding products from one search, performing a different search, returning to the original search, and verifying all quantities are still correctly displayed.

**Acceptance Scenarios**:

1. **Given** the user has added products to the cart from search results for "Roomboter", **When** the user searches for "Melk" and then searches for "Roomboter" again, **Then** the product cards show the correct quantities from the cart.
2. **Given** a product appears in multiple search result sections (e.g., "Opnieuw bestellen" and a category section), **When** the user changes the quantity on one card, **Then** all instances of that product across sections reflect the updated quantity.

---

### Edge Cases

- What happens when the user rapidly taps plus or minus multiple times in quick succession? Mutations are queued per product and applied in tap order; the UI remains responsive via optimistic updates, and stale responses cannot overwrite newer quantities.
- What happens when a cart mutation request fails (e.g., network error)? The UI reverts to the previous state and shows a global toast message.
- What happens when a product becomes unavailable while the user is browsing? The add-to-cart control should not be shown for unavailable products.
- What happens when the user has a product in the cart but it does not appear in the current search results? No action needed — the cart badge in the header still reflects the full cart.
- What happens when the maximum count for a product is 1? The plus button should be disabled after adding 1, and only minus is available.
- What happens when bundle discount data cannot be loaded for a product in the cart? Keep the plain quantity stepper without bundle indicators and continue allowing normal quantity changes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each product card on the search results page MUST display a cart action control (add button or quantity stepper) unless the product is unavailable.
- **FR-002**: The default state for a product not in the cart MUST show a single add-to-cart button (e.g., a "+" icon).
- **FR-003**: When a product is in the cart, the card MUST show a quantity stepper with minus button, current quantity count, and plus button.
- **FR-004**: The quantity stepper MUST overlay the bottom portion of the product image area, matching the visual style shown in the reference screenshots (rounded container with white background, dark icons and count).
- **FR-005**: Tapping the add button MUST add the product to the cart with quantity 1 and transition the card to the quantity stepper view.
- **FR-006**: Tapping plus MUST increment the cart quantity by 1, up to the product's maximum allowed count.
- **FR-007**: Tapping minus MUST decrement the cart quantity by 1. When quantity reaches 0, the product is removed from the cart and the card returns to the add button state.
- **FR-008**: The plus button MUST be visually disabled and non-interactive when the product is at its maximum allowed count.
- **FR-009**: Cart mutations MUST be reflected in the header's cart price badge without requiring a full page refresh.
- **FR-010**: For products with bundle discount options, the quantity stepper MUST show dot indicators representing progress toward the next unmet bundle quantity threshold. Filled dots represent progress toward that next tier; unfilled dots represent the remaining count needed to reach it.
- **FR-011**: When a bundle discount threshold is met, the card MUST display a savings label above the quantity stepper showing the total amount saved (e.g., "€0.08 bespaard").
- **FR-012**: When a bundle discount is active, the product's displayed price on the card MUST update to reflect the discounted per-unit price, styled in the discount color (red).
- **FR-013**: If a cart mutation fails, the UI MUST revert to the previous quantity and indicate the error via a global toast message.
- **FR-014**: The search results page MUST load the current cart state on initial render so product cards can display correct quantities for products already in the cart.
- **FR-015**: When the same product appears in multiple sections of the search results, changing the quantity on one card MUST update all instances of that product across all sections.
- **FR-016**: Bundle discount data MUST be fetched on-demand: (a) on initial page load, for products already in the cart, and (b) when a product is first added to the cart. Bundle data MUST NOT be fetched for all search results upfront.
- **FR-017**: When bundle data has not yet loaded for a product in the cart, the quantity stepper MUST be shown immediately without bundle indicators. Once bundle data arrives, dot indicators and savings labels MUST appear progressively without disrupting the stepper. If bundle data fetch fails, the card MUST remain in this plain stepper state and cart actions MUST continue to work.
- **FR-018**: Rapid repeated plus/minus taps for the same product MUST be processed in order using a per-product mutation queue. The UI MAY update optimistically per tap, but server reconciliation MUST preserve tap order and prevent stale responses from overwriting newer state.

### Key Entities

- **Product**: A purchasable item with an identifier, name, image, price, maximum orderable count, and optional bundle discount tiers. Displayed on the search results page.
- **Cart**: The user's current shopping cart, containing a list of items with quantities and a total price. Managed server-side; the search results page reads and mutates it.
- **Bundle Option**: A discount tier for a product, defining a quantity threshold and a discounted per-unit price. A product may have zero or more bundle options.
- **Cart Action State**: The visual state of a product card's cart control — either "add" (product not in cart) or "stepper" (product in cart, showing quantity with +/- controls and optional bundle indicators).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add a product to the cart from search results in a single tap, with visual confirmation appearing within 1 second.
- **SC-002**: Users can adjust product quantity (increment, decrement, remove) directly from the search results without navigating away.
- **SC-003**: The cart badge in the header reflects the correct total within 2 seconds of any cart mutation.
- **SC-004**: Bundle discount indicators (dots and savings label) appear correctly for 100% of products that have bundle pricing.
- **SC-005**: When a cart mutation fails, the UI reverts and the user sees an error indication within 2 seconds.
- **SC-006**: Product quantities persist correctly across different searches — navigating away and back shows the same quantities.

## Assumptions

- The cart page and product detail page (PDP) are out of scope. Cart actions are only being added to the product listing page (search results).
- The existing Picnic API supports adding and removing products from the cart and returns the updated cart state in the response.
- Bundle discount information is not included in the search response. It is fetched on-demand: for products already in the cart, bundle data is fetched alongside the initial cart state load; for newly added products, bundle data is fetched at the time of the first cart action on that product.
- The header cart badge already fetches cart data on mount; it will need to be updated reactively when cart mutations occur on the search page.
- Authentication is already handled (HTTP-only cookie). Cart operations use the same authenticated session.
- Optimistic UI updates (showing the new quantity immediately before the server confirms) are acceptable to maintain a responsive feel, with rollback on failure.
- The visual design follows the Picnic mobile app patterns as shown in the reference screenshots: quantity stepper overlays the bottom of the image area, bundle dots sit below the count number, and savings labels appear above the stepper.

## Clarifications

### Session 2026-04-09

- Q: How should bundle discount data be sourced, given search results don't include it? → A: On-demand fetching — fetch bundle data for products already in the cart on initial load, and for newly added products at the time of the first cart action. Do not fetch for all search results upfront to avoid API overload.
- Q: How should the stepper behave before bundle data has loaded? → A: Show the plain quantity stepper immediately (progressive enhancement). Bundle dots and savings labels appear once data arrives, without blocking or delaying the stepper.
- Q: How should rapid repeated taps on +/- be handled for one product? → A: Use a per-product mutation queue with optimistic UI; process requests sequentially and reconcile in order.
- Q: How should cart mutation failures be surfaced to the user on PLP? → A: Show a global toast only, while the affected card rolls back to the previous state.
- Q: How should bundle dots behave for products with multiple tiers? → A: Show progress toward the next unmet tier (e.g., after reaching 3, progress advances toward 6).
- Q: How should UI behave if bundle-discount data fetch fails for an in-cart product? → A: Gracefully degrade to the plain stepper (no dots/savings) and keep cart actions available.
