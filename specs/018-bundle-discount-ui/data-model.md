# Data Model: Bundle Discount UI

**Feature**: 018-bundle-discount-ui
**Date**: 2026-04-20

## Existing Entities (Unchanged)

### BundleThreshold
Represents a volume discount tier for PLP products.

| Field | Type | Description |
|-------|------|-------------|
| quantity | number | Minimum units to activate this tier |
| pricePerUnit | number | Price in cents per unit at this tier |

### BundleProgress
Runtime state combining bundle thresholds with current cart quantity. Computed by cart context.

| Field | Type | Description |
|-------|------|-------------|
| productId | string | Product identifier |
| thresholds | BundleThreshold[] | All available tiers |
| currentQuantity | number | Current cart quantity for this product |

### BundleOption
PDP-specific bundle data with richer metadata.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Bundle option identifier |
| quantity | number | Tier quantity (1-indexed position) |
| pricePerUnit | number | Price in cents per unit |
| imageId | string | Product image for this bundle |
| maxCount | number | Maximum purchasable count |

### CartItem (Existing — no structural changes)
Cart line items already have `displayPrice`, `originalPrice`, and `badges[]`. Bundle discounts are reflected through:
- `displayPrice` < `originalPrice` when a bundle discount is applied (API sends override)
- `badges[]` containing a badge from the `BUNDLES_BUTTON` decorator

### Badge (Existing — potential new variant)
Current variants: promo, discount, size, freshness, availability, info, unit-price.

May need a new `"bundle"` variant for "BundelBonus" styling (red background, white text) if the existing variants don't match the app design.

| Field | Type | Description |
|-------|------|-------------|
| variant | string | Visual style key |
| text | string | Display text (e.g. "BundelBonus") |

## Entity Relationships

```
Product (PLP) ──has──> BundleThreshold[] (via priceRanges)
                          │
                          ▼
CartContext ──tracks──> BundleProgress (runtime, per product)
                          │
                          ▼
QuantityStepper ──uses──> BundleDots + SavingsLabel

ProductDetail (PDP) ──has──> BundleOption[] (via bundles)
                                │
                                ▼
ProductPriceSection ──renders──> Tier Grid

CartItem ──has──> Badge[] (includes BundelBonus from API)
              ──has──> displayPrice / originalPrice (bundle-adjusted)
```

## State Transitions

Bundle tier activation on PLP/PDP:
- quantity = 0: No tier active, standard price shown
- quantity >= threshold[n].quantity: Tier n active, discounted price shown
- quantity increases past next threshold: Higher tier activates, greater discount

Cart bundle state:
- API applies bundle discount to `display_price` on order lines
- `BUNDLES_BUTTON` decorator present → "BundelBonus" badge rendered
- `price > display_price` → strikethrough original price shown
