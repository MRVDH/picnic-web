# Implementation Plan: Cart Page

**Branch**: `006-cart-page` | **Date**: 2026-04-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-cart-page/spec.md`

## Summary

Build a read-only cart page at `/cart` that displays the user's shopping cart contents, order summary, minimum order value indicator, unavailable product handling, "Niets vergeten?" suggestions, and a checkout CTA directing users to the Picnic app. The cart data is fetched via `sendRequest("GET", "/cart")` — the same cast-based pattern used by search and product-detail routes — with the raw `unknown` response validated and extracted at runtime in a `parseCartResponse` function. A shared header component with cart icon and price badge is extracted and used across all authenticated pages. The page follows the established client-component pattern with a Next.js API route proxy layer.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20.9+
**Primary Dependencies**: Next.js 16.2.1, React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0
**Storage**: N/A (no persistent storage; cart state lives in the Picnic API)
**Testing**: ESLint (no test framework configured); manual browser testing
**Target Platform**: Web (responsive: 320px mobile to 1920px+ desktop)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Cart page loads within 3 seconds (SC-001)
**Constraints**: Read-only cart (no modifications); all text in Dutch; HTTP-only cookie auth
**Scale/Scope**: Single page (`/cart`) + shared header component + API route + transformer

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SRP | PASS | Each file has one responsibility: API route (fetch + proxy), transformer (parse + validate), page (state + layout), components (display) |
| I. DRY | PASS | `isApiAuthError` extracted to shared `src/lib/api-error.ts`; reusable components (`PriceDisplay`, `Badge`, `ProductSlider`) reused directly; shared header component replaces per-page inline headers |
| I. Dependency Injection | PASS | `buildPicnicClient(token)` injects auth; `parseCartResponse(rawData)` is a pure function accepting injected data |
| II. Naming Conventions | PASS | All names follow verb-first camelCase for functions, noun-based camelCase for variables, kebab-case for files |
| III. No God Objects | PASS | No file exceeds 300 lines; transformer logic split by concern |
| III. No Deep Nesting | PASS | Early returns for auth checks; guard clauses for missing data |
| III. No Magic Numbers | PASS | All prices in cents (integer arithmetic); no magic strings |
| III. No Catch-All Error Swallowing | PASS | Errors are caught, classified (auth vs. upstream), and handled with appropriate responses |
| IV. Self-Refactor | PASS | Applied during implementation |
| V. Readability | PASS | Explicit transformations; no clever constructs |

## Project Structure

### Documentation (this feature)

```text
specs/006-cart-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── cart-api.md      # Internal API route contract
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   └── cart/
│   │       └── route.ts             # API route: GET /api/cart (sendRequest pattern)
│   └── cart/
│       └── page.tsx                 # Cart page client component
├── components/
│   ├── cart-item.tsx                # Single cart line item display
│   ├── order-summary.tsx            # Order totals summary
│   ├── minimum-order-indicator.tsx  # Min order value progress indicator
│   ├── unavailable-product.tsx      # Unavailable product with replacements
│   ├── checkout-cta.tsx             # "Complete in Picnic app" message
│   └── shared-header.tsx            # Shared header with cart icon + price badge
├── lib/
│   ├── parse-cart.ts                # Cart response → display types transformer (runtime validation)
│   ├── api-error.ts                 # Shared isApiAuthError utility (extracted from DRY)
│   └── types.ts                     # Extended with CartData, CartItem, DepositEntry
```

**Structure Decision**: Next.js App Router structure with `src/` directory. API routes proxy the Picnic API server-side. Client components fetch from internal API routes. Shared utilities in `src/lib/`. This matches the existing patterns from 002-search and 005-product-detail features.

## Complexity Tracking

No constitution violations requiring justification.
