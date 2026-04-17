# Research: Sub-category Navigation

**Feature**: 015-subcategory-navigation
**Date**: 2026-04-16

## Research Questions & Findings

### R1: L1 Category Page API Response Structure

**Question**: What does `client.app.getPage("L1-category-page-root?category_id=21724")` return? How are sub-categories structured?

**Finding**: The L1 page returns a FusionPage with the **same PML item structure** as the top-level category list. Sub-categories use `core-list-item-category-{id}` nodes with `accessibilityLabel`, `onPress.target`, and IMAGE sources — identical to top-level categories.

**Tree structure** (confirmed via live API call for category 21724 = "Fruit"):
```
FusionPage
  id: "L1-category-tree-generic-root-js"
  header: { type: "STATIC", title: "Fruit" }    ← category name in header
  body: StateBoundaryComponent (id: "GlobalState")
    child: BlockComponent (id: "root")
      children[0]: BlockComponent (id: "core-category-promotions-block")
        children[0]: PMLItem (id: "core-category-promotions-item")   ← "Acties" promotions link
      children[1]: BlockComponent (id: "core-L1-category-page-vertical-list-section")
        children[0]: BlockComponent (id: "core-L1-category-page-list")
          children[0..N]: PMLItem[]  ← sub-category items (same format as top-level)
```

**Key observations**:
1. The page `header.title` contains the parent category name (e.g., "Fruit").
2. There is a **promotions item** (`core-category-promotions-item`) at the top with label "Acties" that links to `L2-promotion-category-page-root,l1CategoryId=21724`. We will skip this for now (out of scope).
3. Sub-category items are in `core-L1-category-page-list` block, using the same `core-list-item-category-{id}` prefix.
4. The list block ID is `core-L1-category-page-list` (vs `core-category-tree-wrapper-list` for top-level). Our parser needs to handle both.

**Sub-categories observed for "Fruit" (21724)**:
1. Fruit van Hollandse bodem (CustomCatNLFruitLvl2Pos1)
2. Sinaasappel & citrus (21746)
3. Banaan, appel & peer (21745)
4. Kiwi, druiven, mango & exoten (21747)
5. Rood fruit & bessen (21750)
6. Meloen, ananas & passievrucht (21749)
7. Gesneden fruit (21751)
8. Verse sappen (CustomCatFruitLvl1L2Versesappen)

### R2: L2 Category Page API Response Structure

**Question**: What does L2 return? Does it contain further sub-categories or products?

**Finding**: L2 pages contain **products (articles), not sub-categories**. The L2 page is the leaf level of the category tree.

**Tree structure** (confirmed for category 21746 = "Sinaasappel & citrus"):
```
FusionPage
  id: "L2-category-page-root"
  header: { type: "STATIC", title: "Sinaasappel & citrus" }
  body: StateBoundaryComponent (id: "GlobalState")
    child: StateBoundaryComponent (id: "CategoryTreeArticlesState")
      child: BlockComponent (id: "root")
        children[0]: BlockComponent (id: "core-L2-category-page-horizontal-list-section")
          children[0..N]: PMLItem[] (id: "category-tree-page-filter-item-{id}")  ← filter chips
        children[1]: BlockComponent (id: "core-L2-category-page-vertical-list-section")
          children[0..N]: BlockComponent (id: "category-tree-page-articles-section*")  ← product groups
            children: [sub-header, vertical-article-tiles]  ← actual products
```

**Key observations**:
1. L2 uses **filter chips** (horizontal list) for product sub-filtering — these use JavaScript expressions for state management, not deep links. They are **not navigable sub-categories**.
2. L2 contains **product article tiles** grouped by section. This is the product listing level.
3. **L2 is out of scope** for this feature (spec says "tapping a leaf sub-category will be a no-op for now").

### R3: Deep Link Format Differences

**Question**: How do L1 and L2 deep links differ? Can we distinguish them?

**Finding**: The deep link format reliably distinguishes levels:

| Level | Deep link pattern | Page ID for `getPage()` |
|-------|-------------------|------------------------|
| Top → L1 | `app.picnic://store/page;id=L1-category-page-root,category_id={id}` | `L1-category-page-root?category_id={id}` |
| L1 → L2 | `app.picnic://store/page;id=L2-category-page-root,category_id={id}` | `L2-category-page-root?category_id={id}` |
| L1 → L2 promo | `app.picnic://store/page;id=L2-promotion-category-page-root,l1CategoryId={id}` | (out of scope) |

**Decision**: When a sub-category's `onPress.target` contains `L2-category-page-root`, it's a leaf — we show it but make the tap a no-op. When it contains `L1-category-page-root`, we can drill down further (though in practice, the hierarchy is Top → L1 → L2, and L1 items always link to L2).

### R4: Parser Reuse Opportunity

**Question**: Can we reuse the existing `parseCategoryPage()` from feature 014?

**Finding**: **Almost entirely.** The L1 sub-category PML items have the same structure as top-level categories:
- Same `core-list-item-category-{id}` ID prefix
- Same `accessibilityLabel` for name
- Same `onPress.target` for deep link
- Same IMAGE `source.id` for thumbnail

**The only difference** is the container block ID:
- Top-level: `core-category-tree-wrapper-list`
- L1 page: `core-L1-category-page-list`

**Decision**: Generalize the parser to accept a block ID pattern, or search for any block containing `core-list-item-category-*` children. The existing `findNodeByIdSubstring` helper can find nodes by partial ID match.

### R5: Page Header as Category Title

**Question**: How do we display the category name when viewing sub-categories?

**Finding**: The FusionPage `header.title` field contains the parent category name (e.g., `"Fruit"` for category 21724). This is reliable and available on every L1 page response.

**Decision**: The API response for sub-categories should include the `header.title` so the client can display it as a heading (FR-009).

### R6: Navigation Model

**Question**: How should we manage navigation state (top-level → L1 → back)?

**Finding**: Per spec assumption, navigation state is client-side only (no URL changes). The simplest model:
- `page.tsx` maintains a `categoryNav` state: `{ level: "top" } | { level: "l1", categoryId: string, categoryName: string }`
- When user taps a top-level category → set state to `{ level: "l1", ... }` → fetch sub-categories from new API endpoint
- Back button → set state to `{ level: "top" }`
- Top-level categories are already fetched and cached in existing state

## Summary

| Topic | Decision |
|-------|----------|
| L1 API endpoint | `client.app.getPage("L1-category-page-root?category_id={id}")` |
| L1 tree structure | Same PML structure as top-level; sub-categories in `core-L1-category-page-list` |
| L2 API endpoint | `client.app.getPage("L2-category-page-root?category_id={id}")` — returns products, not sub-categories |
| L2 scope | Out of scope (leaf node, tap is no-op) |
| Parser reuse | Generalize existing parser to handle different container block IDs |
| Category title | Use `header.title` from FusionPage response |
| Navigation model | Client-side state in `page.tsx`, no URL changes |
| Promotions item | "Acties" link at top of L1 page — skip for now |
