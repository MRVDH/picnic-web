# Quickstart: Product Detail Page

**Feature**: 005-product-detail-page  
**Date**: 2026-03-30

## Prerequisites

- Node.js 20.9+
- Project dependencies installed (`npm install`)
- Valid Picnic auth token (set via the login page at `/login`)

## Development

```bash
# Start development server
npm run dev

# Lint code
npm run lint

# Build for production
npm run build
```

## Key Files (New)

| File | Purpose |
|------|---------|
| `src/app/product/[id]/page.tsx` | Product detail page (client component) |
| `src/app/product/[id]/loading.tsx` | Loading state for product page |
| `src/app/product/[id]/error.tsx` | Error boundary for product page |
| `src/app/api/product/[id]/route.ts` | API route: fetches and parses product data |
| `src/lib/parse-fusion-product.ts` | Fusion page parser for product details |
| `src/lib/types.ts` | Extended with `ProductDetail` and related types |
| `src/lib/pml-helpers.ts` | Extended with `findNodeById`, `findNodeByIdPrefix`, `collectPropertyValues` |
| `src/components/product-gallery.tsx` | Image gallery with thumbnail strip |
| `src/components/product-info-header.tsx` | Title, brand, weight, unit price |
| `src/components/product-price-section.tsx` | Price, promotion label, bundle options |
| `src/components/product-highlights.tsx` | Highlights list |
| `src/components/product-description.tsx` | Description block |
| `src/components/allergen-badges.tsx` | Allergen badges with "bevat mogelijk" section |
| `src/components/accordion-section.tsx` | Collapsible info section |
| `src/components/nutrition-table.tsx` | Voedingswaarde table renderer |
| `src/components/product-slider.tsx` | Horizontal scrollable product slider |
| `src/components/product-slider-card.tsx` | Compact card for slider items |

## Key Files (Modified)

| File | Change |
|------|--------|
| `src/components/product-card.tsx` | Add optional `href` prop; wrap content in `Link` when provided |
| `src/components/product-grid.tsx` | Pass `href` to `ProductCard` for product detail navigation |

## Testing a Product Detail Page

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000/login` and authenticate
3. Search for a product (e.g. "melk")
4. Click any product card to navigate to its detail page
5. Or navigate directly: `http://localhost:3000/product/s1001524` (replace with a valid ID)

## Architecture Overview

```
Browser                    Next.js Server               Picnic API
  │                            │                            │
  │  GET /product/s1001524     │                            │
  │ ──────────────────────>    │                            │
  │                            │  (middleware: auth check)  │
  │                            │                            │
  │  HTML (page shell)         │                            │
  │ <──────────────────────    │                            │
  │                            │                            │
  │  GET /api/product/s1001524 │                            │
  │ ──────────────────────>    │                            │
  │                            │  GET /pages/product-       │
  │                            │  details-page-root?id=...  │
  │                            │ ──────────────────────>    │
  │                            │                            │
  │                            │  FusionPage JSON           │
  │                            │ <──────────────────────    │
  │                            │                            │
  │                            │  parse-fusion-product.ts   │
  │                            │  (extract ProductDetail)   │
  │                            │                            │
  │  ProductDetail JSON        │                            │
  │ <──────────────────────    │                            │
  │                            │                            │
  │  (render all sections)     │                            │
```

## Constraints

- **Do NOT use** `client.catalog.getProductDetailsPage()` or `client.catalog.getProductDetails()` from picnic-api
- **Do use** `client.sendRequest("GET", "/pages/product-details-page-root?id=...", null, true)` directly
- Follow the same parsing pattern as `parse-fusion-search.ts` — use local `pml-helpers.ts` utilities, not `jsonpath-plus`
- All new files must comply with the project constitution (max 300 lines, SRP, no deep nesting, named constants)
