# Feature Specification: Search Page Category Browsing

**Feature Branch**: `014-search-categories`  
**Created**: 2026-04-15  
**Status**: Draft  
**Input**: User description: "In the app, the default search screen shows a list of categories. I want these in the website as well. So the current home page (which is actually the search page) should get these. I'm not sure what the endpoint of this data is. You need to find this yourself in the picnic-api or otherwise the bootstrap response. See attached screenshot and replicate that design but in a website format."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse All Product Categories (Priority: P1)

When a user visits the home page (the search page) without an active search query, they see a grid of product categories they can browse — just like in the native Picnic app. Each category shows its image and name. The page is split into two visual sections: a "Deze week" (this week) section at the top with promotional/highlighted entries like "Alle acties", "Nieuw", "Alle recepten", and "Onze Versmarkt", followed by an "Alle categorieën" section listing all standard grocery categories (Fruit, Aardappelen & groente, Maaltijden & gemak, Vlees & vis, etc.).

**Why this priority**: This replaces the current empty welcome screen with real, functional content. It gives users immediate access to product browsing without needing to type a search query — the primary way most users discover products in grocery apps.

**Independent Test**: Can be fully tested by loading the home page while logged in and verifying category tiles appear with correct images, names, and section grouping. Delivers standalone value as a browsing entry point.

**Acceptance Scenarios**:

1. **Given** a logged-in user with no active search query, **When** they visit the home page, **Then** they see a "Deze week" section with promotional entries followed by an "Alle categorieën" section with standard grocery categories, each showing an image and name.
2. **Given** the category data has loaded, **When** the user views the category grid, **Then** each tile displays the category image and Dutch category name matching the data from the Picnic API.
3. **Given** a slow network connection, **When** the categories are loading, **Then** the user sees a loading indicator instead of the category grid.
4. **Given** the category API call fails, **When** the user views the home page, **Then** they see an error message with an option to retry.

---

### User Story 2 - Navigate to Category Products (Priority: P2)

When a user taps a category tile, they are navigated to a view showing the products within that category. This allows users to drill down from the category overview into specific product listings.

**Why this priority**: Without navigation, the category grid is just decorative. This connects the browsing UI to actual product discovery, completing the user flow. Depends on US1 being in place first.

**Independent Test**: Can be tested by tapping any category tile and verifying the user is taken to a product listing filtered to that category. The products shown should correspond to the selected category.

**Acceptance Scenarios**:

1. **Given** the category grid is displayed, **When** the user taps a category tile (e.g. "Fruit"), **Then** they are navigated to a product listing showing items from that category.
2. **Given** the user has navigated to a category listing, **When** they view the page, **Then** the category name is displayed as a heading and relevant products are shown.
3. **Given** the user is viewing a category listing, **When** they tap the browser back button or the home logo, **Then** they return to the home page with the category grid visible.

---

### Edge Cases

- What happens when the API returns zero categories? The page should show the category section area with a user-friendly empty state rather than a blank space.
- What happens when a category has no image? The tile should display a placeholder or fallback visual so the layout remains intact.
- What happens when the user starts typing a search query while categories are visible? The categories should be replaced by the existing search flow (loading → results) as they are today.
- What happens when the user clears their search query after viewing results? The categories should reappear as the page returns to idle state.
- What happens when the user is not logged in? The existing auth gate redirects to the login page — categories are only shown to authenticated users.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a "Deze week" section on the home page when no search query is active, showing promotional category entries (e.g. "Alle acties", "Nieuw", "Alle recepten", "Onze Versmarkt") with their images and names.
- **FR-002**: System MUST display an "Alle categorieën" section below "Deze week", showing all standard grocery categories (e.g. Fruit, Aardappelen & groente, Maaltijden & gemak, Vlees & vis, Vega & plantaardig, etc.) with their images and names.
- **FR-003**: Each category tile MUST display the category image and the Dutch category name as provided by the API.
- **FR-004**: The category grid MUST use a responsive layout — adapting column count to screen width (e.g. 2 columns on mobile, 3-4 on tablet, 4-5 on desktop).
- **FR-005**: System MUST show a loading state while category data is being fetched.
- **FR-006**: System MUST show an error state with a retry option if category fetching fails.
- **FR-007**: Categories MUST be hidden when the user has an active search query, and reappear when the query is cleared.
- **FR-008**: Each category tile MUST be tappable, navigating the user to a product listing for that category.
- **FR-009**: Category images MUST load using the existing image URL pattern used elsewhere in the application (e.g. the same CDN/image-building logic used for product images).
- **FR-010**: Section headers ("Deze week" and "Alle categorieën") MUST be displayed as visible headings above their respective groups, matching the native app's section labeling.

### Key Entities

- **Category**: Represents a browseable product grouping — has an ID, name (Dutch), image, and a navigation target (link to its product listing). Categories are divided into promotional ("Deze week") and standard ("Alle categorieën") groups.
- **Category Section**: A labeled group of categories — either "Deze week" (highlighted/promotional entries) or "Alle categorieën" (standard grocery categories).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Logged-in users see category tiles within 2 seconds of landing on the home page on a standard connection.
- **SC-002**: All categories returned by the API are displayed — no categories are missing or duplicated.
- **SC-003**: The category layout adapts correctly across mobile (320px), tablet (768px), and desktop (1280px) viewport widths without horizontal scrolling or visual overflow.
- **SC-004**: Tapping a category tile takes the user to the correct category product listing within 2 seconds.
- **SC-005**: The page passes lint and build validation with zero errors.

## Assumptions

- The Picnic API provides category data (names, images, IDs) through either the Fusion page system or the legacy catalog endpoint. The implementation phase will determine which specific endpoint to use based on data richness and parsing complexity.
- Category images use the same CDN and image URL scheme as product images already used in the application.
- The "Deze week" promotional section and "Alle categorieën" standard section distinction exists in the API response (either as separate data structures or identifiable by category attributes).
- Dutch language is used throughout, consistent with the rest of the application.
- Category browsing is only available to authenticated users (the existing auth gate handles unauthenticated access).
- The current welcome/landing view ("Welkom bij Picnic Web") will be fully replaced by the category grid — the logo and welcome text will no longer appear on the home page.
