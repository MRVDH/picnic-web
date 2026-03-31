# Feature Specification: Product Detail Page

**Feature Branch**: `005-product-detail-page`  
**Created**: 2026-03-30  
**Status**: Draft  
**Input**: User description: "I want to have product detail pages now. This page should show an image gallery (main image and additional images), the product title, the producer (/brand), additional subtitles such as the weight and price per kg, description, recipes that this is used with or in, a 'combine with' slider, allergen info in the form of badges and a 'bevat mogelijk', bereiding, ingrediënten, a table for the voedingswaarde, extra info section, and a similar products slider. All of this info should come from the API. After this, the search results should of course become clickable and lead to the product detail page. Important note: the data should be parsed from the `product-details-page-root` page. This means that the `getProductDetailsPage` and `getProductDetails` functions from the picnic-api should NOT be used."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Product Detail Page (Priority: P1)

A user navigates to a product detail page (e.g. by entering the URL directly) and sees the full product information. The page displays a gallery with the main product image and additional images that the user can browse through. Below or beside the gallery, the product title, brand/producer, weight, unit price (price per kg/l), and the selling price are shown. Further down, the user can read the product description, view any highlights, and see allergen information displayed as visual badges along with a "bevat mogelijk" notice. Collapsible sections show the bereiding (preparation), ingrediënten (ingredients), a voedingswaarde (nutritional values) table, and extra information. If the product has associated recipes, these are displayed. A "combine with" horizontal slider suggests complementary products, and a "similar products" slider shows alternatives. All data is fetched from the API by requesting the raw `product-details-page-root` Fusion page and parsing it on the server side.

**Why this priority**: This is the core feature — without the detail page itself, nothing else in this feature has value. It delivers the primary user need of viewing comprehensive product information.

**Independent Test**: Can be fully tested by navigating directly to a product detail URL (e.g. `/product/s1001524`) and verifying that all sections render with correct data from the API.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they navigate to `/product/{productId}`, **Then** the page displays the following sections in order from top to bottom: image gallery, title/brand/weight/unit price/selling price, promotion and bundle options (if applicable), description and highlights, allergen badges and "bevat mogelijk" notice, collapsible info sections (bereiding, ingrediënten, voedingswaarde, extra info), recipe associations, "Combineer met" slider, and "similar products" slider.
2. **Given** a product with multiple images, **When** the user views the gallery, **Then** one image is displayed prominently as the main image with a thumbnail strip below it; clicking a thumbnail switches the main image to that image.
3. **Given** a product with a single image, **When** the user views the gallery, **Then** the single image is shown as the main image and no thumbnail strip is displayed.
4. **Given** a product with allergen information, **When** the user views the allergen section, **Then** each allergen is shown as a distinct visual badge, and any "bevat mogelijk" (may contain) allergens are shown separately with a clear label.
5. **Given** a product with collapsible info sections, **When** the page loads, **Then** all accordion sections are collapsed by default; **When** the user taps/clicks a section header (e.g. "Ingrediënten"), **Then** the section expands to show its content, and tapping again collapses it.
6. **Given** a product with similar products, **When** the user views the bottom of the page, **Then** a horizontally scrollable slider displays similar product cards.
7. **Given** a product with "combine with" suggestions, **When** the user views the page, **Then** a horizontally scrollable "Combineer met" slider shows complementary product cards.
8. **Given** a product with nutritional value data, **When** the user expands the "Voedingswaarde" section, **Then** the data is displayed in a structured table format.

---

### User Story 2 - Navigate from Search Results to Product Detail (Priority: P1)

A user performs a search, sees the results grid, and clicks on any product card to navigate to that product's detail page. The product cards in search results become clickable links that lead to the corresponding product detail page. The transition is seamless, and the user can use browser back navigation to return to their search results.

**Why this priority**: Without the ability to navigate from search to product detail, users have no practical way to reach the detail page. This is essential for the feature to be usable in context of the existing application.

**Independent Test**: Can be fully tested by performing a search, clicking a product card, verifying the correct detail page loads, and pressing browser back to return to search results.

**Acceptance Scenarios**:

1. **Given** search results are displayed, **When** the user clicks on a product card, **Then** the browser navigates to `/product/{productId}` for that product.
2. **Given** the user is on a product detail page reached from search, **When** the user presses the browser back button, **Then** they return to the search results page with their previous search query and scroll position preserved.
3. **Given** search results contain product cards, **When** the user hovers over a card, **Then** the card provides a visual affordance indicating it is clickable (e.g. cursor change, subtle highlight).

---

### User Story 3 - Navigate Between Related Products (Priority: P2)

A user is on a product detail page and clicks on a product in the "similar products" slider or the "combine with" slider to navigate to that product's detail page. This allows discovery-driven browsing without returning to search.

**Why this priority**: Cross-navigation between related products enhances the browsing experience but is not essential for the core feature. The detail page and search linking must work first.

**Independent Test**: Can be fully tested by navigating to a product detail page that has similar products, clicking one, and verifying the new detail page loads correctly.

**Acceptance Scenarios**:

1. **Given** a product detail page with similar products, **When** the user clicks a product in the "similar products" slider, **Then** the browser navigates to the detail page for that product.
2. **Given** a product detail page with "combine with" suggestions, **When** the user clicks a product in the "Combineer met" slider, **Then** the browser navigates to the detail page for that product.
3. **Given** the user has navigated through multiple product pages via sliders, **When** the user presses back repeatedly, **Then** the browser history allows returning through each previously viewed product.

---

### User Story 4 - Handle Missing or Unavailable Product Data (Priority: P2)

A user navigates to a product detail page where some data sections are not available (e.g. no description, no recipes, no allergens, no similar products). The page gracefully omits sections that have no data rather than showing empty placeholders. If the product itself cannot be found, the user sees a clear error message.

**Why this priority**: Graceful handling of partial data is important for a polished experience, but the core rendering of complete products takes precedence.

**Independent Test**: Can be tested by navigating to products known to have sparse data and verifying sections are omitted cleanly, and by navigating to an invalid product ID to verify error handling.

**Acceptance Scenarios**:

1. **Given** a product with no description, **When** the page loads, **Then** the description section is not displayed at all.
2. **Given** a product with no allergen information, **When** the page loads, **Then** the allergen section is not displayed.
3. **Given** a product with no similar products, **When** the page loads, **Then** the similar products slider is not displayed.
4. **Given** a product with no collapsible info sections, **When** the page loads, **Then** no accordion/collapsible sections appear.
5. **Given** an invalid product ID in the URL, **When** the page loads, **Then** the user sees a clear "Product not found" message.
6. **Given** the API returns an error (e.g. network failure), **When** the page loads, **Then** the user sees a helpful error message with an option to retry.
7. **Given** the user's authentication token has expired, **When** they try to view a product, **Then** they are redirected to the login page.

---

### Edge Cases

- What happens when the product ID in the URL is malformed or empty? The system shows a "Product not found" page without crashing.
- What happens when the API returns a product with zero images? A placeholder image is shown in place of the gallery.
- What happens when the "voedingswaarde" section contains complex nested data? The table renders all rows faithfully, preserving the structure from the API response.
- What happens when the product has a promotion active? The promotion label (e.g. "1+1 gratis") is displayed prominently near the price.
- What happens when the user navigates to a product detail page while unauthenticated? They are redirected to the login page following the existing auth gate pattern.
- What happens when a "similar product" or "combine with" product shown in a slider no longer exists? Clicking it leads to the error state described in User Story 4, scenario 5.
- What happens when the product has bundle options (buy-more-pay-less)? The bundle options are displayed so the user can see the price per unit for different quantities.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated product detail page accessible at a unique URL per product (using the product's selling unit ID).
- **FR-002**: System MUST fetch product data by requesting the `product-details-page-root` Fusion page from the API and parsing the response server-side. The typed `getProductDetailsPage` and `getProductDetails` convenience functions from picnic-api MUST NOT be used.
- **FR-003**: System MUST display an image gallery showing the main product image prominently. When multiple images are available, a thumbnail strip MUST be shown below the main image; clicking a thumbnail MUST switch the main displayed image.
- **FR-004**: System MUST display the product title, brand/producer name, unit quantity (e.g. weight/volume), and unit price (e.g. price per kg/l) when available.
- **FR-005**: System MUST display the product selling price in euros.
- **FR-006**: System MUST display any active promotion label (e.g. "1+1 gratis") alongside the price when a promotion is active.
- **FR-007**: System MUST display product highlights as a list when available.
- **FR-008**: System MUST display the product description when available.
- **FR-009**: System MUST display allergen information as visual badges, separating confirmed allergens from "bevat mogelijk" (may contain) allergens with a clear label distinction.
- **FR-010**: System MUST display collapsible/accordion info sections for bereiding (preparation), ingrediënten (ingredients), voedingswaarde (nutritional values), and extra information, populated from the API response. All sections MUST be collapsed by default on page load.
- **FR-011**: System MUST render the voedingswaarde (nutritional values) content in a structured table format.
- **FR-012**: System MUST display a horizontally scrollable "similar products" slider showing alternative products when available.
- **FR-013**: System MUST display a horizontally scrollable "Combineer met" (combine with) slider showing complementary products when available.
- **FR-014**: System MUST display recipe associations for the product when available.
- **FR-015**: System MUST display bundle options (buy-more-pay-less) when available, showing the quantity and price per unit for each option.
- **FR-016**: System MUST omit any section for which no data is available rather than showing empty placeholders.
- **FR-017**: Product cards in search results MUST become clickable links that navigate to the corresponding product detail page.
- **FR-018**: Product cards in the "similar products" and "combine with" sliders MUST be clickable links that navigate to the respective product detail pages.
- **FR-019**: System MUST require authentication to view product detail pages, redirecting unauthenticated users to the login page following the existing auth gate pattern.
- **FR-020**: System MUST display a clear error message when a product cannot be found or the API request fails.
- **FR-021**: System MUST handle expired authentication tokens by redirecting the user to the login page with appropriate feedback.
- **FR-022**: System MUST support browser back/forward navigation to and from the product detail page without breaking state.
- **FR-023**: System MUST render page sections in the following order from top to bottom: image gallery, title/brand/weight/unit price/selling price, promotion and bundle options, description and highlights, allergen badges and "bevat mogelijk" notice, collapsible info sections (bereiding, ingrediënten, voedingswaarde, extra info), recipe associations, "Combineer met" slider, "similar products" slider. Sections without data are omitted without affecting the ordering of remaining sections.

### Key Entities

- **Product Detail**: The comprehensive information set for a single product, including identity (ID, name, brand), pricing (display price, unit price, promotions, bundles), media (gallery image IDs), content (description, highlights), dietary/safety info (allergens, "bevat mogelijk"), structured info sections (ingredients, nutritional values, preparation, extra info), and related products (similar products, combine-with suggestions, recipes).
- **Allergen Badge**: A visual indicator for a specific allergen associated with the product, categorized as either a confirmed allergen or a "may contain" allergen.
- **Info Section**: A collapsible content block with a title (e.g. "Ingrediënten") and body content (text or tabular data), displayed in an accordion pattern.
- **Similar Product**: A condensed product reference (ID, name, image, price, unit quantity) shown in the similar products slider.
- **Bundle Option**: A quantity-based pricing option for the product (e.g. buy 2 for a lower per-unit price), with its own selling unit ID, quantity, price per unit, and image.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view all available product information (title, brand, price, images, description, allergens, info sections, similar products) on a single page within 3 seconds of navigation.
- **SC-002**: Users can navigate from any search result to the corresponding product detail page with a single click/tap.
- **SC-003**: Users can browse between related products via the "similar products" and "combine with" sliders without returning to search, completing a cross-navigation in under 2 seconds.
- **SC-004**: Users can expand and collapse all info sections (ingredients, nutritional values, preparation, extra info) independently with a single click/tap each.
- **SC-005**: 100% of product detail pages with available data correctly display all non-empty sections; pages with missing data cleanly omit those sections without visual artifacts.
- **SC-006**: Users encountering an invalid product URL or API error see a clear, actionable error message within 2 seconds.
- **SC-007**: Users can browse through all product gallery images using intuitive navigation controls.
- **SC-008**: Browser back/forward navigation works correctly in 100% of navigation paths involving the product detail page.

## Clarifications

### Session 2026-03-30

- Q: What is the default state of accordion info sections on page load? → A: All sections start collapsed.
- Q: How does the user navigate between gallery images? → A: Thumbnail strip below main image; clicking a thumbnail switches the main image.
- Q: What is the visual ordering of sections on the product detail page? → A: Gallery → Title/Brand/Weight/Price → Promotion/Bundles → Description/Highlights → Allergens → Accordion sections (Bereiding, Ingrediënten, Voedingswaarde, Extra info) → Recipes → "Combineer met" slider → "Similar products" slider.

## Assumptions

- The existing authentication system (HTTP-only cookie `picnic_auth_token`) and auth gate will be reused for protecting the product detail page.
- The `product-details-page-root` Fusion page endpoint returns all the data needed for the product detail page, including recipe associations and "combine with" suggestions, within the nested page tree structure.
- Recipe data and "combine with" data are present in the raw Fusion page response even though the existing `extractProductDetails` helper in picnic-api does not extract them — custom parsing will be needed for these sections.
- Image URLs can be constructed from image IDs using the existing `buildImageUrl` utility already in use across the application.
- Product selling unit IDs (e.g. "s1001524") are URL-safe and suitable for use in URL path segments.
- The "voedingswaarde" section content from the API is structured as markdown text that can be parsed into a table format.
- "Combine with" product data follows a similar structure to "similar products" data in the Fusion page tree.
- The existing search results page preserves its state (query, scroll position) when the user navigates away and returns via browser back, thanks to default browser/framework caching behavior.
