# Research: Search Page Category Browsing

**Feature**: 014-search-categories
**Date**: 2026-04-15

## Research Questions & Findings

### R1: Which API Endpoint to Use for Category Data

**Question**: Three endpoints were identified during the specify phase: `client.app.getPage("empty-search-page-root")`, `client.app.getPage("category-tree-root")`, and legacy `GET /my_store?depth=0`. Which is the best fit?

**Decision**: Use `client.app.getPage("empty-search-page-root")` — the Fusion page endpoint that matches the native app's search landing screen.

**Rationale**: This is what the native Picnic app uses when displaying the search screen before any query is entered. The response returns a `FusionPage` with a well-structured PML tree containing exactly the categories shown to the user. Using the same endpoint as the native app ensures data parity (same categories, same ordering, same images).

The call is:
```typescript
client.app.getPage("empty-search-page-root")
// Internally: GET /pages/empty-search-page-root (with x-picnic-agent headers)
```

**Alternatives considered**:
- `category-tree-root`: May return a different layout optimized for the category tree page, not the search landing. Not tested.
- Legacy `GET /my_store?depth=0`: Returns structured `MyStore` data but may be deprecated and has different category ordering/grouping. Over-fetches (includes user data, content, etc.).

### R2: Response Shape — PML Tree Structure

**Question**: What does the `empty-search-page-root` response look like? How are categories organized?

**Finding**: The response is a single flat list of 26 grocery categories. **There is no "Deze week" promotional section** in this endpoint.

**Tree structure** (confirmed via live API call):
```
FusionPage
  id: "empty-search-page-root-js"
  header: null
  body: StateBoundaryComponent (id: "GlobalState")
    child: BlockComponent (id: "root")
      children[0]: BlockComponent (id: "category-tree-wrapper")
        children[0]: BlockComponent (id: "core-category-tree-wrapper-vertical-list-section")
          children[0]: BlockComponent (id: "core-category-tree-wrapper-list")
            children[0..25]: PMLItem[] — 26 category tiles
```

Each category tile is a `PMLItem` with this structure:
```
PMLItem
  type: "PML"
  id: "core-list-item-category-{categoryId}"   // e.g. "core-list-item-category-21724"
  analytics.contexts[1].data.deeplink: "app.picnic://store/page;id=L1-category-page-root,category_id={id}"
  analytics.contexts[2].data.name: "Fruit"     // category name (also in analytics)
  pml.component: FusionTouchableComponent
    type: "TOUCHABLE"
    accessibilityLabel: "Fruit"                // category name
    onPress.actionType: "OPEN"
    onPress.target: "app.picnic://store/page;id=L1-category-page-root,category_id=21724"
    child: StackComponent (HORIZONTAL)
      children[0]: StackComponent (HORIZONTAL, inner)
        children[0]: ContainerComponent (64x64, borderRadius: 8)
          child: ImageComponent
            source.id: "396767b8..."           // image hash for buildImageUrl()
        children[1]: RichTextComponent
          markdown: "Fruit"                    // display name
      children[1]: IconComponent (rightChevron) // visual hint only
```

**Key extraction points per tile**:
1. **Category ID**: Extract from `PMLItem.id` — strip prefix `"core-list-item-category-"` → `"21724"`
2. **Name**: `pml.component.accessibilityLabel` (cleanest) or `pml.component.child.children[0].children[1].markdown` (the RICH_TEXT)
3. **Image ID**: `pml.component.child.children[0].children[0].child.source.id` (the IMAGE source)
4. **Deep link target**: `pml.component.onPress.target` → `"app.picnic://store/page;id=L1-category-page-root,category_id=21724"`
5. **Category ID from deep link**: Parse `category_id=<value>` from the target string

**All 26 categories observed** (in order):
1. Fruit (21724)
2. Aardappelen & groente (21725)
3. Maaltijden & gemak (21727)
4. Vlees & vis (21726)
5. Vega & plantaardig (32811)
6. Bakkerij (21728)
7. Zuivel & eieren (21730)
8. Kaas (26714)
9. Vleeswaren & broodsalades (21731)
10. Borrel, tapas & spreads (36362)
11. Ontbijt & zoet beleg (21732)
12. Pasta, rijst & wereldkeuken (21733)
13. Diepvries (21740)
14. Voorraadkast (21734)
15. Koek, snoep & snacks (21735)
16. Glutenvrij (CustomCatGlutenvrijL1)
17. Drinken (21736)
18. Koffie & thee (21738)
19. Bier & aperitieven (33825)
20. Wijn & bubbels (33826)
21. Huishouden (21741)
22. Drogist (21742)
23. Gezondheid (35196)
24. Baby & kind (21743)
25. Dier (21744)
26. Koken, tafelen & vrije tijd (34134)

### R3: "Deze week" Section — Spec Adjustment Needed

**Question**: The spec mentions a "Deze week" promotional section with entries like "Alle acties", "Nieuw", "Alle recepten", "Onze Versmarkt". Does this exist in the API response?

**Finding**: **No.** The `empty-search-page-root` response contains only a single flat list of grocery categories under one block (`core-category-tree-wrapper-vertical-list-section`). There is no separate section for promotional/highlighted categories.

**Decision**: Drop the "Deze week" section from the implementation. The API doesn't provide it through this endpoint. The native app may compose the "Deze week" section from a different data source (possibly the home page or a promotional feed). We will implement what the API gives us: a single "Alle categorieën" section with all 26 categories.

**Impact on spec**:
- FR-001 (Deze week section): **Cannot be implemented** with this endpoint. Downgrade to "nice to have" / future enhancement if a promotional endpoint is found.
- FR-002 (Alle categorieën section): **Fully supported.** This is what we'll build.
- FR-010 (Section headers): Only one header needed: "Alle categorieën" (or no section header at all, since there's only one section).

### R4: Deep Link Parsing for Category Navigation

**Question**: How should we extract the `category_id` from the deep link target for navigation?

**Decision**: Parse the `onPress.target` string using a regex to extract the `category_id` parameter.

**Deep link format**: `app.picnic://store/page;id=L1-category-page-root,category_id={id}`

**Parsing approach**:
```typescript
function extractCategoryId(target: string): string | null {
  const match = target.match(/category_id=([^,&]+)/);
  return match ? match[1] : null;
}
```

**Note**: Category IDs are mostly numeric (e.g., `21724`, `32811`) but can also be string identifiers (e.g., `CustomCatGlutenvrijL1` for "Glutenvrij"). The parser must handle both.

### R5: Image URL Pattern

**Question**: How should category images be loaded?

**Decision**: Use the existing `buildImageUrl(imageId)` function from `src/lib/image-url.ts`. The image `source.id` from the PML tree is the same kind of hash used for product images.

**Example**:
```typescript
buildImageUrl("396767b8acb6f8f3aa60953c7f62b8d51a2c7c6391bf6580ac0b4240f4b9dc71")
// → "https://storefront-prod.nl.picnicinternational.com/static/images/396767b8.../medium.png"
```

The native app renders these at 64x64px. For our web grid, we may want to use a larger size for better quality.

### R6: Navigation Strategy for Category Drill-Down (US2)

**Question**: When a user taps a category, what page should they see?

**Decision**: Navigate to a new URL like `/?category={categoryId}` which triggers a fetch to `L1-category-page-root?category_id={id}`. This returns a FusionPage with sub-categories or products.

**However**, implementing the category product listing is a separate concern (US2, P2). For the initial implementation, we have two options:
1. Navigate to a search query that filters by category (if such API exists)
2. Build a category detail page

**For US1 (this sprint)**: Make tiles tappable with navigation targets stored in the data model. The actual navigation handler can be a no-op or show a "coming soon" toast for now, to be completed in US2.

**For US2**: Use `client.app.getPage("L1-category-page-root?category_id={id}")` and parse the response. This will require a new parser similar to the search parser. This is a significant piece of work and may warrant its own feature spec.

### R7: Parser Design — Defensive Extraction Strategy

**Question**: How should the parser extract categories from the PML tree? Should it walk the tree generically or use known IDs?

**Decision**: Use a hybrid approach — walk to the known container block by ID, then extract category tiles by their `PMLItem.id` prefix pattern.

**Algorithm**:
1. Navigate to `body.child` (root BlockComponent)
2. Find the block with ID containing `"category-tree-wrapper-list"` (recursive search using existing `findNodeByIdSubstring`)
3. Extract all `children` of that block where `type === "PML"` and `id` starts with `"core-list-item-category-"`
4. For each PMLItem, extract: category ID (from item ID), name (from `accessibilityLabel`), image ID (from IMAGE source), deep link target (from `onPress.target`)

**Fallback**: If the known container isn't found, recursively search for all TOUCHABLE components with `onPress.target` containing `"L1-category-page-root"` — this handles future API layout changes.

**Rationale**: This follows the same pattern as `parse-fusion-search.ts` which navigates by known IDs but has fallback paths. The ID prefix `"core-list-item-category-"` is a stable API pattern — category tiles have used this naming convention consistently.

### R8: File Organization

**Question**: Where should new files go? How many new files are needed?

**Decision**:
- `src/lib/category-types.ts` — types: `CategoryItem`, `CategoriesApiResponse`
- `src/lib/parse-categories.ts` — parser: `parseCategoryPage(rawPage: unknown): CategoryItem[]`
- `src/app/api/categories/route.ts` — API route: `GET /api/categories`
- `src/components/category-grid.tsx` — grid component: renders the category tiles
- Modify `src/app/page.tsx` — replace `LandingView` with category grid + loading/error states

This adds 4 new files and modifies 1 existing file. All new files will be well under the 300-line constitution limit.

## Summary

| Topic | Decision |
|-------|----------|
| API endpoint | `client.app.getPage("empty-search-page-root")` |
| Tree structure | Single flat list of 26 categories under `core-category-tree-wrapper-list` |
| "Deze week" section | Not available from this endpoint — dropped from scope |
| Data extraction | Item ID prefix + `accessibilityLabel` + IMAGE source + onPress target |
| Image loading | Existing `buildImageUrl()` with image hash from `source.id` |
| Category navigation | Store deep link target; implement drill-down as US2 |
| Parser strategy | Known-ID navigation with generic fallback |
| File count | 4 new files + 1 modified |
