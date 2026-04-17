# Data Model: Search Page Category Browsing

**Feature**: 014-search-categories
**Date**: 2026-04-15

## Overview

This feature introduces category types and a parser that extracts categories from the `empty-search-page-root` Fusion page response. The home page's idle state (previously a welcome screen) is replaced with a category grid. No existing types are modified — all new types live in a dedicated file.

## New Types (in `src/lib/category-types.ts`)

### `CategoryItem`

Our application-level representation of a single browsable category, extracted defensively from the raw PML tree.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Category identifier extracted from the PML item ID or deep link target (e.g., `"21724"`, `"CustomCatGlutenvrijL1"`) |
| `name` | `string` | Dutch display name (e.g., `"Fruit"`, `"Aardappelen & groente"`) |
| `imageId` | `string` | Image hash for `buildImageUrl()` (e.g., `"396767b8acb6..."`) |
| `deepLinkTarget` | `string` | Full deep link target from `onPress.target` (e.g., `"app.picnic://store/page;id=L1-category-page-root,category_id=21724"`) |

```typescript
export type CategoryItem = {
  id: string;
  name: string;
  imageId: string;
  deepLinkTarget: string;
};
```

### `CategoriesApiResponse`

Response shape for `GET /api/categories`.

| Field | Type | Description |
|-------|------|-------------|
| `categories` | `CategoryItem[]` | Ordered list of all categories |

```typescript
export type CategoriesApiResponse = {
  categories: CategoryItem[];
};
```

## No Changes to Existing Types

This feature does not modify `CartData`, `Product`, or any other existing type in `src/lib/types.ts`. The category types are self-contained. The `ApiErrorResponse` type from `src/lib/types.ts` is reused for error responses.

## Field Mapping

### Raw Fusion Page → CategoryItem

The `empty-search-page-root` returns a FusionPage with PML items nested under `core-category-tree-wrapper-list`. Each `PMLItem` maps to one `CategoryItem`:

| Raw PML field path | CategoryItem field | Extraction |
|---|---|---|
| `PMLItem.id` | `id` | Strip prefix `"core-list-item-category-"` from the PML item ID |
| `PMLItem.pml.component.accessibilityLabel` | `name` | Direct string read (cleanest source, avoids markdown parsing) |
| `PMLItem.pml.component.child.children[0].children[0].child.source.id` | `imageId` | Navigate STACK → inner STACK → CONTAINER → IMAGE → source.id |
| `PMLItem.pml.component.onPress.target` | `deepLinkTarget` | Direct string read from TOUCHABLE's onPress action |

**Fallback extraction for `name`**: If `accessibilityLabel` is missing, fall back to the RICH_TEXT markdown at `pml.component.child.children[0].children[1].markdown`.

**Fallback extraction for `imageId`**: Recursively search for the first IMAGE component's `source.id` within the PML component tree.

### Deep Link → Category ID

The `id` can be extracted from either the PML item ID or the deep link target:

```
PML item ID:     "core-list-item-category-21724"  → "21724"
Deep link target: "app.picnic://store/page;id=L1-category-page-root,category_id=21724" → "21724"
```

Both approaches yield the same result. The PML item ID prefix stripping is simpler and preferred. The deep link is preserved in `deepLinkTarget` for future navigation use.

## PML Tree Structure Reference

```
FusionPage (id: "empty-search-page-root-js")
  body: StateBoundaryComponent (id: "GlobalState")
    child: BlockComponent (id: "root")
      children[0]: BlockComponent (id: "category-tree-wrapper")
        children[0]: BlockComponent (id: "core-category-tree-wrapper-vertical-list-section")
          children[0]: BlockComponent (id: "core-category-tree-wrapper-list")
            children[0..N]: PMLItem[]  ← 26 category tiles
```

Each PML item:
```
PMLItem (type: "PML", id: "core-list-item-category-{id}")
  pml.component: TOUCHABLE
    accessibilityLabel: "{category name}"
    onPress: { actionType: "OPEN", target: "app.picnic://store/page;id=L1-category-page-root,category_id={id}" }
    child: STACK (HORIZONTAL)
      children[0]: STACK (HORIZONTAL, inner)
        children[0]: CONTAINER (64x64, borderRadius: 8)
          child: IMAGE (source.id: "{imageHash}")
        children[1]: RICH_TEXT (markdown: "{category name}")
      children[1]: ICON (rightChevron) — decorative only
```

## Display Rules

### Home Page (idle state)

| Condition | Display |
|-----------|---------|
| Categories loading | `<LoadingSpinner />` (existing component) |
| Categories loaded, count > 0 | Category grid with all tiles |
| Categories loaded, count === 0 | Empty state message |
| Categories fetch failed | `<ErrorView />` with retry button |
| Search query active | Categories hidden, search results shown (existing behavior) |

### Category Tile

| Element | Value |
|---------|-------|
| Image | `buildImageUrl(item.imageId)` inside a rounded container |
| Text | `item.name` — 1-2 lines, medium weight, truncated with ellipsis |
| Click action | Navigate to category (US2 — placeholder/no-op initially) |

## Existing Types Referenced

From `src/lib/types.ts` (unchanged):
- `ApiErrorResponse` — reused for categories error response
- `IMAGE_CDN_BASE`, `DEFAULT_IMAGE_SIZE` — used by `buildImageUrl()` for category images
