# Feature Specification: Product Search

**Feature Branch**: `004-product-search`
**Created**: 2026-03-27
**Status**: Draft
**Input**: User description: "I want a website for the online supermarket picnic, which currently only has a mobile app. It does not need all the features that the current app has. In the initial version I only want a search function that returns a list of products. I want the products to show up with their image, name, company, price (both regular and if present the discounted price), pieces or kgs etc (basically unit and/or qt, whatever comes out of the API). Also include possible labels like '3 voor €5', 'Klein', '10% korting', 'Snel weer terug', 'Nu buiten het seizoen', etc. Basically whatever label is returned from the API. I used query 'tomaten' to test this."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search for Products by Name (Priority: P1)

A user visits the Picnic web interface and sees a search bar. They type a product name (e.g., "tomaten") and submit their query. The system displays a list of matching products, each showing the product image, name, brand/company, price, unit/quantity information, and any applicable labels or badges (e.g., discounts, seasonal notices, size labels).

**Why this priority**: This is the core and only feature requested for the initial version. Without product search, the website has no functionality. It delivers the primary value of allowing desktop/browser users to browse Picnic's product catalog.

**Independent Test**: Can be fully tested by entering a search term and verifying that a list of product cards appears with all required data fields populated. Delivers the fundamental value of product discovery on web.

**Acceptance Scenarios**:

1. **Given** a user is on the home page, **When** they type "tomaten" into the search bar and submit, **Then** a list of product results is displayed with each product showing its image, name, brand, price, unit quantity, and any applicable labels.
2. **Given** a user has submitted a search query, **When** results are returned, **Then** each product card displays the product image in a recognizable size, the product name, and the brand or company name.
3. **Given** a product has a discounted price, **When** it appears in search results, **Then** both the original price (crossed out) and the discounted price are visible.
4. **Given** a product has labels (e.g., "3 voor €5", "Klein", "10% korting", "Snel weer terug", "Nu buiten het seizoen"), **When** it appears in search results, **Then** all labels returned from the upstream API are rendered as visible badges on the product card.
5. **Given** a product has unit/quantity information (e.g., "6 x 300 ml", "per kg", "500 g"), **When** it appears in search results, **Then** that information is displayed on the product card.
6. **Given** a user submits a search query, **When** there are no matching products, **Then** a clear "no results found" message is displayed.
7. **Given** a user visits the home page for the first time, **When** no search has been performed, **Then** the page displays a clean layout with a prominent search bar and Picnic branding only (no product content).

---

### User Story 2 - Search Suggestions While Typing (Priority: P2)

As a user types into the search bar, the system suggests matching search terms in a dropdown below the input field. The user can select a suggestion to immediately trigger a full search, or continue typing their own query.

**Why this priority**: Search suggestions significantly improve usability by helping users discover product names and reducing typos, but the core search functionality works without them.

**Independent Test**: Can be tested by typing partial text into the search bar and verifying that a dropdown of suggestions appears. Selecting a suggestion triggers a product search.

**Acceptance Scenarios**:

1. **Given** a user is typing in the search bar, **When** they have entered at least 2 characters, **Then** a dropdown of search suggestions appears below the input.
2. **Given** suggestions are displayed, **When** the user clicks on a suggestion, **Then** the search bar is populated with that suggestion and a full product search is triggered.
3. **Given** suggestions are displayed, **When** the user continues typing, **Then** the suggestions update to reflect the new input.
4. **Given** the user is typing rapidly, **When** characters are entered in quick succession, **Then** suggestion requests are debounced so the system does not make excessive calls.

---

### Edge Cases

- What happens when the search query contains only whitespace or special characters? The system MUST treat this as an empty query and not submit a search request.
- What happens when the upstream API is unreachable or returns an error? The system MUST display a user-friendly error message (not a raw error or blank screen).
- What happens when a product has no image? The system MUST display a placeholder image.
- What happens when a product has no brand/company information? The product card MUST still render correctly, omitting the brand field without breaking layout.
- What happens when a product has many labels (5+)? All labels MUST still be displayed without overflowing or hiding content.
- What happens when the user presses Enter with an empty search bar? No search request is made.
- What happens when a user tries to click on a product card? Nothing — product cards are display-only and MUST NOT be clickable or link to any detail page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a search input field prominently placed on the main page where users can type product queries.
- **FR-002**: System MUST submit the search query to the upstream product catalog and display results as a list of product cards.
- **FR-003**: Each product card MUST display the product image, product name, brand/company name (when available), and price.
- **FR-004**: Each product card MUST display the unit and/or quantity information (e.g., "500 g", "6 x 300 ml", "per kg") as returned by the API.
- **FR-005**: Each product card MUST display all labels/badges returned by the API, including but not limited to promotional labels (e.g., "3 voor €5", "1+1 gratis"), size labels (e.g., "Klein"), discount labels (e.g., "10% korting"), availability notices (e.g., "Snel weer terug", "Nu buiten het seizoen"), and freshness labels.
- **FR-006**: When a product has a discounted price, the product card MUST display both the original price (visually struck through) and the current/discounted price.
- **FR-007**: System MUST display a "no results found" message when a search query returns zero products.
- **FR-008**: System MUST display a user-friendly error message when the upstream API is unreachable or returns an error.
- **FR-009**: System MUST provide search suggestions as the user types (after at least 2 characters), displayed in a dropdown below the search input.
- **FR-010**: System MUST debounce search suggestion requests to avoid excessive network calls during rapid typing.
- **FR-011**: System MUST NOT submit a search request when the input is empty or contains only whitespace.
- **FR-012**: System MUST display a placeholder image when a product has no image available.
- **FR-013**: Product images MUST be loaded from the Picnic CDN using the format `https://storefront-prod.${COUNTRY_CODE}.picnicinternational.com/static/images/${imageId}/${size}.png` (always `.png`, never `.webp`).
- **FR-014**: Product cards MUST NOT be clickable or link to any detail page. They are display-only.

### Key Entities

- **Product**: A sellable item in the Picnic catalog. Key attributes: unique identifier, name, brand/company, image, display price (in cents), unit quantity description, maximum order count.
- **Label/Badge**: A visual tag attached to a product conveying additional information. Types include promotional labels, discount indicators, availability notices, size labels, freshness guarantees, and product characteristics.
- **Search Suggestion**: An autocomplete recommendation returned by the API. Key attributes: suggestion text.
- **Search Query**: The text input submitted by the user to find products. Key attributes: query string.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can search for a product by name and see results within 2 seconds of submitting the query.
- **SC-002**: Each product result displays at minimum: image, name, price, and unit quantity information.
- **SC-003**: 100% of labels returned by the upstream API for a product are rendered visibly on the product card.
- **SC-004**: When a product has a discounted price, both the original and discounted price are distinguishable to the user.
- **SC-005**: Search suggestions appear within 500 milliseconds of the user pausing their typing.
- **SC-006**: The search interface is usable on standard desktop screen sizes (1024px width and above).

## Clarifications

### Session 2026-03-27

- Q: What is the canonical image URL format? → A: Always `.png` — `https://storefront-prod.${COUNTRY_CODE}.picnicinternational.com/static/images/${imageId}/${size}.png`. No `.webp` variant exists despite some code references.
- Q: What should the user see before performing any search? → A: Search bar only — clean page with prominent search bar and Picnic branding, no extra content.
- Q: Should product cards be clickable / link to a product detail page? → A: No. Product cards are NOT clickable. Product detail pages are out of scope for v1.

## Assumptions

- Users have a stable internet connection and access a modern desktop web browser.
- The upstream Picnic product catalog API is available and returns product data including images, names, prices, quantities, and labels/decorators.
- Authentication with the upstream API is pre-configured on the server side; users of the website do not need to log in for product search functionality.
- Mobile/responsive design is out of scope for this initial version; the primary target is desktop browsers.
- Cart functionality (adding products to cart, checkout) is out of scope for this initial version.
- Product detail pages (clicking through to a full product description) are out of scope for this initial version.
- The website serves a single geographic region (NL or DE), pre-configured on the server.
