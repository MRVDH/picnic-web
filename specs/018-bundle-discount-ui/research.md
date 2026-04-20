# Research: Bundle Discount UI

**Feature**: 018-bundle-discount-ui
**Date**: 2026-04-20

## R1: picnic-api 4.3.0 Changes

**Decision**: Upgrade picnic-api from 4.1.0 to ^4.3.0 and adapt to any new bundle-related fields.

**Rationale**: The user states 4.3.0 "supports bundle discounts." No changelog is available locally; the upgrade must be performed first, then build errors and new API response fields can be discovered empirically. The existing codebase already parses `price_ranges` on search results and `BUNDLES_BUTTON` decorators on cart items, suggesting the API already partially supports bundles — 4.3.0 likely enriches this data.

**Alternatives considered**: Pinning to exact 4.3.0 vs ^4.3.0. Using ^4.3.0 allows patch updates while ensuring minimum bundle support.

## R2: PDP Bundle Tier Grid Design

**Decision**: Redesign `ProductPriceSection` bundle display from a vertical list ("Nx — price/stuk") to a horizontal grid of tier boxes matching the Picnic app design: "Vanaf {n}" label with price below, active tier visually highlighted.

**Rationale**: The reference images show a horizontal row of boxes with "Vanaf 1", "Vanaf 2", etc. labels and per-unit prices. The currently active tier (matching cart quantity) has a distinct background color. This matches the native app's design and is more scannable than the current vertical list.

**Implementation approach**: Replace the inner content of the `bundles.length > 1` block in `product-price-section.tsx` with a flex row of tier boxes. Use cart context to determine active tier. The component currently receives `BundleOption[]` from the PDP parser — these contain quantity and pricePerUnit which map directly to the tier grid.

## R3: Cart Line Item Bundle Badge

**Decision**: Add a "BundelBonus" badge to cart line items when the item has an active bundle discount. Use the existing `discount` badge variant (orange background, white text) or add a dedicated "bundle" variant (red background, white text) matching the app screenshots.

**Rationale**: The reference image shows a red "BundelBonus" badge on cart line items. The existing badge component has a `discount` variant (orange) but the app uses red. A new variant or custom styling may be needed.

**Implementation approach**:
- The cart parser (`parse-cart.ts`) already handles `BUNDLES_BUTTON` decorator → "info" badge with text "Bundel". This needs to be changed to produce a "BundelBonus" badge with appropriate styling.
- Cart line items already show `originalPrice` strikethrough when `originalPrice > displayPrice`. Bundle discounts should already trigger this if the API sends corrected `display_price` values.
- The `CartItem` type does not need `priceRanges` — the badge and strikethrough pricing come from the API response data (decorator overrides and price fields).

## R4: PLP Bundle Display (Existing Infrastructure)

**Decision**: The PLP bundle display is already implemented and likely functional once picnic-api 4.3.0 provides proper data. Verify after upgrade rather than redesign.

**Rationale**: The codebase already has:
- `product-card.tsx`: Computes `getActiveBundlePrice()`, shows bundle-discounted price with strikethrough
- `quantity-stepper.tsx`: Renders `BundleDots` and `SavingsLabel` when bundle progress exists
- `savings-label.tsx`: Shows "€X.XX bespaard" text
- `bundle-dots.tsx`: Renders dot indicators
- Cart context: `registerBundleData()` and `getBundleProgress()` track bundle state

The PLP implementation appears complete. After upgrading picnic-api, the `priceRanges` data from search results should flow through to these components.

**Alternatives considered**: Rebuilding PLP bundle display from scratch — rejected because the infrastructure is already in place.

## R5: Warning Banner Removal

**Decision**: Remove the hardcoded amber banner div from `src/app/product/[id]/page.tsx` lines 104-106.

**Rationale**: Trivial deletion. The banner was a temporary measure while bundle data was unavailable.

## R6: Cart Bundle Data Source

**Decision**: Bundle badge and pricing in cart come from API response data (decorator overrides), not from client-side bundle threshold calculation.

**Rationale**: The cart API already sends `BUNDLES_BUTTON` decorators and applies price overrides (`display_price` vs `price` differences) for bundle-discounted items. The `totalDiscount` calculation in `parse-cart.ts` already captures bundle savings implicitly via the `price - displayPrice` delta. No additional client-side computation is needed for cart — the API is the source of truth for applied discounts.
