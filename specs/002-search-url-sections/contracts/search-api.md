# Contract: GET /api/search

**Feature**: 002-search-url-sections
**Date**: 2026-03-28
**File**: `src/app/api/search/route.ts`

## Endpoint

```
GET /api/search?q={searchTerm}
```

## Request

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `q` | Query string | `string` | Yes | Search term. Empty or missing returns empty results. |

## Response — Success (200)

**Type**: `SearchApiResponse`

```jsonc
{
  "products": [
    // Flat, deduplicated list of all products across all sections.
    // Used for total count display.
    {
      "id": "s1016590",
      "name": "Trostomaten",
      "namePrefix": "Bio",           // or null
      "subtitle": "D.O.P. Sarnese",  // or null
      "brand": "Mutti",              // or null
      "highlight": {                 // or null
        "text": "Prijskampioen",
        "color": "#B40117"
      },
      "flagIconKey": "flagNetherlands",  // or null
      "flagFallbackImageId": "abc123",   // or null
      "imageId": "image-id",
      "displayPrice": 169,
      "originalPrice": 199,          // or null
      "unitQuantity": "500 g",
      "maxCount": 15,
      "badges": [
        { "text": "2 voor €3", "variant": "promo" }
      ],
      "isUnavailable": false,
      "unavailableReason": null
    }
    // ... more products
  ],
  "sections": [
    {
      "title": "Opnieuw bestellen",
      "products": [
        // Subset of products belonging to this section.
        // Same Product shape as above.
      ]
    },
    {
      "title": "Tros- en pruimtomaten",
      "products": [/* ... */]
    },
    {
      "title": "Cherrytomaten",
      "products": [/* ... */]
    },
    {
      "title": "In blik / Heinz",
      "products": [/* ... */]
    }
    // ... more sections, ordered as returned by the Fusion API
  ],
  "query": "tomaten"
}
```

### Section Ordering

Sections appear in the order returned by the Fusion API:
1. "Opnieuw bestellen" (re-order section, if present)
2. Category sections (e.g., "Tros- en pruimtomaten", "Cherrytomaten", etc.)
3. "Bekijk ook" (catch-all section, last)

### Deduplication Rules

- Products that appear in the "Opnieuw bestellen" section are **excluded** from later category sections to avoid duplicates.
- The flat `products` array contains each product exactly once.
- Sections with zero products after deduplication are excluded.

## Response — Empty Results (200)

When the query produces no results or `q` is empty/missing:

```json
{
  "products": [],
  "sections": [],
  "query": ""
}
```

## Response — Error (502)

**Type**: `ApiErrorResponse`

```json
{
  "error": "Failed to search for products. Please try again later."
}
```

## Changes from Current Contract

| Aspect | Before (001) | After (002) |
|--------|-------------|-------------|
| Response fields | `{ products, query }` | `{ products, sections, query }` |
| `sections` field | Not present | `SearchSection[]` — ordered section groups |
| `products` field | Flat deduplicated list | **Unchanged** — same flat deduplicated list |
| Deduplication | Later occurrence wins | First occurrence wins (re-order section takes priority) |

## Parser Function Signature Change

```typescript
// Before (001):
export function parseFusionSearchPage(rawPage: unknown): Product[]

// After (002):
export function parseFusionSearchSections(rawPage: unknown): {
  sections: SearchSection[];
  products: Product[];
}
```

The old `parseFusionSearchPage` function is replaced by `parseFusionSearchSections` which returns both the sectioned and flat product data in a single pass.
