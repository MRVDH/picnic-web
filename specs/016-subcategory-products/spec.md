# Feature Specification: Subcategory Product Listing

**Feature Branch**: `016-subcategory-products`  
**Created**: 2026-04-16  
**Status**: Draft  
**Input**: User description: "Now lets do the final category level, this page shows all the products of that subcategory. The styling and everything should be the same as the search results page. See if you can reuse components. You might have to refactor here and there."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Products in a Sub-category (Priority: P1)

A user browsing the category hierarchy taps on a leaf sub-category (L2 level) and sees all products belonging to that sub-category displayed in the same visual style as search results. The user can browse the product list, see product images, names, prices, and other details identical to the search results layout.

**Why this priority**: This is the core feature — without it, tapping a sub-category is a dead end (currently a no-op). It completes the full category browsing flow: top-level categories → sub-categories → products.

**Independent Test**: Tap any sub-category from the L1 drill-down view → product list appears with the same card/grid layout as search results → products display images, names, prices, and unit info.

**Acceptance Scenarios**:

1. **Given** a user is viewing sub-categories within an L1 category, **When** they tap a leaf sub-category, **Then** the products for that sub-category are fetched and displayed in the same layout as search results.
2. **Given** a user is viewing sub-category products, **When** the products are loading, **Then** a loading spinner is shown.
3. **Given** a user is viewing sub-category products, **When** the data loads successfully, **Then** the product list renders with the same styling, card layout, and information density as the search results page.
4. **Given** a user is viewing sub-category products, **When** they want to go back, **Then** they can navigate back to the sub-category list.

---

### User Story 2 - Add Products to Cart from Sub-category View (Priority: P2)

A user viewing products within a sub-category can add items to their cart using the same cart actions available on the search results page (add/increment/decrement buttons).

**Why this priority**: Cart actions are essential for the shopping flow but depend on the product listing being in place first.

**Independent Test**: Navigate to a sub-category product listing → tap "add to cart" on a product → cart toast confirms the addition → quantity controls appear on the product card.

**Acceptance Scenarios**:

1. **Given** a user is viewing sub-category products, **When** they add a product to their cart, **Then** the same cart interaction (button, toast, quantity controls) as the search results page is available.
2. **Given** a user has added products from a sub-category, **When** they navigate back to sub-categories or top-level categories, **Then** their cart state is preserved.

---

### User Story 3 - Handle Empty and Error States (Priority: P3)

When a sub-category has no products or the fetch fails, the user sees appropriate feedback consistent with the rest of the application.

**Why this priority**: Error handling is important for robustness but is secondary to the happy path.

**Independent Test**: Simulate an API error or empty response → appropriate error message or empty state is displayed with a retry option and back navigation.

**Acceptance Scenarios**:

1. **Given** a user taps a sub-category, **When** the product fetch fails, **Then** an error message is shown with options to retry or go back.
2. **Given** a user taps a sub-category, **When** the sub-category contains no products, **Then** a friendly empty-state message is displayed.
3. **Given** a user's authentication has expired, **When** they try to load sub-category products, **Then** they are redirected to the login page.

---

### Edge Cases

- What happens when the user rapidly switches between sub-categories? Previous requests should be cancelled.
- What happens when the sub-category page contains filter chips or promotional banners alongside products? Only product items are extracted; other elements are ignored.
- What happens when the sub-category name from the API differs from the name shown in the sub-category list? The API page title is preferred, with the list name as fallback.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch and display products when a user taps a leaf sub-category (L2 level).
- **FR-002**: System MUST render sub-category products using the same visual components and layout as the search results page.
- **FR-003**: System MUST show a loading indicator while products are being fetched.
- **FR-004**: System MUST display an error message with retry and back-navigation options when fetching fails.
- **FR-005**: System MUST display a friendly message when a sub-category contains no products.
- **FR-006**: System MUST provide back navigation from the product listing to the sub-category list.
- **FR-007**: System MUST cancel in-flight product requests when the user navigates away.
- **FR-008**: System MUST redirect to the login page when the authentication token has expired.
- **FR-009**: System MUST support cart actions (add to cart, quantity adjustment) on sub-category product cards, identical to search results.
- **FR-010**: System MUST display the sub-category name as a heading above the product listing.
- **FR-011**: System MUST reuse existing product display and cart interaction components rather than duplicating them.

### Key Entities

- **Sub-category Product List**: A collection of products belonging to a specific L2 sub-category, fetched from the category page API. Contains the same product data (name, image, price, unit info, quantity) as search results.
- **L2 Category Page**: The API response for a leaf-level category, containing product article tiles rather than further sub-categories.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate from top-level category → sub-category → product listing in under 3 taps.
- **SC-002**: Sub-category product display is visually identical to search results — same card layout, information, and spacing.
- **SC-003**: Cart actions on sub-category products behave identically to cart actions on search result products.
- **SC-004**: Navigation back from products to sub-categories is instantaneous (no re-fetch of cached sub-category data).
- **SC-005**: All code changes pass lint and build validation with zero errors.

## Assumptions

- The L2 category page API returns product data in a parseable structure containing article tiles with the same fields as search result products.
- The existing product grid component and cart action components from the search results page can be reused with minimal or no modification.
- The "Snel naar" shortcuts section remains hidden when viewing sub-category products (same as sub-category view).
- Filter chips present on L2 pages are out of scope for this feature — only product listing is implemented.
- The navigation depth is fixed at three levels: top-level categories → L1 sub-categories → L2 products. No deeper nesting exists.
- Product detail page navigation from sub-category products works the same as from search results.
