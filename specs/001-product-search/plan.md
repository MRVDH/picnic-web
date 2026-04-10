# Implementation Plan: Product Search

**Branch**: `004-product-search` | **Date**: 2026-03-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-product-search/spec.md`

## Summary

Build a web interface for the Picnic online supermarket focused on product
search. Users enter a search query and see a grid of product cards showing
image, name, brand, price (with discount display), unit/quantity, and all
labels/badges returned by the API. Search suggestions appear as the user
types. The app uses Next.js 16 with React 19, fetches data via the
`picnic-api` package through server-side route handlers, and renders a
custom design system (not Fusion/PML-based) built on extracted data points.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20.9+
**Primary Dependencies**: Next.js 16, React 19, Tailwind CSS 4, picnic-api
**Storage**: N/A
**Testing**: ESLint 9
**Target Platform**: Modern desktop browsers (1024px+ width)
**Project Type**: web-application
**Performance Goals**: Search results in <2s, suggestions in <500ms
**Constraints**: Auth token server-side only, no direct Picnic API exposure
**Scale/Scope**: Single feature (product search), ~15 source files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Architectural Integrity (SRP, DRY, DI) | PASS | Each file has a single responsibility: route handlers, extraction logic, UI components, hooks, and types are all separate. PicnicClient is injected via factory function. |
| II. Naming Conventions | PASS | All files use kebab-case, functions use verb-first camelCase (`extractProducts`, `buildImageUrl`, `fetchSuggestions`), constants use UPPER_SNAKE_CASE, booleans use `is`/`has` prefixes. |
| III. Forbidden Anti-Patterns | PASS | No file exceeds 300 lines. No deep nesting (max 3 levels). Magic numbers extracted as constants (e.g., `CENTS_DIVISOR`, `DEBOUNCE_DELAY_MS`). Error handling is explicit in route handlers and UI. |
| IV. Mandatory Self-Refactor Protocol | PASS | Applied during implementation: all code reviewed against principles before output. |
| V. Readability Over Cleverness | PASS | Explicit control flow with early returns. No clever constructs. Comments explain "why" (e.g., why we parse the raw Fusion response instead of using `search()`). |

## Project Structure

### Documentation (this feature)

```text
specs/004-product-search/
├── plan.md              # This file
├── research.md          # Phase 0: technology decisions and data model research
├── data-model.md        # Phase 1: entity definitions and transformation pipeline
├── quickstart.md        # Phase 1: setup and verification instructions
├── contracts/
│   └── api-routes.md    # Phase 1: internal API route contracts
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx              # Root layout (html, body, fonts, metadata)
│   ├── page.tsx                # Home page with search interface
│   ├── globals.css             # Tailwind imports + Picnic design tokens
│   ├── loading.tsx             # Root loading state
│   ├── error.tsx               # Root error boundary
│   └── api/
│       ├── search/route.ts     # GET /api/search?q=... → Product[]
│       └── suggestions/route.ts # GET /api/suggestions?q=... → Suggestion[]
├── components/
│   ├── search-bar.tsx          # Search input with debounce + suggestions
│   ├── search-suggestions.tsx  # Dropdown suggestion list
│   ├── product-grid.tsx        # Responsive grid layout for cards
│   ├── product-card.tsx        # Individual product display card
│   ├── price-display.tsx       # Price with optional strikethrough
│   └── badge.tsx               # Label/badge rendering component
├── lib/
│   ├── picnic-client.ts        # PicnicClient singleton factory (DI)
│   ├── extract-products.ts     # Fusion page → Product[] transformation
│   ├── image-url.ts            # CDN image URL builder utility
│   └── types.ts                # Application-level type definitions
└── hooks/
    └── use-debounce.ts         # Generic debounce hook
```

**Structure Decision**: Single Next.js application with App Router. No
separate backend/frontend split — Next.js serves both roles. Server-side
route handlers act as the API proxy layer. All source code lives under
`src/` with the `@/*` path alias mapping to `./src/*`.

## Complexity Tracking

No constitution violations to justify. The design stays within all
principle boundaries:
- All files are under 300 lines
- Single responsibility per file
- PicnicClient injected via factory (`getPicnicClient()`)
- No deep nesting, no magic values, no god objects
