# Implementation Plan: Reorder Section in Search Results

**Branch**: `009-reorder-search-results` | **Date**: 2026-04-10 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/009-reorder-search-results/spec.md`

## Summary

Display the "Opnieuw bestellen" (reorder) section in search results when the upstream Picnic API returns previously ordered products for the search query. The existing search parser (`parse-fusion-search.ts`) already has extraction logic for this section (lines 166-187) but it may not be working correctly. The approach is debug-first: capture the raw API response, identify why products are not being extracted, fix the parser, and verify the section renders with full product cards including cart action controls. The section nav bar already renders dynamically from the sections array, so no nav bar changes are expected.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20.9+  
**Primary Dependencies**: Next.js 16.2.1, React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0  
**Storage**: N/A (no persistent storage; search state is URL + client memory)  
**Testing**: No test framework configured (no test runner, no test files)  
**Target Platform**: Web browser (Next.js App Router, client-side rendering for search)  
**Project Type**: Web application (Next.js)  
**Performance Goals**: N/A (feature is parsing + rendering, no new performance-critical paths)  
**Constraints**: Files under 300 lines (constitution), no god objects, SRP/DRY  
**Scale/Scope**: Single feature touching 1-2 parser files and 0-1 component files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SRP / DRY / Dependency Injection | PASS | Changes scoped to search parser (`parse-fusion-search.ts`). No new components expected — existing `ProductGrid`, `SectionNavBar`, `ProductCard` already handle sections generically. Shared utilities (`containerToProduct`, `extractProductsFromWrappers`) are reused. |
| II. Naming Conventions | PASS | All existing names follow verb-first camelCase for functions, descriptive nouns for variables. No new names expected to violate. |
| III. Forbidden Anti-Patterns | PASS | `parse-fusion-search.ts` is 275 lines (under 300 limit). Parser changes are scoped additions, not expanding the file significantly. No deep nesting, no magic strings (constants already extracted). |
| IV. Mandatory Self-Refactor Protocol | PASS | Will be enforced during implementation. |
| V. Readability Over Cleverness | PASS | Parser uses explicit loops and guard clauses. No clever constructs. |

**Gate result**: PASS — proceed to Phase 0.

### Post-Design Re-Check (after Phase 1)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SRP / DRY / DI | PASS | No new entities, no new components. Changes scoped to parser functions. Existing shared utilities reused. |
| II. Naming Conventions | PASS | No new public APIs. Any new helpers follow existing verb-first camelCase convention. |
| III. Forbidden Anti-Patterns | PASS | File stays under 300 lines. No new nesting, no magic strings. |
| IV. Self-Refactor Protocol | PASS | Enforced during implementation. |
| V. Readability Over Cleverness | PASS | No change to existing explicit style. |

**Post-design gate result**: PASS — no violations, no complexity tracking entries needed.

## Project Structure

### Documentation (this feature)

```text
specs/009-reorder-search-results/
├── plan.md              # This file
├── research.md          # Phase 0 output — API response analysis
├── data-model.md        # Phase 1 output — entity definitions
├── quickstart.md        # Phase 1 output — implementation guide
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   └── search/
│   │       └── route.ts          # Search API route (may need debug logging)
│   └── page.tsx                  # Search page (renders sections — no changes expected)
├── components/
│   ├── product-grid.tsx          # Renders sections with product cards (no changes expected)
│   ├── section-nav-bar.tsx       # Section pills (no changes expected — renders from sections array)
│   └── product-card.tsx          # Product card with cart actions (no changes expected)
├── lib/
│   ├── parse-fusion-search.ts    # PRIMARY: Fix re-order section extraction (lines 166-187)
│   ├── pml-helpers.ts            # May need fixes if container detection patterns changed
│   ├── extract-tile-data.ts      # May need fixes if re-order tile PML differs
│   └── types.ts                  # SearchSection type (no changes — confirmed in clarify)
```

**Structure Decision**: Single project, Next.js App Router. All changes are in `src/lib/` parser layer. No new files, no new components. The rendering layer (`page.tsx`, `product-grid.tsx`, `section-nav-bar.tsx`) already handles sections generically.

## Complexity Tracking

> No constitution violations to justify — feature is a parser bugfix with no new architectural patterns.
