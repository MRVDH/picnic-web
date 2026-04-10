# Implementation Plan: Product Detail Page

**Branch**: `005-product-detail-page` | **Date**: 2026-03-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-product-detail-page/spec.md`

## Summary

Add a product detail page that displays comprehensive product information (image gallery, title, brand, price, description, allergens, collapsible info sections, recipes, "combine with" slider, similar products slider) fetched by requesting the raw `product-details-page-root` Fusion page and parsing it server-side. Make search result product cards clickable to navigate to the detail page. The `getProductDetailsPage` and `getProductDetails` convenience functions from picnic-api must not be used — data is fetched via `sendRequest` directly and parsed with a custom Fusion page parser.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20.9+  
**Primary Dependencies**: Next.js 16.2.1, React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0  
**Storage**: N/A (no persistent storage; read-only product data from API)  
**Testing**: No test framework configured (no jest/vitest/playwright in project)  
**Target Platform**: Web browser (desktop + mobile responsive)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: Page load within 3 seconds (SC-001), cross-navigation under 2 seconds (SC-003)  
**Constraints**: Must use raw `sendRequest` to `/pages/product-details-page-root`, must NOT use typed `getProductDetailsPage`/`getProductDetails`; must follow existing Fusion page parsing patterns from `parse-fusion-search.ts` and `pml-helpers.ts`  
**Scale/Scope**: Single product detail page; ~8 new components, 1 new API route, 1 new parser, modifications to 2 existing components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SRP / DRY / DI | PASS | Parser will be a separate module (`parse-fusion-product.ts`). Each UI section is its own component. API route follows existing pattern. `buildPicnicClient` is injected via existing factory. |
| II. Naming Conventions | PASS | All new functions will use verb-first camelCase (`extractProductDetail`, `parseAllergens`). Components use PascalCase. Files use kebab-case matching existing patterns. |
| III. Forbidden Anti-Patterns | PASS | No file will exceed 300 lines — the parser will be split across focused helper functions. No deep nesting (max 3 levels). Magic strings for node IDs will be extracted to named constants. Error handling will follow existing try/catch + rethrow pattern. |
| IV. Self-Refactor Protocol | PASS | Will be enforced during implementation. |
| V. Readability Over Cleverness | PASS | Will use explicit traversal functions (matching `pml-helpers.ts` patterns) rather than JSONPath magic. Early returns for missing data sections. |

**Gate Result**: PASS — No violations. Proceed to Phase 0.

### Post-Design Re-Check (after Phase 1)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SRP / DRY / DI | PASS | Parser (`parse-fusion-product.ts`) has single responsibility. Shared utilities promoted to `pml-helpers.ts` prevent duplication across parsers. `buildPicnicClient` injected via existing factory. Each component (gallery, accordion, slider, etc.) has one job. |
| II. Naming Conventions | PASS | Entities: `ProductDetail`, `AllergenInfo`, `SliderProduct`. Functions: verb-first camelCase (`extractProductDetail`, `parseAllergens`). Constants: UPPER_SNAKE_CASE for node IDs. Files: kebab-case. |
| III. Forbidden Anti-Patterns | PASS | Parser split into focused functions keeps all files under 300 lines. Node ID strings extracted as named constants. API route error handling follows existing throw-and-catch pattern. |
| IV. Self-Refactor Protocol | PASS | Will be enforced during implementation. |
| V. Readability Over Cleverness | PASS | Explicit recursive tree traversal (not JSONPath). Early returns for missing sections. Linear parsing flow. |

**Post-Design Gate Result**: PASS — No violations detected. Design is consistent with constitution.

## Project Structure

### Documentation (this feature)

```text
specs/005-product-detail-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── product-detail-api.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── product/
│   │   └── [id]/
│   │       └── page.tsx              # Product detail page (new)
│   └── api/
│       └── product/
│           └── [id]/
│               └── route.ts          # GET /api/product/[id] (new)
├── components/
│   ├── product-card.tsx              # Modified: wrap in Link
│   ├── product-gallery.tsx           # New: image gallery with thumbnails
│   ├── product-info-header.tsx       # New: title, brand, weight, unit price
│   ├── product-price-section.tsx     # New: price, promotion, bundles
│   ├── product-highlights.tsx        # New: highlights list
│   ├── product-description.tsx       # New: description block
│   ├── allergen-badges.tsx           # New: allergen badges + "bevat mogelijk"
│   ├── accordion-section.tsx         # New: collapsible section
│   ├── nutrition-table.tsx           # New: voedingswaarde table
│   ├── product-slider.tsx            # New: horizontal scrollable product slider
│   └── product-slider-card.tsx       # New: compact card for slider items
├── lib/
│   ├── types.ts                      # Modified: add ProductDetail types
│   ├── parse-fusion-product.ts       # New: Fusion product page parser
│   └── pml-helpers.ts                # Possibly extended (reuse existing)
└── hooks/
    (no new hooks needed)
```

**Structure Decision**: Follows the existing Next.js App Router convention with `app/` for routes, `components/` for UI, `lib/` for data logic. The product detail page uses a dynamic route segment `[id]` matching the selling unit ID. The API route mirrors the existing `/api/search/` pattern.

## Complexity Tracking

> No constitution violations to justify.
