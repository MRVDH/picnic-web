# Quickstart: Reorder Section in Search Results

**Feature**: 009-reorder-search-results  
**Date**: 2026-04-10

## Prerequisites

- Node.js 20.9+
- Valid Picnic auth token (login at `/login` to obtain one via cookie)
- A test account that has previously ordered products matching "Roomboter" or "Tomaten"

## Getting Started

```bash
# Start the development server
npm run dev
```

## Implementation Approach

This feature is a **parser bugfix**, not a new feature build. The rendering layer already handles re-order sections correctly. The work is entirely in `src/lib/parse-fusion-search.ts`.

### Step 1: Capture Raw API Response

Add temporary debug logging to `src/app/api/search/route.ts` to capture the raw Fusion page response:

```typescript
// In the GET handler, after rawPage is fetched:
console.log("RAW_SEARCH_RESPONSE", JSON.stringify(rawPage, null, 2));
```

Search for "Roomboter" in the browser. Copy the JSON from the server console output.

### Step 2: Analyze the PML Tree

In the captured JSON, look for:

1. The `structured-selling-unit-search-result` container node
2. Its direct children — identify which ones are the re-order section vs category sections
3. The node IDs — check if they match the expected patterns:
   - Header: `client-side-filtering-section-header-wrapper-*`
   - Wrapper: `client-side-filtering-section-wrapper-*`
4. Product tiles within the re-order wrappers — check if they have:
   - `type: "PML"`
   - `id` starting with `selling-unit-` and containing `-tile`
   - `content.sellingUnit` with product data

### Step 3: Fix the Parser

Based on the analysis, fix one or more of:

- **ID patterns**: Update `HEADER_PREFIX`, `WRAPPER_PREFIX`, or add alternative patterns for re-order sections
- **Tile detection**: Update `findSellingUnitContainers` in `pml-helpers.ts` if re-order tiles use different ID patterns
- **Data extraction**: Update `containerToProduct` if the selling unit data is structured differently

### Step 4: Verify

1. Search for "Roomboter" — should show "Opnieuw bestellen" section at top
2. Search for "Tomaten" — should show "Opnieuw bestellen" section at top
3. Search for a term with no re-order data — should show only category sections (no regression)
4. Check the section nav bar includes an "Opnieuw bestellen" pill when the section is present
5. Verify no duplicate products between re-order and category sections

### Step 5: Clean Up

Remove the debug logging from `route.ts`.

## Key Files

| File | Role |
|------|------|
| `src/lib/parse-fusion-search.ts` | **Primary fix target** — re-order section extraction (lines 166-187) |
| `src/lib/pml-helpers.ts` | May need fix — `findSellingUnitContainers` tile ID matching |
| `src/lib/extract-tile-data.ts` | May need fix — if re-order tile PML structure differs |
| `src/app/api/search/route.ts` | Temporary debug logging, then clean up |
| `src/app/page.tsx` | No changes — renders sections generically |
| `src/components/section-nav-bar.tsx` | No changes — renders pills from sections array |
| `src/components/product-grid.tsx` | No changes — renders section titles and product cards |

## Validation Commands

```bash
# Lint check
npm run lint

# Build check
npm run build
```

No test suite exists. Validation is manual via the browser.
