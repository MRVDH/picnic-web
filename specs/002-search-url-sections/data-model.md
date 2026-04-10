# Data Model: Search URL State and Section Headers

**Feature**: 002-search-url-sections
**Date**: 2026-03-28

## Entities

### SearchSection

A named group of products returned by the Fusion API. Represents a category-level grouping of search results (e.g., "Tros- en pruimtomaten", "Cherrytomaten").

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | Yes | Display text for the section header, extracted from PML RICH_TEXT markdown (e.g., "In blik / Heinz"). Stripped of color tags and formatting. |
| `products` | `Product[]` | Yes | Ordered list of products in this section. Always non-empty (sections with 0 products are excluded during parsing). |

**Constraints**:
- `products.length > 0` — filter-only sections (Bio, Acties) with zero products are excluded at parse time.
- `title` is unique per search response — duplicate PML section names (e.g., two "Heinz" sections) are disambiguated by their full display text ("In blik / Heinz" vs "Passata / Heinz").
- Section order matches the Fusion API response order: "Opnieuw bestellen" first (if present), then category sections, then "Bekijk ook" last.

**Source**: Extracted from PML `BLOCK` nodes with IDs matching `client-side-filtering-section-header-wrapper-*` and their adjacent `client-side-filtering-section-wrapper-*` product blocks.

### Product (existing — no changes)

The existing `Product` type defined in `src/lib/types.ts` is unchanged. Products within sections carry the same fields as today. Deduplication behavior changes: products appearing in "Opnieuw bestellen" are shown there and excluded from later category sections (reversed from current behavior where later entries win).

### SearchApiResponse (updated)

The internal API response from `/api/search` gains a `sections` field.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `products` | `Product[]` | Yes | **Retained for backward compatibility.** Flat list of all unique products across all sections. |
| `sections` | `SearchSection[]` | Yes | Ordered list of sections with their products. Empty array when no results. |
| `query` | `string` | Yes | The search term that produced these results. |

**Design decision**: Keeping the flat `products` array alongside `sections` allows the total count display ("X resultaten") to use `products.length` without summing across sections. The page component uses `sections` for rendering and `products.length` for the count.

## URL State

### Search Query Parameter

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `q` | `string` | URL query string | The active search term. Absent or empty means no active search (show landing page). |

**Behavior**:
- **New search**: `router.push("/?q=" + encodeURIComponent(query))` — creates a browser history entry.
- **Clear search**: `router.push("/")` — removes the parameter entirely.
- **Page load**: Read `searchParams.get("q")` — if non-empty, trigger search automatically.
- **Encoding**: Standard `encodeURIComponent` for the value. Special characters (spaces, accents) are percent-encoded.

## Type Definitions (TypeScript)

```typescript
// New type — added to src/lib/types.ts
export type SearchSection = {
  /** Display text for the section header (e.g., "Cherrytomaten"). */
  title: string;
  /** Products in this section, in API order. Always non-empty. */
  products: Product[];
};

// Updated type — modified in src/lib/types.ts
export type SearchApiResponse = {
  products: Product[];
  sections: SearchSection[];
  query: string;
};
```

## Relationships

```
SearchApiResponse
├── products: Product[]         (flat, deduplicated, for total count)
├── sections: SearchSection[]   (grouped, ordered, for rendering)
│   └── SearchSection
│       ├── title: string
│       └── products: Product[] (subset of top-level products)
└── query: string

URL query parameter "q"
└── drives: SearchApiResponse.query
└── drives: SearchBar input value (initialQuery)
└── drives: page.tsx search trigger on mount
```

## Data Flow

1. **User searches or page loads with `?q=`** → query string extracted
2. **Client fetches** `GET /api/search?q={query}` → API route handler
3. **API route** calls Picnic Fusion API → raw PML page response
4. **Parser** (`parseFusionSearchSections`) extracts `SearchSection[]` from PML tree
5. **Parser** also produces flat `Product[]` (deduplicated union of all section products)
6. **API route** returns `{ products, sections, query }` as JSON
7. **Page component** receives response, renders sections with headers via `ProductGrid`
8. **URL** stays in sync: `router.push("/?q=...")` on search, `router.push("/")` on clear
