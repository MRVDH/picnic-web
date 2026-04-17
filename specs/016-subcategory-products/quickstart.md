# Quickstart: Subcategory Product Listing

**Feature**: 016-subcategory-products  
**Branch**: `016-subcategory-products`

## What This Feature Does

Completes the 3-level category browsing flow by displaying products when a user taps a leaf sub-category (L2 level). The product listing reuses the same visual components as search results.

## Navigation Flow

```
Top-level categories → L1 Sub-categories → L2 Products
        ← back                  ← back
```

## Key Files

| File | Role |
|------|------|
| `src/lib/parse-category-products.ts` | NEW: Parses L2 category page into `Product[]` |
| `src/lib/parse-fusion-search.ts` | MODIFIED: Export `containerToProduct` for reuse |
| `src/app/api/categories/[categoryId]/products/route.ts` | NEW: API endpoint |
| `src/components/category-products-view.tsx` | NEW: Product listing wrapper with back nav |
| `src/components/subcategory-view.tsx` | MODIFIED: Rows become tappable |
| `src/app/page.tsx` | MODIFIED: L2 nav state + products fetch |

## API

```
GET /api/categories/{categoryId}/products
→ { title: string | null, products: Product[] }
```

## Validation

```bash
npm run lint && npm run build
```
