# Feature Specification: Sub-category Navigation

**Feature Branch**: `015-subcategory-navigation`  
**Created**: 2026-04-16  
**Status**: Draft  
**Input**: User description: "Now implement the next category level. Because most categories have a sub categories list. This will mostly be the same rendering, a list again but a layer down."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Sub-categories (Priority: P1)

A user on the search landing page sees the list of top-level categories (e.g. "Groente & fruit", "Brood & gebak"). When they tap a category, the view navigates to show that category's sub-categories as a list with the same row layout (thumbnail, name, chevron). The user can then browse the sub-category list and navigate back to the top-level categories.

**Why this priority**: This is the core feature — without sub-category browsing, category tiles are dead-end buttons. This enables the primary product discovery flow.

**Independent Test**: Can be fully tested by tapping any top-level category and verifying that a sub-category list appears. Delivers the ability to drill one level deeper into the product catalog.

**Acceptance Scenarios**:

1. **Given** the user is on the search landing page viewing top-level categories, **When** they tap a category (e.g. "Groente & fruit"), **Then** the view transitions to show that category's sub-categories as a list with the same row layout.
2. **Given** the user is viewing a category's sub-categories, **When** they tap the back/return control, **Then** they return to the top-level category list.
3. **Given** the user taps a category that has sub-categories, **When** the sub-category data is loading, **Then** a loading indicator is displayed.
4. **Given** the user taps a category, **When** the sub-category fetch fails, **Then** an error message is displayed with the option to retry or go back.

---

### User Story 2 - Browse L2 Sub-categories (Priority: P2)

Some sub-categories themselves have further nested sub-categories (L2 level). When a user taps an L1 sub-category that contains L2 children, the view drills down one more level showing the L2 sub-category list in the same row layout.

**Why this priority**: Completes the full category tree navigation depth matching the native app experience. Some product categories require two levels of drilling to reach the product listing.

**Independent Test**: Can be tested by tapping a category known to have L2 children and verifying a third-level list appears.

**Acceptance Scenarios**:

1. **Given** the user is viewing L1 sub-categories, **When** they tap an L1 sub-category that has L2 children, **Then** the view transitions to show the L2 sub-category list.
2. **Given** the user is viewing L2 sub-categories, **When** they tap back, **Then** they return to the L1 sub-category list.

---

### Edge Cases

- What happens when a category has no sub-categories (leaf node)? The tap should be a no-op or visually indicate it has no children.
- What happens when the user's auth token expires mid-navigation? The user should be redirected to the login page.
- What happens when the sub-category API call returns an empty list? An appropriate empty state message should be shown.
- What happens if the user navigates back from a sub-category view while data is still loading? The loading should be cancelled and the previous view restored cleanly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch sub-category data from the category page API when a user taps a top-level category.
- **FR-002**: System MUST display sub-categories in the same list-row layout as the top-level categories (thumbnail image, name, chevron icon).
- **FR-003**: System MUST provide a back navigation control (e.g. back button or breadcrumb) to return to the previous category level.
- **FR-004**: System MUST show a loading indicator while sub-category data is being fetched.
- **FR-005**: System MUST display an error message when sub-category fetching fails, allowing the user to retry or go back.
- **FR-006**: System MUST handle categories that have no sub-categories gracefully (no navigation occurs or visual feedback is given).
- **FR-007**: System MUST support at least two levels of sub-category drilling (L1 and L2) to match the native app's category depth.
- **FR-008**: System MUST redirect the user to the login page when an expired-token error is returned during sub-category fetching.
- **FR-009**: System MUST display the current category name as a heading when viewing sub-categories so users know where they are in the hierarchy.

### Key Entities

- **Category**: A browsable product grouping with a name, image, and unique identifier. May contain child sub-categories.
- **Sub-category (L1)**: A child of a top-level category. Same attributes as a category. May itself contain L2 sub-categories.
- **Sub-category (L2)**: A child of an L1 sub-category. Same attributes. Represents the deepest browsable level before products.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate from a top-level category to its sub-categories within 2 seconds (including data fetch time).
- **SC-002**: Users can navigate back to the previous category level with a single tap.
- **SC-003**: 100% of top-level categories that have sub-categories in the native app also display sub-categories in the web app.
- **SC-004**: The sub-category list visually matches the top-level category list layout (same row style, image size, typography).
- **SC-005**: The feature passes lint and build validation with zero errors.

## Assumptions

- The existing category list row layout (thumbnail, name, chevron) will be reused for sub-category rendering without visual changes.
- Sub-category data is available through the same Fusion page API used for other page types in the application.
- The category hierarchy has at most 3 levels: top-level → L1 → L2. Deeper nesting is not expected.
- Product listing within a sub-category is out of scope for this feature — tapping a leaf sub-category will be a no-op for now.
- Navigation state (which category level the user is viewing) is managed client-side and does not need to be reflected in the URL.
- The "Snel naar" shortcuts section remains visible only on the top-level category view, not when drilling into sub-categories.
