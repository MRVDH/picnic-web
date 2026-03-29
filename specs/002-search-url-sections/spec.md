# Feature Specification: Search URL State and Section Headers

**Feature Branch**: `002-search-url-sections`  
**Created**: 2026-03-28  
**Status**: Draft  
**Input**: User description: "I want to enhance the search results page a bit. For one, it should show the dynamic section headers from the api response, and I want the search term (state) to be saved in the URL, so that when I reload the page I still have the results and so that I can share the link."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Shareable Search URL (Priority: P1)

A user searches for "tomaten" and wants to share the results page with someone else. The search term is reflected in the browser URL so the user can copy the URL, send it, and the recipient sees the same search results when they open the link. Similarly, refreshing the page preserves the search results instead of returning to the empty landing screen.

**Why this priority**: Without URL persistence, the entire search state is lost on refresh or share — this is the foundational usability issue the user explicitly requested to fix.

**Independent Test**: Can be fully tested by searching for a term, copying the URL, opening it in a new tab, and verifying the same results appear.

**Acceptance Scenarios**:

1. **Given** the user is on the landing page, **When** they search for "tomaten", **Then** the browser URL updates to include the search term (e.g., `/?q=tomaten`).
2. **Given** a URL with a search term (e.g., `/?q=tomaten`), **When** a user navigates to that URL directly, **Then** the search executes automatically and results are displayed.
3. **Given** the user is viewing search results, **When** they refresh the page, **Then** the same search results are displayed again.
4. **Given** the user is viewing search results, **When** they clear the search input and submit, **Then** the URL returns to the base path (no query parameter) and the landing screen is shown.
5. **Given** a URL with an empty query parameter (e.g., `/?q=`), **When** a user navigates to that URL, **Then** the landing screen is shown (no search is executed).

---

### User Story 2 - Section Headers in Search Results (Priority: P2)

A user searches for "tomaten" and sees results organized under descriptive section headers such as "Tros- en pruimtomaten", "Cherrytomaten", "Snacktomaten", etc. These section headers come from the upstream API response and help the user quickly scan and navigate through the categorized results.

**Why this priority**: Section headers provide meaningful organization of results and match the native app experience. This is the second explicit request from the user and depends on the search mechanism (P1) working correctly.

**Independent Test**: Can be tested by searching for a term and verifying that section headers appear above their respective product groups, matching the sections provided by the API.

**Acceptance Scenarios**:

1. **Given** search results are returned with multiple sections, **When** the results page is displayed, **Then** each section is preceded by its header text (e.g., "Tros- en pruimtomaten").
2. **Given** a search returns results in a single section, **When** the results page is displayed, **Then** that section's header is still shown.
3. **Given** a section has a header and products, **When** the results page is displayed, **Then** the products within each section appear directly below their section header, visually grouped together.
4. **Given** the API returns a "re-order" section (e.g., "Opnieuw bestellen"), **When** results are displayed, **Then** it appears as a distinct section with its own header, separate from the main results.

---

### Edge Cases

- What happens when the URL contains a search term that returns zero results? The page should display a "no results" message and the URL should still reflect the search term.
- What happens when the user modifies the URL query parameter manually to an invalid or very long string? The search should execute with the provided term and gracefully handle any API errors.
- What happens when the API returns sections with zero products (e.g., hidden filter sections)? Empty sections should not be displayed.
- What happens when the user navigates back/forward in browser history after multiple searches? The URL and displayed results should stay in sync with browser history.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The search term MUST be stored as a URL query parameter (e.g., `?q=tomaten`) so the page state is reflected in the browser address bar.
- **FR-002**: When the page loads with a search term in the URL, the system MUST automatically execute the search and display results without requiring additional user interaction.
- **FR-003**: When the user performs a new search, the URL MUST update to reflect the new search term, and this MUST create a new browser history entry so back/forward navigation works.
- **FR-004**: When the user clears the search, the URL MUST return to the base path without a query parameter.
- **FR-005**: The search API response MUST include section grouping information so the client can display products organized under their respective section headers.
- **FR-006**: Section headers MUST be displayed as visible text labels above each group of products in the search results.
- **FR-007**: Sections with zero products MUST NOT be rendered in the results view.
- **FR-008**: The total result count display (e.g., "X resultaten voor ...") MUST remain visible and reflect the total number of products across all sections.
- **FR-009**: The search input field MUST be pre-populated with the search term from the URL when the page loads from a shared link or refresh.

### Key Entities

- **Search Section**: A named group of products returned by the API. Has a display title (e.g., "Cherrytomaten") and an ordered list of products. Sections are ordered by the API and that order is preserved in the display.
- **Search Query State**: The active search term, synchronized between the search input, the URL query parameter, and the API request.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A shared search URL (e.g., `/?q=tomaten`) displays the correct search results when opened in a new browser session, within the same time as a normal search.
- **SC-002**: Refreshing the page during an active search preserves the results — the user sees the same results without needing to re-type the query.
- **SC-003**: All section headers from the API are visible in the search results, correctly positioned above their respective product groups.
- **SC-004**: Browser back/forward navigation correctly restores previous search states (query + results).
- **SC-005**: Empty sections (zero products) are never shown to the user.

## Clarifications

### Session 2026-03-28

- Q: Should the re-order section ("Opnieuw bestellen") render as a vertical grid like other sections, be excluded, or render as a horizontal carousel? → A: Render as a regular vertical grid, same as other sections.

## Assumptions

- The upstream Picnic API will continue to provide section grouping data (section names and product ordering) in its search response. If the API changes its response format, the section parsing may need to be updated.
- The URL query parameter approach (`?q=...`) is sufficient — no need for path-based routing (e.g., `/search/tomaten`).
- The "Opnieuw bestellen" (re-order) section will be treated as a regular section with a header, displayed as a vertical product grid in the same layout as all other sections. A horizontal carousel layout is out of scope for this feature.
- Filter chips and sorting options visible in the API response are out of scope for this feature — only section headers and URL state are addressed.
- The existing search suggestions/autocomplete behavior is not affected by URL state changes — suggestions still work from the search input as before.
