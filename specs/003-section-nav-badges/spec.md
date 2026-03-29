# Feature Specification: Section Navigation Badges

**Feature Branch**: `003-section-nav-badges`  
**Created**: 2026-03-29  
**Status**: Draft  
**Input**: User description: "I would like to add navigation badges to the top of the search result page, one for each header. This bar should be sticky so that when you scroll down you can still easily navigate to other sections. The active badge should dynamically change when you scroll over the page, to whatever section you are at that moment looking at. And of course clicking a badge should move you to that section. The active badge should be the red primary picnic colour."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Click Badge to Navigate to Section (Priority: P1)

As a user viewing search results, I want to tap a section badge to instantly scroll to that section, so I can jump directly to products I care about without manually scrolling through the entire results list.

**Why this priority**: Navigation is the core purpose of the badge bar. Without click-to-scroll, the badges are purely decorative and deliver no value.

**Independent Test**: Can be fully tested by performing a search that returns multiple sections, clicking any badge, and verifying the page scrolls to the corresponding section header. Delivers immediate navigation value even without sticky positioning or active-state highlighting.

**Acceptance Scenarios**:

1. **Given** search results with 3+ sections are displayed, **When** the user clicks the "Cherrytomaten" badge, **Then** the page smooth-scrolls until the "Cherrytomaten" section header is visible near the top of the viewport.
2. **Given** search results with sections are displayed, **When** the user clicks the first badge, **Then** the page scrolls to the top of the results (first section).
3. **Given** search results with sections are displayed, **When** the user clicks the last badge, **Then** the page scrolls to the last section, even if it is near the bottom of the page.

---

### User Story 2 - Sticky Badge Bar While Scrolling (Priority: P1)

As a user scrolling through a long list of search results, I want the badge bar to remain visible at the top of the screen so that I always have quick access to section navigation regardless of my scroll position.

**Why this priority**: Without sticky behavior, the badge bar scrolls out of view and becomes useless on long result pages. This is essential for the navigation to be practical.

**Independent Test**: Can be fully tested by performing a search that returns enough products to require scrolling, then scrolling down and verifying the badge bar remains pinned below the site header.

**Acceptance Scenarios**:

1. **Given** search results that overflow the viewport, **When** the user scrolls down past the badge bar's natural position, **Then** the badge bar remains pinned below the sticky site header.
2. **Given** the user has scrolled to the bottom of results, **When** the user looks at the top of the viewport, **Then** both the site header and the badge bar are visible and accessible.

---

### User Story 3 - Active Badge Highlights Current Section (Priority: P2)

As a user scrolling through search results, I want the badge corresponding to the section currently in view to be visually highlighted in Picnic red, so I always know which section I am looking at.

**Why this priority**: Active-state highlighting is a usability enhancement that provides spatial context. While valuable, the navigation bar is functional without it (users can still click badges and the bar remains sticky).

**Independent Test**: Can be fully tested by performing a search, scrolling through different sections, and verifying that the highlighted badge changes to reflect the currently visible section.

**Acceptance Scenarios**:

1. **Given** search results with multiple sections, **When** the page first loads, **Then** the first section's badge is highlighted in Picnic red.
2. **Given** the user is viewing the "Trostomaten" section, **When** the user scrolls down until "Cherrytomaten" becomes the topmost visible section, **Then** the active badge changes from "Trostomaten" to "Cherrytomaten" with Picnic red styling.
3. **Given** the user clicks a badge to navigate to a section, **When** the scroll animation completes, **Then** the clicked badge becomes the active (highlighted) badge.
4. **Given** a badge is active, **When** the user inspects it visually, **Then** it is styled in Picnic red (the brand's primary color) and is clearly distinguishable from inactive badges.

---

### Edge Cases

- What happens when a search returns zero sections (e.g., no results)? The badge bar is not rendered at all.
- What happens when a search returns exactly one section? The badge bar is rendered with a single badge that is always active. The bar is still useful as a section label.
- What happens when section titles are very long? Badge text is displayed in a single line; the bar scrolls horizontally to accommodate overflow.
- What happens when there are many sections (10+)? The badge bar scrolls horizontally. The active badge is automatically scrolled into view.
- What happens when the user resizes the browser window? The badge bar adapts; horizontal overflow behavior adjusts to the new width.
- What happens during the loading state (before results arrive)? The badge bar is not displayed until sections are available.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render a horizontal bar of badges above the search results, with one badge per section header.
- **FR-002**: Each badge MUST display the section's title text.
- **FR-003**: The badge bar MUST use sticky positioning so it remains visible below the site header when the user scrolls.
- **FR-004**: Clicking a badge MUST smooth-scroll the page to the corresponding section header.
- **FR-005**: The badge bar MUST visually highlight the currently active section's badge using the Picnic red primary color.
- **FR-006**: The active badge MUST update dynamically as the user scrolls through sections (scroll-spy behavior).
- **FR-007**: When the badge bar overflows horizontally, the user MUST be able to scroll the bar sideways to see all badges.
- **FR-008**: When the active badge changes, the badge bar MUST auto-scroll horizontally to ensure the active badge is visible.
- **FR-009**: The badge bar MUST NOT be rendered when there are no sections (no results or flat product list).
- **FR-010**: The scroll offset when navigating to a section MUST account for the combined height of the sticky site header and the sticky badge bar, so the section header is not hidden behind them.
- **FR-011**: Inactive badges MUST be visually distinct from the active badge (neutral/muted styling).

### Key Entities

- **SectionBadge**: Represents a single navigation badge — displays a section title and links to the corresponding section in the results list.
- **BadgeBar**: The horizontal container holding all section badges — sticky-positioned, horizontally scrollable, manages active badge state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate to any section in the search results with a single click/tap on the corresponding badge.
- **SC-002**: The badge bar remains visible and accessible at all scroll positions within a search results page.
- **SC-003**: The active badge accurately reflects the section currently in the viewport as the user scrolls, updating within a perceptible but not jarring timeframe.
- **SC-004**: All section badges are reachable via horizontal scrolling when the badge bar overflows.
- **SC-005**: The feature does not degrade existing search result rendering or performance.

## Assumptions

- The existing `SearchSection[]` data from the search API provides all information needed for the badge bar (no API changes required).
- The badge bar sits directly below the existing sticky site header.
- The Picnic red primary color is already available as a design token or CSS variable in the project.
- Smooth scroll behavior is delegated to the browser's native implementation.
- Scroll-spy detection uses viewport-based observation (e.g., determining which section header is nearest the top of the visible area).
- Horizontal badge overflow is handled with native CSS overflow scrolling (no custom carousel or arrow buttons).
- Mobile and desktop share the same badge bar layout (responsive by nature of horizontal scroll).
