# Data Model: Reorder Section in Search Results

**Feature**: 009-reorder-search-results  
**Date**: 2026-04-10

## Entities

This feature introduces no new entities or types. It relies entirely on existing types. The key entities involved are documented below for reference.

### SearchSection (existing, unchanged)

**Location**: `src/lib/types.ts`

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Section heading from API (e.g., "Opnieuw bestellen", "Boter") |
| `products` | `Product[]` | Non-empty array of products in this section |

**Validation**: Sections with zero products are not included in the array (enforced by parser).

**Notes**: The re-order section is not structurally distinguished from category sections. It appears as the first element in the `sections` array when present, with its title set from the API response (typically "Opnieuw bestellen").

### Product (existing, unchanged)

**Location**: `src/lib/types.ts`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique product identifier |
| `name` | `string` | Product display name |
| `namePrefix` | `string \| null` | Bold prefix (e.g., "Bio") |
| `subtitle` | `string \| null` | Text above the name |
| `brand` | `string \| null` | Brand or subtext |
| `highlight` | `Highlight \| null` | Colored subtext (e.g., "Prijskampioen") |
| `flagIconKey` | `string \| null` | Country flag icon key |
| `flagFallbackImageId` | `string \| null` | Fallback image for flag |
| `imageId` | `string` | Product image ID for CDN |
| `displayPrice` | `number` | Current price in cents |
| `originalPrice` | `number \| null` | Pre-discount price (cents), null if no discount |
| `unitQuantity` | `string` | Quantity label (e.g., "250 gram") |
| `maxCount` | `number` | Maximum orderable quantity |
| `priceRanges` | `BundleThreshold[] \| null` | Volume discount thresholds |
| `badges` | `Badge[]` | Labels (promo, size, freshness, etc.) |
| `isUnavailable` | `boolean` | Whether product is unavailable |
| `unavailableReason` | `string \| null` | Reason for unavailability |

**Validation**: Products must have a non-empty `id`. Products are deduplicated by `id` across sections (first occurrence wins via `seenIds` Set in parser).

### SearchResult (existing, unchanged)

**Location**: `src/lib/types.ts`

| Field | Type | Description |
|-------|------|-------------|
| `products` | `Product[]` | Flat list of all products (from all sections) |
| `sections` | `SearchSection[]` | Ordered array of sections; re-order section is first when present |
| `query` | `string` | The search query that produced these results |

### SearchApiResponse (existing, unchanged)

**Location**: `src/lib/types.ts`

Same shape as `SearchResult` — returned by the `/api/search` route.

## State Transitions

No state transitions are relevant. The search result data is immutable once parsed from the API response.

## Relationships

```
SearchResult
  └── sections: SearchSection[]       (0..N, ordered: re-order first, then categories)
       └── products: Product[]        (1..N per section, deduplicated across sections)
  └── products: Product[]             (flat aggregate of all section products)
```

## Changes Required

**None.** All types remain unchanged. The fix is entirely in the parser layer — correctly extracting re-order section data from the PML tree into the existing `SearchSection` and `Product` types.
