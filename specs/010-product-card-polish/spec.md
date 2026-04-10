# Feature Specification: Product Card Layout Polish

**Feature Branch**: `010-product-card-polish`  
**Created**: 2026-04-10  
**Status**: Draft  
**Input**: User description: "The product card should be styled in such a way that the price is always at the bottom. Right now it is always at a different height because the text above it differs per card. Overall make it look a bit nicer"

## User Scenarios & Testing

### User Story 1 - Consistent Price Alignment Across Cards (Priority: P1)

As a shopper browsing search results, I want all product card prices to appear at the same vertical position regardless of how much text (subtitle, brand, name length) each card has, so that I can quickly scan and compare prices across a row of products.

**Why this priority**: Price comparison is a core shopping activity. Inconsistent price positioning forces users to visually hunt for prices on each card, slowing down the browsing experience. Fixing this delivers the most immediate visual improvement.

**Independent Test**: Search for a term that returns products with varying text lengths (e.g. "tomaten" — some have subtitles, brand names, highlights, and some do not). All prices in a row should be vertically aligned at the same height.

**Acceptance Scenarios**:

1. **Given** a search results grid with products of varying text content (some with subtitles, brands, highlights; some without), **When** the user views the grid, **Then** all product prices in the same row appear at the same vertical position.
2. **Given** a product card with a long name that wraps to two lines, **When** displayed next to a card with a short single-line name, **Then** both prices are at the same height.
3. **Given** a product card with no subtitle, no brand, and no highlight, **When** displayed next to a card that has all three, **Then** prices are still aligned.

---

### User Story 2 - Visual Polish of Product Cards (Priority: P2)

As a shopper, I want product cards to look clean and well-structured so that the overall shopping experience feels polished and professional.

**Why this priority**: General visual polish complements the price alignment fix and makes the entire grid feel cohesive. This covers spacing, typography, and visual hierarchy improvements within each card.

**Independent Test**: View search results and verify that product cards have balanced spacing between elements (image, name, price, badges), consistent visual weight, and a clean, readable appearance.

**Acceptance Scenarios**:

1. **Given** a product card, **When** the user views it, **Then** the card has visually balanced spacing between the image area, text content area, and price/badge area.
2. **Given** a product card with badges, **When** displayed, **Then** badges appear in a consistent location without crowding other elements.
3. **Given** a product card with an unavailability overlay, **When** displayed, **Then** the overlay and card layout remain visually consistent with available product cards.

---

### Edge Cases

- What happens when a product name is extremely long (3+ lines before clamping to 2)?
- How does the card look when a product has no badges, no subtitle, no brand — just name and price?
- How does the layout behave when the product has bundle pricing with strikethrough prices?
- How does the card look on narrow screens (2-column mobile layout) vs wide screens (5-column desktop)?

## Requirements

### Functional Requirements

- **FR-001**: Product card price MUST be anchored to the bottom of the card, so that all cards in a grid row display prices at the same vertical position regardless of the amount of text content above.
- **FR-002**: The variable-height text area (subtitle, name, brand/highlight, unit quantity) MUST grow upward from the price, not push the price downward.
- **FR-003**: Product name MUST remain clamped to a maximum of 2 visible lines (preserving existing behavior).
- **FR-004**: Card spacing MUST be visually balanced — no cramped or overly sparse areas between image, text, and price sections.
- **FR-005**: Badges MUST appear in a consistent position relative to the price.
- **FR-006**: The existing cart action overlay (add/quantity stepper on the product image) MUST remain functional and correctly positioned.
- **FR-007**: The card layout MUST work correctly across all supported grid breakpoints (2-column mobile through 5-column desktop).
- **FR-008**: Cards with unavailability overlays MUST maintain the same layout structure as available product cards.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All product prices in a single grid row are visually aligned at the same vertical position (zero misalignment across any row of cards in search results).
- **SC-002**: No existing product card functionality is broken — cart actions, navigation to product detail, badges, unavailability overlays all work as before.
- **SC-003**: Card layout is consistent across all breakpoints (2-column to 5-column grids).
- **SC-004**: Users can scan prices across a row of products without needing to search for each price individually.

## Assumptions

- The fix is purely CSS/layout — no changes to data fetching, API responses, or product data structures.
- The product card is used in the search results grid (`ProductGrid`) and the product detail page. This spec focuses on the grid context.
- "Look nicer" is interpreted as improving spacing, alignment, and visual hierarchy — not redesigning the card entirely or adding new visual elements (e.g., no new icons, colors, or animations).
- The existing Tailwind CSS utility-first approach will be used. No new design system or component library is introduced.
- Badge positioning adjusts as needed to maintain consistent price alignment — currently badges use `mt-auto` which pushes them to the bottom, but price should take the bottom-anchored position instead.
