# Research: Search URL State and Section Headers

**Feature**: 002-search-url-sections
**Date**: 2026-03-28

## R1: Section Extraction from Fusion PML

### Decision
Use a hybrid approach: walk the PML tree for visual section headers and product groupings, and use the `state` object for the re-order section size and canonical product ID list.

### Rationale
The Fusion page response contains structured section data at two levels:
1. A `state` object with `originalProductsIds` (ordered list of all product IDs) and `analyticsRfySize` (number of re-order products)
2. PML nodes under `structured-selling-unit-search-result-visual-sections` with interleaved header-wrapper and product-wrapper blocks

Walking the PML tree gives us exact section names, display text, and product-to-section mapping. The `state.originalProductsIds` confirms ordering but isn't needed for the actual grouping since header-wrapper nodes naturally delimit sections.

### Alternatives Considered
- **`state.sections` array only**: Contains section names and indices, but indices aren't sequential — multiple sections share the same index. Doesn't directly provide product-to-section mapping without cross-referencing.
- **JSONPath on `sellingUnitIdsByFacetIds`**: Complex and fragile. The facet keys encode section info but in a non-obvious format.
- **Purely positional (contiguous ranges)**: Sections map to contiguous slices of `originalProductsIds`, but we'd need the header text from PML anyway.

### Key Findings
- Sections are delimited by PML `BLOCK` nodes with IDs `client-side-filtering-section-header-wrapper-{Name}`
- Products within a section are `BLOCK` nodes with IDs `client-side-filtering-section-wrapper-{Name}[__N]`
- Each product wrapper contains a selling-unit tile with ID `selling-unit-{productId}-tile-{sectionNum}-{posInSection}`
- The "Opnieuw bestellen" re-order section is a separate sibling node outside visual-sections, using horizontal scroll layout
- Filter-only sections (Bio, Acties) have 0 products and should be excluded
- Duplicate section names (Heinz, Picnic, Mutti appearing twice) use `__2` suffix in IDs and have distinct display text (e.g., "In blik / Heinz" vs "Passata / Heinz")
- Section header text is in RICH_TEXT markdown: `#(#333333)SectionName#(#333333)`

### Section Inventory (for "tomaten" query)

| Section | Display Text | Products |
|---------|-------------|----------|
| Opnieuw bestellen | Opnieuw bestellen | 5 |
| Tros- en pruimtomaten | Tros- en pruimtomaten | 9 |
| Cherrytomaten | Cherrytomaten | 7 |
| Snacktomaten | Snacktomaten | 5 |
| Picnic | In blik / Picnic | 9 |
| Heinz | In blik / Heinz | 2 |
| Mutti | In blik / Mutti | 11 |
| Heinz (2) | Passata / Heinz | 4 |
| Picnic (2) | Passata / Picnic | 4 |
| Mutti (2) | Passata / Mutti | 6 |
| Bekijk ook | Bekijk ook | 145 |

---

## R2: URL State Management in Next.js 16 App Router

### Decision
Use `useSearchParams()` from `next/navigation` to read the URL query parameter, and `router.push()` / `router.replace()` to update it. The page component reads `?q=` on mount and triggers a search if present.

### Rationale
This is the standard Next.js App Router pattern for client-side URL state. The page is already a `"use client"` component, so `useSearchParams` integrates without architecture changes. `router.push` creates browser history entries (enabling back/forward), while `router.replace` avoids polluting history for intermediate state updates.

### Alternatives Considered
- **`window.history.pushState` / `replaceState`**: Lower-level, bypasses Next.js router. Would work but doesn't integrate with Next.js navigation lifecycle (prefetching, route transitions).
- **Path-based routing (`/search/[query]`)**: Requires a new route directory. More complex and unnecessary for a single query parameter. Spec explicitly chose `?q=` approach.
- **Server-side rendering with `searchParams` prop**: Next.js pages receive `searchParams` as a server prop. Could eliminate the client-side fetch for initial load but would require converting the page to a server component with client sub-components — a larger refactor than needed.

### Implementation Pattern
1. Wrap the page content in `<Suspense>` (required for `useSearchParams` in Next.js 14+)
2. Read `searchParams.get("q")` on mount
3. If non-empty, trigger search automatically (same `handleSearch` flow)
4. On new searches, call `router.push("/?q=" + encodeURIComponent(query))`
5. On clear, call `router.push("/")` to remove the parameter
6. SearchBar receives an `initialQuery` prop to pre-populate the input

---

## R3: Handling Duplicate Sections and Filter-Only Sections

### Decision
Exclude filter-only sections (Bio, Acties) that have 0 products. For duplicate section names (e.g., two "Heinz" sections), use the full display text from the PML header which differentiates them (e.g., "In blik / Heinz" vs "Passata / Heinz").

### Rationale
Filter-only sections are client-side UI elements for toggling product filters — they contain no products and have no meaningful header to display. Duplicate sections have distinct header text in the PML (using category + brand), so the user sees meaningful, differentiable section titles.

### Alternatives Considered
- **Merge duplicate sections**: Would combine "In blik / Heinz" and "Passata / Heinz" into one "Heinz" section. Rejected because the API intentionally separates them by product category.
- **Number duplicate sections**: "Heinz (1)", "Heinz (2)". Rejected because the PML already provides distinct display text.

---

## R4: Re-order Section Handling

### Decision
Include the "Opnieuw bestellen" section as the first section in the results, rendered as a regular vertical product grid with its own section header. Per the clarification session, no horizontal carousel layout.

### Rationale
The spec and clarification explicitly chose vertical grid layout for all sections. The re-order section contains 5 products from the user's order history that also appear in their natural category sections — these duplicates will be deduplicated (shown only in the re-order section, not repeated in category sections).

### Implementation Note
Re-order products are identified by their position in `originalProductsIds[0..analyticsRfySize-1]` and by their location outside the `visual-sections` PML subtree. The parser will extract them as a separate section, then the existing deduplication logic will prevent them from appearing again in category sections.
