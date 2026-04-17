# Data Model: Sub-category Navigation

**Feature**: 015-subcategory-navigation
**Date**: 2026-04-16

## Overview

This feature extends the category browsing from feature 014 to support drilling into sub-categories. It reuses `CategoryItem` for sub-categories (same PML structure) and adds a new API endpoint for fetching sub-categories by parent category ID. A new type is introduced for the sub-categories API response which includes the parent category title.

## Type Changes

### Existing Types (unchanged)

From `src/lib/category-types.ts`:

```typescript
export type CategoryItem = {
  id: string;
  name: string;
  imageId: string;
  deepLinkTarget: string;
};
```

Sub-categories are represented as `CategoryItem[]` — they have the exact same fields (name, imageId, deepLinkTarget) as top-level categories.

### New Type: `SubcategoriesApiResponse`

Added to `src/lib/category-types.ts`:

```typescript
/** Response shape for GET /api/categories/[categoryId]/subcategories. */
export type SubcategoriesApiResponse = {
  title: string;              // Parent category name from page header (e.g., "Fruit")
  subcategories: CategoryItem[];  // L1 sub-categories
};
```

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Parent category name from `FusionPage.header.title` |
| `subcategories` | `CategoryItem[]` | Ordered list of sub-categories within this parent |

### New Type: Client-side Navigation State

Used in `src/app/page.tsx` (not exported):

```typescript
type CategoryNavState =
  | { level: "top" }
  | { level: "l1"; categoryId: string; categoryName: string };
```

| Variant | When |
|---------|------|
| `{ level: "top" }` | Viewing top-level categories (default) |
| `{ level: "l1", ... }` | Viewing sub-categories of a specific parent |

## Field Mapping

### L1 FusionPage → SubcategoriesApiResponse

The `L1-category-page-root?category_id={id}` returns a FusionPage. Mapping:

| Raw field path | Response field | Extraction |
|---|---|---|
| `FusionPage.header.title` | `title` | Direct string read |
| `body → core-L1-category-page-list → children[]` | `subcategories` | Same extraction as top-level categories (reuse parser) |

### L1 Sub-category PMLItem → CategoryItem

Identical mapping to top-level categories (feature 014):

| Raw PML field path | CategoryItem field | Extraction |
|---|---|---|
| `PMLItem.id` | `id` | Strip prefix `"core-list-item-category-"` |
| `PMLItem.pml.component.accessibilityLabel` | `name` | Direct string read |
| `PMLItem.pml.component.child → IMAGE → source.id` | `imageId` | Tree traversal to first IMAGE source |
| `PMLItem.pml.component.onPress.target` | `deepLinkTarget` | Direct string read |

## PML Tree Structure Reference

### L1 Category Page
```
FusionPage (id: "L1-category-tree-generic-root-js")
  header.title: "{parent category name}"
  body: StateBoundaryComponent (id: "GlobalState")
    child: BlockComponent (id: "root")
      children[0]: BlockComponent (id: "core-category-promotions-block")
        children[0]: PMLItem (id: "core-category-promotions-item")  ← SKIPPED
      children[1]: BlockComponent (id: "core-L1-category-page-vertical-list-section")
        children[0]: BlockComponent (id: "core-L1-category-page-list")
          children[0..N]: PMLItem[]  ← sub-categories (same format as top-level)
```

Each sub-category PMLItem:
```
PMLItem (type: "PML", id: "core-list-item-category-{id}")
  pml.component: TOUCHABLE
    accessibilityLabel: "{sub-category name}"
    onPress: { actionType: "OPEN", target: "app.picnic://store/page;id=L2-category-page-root,category_id={id}" }
    child: STACK (HORIZONTAL)
      children[0]: STACK (HORIZONTAL, inner)
        children[0]: CONTAINER (64x64) → IMAGE (source.id: "{imageHash}")
        children[1]: RICH_TEXT (markdown: "{sub-category name}")
      children[1]: ICON (rightChevron)
```

## Display Rules

### Sub-category View (L1 level)

| Condition | Display |
|-----------|---------|
| Sub-categories loading | `<LoadingSpinner />` |
| Sub-categories loaded, count > 0 | Back button + category title heading + sub-category list |
| Sub-categories loaded, count === 0 | Empty state message + back button |
| Sub-categories fetch failed | `<ErrorView />` with retry + back button |
| User taps a sub-category (L2 link) | No-op (leaf node, product listing out of scope) |
| User taps back | Return to top-level categories view |

## No Changes to Existing Types

`CartData`, `Product`, `CategoriesApiResponse`, and other existing types remain unchanged. The existing `CategoryItem` type is reused as-is for sub-categories.
