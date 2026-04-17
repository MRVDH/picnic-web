# Feature Specification: Dynamic Page Titles

**Feature Branch**: `011-dynamic-page-title`  
**Created**: 2026-04-13  
**Status**: Draft  
**Input**: User description: "html page title should be dynamic. Something like 'Picnic Web - <page/producttitle/categorytitle>'"

## Clarifications

### Session 2026-04-13

- Q: Implementation mechanism — all pages are `"use client"` components, so standard Next.js `metadata`/`generateMetadata` cannot be used at page level. Which approach? → A: Client-side `document.title` via `useEffect` in each page (no architectural refactoring needed).
- Q: Root layout currently exports static metadata title "Picnic Web — Product Search". Update it to "Picnic Web" or leave as-is? → A: Update root layout metadata to "Picnic Web" (consistent default, no title flash).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Product Page Shows Product Name in Browser Tab (Priority: P1)

A user navigates to a product detail page (e.g., "Halfvolle melk" by Campina). The browser tab immediately displays a title that includes the product name, making it easy to identify which product tab is which when multiple tabs are open. This is the highest-value scenario because product pages carry unique, meaningful names that help users orient themselves.

**Why this priority**: Product pages have the most distinct and useful dynamic data (product names). Users frequently open multiple product tabs and need to distinguish them at a glance.

**Independent Test**: Can be fully tested by navigating to any product detail page and verifying the browser tab shows the product name alongside the application name.

**Acceptance Scenarios**:

1. **Given** a user is on the home page, **When** they navigate to a product detail page for "Halfvolle melk", **Then** the browser tab title displays "Halfvolle melk - Picnic Web".
2. **Given** a user has multiple product tabs open, **When** they look at the browser tab bar, **Then** each tab shows a distinct title containing the respective product name.
3. **Given** a user navigates to a product page and the product data is still loading, **When** they look at the browser tab, **Then** the title displays a reasonable default (e.g., "Picnic Web") until the product name becomes available, then updates to include the product name.

---

### User Story 2 - Static Pages Show Descriptive Titles (Priority: P2)

Pages with a fixed purpose — the login page, the shopping cart page, and the home/search landing page — each display a descriptive title in the browser tab that indicates which page the user is on. For example, "Inloggen - Picnic Web" for the login page, "Winkelwagen - Picnic Web" for the cart page, and "Picnic Web" for the home page.

**Why this priority**: These pages have static, well-known labels. Implementing their titles is straightforward and covers the remaining pages in the application.

**Independent Test**: Can be fully tested by navigating to each page (/login, /cart, /) and verifying the browser tab title matches the expected descriptive label.

**Acceptance Scenarios**:

1. **Given** a user is on the login page, **When** they look at the browser tab, **Then** the title displays "Inloggen - Picnic Web".
2. **Given** a user is on the cart page, **When** they look at the browser tab, **Then** the title displays "Winkelwagen - Picnic Web".
3. **Given** a user is on the home page without an active search, **When** they look at the browser tab, **Then** the title displays "Picnic Web".

---

### User Story 3 - Search Results Page Shows Search Query in Title (Priority: P3)

When a user performs a product search, the browser tab title updates to reflect the active search query. For example, searching for "melk" produces a title like "melk - Picnic Web". This helps users identify search tabs and provides context when returning to a tab.

**Why this priority**: Search query titles enhance the multi-tab experience but are less critical than product page titles since search is typically a transient activity.

**Independent Test**: Can be fully tested by entering a search query on the home page and verifying the browser tab title updates to include the search term.

**Acceptance Scenarios**:

1. **Given** a user is on the home page, **When** they search for "melk", **Then** the browser tab title updates to "melk - Picnic Web".
2. **Given** a user is viewing search results for "kaas", **When** they clear the search query and return to the default home view, **Then** the title reverts to "Picnic Web".
3. **Given** a user enters a very long search query (e.g., 100+ characters), **When** they look at the browser tab, **Then** the title is truncated to a reasonable length so it remains usable and does not cause performance or display issues.

---

### Edge Cases

- What happens when a product page is loaded with an invalid or non-existent product ID? The title should display a sensible fallback (e.g., "Picnic Web") rather than showing "undefined" or an error string.
- What happens when the page title data (e.g., product name) contains special characters, HTML entities, or extremely long text? The title should render correctly and be truncated if excessively long.
- What happens when a user navigates between pages rapidly? The title should always reflect the currently displayed page, not a previously loaded one.
- What happens on the error page (e.g., after a server error)? The title should display a reasonable fallback such as "Picnic Web".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST display page-specific browser tab titles following the pattern "[Page Context] - Picnic Web", where "[Page Context]" varies per page.
- **FR-002**: The product detail page MUST display the product name as the page context in the browser tab title (e.g., "Halfvolle melk - Picnic Web").
- **FR-003**: The login page MUST display "Inloggen" as the page context in the browser tab title.
- **FR-004**: The cart page MUST display "Winkelwagen" as the page context in the browser tab title.
- **FR-005**: The home page (without an active search) MUST display "Picnic Web" as the full browser tab title (no prefix).
- **FR-006**: The home page with an active search query MUST include the search term as the page context in the browser tab title.
- **FR-007**: When page-specific data is unavailable (loading state, error, or missing data), the title MUST fall back to "Picnic Web" rather than displaying empty, undefined, or error text. The root layout's static metadata title MUST also be updated from "Picnic Web — Product Search" to "Picnic Web" to ensure the server-rendered default matches the client-side fallback.
- **FR-008**: The application MUST use a consistent title separator and format across all pages: "[Context] - Picnic Web" for pages with context, or just "Picnic Web" for the default.
- **FR-009**: Excessively long page contexts (over 60 characters) MUST be truncated with an ellipsis to keep the title practical.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of application pages display a page-specific browser tab title (no page shows the old generic static title "Picnic Web — Product Search").
- **SC-002**: Users with multiple open tabs can identify each tab's content by its title without needing to switch to it, for all page types (product, cart, login, search).
- **SC-003**: The browser tab title updates within 1 second of the page content being visible (accounting for data load times on dynamic pages like product detail).
- **SC-004**: No page ever displays "undefined", "null", "error", or an empty string in the browser tab title under any circumstance (loading, error, missing data).

## Assumptions

- The application name used in titles is "Picnic Web" — this is consistent with the current branding.
- The title separator is " - " (space-dash-space), as suggested by the user's description format.
- Dutch-language labels are used for page names ("Inloggen", "Winkelwagen") since the application is configured with `lang="nl"` and targets a Dutch-speaking audience.
- Product names are sourced from the existing product data already fetched on the product detail page; no additional data fetching is required.
- Search query text used in titles comes from the existing URL query parameter (`?q=`) already used by the search page.
- The error page and any future pages without explicit title configuration should fall back to the default "Picnic Web" title.
- All page components are client components (`"use client"`); titles will be set via `document.title` in `useEffect` hooks rather than Next.js server-side metadata APIs. No page refactoring to server components is required.
