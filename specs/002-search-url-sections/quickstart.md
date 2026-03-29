# Quickstart: Search URL State and Section Headers

**Feature**: 002-search-url-sections
**Date**: 2026-03-28

## Overview

This feature adds two capabilities to the search page:
1. **URL state sync** — The search term is stored as `?q=` in the URL, enabling page refresh, sharing, and browser history navigation.
2. **Section headers** — Search results are grouped under category headers (e.g., "Tros- en pruimtomaten", "Cherrytomaten") extracted from the Fusion API's PML response.

## Files to Modify (6 files)

| File | Change Type | Purpose |
|------|------------|---------|
| `src/lib/types.ts` | Add type | Add `SearchSection` type; update `SearchApiResponse` |
| `src/lib/parse-fusion-search.ts` | Rewrite core function | Replace `parseFusionSearchPage` with `parseFusionSearchSections` that returns sections |
| `src/app/api/search/route.ts` | Update response | Return `{ products, sections, query }` instead of `{ products, query }` |
| `src/app/page.tsx` | Major update | Add `useSearchParams`, `Suspense`, URL sync, section-aware rendering |
| `src/components/search-bar.tsx` | Add prop | Accept `initialQuery` to pre-populate input from URL |
| `src/components/product-grid.tsx` | Update rendering | Accept `SearchSection[]` and render section headers |

## Implementation Order

### Step 1: Types (`src/lib/types.ts`)

Add the `SearchSection` type and update `SearchApiResponse`:

```typescript
export type SearchSection = {
  title: string;
  products: Product[];
};

export type SearchApiResponse = {
  products: Product[];
  sections: SearchSection[];
  query: string;
};
```

### Step 2: Parser (`src/lib/parse-fusion-search.ts`)

Replace `parseFusionSearchPage` with `parseFusionSearchSections`:

1. Walk the PML tree to find section header blocks (`client-side-filtering-section-header-wrapper-*`)
2. For each header, collect the adjacent product wrapper blocks
3. Extract section title from RICH_TEXT markdown (strip color tags)
4. Extract products from each section's selling-unit tiles
5. Handle re-order section separately (sibling node outside visual-sections)
6. Deduplicate: products in earlier sections take priority
7. Exclude sections with 0 products
8. Return `{ sections, products }` where `products` is the flat deduplicated union

**Key PML traversal**:
- `body.child.children[0]` → search result container with `state` object
- `.children` → interleaved header-wrapper and product-wrapper BLOCK nodes
- Header ID pattern: `client-side-filtering-section-header-wrapper-{Name}`
- Product wrapper ID pattern: `client-side-filtering-section-wrapper-{Name}[__N]`
- Re-order section: separate sibling with `"Opnieuw bestellen"` in PML text

### Step 3: API Route (`src/app/api/search/route.ts`)

Update to call `parseFusionSearchSections` and return the new response shape:

```typescript
const { sections, products } = parseFusionSearchSections(rawPage);
return NextResponse.json({ products, sections, query });
```

### Step 4: SearchBar (`src/components/search-bar.tsx`)

Add `initialQuery` prop:
- Add `initialQuery?: string` to `SearchBarProps`
- Initialize `inputValue` state with `initialQuery ?? ""`
- Update `inputValue` when `initialQuery` changes (for browser navigation)

### Step 5: ProductGrid (`src/components/product-grid.tsx`)

Update to render sections:
- Change props from `{ products: Product[] }` to `{ sections: SearchSection[] }`
- Render each section: `<h2>` header + product grid
- Section header styling: match Picnic app's section header appearance

### Step 6: Page (`src/app/page.tsx`)

Major update for URL state:
1. Wrap page content in `<Suspense fallback={<LoadingView />}>`
2. Inner component uses `useSearchParams()` to read `?q=`
3. On mount, if `q` is non-empty, trigger search
4. On search submit: `router.push("/?q=" + encodeURIComponent(query))`
5. On clear: `router.push("/")`
6. Pass `initialQuery` to SearchBar
7. Update `ResultsView` to use `sections` from response
8. Update `SearchState` type to include `sections`

## Validation

```bash
npm run lint && npx tsc --noEmit && npm run build
```

No test runner is configured — validation is lint + typecheck + build.

## Key Design Decisions

1. **First-occurrence deduplication**: Products in "Opnieuw bestellen" are kept there and removed from later sections (reversed from current last-wins behavior).
2. **Flat `products` array retained**: For backward compatibility and easy total count (`products.length`).
3. **`router.push` for history**: Each search creates a history entry for back/forward navigation.
4. **Suspense boundary**: Required by Next.js for `useSearchParams()` in client components.
5. **Parser file stays under 300 lines**: The section extraction logic replaces (not adds to) the current flat extraction, keeping the file within the constitution's 300-line limit. Helper functions may need to be extracted to a separate file if the limit is threatened.
