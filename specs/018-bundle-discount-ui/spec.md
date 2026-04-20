# Feature Specification: Bundle Discount UI

**Feature Branch**: `018-bundle-discount-ui`  
**Created**: 2026-04-20  
**Status**: Draft  
**Input**: User description: "picnic-api version 4.3.0 now supports bundle discounts. Update the package, remove the warning banner, and add the bundle discount info to the cart, plp and pdp, the same way that the app does."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - PDP Bundle Price Tiers (Priority: P1)

A shopper viewing a product detail page sees a price tier grid showing volume discounts — "Vanaf 1: €1.19", "Vanaf 2: €1.17", "Vanaf 3: €1.15", "Vanaf 4: €1.13" — so they can decide how many to buy. The currently active tier (based on cart quantity) is visually highlighted. The per-litre/per-kilo unit price updates to reflect the active tier.

**Why this priority**: The PDP is where shoppers make buying decisions; showing the full pricing ladder here drives bundle purchases.

**Independent Test**: Navigate to any product with bundle pricing and verify the tier grid renders with correct prices and the active tier highlights based on cart quantity.

**Acceptance Scenarios**:

1. **Given** a product with bundle thresholds, **When** the shopper opens its PDP, **Then** a price tier grid displays all thresholds with labels "Vanaf {quantity}" and the corresponding per-unit price.
2. **Given** a product with bundle thresholds and 3 items in cart, **When** the shopper views the PDP, **Then** the "Vanaf 3" tier is highlighted and the unit price (e.g. €/l) reflects the active tier price.
3. **Given** a product without bundle thresholds, **When** the shopper views the PDP, **Then** no tier grid is shown.

---

### User Story 2 - PLP Tile Bundle Savings (Priority: P1)

On the product listing page, when a shopper adds multiple units of a bundle-eligible product, the tile shows: (a) a green "€X.XX bespaard" savings badge above the stepper when the quantity meets a bundle threshold, (b) the per-unit price updates to the discounted price with the original struck through, and (c) dot indicators under the quantity show bundle tier progress.

**Why this priority**: PLP tiles are the primary browsing surface; surfacing savings here encourages larger orders.

**Independent Test**: Search for a bundle-eligible product, increment the quantity to 2 and then 3, and verify the savings badge, price, and dot indicators update correctly at each step.

**Acceptance Scenarios**:

1. **Given** a product with bundle thresholds and 1 item in cart, **When** the tile renders, **Then** the regular price is shown with no savings badge.
2. **Given** a product with bundle thresholds and 2 items in cart, **When** the tile renders, **Then** a "€0.04 bespaard" badge appears, the price shows €1.17 with €1.19 struck through, and dot indicators show progress.
3. **Given** a product with bundle thresholds and 3 items in cart, **When** the tile renders, **Then** the savings badge shows "€0.12 bespaard" and the price updates to €1.15.

---

### User Story 3 - Cart Line Item Bundle Badge (Priority: P2)

In the cart, when a line item qualifies for a bundle discount, it shows a "BundelBonus" badge, the total line price reflects the bundle discount, and the original (non-discounted) total is struck through.

**Why this priority**: Cart confirmation of savings reinforces the value and reduces cart abandonment.

**Independent Test**: Add 3 units of a bundle-eligible product, open the cart, and verify the line item shows the "BundelBonus" badge with correct pricing.

**Acceptance Scenarios**:

1. **Given** 3 units of a bundle-eligible product in the cart, **When** the cart page renders, **Then** the line item displays a "BundelBonus" badge, a struck-through original total, and the discounted total.
2. **Given** a cart item without bundle eligibility, **When** the cart page renders, **Then** no "BundelBonus" badge is shown and pricing is unchanged.

---

### User Story 4 - Remove Warning Banner (Priority: P1)

The amber "Bundelkortingen zijn op dit moment niet zichtbaar" banner on the PDP is removed, since bundle discounts are now fully supported.

**Why this priority**: The banner communicates a limitation that no longer exists; leaving it would confuse shoppers.

**Independent Test**: Open any PDP and verify no amber warning banner about bundle discounts is visible.

**Acceptance Scenarios**:

1. **Given** the updated application, **When** the shopper opens any PDP, **Then** no bundle-discount warning banner is displayed.

---

### User Story 5 - Update picnic-api Package (Priority: P1)

The picnic-api dependency is updated from ^4.1.0 to ^4.3.0 to enable bundle discount data in API responses.

**Why this priority**: All other stories depend on the updated API providing bundle discount data.

**Independent Test**: Verify package.json references picnic-api ^4.3.0 and the application builds and runs without errors.

**Acceptance Scenarios**:

1. **Given** the updated dependency, **When** the application starts, **Then** API calls return bundle discount data for eligible products and no build errors occur.

---

### Edge Cases

- What happens when a product has bundle thresholds but the shopper has 0 items in cart? The PDP tier grid shows all tiers with none highlighted; the PLP tile shows standard pricing.
- What happens when the shopper's quantity exceeds the highest bundle tier? The highest tier remains active and highlighted.
- What happens when bundle data is missing or null for a product? The UI falls back to standard pricing with no tier grid, no dots, and no savings badge.
- What happens when the API returns bundle data in an unexpected format after the upgrade? The UI degrades gracefully to standard pricing display.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST update the picnic-api dependency to version ^4.3.0.
- **FR-002**: System MUST remove the amber "Bundelkortingen zijn op dit moment niet zichtbaar" warning banner from the PDP.
- **FR-003**: PDP MUST display a price tier grid when a product has bundle thresholds, showing "Vanaf {quantity}" and the per-unit price for each tier.
- **FR-004**: PDP tier grid MUST visually highlight the currently active tier based on the shopper's cart quantity.
- **FR-005**: PDP unit price (e.g. €/l) MUST update to reflect the active bundle tier price.
- **FR-006**: PLP tiles MUST show a green "€X.XX bespaard" savings badge when the cart quantity meets a bundle threshold above the base tier.
- **FR-007**: PLP tiles MUST display the bundle-discounted per-unit price with the original price struck through when a bundle tier is active.
- **FR-008**: PLP tiles MUST show dot indicators reflecting bundle tier progress under the quantity stepper.
- **FR-009**: Cart line items MUST display a "BundelBonus" badge when the line qualifies for a bundle discount.
- **FR-010**: Cart line items MUST show the discounted total with the original total struck through for bundle-discounted items.
- **FR-011**: All bundle UI elements MUST degrade gracefully when bundle data is absent or null, showing standard pricing with no bundle indicators.

### Key Entities

- **BundleThreshold**: Represents a volume discount tier with a minimum quantity and the corresponding per-unit price.
- **BundleProgress**: Tracks a product's bundle thresholds alongside the shopper's current cart quantity, enabling active tier computation.
- **BundleOption**: PDP-specific enriched bundle data including image and max count information.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All bundle-eligible products display their full pricing tier information on the PDP.
- **SC-002**: PLP savings badges appear and show correct savings amounts within 1 second of quantity changes.
- **SC-003**: Cart line items reflect bundle discounts with correct totals matching the active pricing tier.
- **SC-004**: No amber warning banner is visible anywhere in the application.
- **SC-005**: The application builds and runs without errors after the picnic-api upgrade.

## Assumptions

- The picnic-api 4.3.0 package maintains backward compatibility with existing API response structures and only adds/enriches bundle-related fields.
- The existing BundleThreshold, BundleProgress, and BundleOption type definitions in the codebase are compatible with the data returned by picnic-api 4.3.0 (or will require only minor adjustments).
- The "BundelBonus" badge styling follows the same red badge pattern visible in the Picnic app (red background, white text).
- The PDP price tier grid follows the app's design: horizontally arranged boxes with "Vanaf {n}" labels and prices, active tier having a distinct background.
- Bundle savings calculation is: (base unit price - active tier price) x quantity.
