# Feature Specification: Reorder Section in Search Results

**Feature Branch**: `009-reorder-search-results`  
**Created**: 2026-04-10  
**Status**: Clarified  
**Input**: User description: "Add 'Opnieuw bestellen' section to search results. These are in the app but I don't see them in the search results here yet. Try with search terms 'Roomboter' and 'Tomaten'"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Display "Opnieuw bestellen" Section in Search Results (Priority: P1)

When a user searches for a product they have previously ordered, the search results display an "Opnieuw bestellen" (Reorder) section at the top of the results, above the regular category sections. This matches the behaviour seen in the native Picnic app, where previously purchased products matching the search query are grouped together under the "Opnieuw bestellen" heading.

The section appears only when the upstream API response includes re-order data for the given search term. Not all queries will produce a re-order section — only those matching products the user has ordered before.

**Why this priority**: This is the core value of the feature. Returning customers expect to see their previously ordered products prominently when searching, reducing the time to re-add familiar items to their cart. The Picnic app already provides this, and the web version should match.

**Independent Test**: Search for "Roomboter" or "Tomaten" (terms known to return re-order data for a test account). The search results page should display an "Opnieuw bestellen" section above the regular category sections, containing the previously ordered products.

**Acceptance Scenarios**:

1. **Given** a logged-in user who has previously ordered products matching "Roomboter", **When** they search for "Roomboter", **Then** an "Opnieuw bestellen" section appears at the top of the search results containing the previously ordered matching products.
2. **Given** a logged-in user who has previously ordered products matching a search term, **When** the search results load, **Then** the "Opnieuw bestellen" section appears above all other category sections (e.g., "Boter", "Margarine").
3. **Given** a logged-in user searching a term with no matching previously ordered products, **When** the search results load, **Then** no "Opnieuw bestellen" section appears and only regular category sections are shown.
4. **Given** a logged-in user whose search returns re-order products, **When** the results are displayed, **Then** each product in the "Opnieuw bestellen" section shows the same information as any other search result product (image, name, price, badges, quantity controls).

---

### User Story 2 - Section Navigation Includes Reorder Section (Priority: P2)

When search results include an "Opnieuw bestellen" section, the section navigation bar (pill badges at the top of results) includes an entry for it. Users can tap the "Opnieuw bestellen" pill to scroll directly to the reorder section.

**Why this priority**: The section nav bar is a key navigational aid for search results. If a section exists but has no nav pill, users may not discover it — especially on longer result pages where it may scroll off-screen.

**Independent Test**: Search for a term that returns re-order results. The section nav bar should display an "Opnieuw bestellen" pill badge. Tapping it should scroll the page to the reorder section.

**Acceptance Scenarios**:

1. **Given** search results that include an "Opnieuw bestellen" section, **When** the section nav bar renders, **Then** it includes an "Opnieuw bestellen" pill badge.
2. **Given** the nav bar shows the "Opnieuw bestellen" pill, **When** the user taps it, **Then** the page scrolls to the reorder section.
3. **Given** search results that do NOT include an "Opnieuw bestellen" section, **When** the section nav bar renders, **Then** no "Opnieuw bestellen" pill is shown.

---

### User Story 3 - Reorder Products Deduplicated from Category Sections (Priority: P2)

Products that appear in the "Opnieuw bestellen" section are not duplicated in the regular category sections below. If a product appears in both the re-order set and a category section, it shows only in "Opnieuw bestellen".

**Why this priority**: Duplicate products clutter results and confuse users. The existing deduplication logic should already handle this, but it must be verified as part of the re-order feature.

**Independent Test**: Search for a term that returns a product in both the re-order section and a category section. Verify the product appears only once (in "Opnieuw bestellen").

**Acceptance Scenarios**:

1. **Given** a product that matches both the re-order set and a category section, **When** search results render, **Then** the product appears only in the "Opnieuw bestellen" section.
2. **Given** a category section where all products were moved to the re-order section, **When** search results render, **Then** that category section is omitted entirely (empty sections are not shown).

---

### Edge Cases

- What happens when the API returns a re-order section header but no products within it? The section should not be rendered.
- What happens when the API response structure for re-order products differs from regular product tiles? The parser must handle variant PML structures and still extract product data.
- What happens when the user is not logged in? The search API requires authentication; unauthenticated users are redirected to login and never see search results.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an "Opnieuw bestellen" section in search results when the upstream API provides re-order product data for the search query.
- **FR-002**: The "Opnieuw bestellen" section MUST appear above all other category sections in the search results.
- **FR-003**: Products in the "Opnieuw bestellen" section MUST display the same product information as regular search result products (image, name, price, discount indicators, badges, quantity controls).
- **FR-004**: Products that appear in the "Opnieuw bestellen" section MUST NOT be duplicated in subsequent category sections.
- **FR-005**: The section navigation bar MUST include an entry for the "Opnieuw bestellen" section when it is present in the results.
- **FR-006**: The "Opnieuw bestellen" section MUST NOT be displayed when the API provides no re-order data for the query.
- **FR-007**: Empty re-order sections (header present but no products) MUST NOT be rendered.
- **FR-008**: The section title MUST match the title provided by the upstream API (typically "Opnieuw bestellen") rather than being hardcoded.
- **FR-009**: System MUST correctly parse re-order product data from the upstream API response, even if the data structure for re-order products differs from regular search result products.

### Key Entities

- **Re-order Section**: A search result section containing products the user has previously ordered that match the current search query. Distinguished from category sections by its position in the API response (appears before category sections).
- **Search Section**: A titled group of products within search results. Sections include both re-order sections and category sections. Each has a title and a list of products.
- **Product**: A purchasable item with image, name, price, quantity, badges, and availability status. Identical structure whether in a re-order section or category section.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users who have previously ordered products matching a search term see those products grouped in an "Opnieuw bestellen" section at the top of search results, matching the behaviour of the native Picnic app.
- **SC-002**: The re-order section is navigable via the section nav bar, with scroll-to-section working correctly.
- **SC-003**: No product appears in both the "Opnieuw bestellen" section and a category section within the same set of search results.
- **SC-004**: Search results for queries with no re-order data render identically to current behaviour (no regressions).

## Assumptions

- The upstream Picnic search API already returns re-order product data as part of the Fusion page response for authenticated users. This feature relies on correctly parsing and displaying that data — it does not require any new API endpoints.
- The re-order section structure in the API response may use a different PML node arrangement than category sections. The parser may need to handle both the existing pattern (header-wrapper siblings before the visual-sections container) and any variant structures the API uses.
- The `state.analyticsRfySize` field in the API response body can be used as a supplementary signal to identify re-order products if the PML tree-based extraction is unreliable.
- The feature only applies to authenticated users. Unauthenticated users cannot perform searches.
- The section nav bar already renders dynamically based on the sections present in the search response — adding a new section type requires no nav bar changes if the section is included in the sections array.
- Deduplication of re-order products from category sections is handled by the upstream API. No client-side deduplication logic is needed unless debugging reveals otherwise.
- The `SearchSection` type does not need a new discriminator field; the re-order section is identified by its position (first in the array) and its API-provided title.

## Clarification Log

Completed: 2026-04-10

| # | Topic | Decision |
|---|-------|----------|
| 1 | Parser approach | Debug existing parser by inspecting actual API response before any rewrite |
| 2 | Cart actions in re-order | Re-order products get full cart action controls (add-to-cart / quantity stepper), same as regular search products |
| 3 | Deduplication | Trust API deduplication; no client-side dedup unless proven necessary during research |
| 4 | Section type field | Keep `SearchSection` type unchanged; rely on array position and title |
| 5 | Research phase | Include explicit research phase (capture & inspect raw API response) as a prerequisite before implementation |
