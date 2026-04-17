# Implementation Plan: Subcategory Product Listing

**Branch**: `016-subcategory-products` | **Date**: 2026-04-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-subcategory-products/spec.md`

## Summary

Complete the category browsing hierarchy by displaying products when users tap a leaf sub-category (L2 level). The product listing reuses the same `ProductGrid` and `ProductCard` components already used for search results, ensuring visual consistency. A new API route fetches L2 category pages and parses selling-unit tiles into the existing `Product` type using shared parser functions extracted from the search parser.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20.9+  
**Primary Dependencies**: Next.js 16.2.1 (App Router), React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0  
**Storage**: N/A (no persistent storage; product data fetched on demand from Picnic API)  
**Testing**: No test framework configured; validation via `npm run lint && npm run build`  
**Target Platform**: Web browser (mobile-first responsive)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: Product list renders within standard web app expectations  
**Constraints**: Max 300 lines per file, max 3 nesting levels, all constitution rules  
**Scale/Scope**: Single page state extension + 1 new API route + 1 new parser + refactoring for shared extraction

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SRP/DRY/DI | PASS | `containerToProduct` extracted to shared module for DRY reuse; new parser is single-purpose |
| II. Naming | PASS | verb-first functions (`parseL2ProductPage`, `fetchCategoryProducts`), kebab-case files |
| III. Forbidden Anti-Patterns | PASS | All files under 300 lines; no deep nesting; named constants for PML IDs |
| IV. Self-Refactor Protocol | PASS | Will be enforced during implementation |
| V. Readability Over Cleverness | PASS | Linear control flow; explicit state machine |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/016-subcategory-products/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── products-api.md  # GET /api/categories/{id}/products endpoint
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── page.tsx                                          # MODIFY: add L2 nav state + products view
│   └── api/categories/[categoryId]/
│       ├── subcategories/route.ts                        # EXISTING (unchanged)
│       └── products/route.ts                             # NEW: L2 product fetch endpoint
├── components/
│   ├── product-grid.tsx                                  # EXISTING (reused as-is)
│   ├── product-card.tsx                                  # EXISTING (reused as-is)
│   ├── results-view.tsx                                  # EXISTING (reused as-is or lightly refactored)
│   ├── subcategory-view.tsx                              # MODIFY: make rows tappable
│   └── category-products-view.tsx                        # NEW: L2 product listing wrapper
└── lib/
    ├── parse-fusion-search.ts                            # MODIFY: export containerToProduct
    ├── parse-category-products.ts                        # NEW: L2 page parser
    ├── types.ts                                          # MODIFY: add CategoryProductsApiResponse
    └── pml-helpers.ts                                    # EXISTING (reused as-is)
```

**Structure Decision**: Follows existing Next.js App Router conventions. New API route nested under existing `categories/[categoryId]/` path. New parser follows the `parse-*.ts` pattern. New view component follows the `*-view.tsx` pattern.
