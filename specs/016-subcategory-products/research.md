# Research: Subcategory Product Listing

**Feature**: 016-subcategory-products  
**Date**: 2026-04-16

## R1: L2 Category Page API Structure

**Decision**: Use `client.app.getPage("L2-category-page-root?category_id={id}")` to fetch L2 product pages, matching the deep link target format already present in `CategoryItem.deepLinkTarget`.

**Rationale**: The existing subcategory items contain `deepLinkTarget` values like `"L2-category-page-root?category_id=123"`. The `getPage()` API accepts these page identifiers directly. This is the same pattern used for L1 pages in the subcategories route.

**Alternatives considered**:
- Using `catalog.getCategory()` — rejected because the codebase consistently uses Fusion pages (`getPage`) for all category browsing, not the catalog API.

## R2: Product Parsing from L2 Pages

**Decision**: Reuse `containerToProduct()` from `parse-fusion-search.ts` and `findSellingUnitContainers()` from `pml-helpers.ts` to extract products from L2 category pages.

**Rationale**: L2 category pages contain the same `selling-unit-*-tile` PML nodes as search result pages. The `containerToProduct()` function already handles the full conversion from PML selling-unit containers to the `Product` type, including badges, pricing, availability, and visual metadata. Rewriting this logic would violate DRY.

**Alternatives considered**:
- Writing a dedicated L2 parser from scratch — rejected as DRY violation; the selling-unit tile structure is identical.
- Using `parseFusionSearchSections()` directly — rejected because L2 pages don't have the search-specific section header/wrapper structure. Only the lower-level container-finding and conversion functions are reusable.

## R3: Shared Parser Extraction

**Decision**: Export `containerToProduct()` from `parse-fusion-search.ts` (currently not exported). Create a thin `parse-category-products.ts` that calls `findSellingUnitContainers()` + `containerToProduct()` on the L2 page tree.

**Rationale**: `containerToProduct` is the core reusable unit. Exporting it requires no refactoring — it's already a pure function. The new parser file stays single-purpose (SRP) while reusing shared logic (DRY).

**Alternatives considered**:
- Extracting `containerToProduct` into a new shared file (e.g., `parse-product-common.ts`) — rejected as over-engineering; it's fine in its current file with an export added.

## R4: Component Reuse Strategy

**Decision**: Reuse `ProductGrid` (flat mode with `products` prop) directly. Create a thin `CategoryProductsView` wrapper component that handles the back button, title, loading/error states, and delegates product rendering to `ProductGrid`.

**Rationale**: `ProductGrid` already supports a flat `products: Product[]` prop. `ProductCard` (used by `ProductGrid`) already includes cart actions via `CartProvider`. No modifications needed to these components. The new wrapper follows the same pattern as `SubcategoryView`.

**Alternatives considered**:
- Reusing `ResultsView` directly — rejected because `ResultsView` includes search-specific text ("X resultaten voor 'query'") that doesn't apply to category browsing.
- Modifying `ResultsView` to be generic — possible but couples search concerns with category concerns.

## R5: Navigation State Extension

**Decision**: Extend `CategoryNavState` to include a third level: `{ level: "l2"; categoryId: string; categoryName: string; parentCategoryId: string; parentCategoryName: string }`. Add a `categoryProductsState` discriminated union similar to `subcategoriesState`.

**Rationale**: The back button from L2 products needs to return to the L1 sub-category list, which requires knowing the parent category context. Storing both parent and current category IDs enables this without re-fetching.

**Alternatives considered**:
- Using a navigation stack/history array — rejected as over-engineering for a fixed 3-level hierarchy.
- Storing only current level and relying on cached subcategory data — this is what we do; the subcategoriesState remains in memory when drilling to L2.

## R6: Making SubcategoryView Rows Tappable

**Decision**: Add an `onSubcategoryTap` callback prop to `SubcategoryView`. When provided, `SubcategoryRow` becomes a button that calls the callback with the tapped `CategoryItem`.

**Rationale**: Currently `SubcategoryRow` is a non-interactive div (comment: "tap is a no-op"). Making it tappable follows the same pattern as `CategoryGrid.onCategoryTap`.

**Alternatives considered**:
- Handling tap logic inside `SubcategoryView` — rejected; the parent (`page.tsx`) owns navigation state and should receive the callback (DI principle).
