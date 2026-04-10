# Implementation Plan: PLP Cart Actions

**Branch**: `007-plp-cart-actions` | **Date**: 2026-04-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-plp-cart-actions/spec.md`

## Summary

Add cart action controls (add button, quantity stepper with +/−) to product cards on the search results page, with bundle discount indicators (dot progress, savings label) that activate when the API provides bundle data. Cart mutations use `POST /cart/add_product` and `POST /cart/remove_product` via the existing `sendRequest` cast pattern, with optimistic UI updates, per-product mutation queuing, and rollback on failure. A `CartContext` manages client-side cart state for cross-component reactivity (product cards, header badge). Bundle data sourcing is implemented against the known API shapes (`promoProgress` on Cart, `product-page-bundles-*` on PDP) but activates only when the API returns data — currently no products have active bundles.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20.9+
**Primary Dependencies**: Next.js 16.2.1, React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0
**Storage**: N/A (no persistent storage; cart state is URL + client memory)
**Testing**: ESLint (no test framework configured); manual browser testing
**Target Platform**: Web (responsive: 320px mobile to 1920px+ desktop)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Cart action visual feedback within 100ms (optimistic UI); cart badge update within 2s (SC-003)
**Constraints**: HTTP-only cookie auth; all text in Dutch; per-product mutation queuing for rapid taps
**Scale/Scope**: Extends search results page + shared header + API route + new components + cart context

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SRP | PASS | Each new file has one responsibility: cart context (state), mutation queue (sequencing), stepper (UI), bundle dots (UI), API route (network), cart parser (already exists) |
| I. DRY | PASS | Reuses existing `parseCartResponse`, `ProductCard`, `SharedHeader`; cart mutation logic centralized in context |
| I. Dependency Injection | PASS | Cart context receives fetch functions; stepper receives quantity + callbacks via props; mutation queue is a pure utility |
| II. Naming Conventions | PASS | `useCart` hook, `CartProvider` context, `QuantityStepper` component, `BundleDots` component, `createMutationQueue` utility |
| III. No God Objects | PASS | Cart context holds state + actions (under 300 lines); stepper is display-only; mutation queue is a pure utility |
| III. No Deep Nesting | PASS | Guard clauses for empty cart; early returns for unavailable products |
| III. No Magic Numbers | PASS | Bundle thresholds come from API data; prices in cents (integer arithmetic) |
| III. No Catch-All Error Swallowing | PASS | Mutation errors trigger rollback + toast notification |
| IV. Self-Refactor | PASS | Applied during implementation |
| V. Readability | PASS | Explicit state transitions; no clever constructs |

## Project Structure

### Documentation (this feature)

```text
specs/007-plp-cart-actions/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── cart-mutation-api.md  # Internal API route contract for cart mutations
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   └── cart/
│   │       └── route.ts             # MODIFY: Add POST handler for add/remove mutations
│   └── page.tsx                     # MODIFY: Wrap with CartProvider, pass cart state to product grid
├── components/
│   ├── product-card.tsx             # MODIFY: Add cart action overlay (add button or stepper)
│   ├── shared-header.tsx            # MODIFY: Subscribe to CartContext when available
│   ├── quantity-stepper.tsx         # NEW: Minus/count/plus control with bundle dot slots
│   ├── bundle-dots.tsx              # NEW: Dot indicators for bundle progress
│   ├── savings-label.tsx            # NEW: "€X.XX bespaard" label
│   └── cart-toast.tsx               # NEW: Global toast for error feedback
├── contexts/
│   └── cart-context.tsx             # NEW: CartProvider + useCart hook (state, mutations, optimistic UI)
├── lib/
│   ├── types.ts                     # MODIFY: Add CartMutationRequest, BundleProgress types
│   ├── parse-cart.ts                # REFERENCE: Already parses cart response (reuse as-is)
│   └── mutation-queue.ts            # NEW: Per-product sequential mutation queue utility
```

**Structure Decision**: Extends the existing Next.js App Router structure. New `contexts/` directory for the cart context provider (consistent with React conventions). New lib utility for the mutation queue (pure logic, no React dependency). Components are flat in `src/components/` following existing convention.

## Complexity Tracking

No constitution violations requiring justification.
