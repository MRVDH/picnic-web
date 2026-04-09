# Feature Specification: Cart Page

**Feature Branch**: `006-cart-page`  
**Created**: 2026-03-31  
**Status**: Draft  
**Input**: User description: "Create the cart page with product list, pricing summary, suggestions, and additional cart data"

## Clarifications

### Session 2026-04-01

- Q: Does the cart page allow users to modify item quantities or remove items? → A: Read-only; users can only review cart contents.
- Q: Should products in the cart be clickable and navigate to the product detail page? → A: Yes, products link to product detail page.
- Q: Should the cart auto-refresh while the user is viewing the page? → A: No; fetch once on page load.
- Q: Should replacement product suggestions be clickable? → A: Yes, link to product detail page.
- Q: Should "Niets vergeten?" suggested products be clickable? → A: Yes, link to product detail page.
- Q: Which Cart API field to display as the order total — `total_price` or `checkout_total_price`? → A: `checkout_total_price` (final amount including fees and deposits).
- Q: If the minimum order value API call fails (but a slot is selected), what should the indicator do? → A: Hide the indicator silently (same behavior as no slot selected).

### Session 2026-04-04

- Q: Should the cart icon with price badge appear on all authenticated pages, or only specific pages? → A: All authenticated pages (search, product detail, cart).
- Q: How should non-cart pages fetch cart data for the header badge? → A: Reuse the full `GET /api/cart` endpoint on every page.
- Q: When cart data fetch fails on a non-cart page, what should the header cart icon do? → A: Show icon without badge (silent degradation).
- Q: While cart data is loading, should the cart icon badge show a loading state? → A: Show icon without badge until data loads.
- Q: Should extracting a shared header component be part of the 006-cart-page feature scope? → A: Yes, part of this feature's scope.

### Session 2026-04-07

- Q: How should the raw cart response be typed when using `sendRequest` instead of the typed `getCart()` method? → A: Keep the response as `unknown` and validate/extract fields at runtime in `parseCartResponse`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Cart Contents (Priority: P1)

A logged-in user navigates to the cart page to review the products they have added. They see a list of all items in their cart, each showing the product image, name, subtitle (unit quantity), quantity, and current price. If a product has a discount, both the original and discounted price are shown. Discount labels (e.g., "1 + 1 gratis") and bundle labels are displayed on the relevant items.

**Why this priority**: The product list is the core of the cart page. Without it, nothing else makes sense. This is the minimum viable product that delivers value.

**Independent Test**: Can be fully tested by adding products to the cart (via the Picnic app or API), navigating to the cart page, and verifying each item displays all required data fields correctly.

**Acceptance Scenarios**:

1. **Given** a user has 5 products in their cart, **When** they open the cart page, **Then** all 5 products are displayed with image, name, subtitle, quantity, and price.
2. **Given** a product in the cart has a discount, **When** the cart page loads, **Then** the original price is shown with a strikethrough and the discounted price is shown prominently.
3. **Given** a product has a discount label (e.g., "2 voor €3"), **When** the cart page loads, **Then** the discount label badge is displayed on that product.
4. **Given** a product has a bundle label, **When** the cart page loads, **Then** the bundle label is displayed on that product.
5. **Given** the user has an empty cart, **When** they open the cart page, **Then** a meaningful empty state is shown (e.g., "Je winkelwagen is leeg").

---

### User Story 2 - View Order Summary (Priority: P1)

A user reviews the financial summary of their cart at the bottom or side of the page. They see the total price to pay, the total calculated discount (sum of per-item savings), the deposit total, and the total item count. If the user has membership savings, those are shown separately.

**Why this priority**: The order summary is essential alongside the product list — users need to know the total cost before proceeding. This is co-equal to P1 because a cart page without a summary is incomplete.

**Independent Test**: Can be tested by adding products with known prices and discounts to the cart, then verifying the summary section displays the correct totals.

**Acceptance Scenarios**:

1. **Given** a cart with products totalling €25.50, **When** the cart page loads, **Then** the summary shows "Totaal: €25,50" (formatted in Dutch locale).
2. **Given** a cart where 3 items have discounts saving a total of €4.20, **When** the cart page loads, **Then** the summary shows the total discount (e.g., "Korting: -€4,20").
3. **Given** a cart with 2 bag deposits (€0.25 each), **When** the cart page loads, **Then** the deposit total is shown in the summary (e.g., "Statiegeld: €0,50").
4. **Given** a user has €1.00 in membership savings, **When** the cart page loads, **Then** the membership savings are shown in the summary.
5. **Given** an empty cart, **When** the summary section renders, **Then** all totals show €0,00 or the summary section is hidden with the empty state.

---

### User Story 3 - Minimum Order Value Indicator (Priority: P2)

A user sees how close their cart is to meeting the minimum order value required for delivery. If the cart total is below the minimum, a visual indicator (e.g., progress bar or warning message) shows how much more they need to add. Once the minimum is met, the indicator shows a success state.

**Why this priority**: This prevents user frustration at checkout by surfacing the minimum order constraint early. It is important but the cart page is still useful without it.

**Independent Test**: Can be tested by creating a cart with a total below the minimum order value and verifying the warning appears; then adding items to exceed the minimum and verifying the success state.

**Acceptance Scenarios**:

1. **Given** the minimum order value is €35.00 and the cart total is €22.00, **When** the cart page loads, **Then** an indicator shows "Nog €13,00 tot de minimale bestelwaarde" (or similar).
2. **Given** the cart total meets or exceeds the minimum, **When** the cart page loads, **Then** the indicator shows a success/complete state.
3. **Given** no minimum order value can be determined (e.g., no slot selected or API call fails), **When** the cart page loads, **Then** the minimum order indicator is hidden gracefully.

---

### User Story 4 - Unavailable Product Handling (Priority: P2)

Some products in the cart may become unavailable after they were added (out of stock, delisted). The cart page visually distinguishes these from available products and displays an explanation. If the system suggests replacement products, those are shown alongside the unavailable item.

**Why this priority**: Unavailable products are a common real-world scenario in grocery shopping. Surfacing this clearly prevents confusion and helps users adjust their order.

**Independent Test**: Can be tested by having an unavailable product in the cart (identifiable by its decorator) and verifying the explanation and any replacements are rendered.

**Acceptance Scenarios**:

1. **Given** a product in the cart is marked unavailable, **When** the cart page loads, **Then** the product is visually distinguished (e.g., greyed out or marked with a warning).
2. **Given** an unavailable product has a short explanation, **When** the cart page loads, **Then** the explanation text is shown.
3. **Given** an unavailable product has replacement suggestions, **When** the cart page loads, **Then** the replacement products are displayed (name, image, price).
4. **Given** all products are available, **When** the cart page loads, **Then** no unavailability warnings are shown.

---

### User Story 5 - "Niets vergeten?" Suggestions (Priority: P3)

Below the cart contents, a "Niets vergeten?" (Don't forget?) section shows product suggestions that the user might want to add. This helps increase basket size and reminds users of commonly purchased items.

**Why this priority**: This is a nice-to-have upsell feature. The cart page is fully functional without it. The data source for suggestions needs to be discovered during implementation.

**Independent Test**: Can be tested by loading the cart page and verifying the suggestion section appears with product cards (if data is available). If no suggestions data can be retrieved, the section is simply hidden.

**Acceptance Scenarios**:

1. **Given** the suggestion data source is available and returns products, **When** the cart page loads, **Then** a "Niets vergeten?" section is shown with a horizontal scrollable list of suggested products.
2. **Given** the suggestion data source returns no products or is unavailable, **When** the cart page loads, **Then** the "Niets vergeten?" section is hidden (no error shown).
3. **Given** the user sees a suggested product, **When** they view it, **Then** the product shows an image, name, and price.

---

### User Story 6 - Checkout Call-to-Action (Priority: P3)

Since checkout is out of scope for the web version, a clear message directs users to complete their order in the Picnic app. This sets expectations and prevents user confusion.

**Why this priority**: Low priority since it's a static message, but important for user experience completion.

**Independent Test**: Can be tested by verifying the message text appears in the correct location on the cart page.

**Acceptance Scenarios**:

1. **Given** a user views the cart page with items, **When** they look at the checkout area, **Then** a message indicates they should complete their order in the Picnic app (e.g., "Afrekenen kan via de Picnic app").
2. **Given** the cart is empty, **When** the user views the cart page, **Then** the checkout message is not shown.

---

### User Story 7 - Cart Icon in Header (Priority: P1)

A logged-in user sees a cart icon in the header on every page. The icon has a red badge showing the total cart price (after discounts). Clicking the icon navigates to the cart page. If the cart is empty, no badge is displayed. If cart data is loading or fails to load, the icon is shown without a badge.

**Why this priority**: The cart icon provides the primary navigation path to the cart page and gives users persistent visibility of their cart total across the entire application. Without it, there is no way to reach the cart page.

**Independent Test**: Can be tested by navigating to the search or product detail page with items in the cart, verifying the cart icon appears with the correct total price badge, and clicking to confirm navigation to `/cart`. Empty cart can be tested by verifying no badge is shown.

**Acceptance Scenarios**:

1. **Given** a user has items in their cart totalling €25,50 (after discounts), **When** they are on any authenticated page, **Then** the header shows a cart icon with a red badge displaying "€25,50".
2. **Given** a user has an empty cart, **When** they are on any authenticated page, **Then** the header shows a cart icon without a badge.
3. **Given** the user clicks the cart icon, **When** on any page, **Then** they are navigated to the cart page (`/cart`).
4. **Given** cart data is still loading, **When** the page renders, **Then** the cart icon is shown without a badge until data arrives.
5. **Given** the cart data fetch fails, **When** the page renders, **Then** the cart icon is shown without a badge and remains clickable.

---

### Edge Cases

- What happens when the cart has a very large number of items (50+ products)? The page should render all items without layout breaks, scrollable vertically.
- What happens when the API returns an error fetching the cart? A user-friendly Dutch error message is displayed with a retry option.
- What happens when the user's session expires mid-viewing? The user is redirected to the login page.
- What happens when a product image fails to load? A placeholder image is shown.
- What happens when the deposit breakdown is empty (no deposit items)? The deposit line in the summary is hidden.
- What happens when an item has both a discount label and a bundle label? Both are displayed.
- What happens when `display_price` differs from `price` on a line item? The `display_price` is shown as the current price and `price` as the original, with the difference treated as a discount.
- What happens when the minimum order value API call fails (but a delivery slot is selected)? The minimum order indicator is hidden silently, same as when no slot is selected.
- What happens when the cart data fetch fails on a non-cart page (e.g., search page)? The cart icon in the header is shown without the price badge (silent degradation); the icon remains clickable and navigates to `/cart`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a list of all products currently in the user's cart, each showing: product image, product name, subtitle (unit quantity), quantity in cart, and current price.
- **FR-002**: System MUST show discount pricing when a product's display price differs from its original price — the original price with strikethrough and the discounted price highlighted.
- **FR-003**: System MUST display discount labels (e.g., "1 + 1 gratis", "2 voor €3") on products that have them, sourced from item decorators.
- **FR-004**: System MUST display bundle labels on products that are part of a bundle offer.
- **FR-005**: System MUST show a freshness label (e.g., "6 dagen vers") on products that have one.
- **FR-006**: System MUST display an order summary showing: total price to pay (sourced from `checkout_total_price`, which includes fees and deposits), total calculated discount, deposit total (from deposit breakdown), total item count, and membership savings (if any).
- **FR-007**: System MUST format all prices in Dutch locale (€ symbol, comma as decimal separator, e.g., "€12,50").
- **FR-008**: System MUST show a minimum order value indicator when the cart total is below the required minimum — displaying the remaining amount needed.
- **FR-009**: System MUST show a success state on the minimum order indicator when the cart total meets or exceeds the minimum.
- **FR-010**: System MUST visually distinguish unavailable products from available ones (e.g., greyed out, warning icon).
- **FR-011**: System MUST display the unavailability explanation text for unavailable products.
- **FR-012**: System MUST display replacement product suggestions for unavailable items when provided by the API, showing at minimum: image, name, and price. Each replacement product is clickable and navigates to its product detail page.
- **FR-013**: System MUST show a "Niets vergeten?" section with suggested products if suggestion data is available. If no data is available, the section is hidden without error. Each suggested product is clickable and navigates to its product detail page.
- **FR-014**: System MUST display a message directing users to complete checkout in the Picnic app (e.g., "Afrekenen kan via de Picnic app") when the cart has items.
- **FR-015**: System MUST show a meaningful empty state when the cart has no items.
- **FR-016**: System MUST display a base price text (e.g., "€4.81/l") on products that have one, sourced from the BASE_PRICE decorator.
- **FR-017**: System MUST require authentication — unauthenticated users are redirected to the login page.
- **FR-018**: System MUST display a loading state while cart data is being fetched.
- **FR-019**: System MUST display a user-friendly error message in Dutch with a retry option if the cart data fails to load.
- **FR-020**: System MUST redirect the user to the login page if their session expires during use.
- **FR-021**: System MUST show a placeholder image when a product image fails to load.
- **FR-022**: System MUST NOT provide controls to modify item quantities or remove items from the cart — the cart page is read-only.
- **FR-023**: System MUST make each product in the cart clickable, navigating to the product detail page when clicked.
- **FR-024**: System MUST display a cart icon in the header on all authenticated pages (search, product detail, cart) that navigates to the cart page (`/cart`) when clicked.
- **FR-025**: System MUST display a red badge on the cart icon showing the total cart price after discounts (sourced from `checkout_total_price`), formatted in Dutch locale.
- **FR-026**: System MUST hide the cart icon badge when the cart is empty (i.e., no items in the cart).
- **FR-027**: System MUST show the cart icon without the price badge when the cart data fetch fails on any page (silent degradation); the icon remains clickable.
- **FR-028**: System MUST show the cart icon without the price badge while cart data is loading; the badge appears only after data is successfully fetched.
- **FR-029**: System MUST extract a shared header component used by all authenticated pages (search, product detail, cart), replacing the current per-page inline headers. The shared header includes the cart icon with price badge.

### Key Entities

- **Cart**: The user's current shopping cart — contains a collection of line items, total price, checkout total price (the displayed order total, includes fees and deposits), total item count, deposit breakdown, membership savings, and delivery slot information.
- **Cart Line Item**: A group of one or more articles representing a product entry in the cart — has a display price, actual price, quantity, and decorators (labels, badges, availability status).
- **Cart Article**: An individual product within a line item — has a name, unit quantity, price, image(s), max orderable count, freshness info, and decorators.
- **Deposit Breakdown**: A categorized list of deposit charges (e.g., bag deposit, bottle deposit) with per-type value and count.
- **Unavailable Product**: A cart article marked as unavailable — includes a reason, short/long explanation, and optional replacement suggestions.
- **Replacement Product**: A suggested alternative for an unavailable product — has name, image, price, unit quantity.
- **Minimum Order Value**: The minimum cart total required for the user's selected delivery slot — used to calculate remaining amount needed.
- **Suggestion Product**: A product recommended in the "Niets vergeten?" section — minimal data: image, name, price.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view all cart contents with complete product details (image, name, quantity, price) within 3 seconds of navigating to the cart page.
- **SC-002**: All prices displayed match the values returned by the cart data source, formatted correctly in Dutch locale with no rounding errors.
- **SC-003**: Users can identify discounted products at a glance — original and discounted prices are visually distinct (strikethrough vs. highlighted).
- **SC-004**: Users can determine the total cost of their order (including deposits) from the summary section without scrolling through individual items.
- **SC-005**: Users whose cart is below the minimum order value can see exactly how much more they need to spend, displayed as a specific euro amount.
- **SC-006**: Unavailable products are immediately distinguishable from available products without reading detailed text.
- **SC-007**: The cart page handles all error states gracefully — no broken layouts, no raw error messages, no blank screens.
- **SC-008**: The page is responsive — usable on screens from mobile (320px) to desktop (1920px+) without horizontal scrolling.
- **SC-009**: Users can see their cart total and navigate to the cart page from any authenticated page via the header cart icon, with the price badge accurately reflecting `checkout_total_price`.

## Assumptions

- The existing authentication system (HTTP-only cookie) and login redirect pattern will be reused for the cart page.
- The cart data is fetched from the Picnic API via `sendRequest("GET", "/cart")` using the same cast-based pattern as search and product-detail routes, rather than the typed `client.cart.getCart()` domain service method. The response is raw JSON (not a Fusion page), so `includePicnicHeaders` should be `false` (or omitted). The raw response is kept as `unknown` and fields are validated/extracted at runtime in the `parseCartResponse` function — no picnic-api `Cart` type import is used for casting.
- The "Niets vergeten?" suggestion data source is not yet known. During implementation, the team will investigate potential endpoints (e.g., undocumented `/cart/recommendations`, pre-checkout upsell configs, or other discovery methods). If no endpoint is found, the section will be omitted gracefully.
- Discount per line item is calculated as the difference between `price` (original) and `display_price` (current) on each line item. Total discount is the sum of these per-line differences. This is an approximation since the active cart does not expose a `total_savings` field.
- Delivery slot selection and modification are explicitly out of scope. The selected slot is used read-only to determine minimum order value.
- Checkout functionality is explicitly out of scope. Only a static message directing users to the Picnic app is shown.
- Cart modification (changing quantities, removing items) is explicitly out of scope. The cart page is read-only.
- The "save products to new recipe" feature is explicitly out of scope.
- All user-facing text is in Dutch, consistent with the rest of the application.
- Product images are loaded from the same CDN used by the product detail and search pages.
- Cart data is fetched once on page load; the page does not auto-refresh or poll for updates while the user is viewing it.
- The full `GET /api/cart` endpoint is reused on all authenticated pages to provide cart data for the header badge. No separate lightweight summary endpoint is needed.
