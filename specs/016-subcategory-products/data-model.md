# Data Model: Subcategory Product Listing

**Feature**: 016-subcategory-products  
**Date**: 2026-04-16

## Entities

### CategoryProductsApiResponse (NEW)

Response type for the `GET /api/categories/{categoryId}/products` endpoint.

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string \| null` | Page title from FusionPage header (sub-category name) |
| `products` | `Product[]` | Products in the sub-category |

### Product (EXISTING — no changes)

Reused from `src/lib/types.ts`. The L2 category page contains the same selling-unit tiles as search results, producing identical `Product` objects.

### CategoryNavState (MODIFIED)

Extended discriminated union for the 3-level navigation state.

| Variant | Fields | Description |
|---------|--------|-------------|
| `{ level: "top" }` | — | Viewing top-level categories |
| `{ level: "l1", categoryId, categoryName }` | `categoryId: string`, `categoryName: string` | Viewing sub-categories of an L1 category |
| `{ level: "l2", categoryId, categoryName, parentCategoryId, parentCategoryName }` | `categoryId: string`, `categoryName: string`, `parentCategoryId: string`, `parentCategoryName: string` | Viewing products of an L2 sub-category |

### CategoryProductsState (NEW)

Client-side state for the L2 product fetch lifecycle.

| Variant | Fields | Description |
|---------|--------|-------------|
| `{ status: "idle" }` | — | No fetch in progress |
| `{ status: "loading" }` | — | Fetching products |
| `{ status: "success", title, products }` | `title: string`, `products: Product[]` | Products loaded |
| `{ status: "error", message }` | `message: string` | Fetch failed |

## State Transitions

```
Top-level categories
  ↓ tap category (L1 deep link)
L1 Sub-categories (subcategoriesState)
  ↓ tap sub-category (L2 deep link)
L2 Products (categoryProductsState)
  ↓ tap back
L1 Sub-categories (cached — no re-fetch)
  ↓ tap back
Top-level categories (cached — no re-fetch)
```

## Relationships

- `CategoryProductsApiResponse.products` uses the existing `Product` type from search
- `CategoryNavState.l2.parentCategoryId` references the L1 category, enabling back navigation without re-fetching
- `CategoryProductsState` mirrors the same discriminated union pattern as `SubcategoriesState`
