# Implementation Plan: Search Page Category Browsing

**Branch**: `014-search-categories` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-search-categories/spec.md`

## Summary

Replace the empty "Welkom bij Picnic Web" landing page with a browsable category grid. When users visit the home page without a search query, they see all ~26 grocery categories (Fruit, Aardappelen & groente, Maaltijden & gemak, etc.) with images and names, matching the native Picnic app's search landing screen. Categories are fetched from the `empty-search-page-root` Fusion page endpoint, parsed from the PML tree, and rendered as a responsive grid. Tapping a category is a no-op for now (US2 scope).

The "Deze week" promotional section from the spec was dropped — it is not available from this endpoint (see research.md R3).

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20.9+  
**Primary Dependencies**: Next.js 16.2.1 (App Router), React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0  
**Storage**: N/A (no persistent storage; category data is fetched on demand from Picnic API)  
**Testing**: No test framework configured (lint + build validation only)  
**Target Platform**: Web (responsive: mobile 320px, tablet 768px, desktop 1280px+)  
**Project Type**: Web application (Next.js App Router, server-side API routes + client-side components)  
**Performance Goals**: Category grid visible within 2 seconds of page load on standard connection (SC-001)  
**Constraints**: All files under 300 lines (constitution). Responsive layout without horizontal scroll (SC-003).  
**Scale/Scope**: Single page change (home page), 4 new files + 1 modified file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. SRP / DRY / DI** | PASS | Each new file has a single responsibility: types (`category-types.ts`), parsing (`parse-categories.ts`), API route (`categories/route.ts`), UI (`category-grid.tsx`). Parsing follows the same DI-friendly pattern as `parse-fusion-search.ts`. `buildPicnicClient` is injected via token. |
| **II. Naming Conventions** | PASS | Functions use verb-first camelCase (`parseCategoryPage`, `extractCategoryFromPmlItem`, `buildImageUrl`). Types use PascalCase (`CategoryItem`, `CategoriesApiResponse`). Files use kebab-case (`category-types.ts`, `parse-categories.ts`). Constants use UPPER_SNAKE_CASE (`CATEGORY_LIST_BLOCK_ID`, `CATEGORY_ITEM_PREFIX`). |
| **III. Forbidden Anti-Patterns** | PASS | No file exceeds 300 lines. No deep nesting (max 3 levels). Magic strings extracted to named constants (`CATEGORY_LIST_BLOCK_ID`, `CATEGORY_ITEM_PREFIX`). Error handling is explicit (auth errors handled, upstream failures surfaced with message). No global mutable state. |
| **IV. Self-Refactor Protocol** | PASS | Will be enforced during implementation. |
| **V. Readability Over Cleverness** | PASS | Explicit extraction logic with named steps. No chained method calls beyond 3 levels. Guard clauses used for early returns. |

**Gate result**: PASS — no violations. Complexity Tracking table is empty (no justified violations needed).

## Project Structure

### Documentation (this feature)

```text
specs/014-search-categories/
├── plan.md              # This file
├── research.md          # Phase 0: API endpoint research, PML tree analysis, design decisions
├── data-model.md        # Phase 1: CategoryItem/CategoriesApiResponse types, field mapping
├── quickstart.md        # Phase 1: Implementation guide with code examples
├── contracts/
│   └── categories-api.md # Phase 1: GET /api/categories contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── page.tsx                          # MODIFY: Replace LandingView with category grid
│   └── api/
│       └── categories/
│           └── route.ts                  # NEW: GET /api/categories
├── components/
│   └── category-grid.tsx                 # NEW: CategoryGrid + CategoryTile components
└── lib/
    ├── category-types.ts                 # NEW: CategoryItem, CategoriesApiResponse
    ├── parse-categories.ts               # NEW: parseCategoryPage() extractor
    ├── pml-helpers.ts                    # EXISTING: findNodeByIdSubstring, collectPropertyValues
    └── image-url.ts                      # EXISTING: buildImageUrl()
```

**Structure Decision**: Next.js App Router single-project structure. All new source files are placed within the existing `src/` tree following established conventions: types in `lib/`, parsers in `lib/`, API routes under `app/api/`, UI components under `components/`. This matches the pattern used by search (`parse-fusion-search.ts`, `api/search/route.ts`, `product-grid.tsx`).

## Complexity Tracking

> No violations to justify — all constitution checks pass.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)* | — | — |
