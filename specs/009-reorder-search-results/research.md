# Research: Reorder Section in Search Results

**Feature**: 009-reorder-search-results  
**Date**: 2026-04-10

## Research Questions

### RQ-1: Why doesn't the existing re-order extraction logic produce results?

**Context**: `parseFusionSearchSections` in `parse-fusion-search.ts` (lines 166-187) already has logic to extract the "Opnieuw bestellen" section. It iterates the children of the `structured-selling-unit-search-result` node, looking for nodes with IDs starting with `client-side-filtering-section-header-wrapper-` before the `visual-sections` container.

**Hypothesis — three possible failure points**:

1. **Node ID mismatch**: The re-order section header or wrapper nodes may use different ID patterns than `HEADER_PREFIX` (`client-side-filtering-section-header-wrapper-`) and `WRAPPER_PREFIX` (`client-side-filtering-section-wrapper-`). The API may use a different naming convention for re-order sections vs category sections.

2. **Product tile ID mismatch**: `findSellingUnitContainers` (in `pml-helpers.ts:80-110`) requires nodes with `type === "PML"` and `id.startsWith("selling-unit-")` and `id.includes("-tile")`. If re-order product tiles use a different ID format (e.g., `reorder-selling-unit-*` or omit the `-tile` suffix), they would not be found.

3. **Missing `content.sellingUnit`**: Even if tile containers are found, `containerToProduct` (line 38) returns `null` when `container.content?.sellingUnit` is falsy. Re-order tiles might structure the selling unit data differently.

**Decision**: Capture the raw API response for a search term known to return re-order data (e.g., "Roomboter") and inspect the PML tree to determine which failure point applies.

**Rationale**: Debugging the actual response is the only reliable way to identify the issue. The parser logic is structurally correct for the pattern it expects — the question is whether the API response matches that pattern.

**Alternatives considered**:
- Rewrite the parser from scratch using `state.analyticsRfySize` as a signal: rejected because it would discard working logic and the analytics field only provides a count, not product data.
- Add extensive logging to the parser and run the app: rejected because it's slower than inspecting the raw response once.

### RQ-2: How should the raw API response be captured for debugging?

**Decision**: Add a temporary debug endpoint or console.log in the search API route (`src/app/api/search/route.ts`) that writes the raw Fusion page response to a JSON file. Alternatively, use the browser dev tools network tab to capture the `/api/search` response and the upstream API call.

**Rationale**: The simplest approach is to add a temporary `console.log(JSON.stringify(rawPage))` in the API route, search for "Roomboter", and capture the output from the server logs. This can be done as the first implementation task and removed afterward.

**Alternatives considered**:
- Creating a test fixture file with a sample response: useful for long-term testing but requires the response to be captured first anyway.
- Using picnic-api directly in a script: requires separate auth token management.

### RQ-3: What rendering changes are needed?

**Decision**: No rendering changes are needed. The existing rendering pipeline already handles the re-order section correctly:

- `SearchPage` (in `page.tsx`) passes `sections` to `ProductGrid` and `SectionNavBar`
- `SectionNavBar` renders a pill badge for each section in the `sections` array
- `ProductGrid` renders each section with a title heading and product cards
- `ProductCard` renders cart action controls for all products regardless of section

The re-order section is a `SearchSection` like any other — once the parser correctly extracts it into the `sections` array (as the first entry), the rendering layer displays it without modifications.

**Rationale**: The rendering components are section-agnostic by design. They iterate over whatever sections the parser produces.

**Alternatives considered**: Adding a visual distinction (icon, different background) for the re-order section. Rejected in clarification — keep `SearchSection` as-is, no type discriminator.

### RQ-4: Is client-side deduplication needed?

**Decision**: No. Trust the upstream API to handle deduplication. The parser already has a `seenIds` Set that deduplicates across all sections (first-occurrence wins). If a product appears in the re-order section first, it will be skipped when encountered again in a category section.

**Rationale**: The existing `seenIds` mechanism in the parser (lines 153, 128-129) already prevents duplicates across sections. Combined with the assumption that the API also deduplicates, no additional logic is needed.

**Alternatives considered**: Explicit post-parse dedup filter — unnecessary given the `seenIds` mechanism.

### RQ-5: File size compliance after changes

**Decision**: `parse-fusion-search.ts` is currently 275 lines. The changes are expected to be minimal (fixing ID patterns or adding an alternative extraction path for re-order tiles). The file should remain under the 300-line constitution limit.

If the fix requires substantial new logic (e.g., a completely different extraction path for re-order tiles), the new logic should be extracted to a helper function in the same file or, if that would exceed 300 lines, moved to a separate helper module.

**Rationale**: Constitution Principle III prohibits files over 300 lines.

## Summary of Findings

| Question | Finding | Action |
|----------|---------|--------|
| RQ-1: Why no re-order results? | **Parser already works correctly** — all three hypothesized failure points were disproven | No parser fix needed |
| RQ-2: How to capture response? | Used existing `/tmp/picnic-test3.json` (Tomaten search, 3.2MB) | Done |
| RQ-3: Rendering changes? | None needed — rendering is section-agnostic | No action |
| RQ-4: Deduplication? | Already handled by `seenIds` + API trust | No action |
| RQ-5: File size? | 275/300 lines, no changes needed | No action |

## Root Cause Analysis (T007)

**Finding: The API uses two different PML layouts for the re-order section depending on the number of products.**

Analysis of two raw API responses revealed the discrepancy:

### Layout 1: Horizontal (many re-order products) — e.g. "Tomaten" (5 products)

```
structured-selling-unit-search-result
├── [0] client-side-filtering-section-header-wrapper-Opnieuw bestellen
├── [1] client-side-filtering-section-wrapper-Opnieuw bestellen  ← DIRECT sibling
│     └── horizontal-selling-unit-tiles (5 products)
└── [2] structured-selling-unit-search-result-visual-sections
```

The wrapper is a **direct sibling** of the header. The original parser found this correctly.

### Layout 2: Vertical (few re-order products) — e.g. "Roomboter" (1 product)

```
structured-selling-unit-search-result
├── [0] client-side-filtering-section-header-wrapper-Opnieuw bestellen
├── [1] structured-selling-unit-search-result-vertical-rfy  ← INTERMEDIATE container
│     └── client-side-filtering-section-wrapper-Opnieuw bestellen  ← NESTED inside
│           └── selling-unit-s1000002-tile-1-0 (1 product)
└── [2] structured-selling-unit-search-result-visual-sections
```

The wrapper is **nested inside** an intermediate `vertical-rfy` container. The original parser missed this because it only checked direct siblings for the `WRAPPER_PREFIX` pattern.

### Fix Applied

Updated the wrapper collection loop in `parseFusionSearchSections` (`src/lib/parse-fusion-search.ts:176-192`) to handle both layouts:
1. First checks if the sibling directly matches `WRAPPER_PREFIX + sectionKey` (Layout 1)
2. If not, and the sibling isn't another header or visual-sections, searches recursively inside it for a nested wrapper (Layout 2)

### Verification

Parser correctly extracts "Opnieuw bestellen" for both:
- Tomaten: 5 re-order products (horizontal layout)
- Roomboter: 1 re-order product (vertical layout)

## Unresolved Items

None — all research questions answered.
