# Implementation Plan: Cart Page Product Actions

**Branch**: `008-cart-page-actions` | **Date**: 2026-04-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-cart-page-actions/spec.md`

## Summary

Add interactive quantity steppers to cart page items, replacing the static "3×" text, so users can adjust quantities or remove products inline. Reuses the existing `QuantityStepper` component, `mutation-queue.ts`, `postCartMutation` pattern, and `CartToast` from feature 007 (PLP cart actions). The cart page gains its own state management that holds the full `CartData` (needed for order summary, deposits, minimum order indicator) and re-renders all sub-components reactively after each mutation. A `maxCount` field is added to `CartItem` by extracting `max_count` from the cart API response during parsing. The `CartItemCard` link structure is refactored to avoid nested interactive elements when embedding the stepper.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20.9+
**Primary Dependencies**: Next.js 16.2.1, React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0
**Storage**: N/A (no persistent storage; cart state lives in the Picnic API)
**Testing**: ESLint (no test framework configured); manual browser testing
**Target Platform**: Web (responsive: 320px mobile to 1920px+ desktop)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Optimistic quantity feedback within 100ms; cart totals update within 1s (SC-002)
**Constraints**: HTTP-only cookie auth; all text in Dutch; per-product mutation queuing for rapid taps
**Scale/Scope**: Modifies cart page, cart item component, cart parser, types; reuses PLP infrastructure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SRP | PASS | Cart page manages page-level state; CartItemCard is display-only with callbacks; QuantityStepper is reused as-is; mutation queue is a separate utility |
| I. DRY | PASS | Reuses QuantityStepper, mutation-queue, postCartMutation pattern, CartToast, parseCartResponse — no duplication of PLP infrastructure |
| I. Dependency Injection | PASS | CartItemCard receives callbacks via props; mutation queue is injected via ref; toast function passed as callback |
| II. Naming Conventions | PASS | `handleIncrement`, `handleDecrement` callbacks; `cartData` state; `maxCount` field name matches existing Product type |
| III. No God Objects | PASS | Cart page is currently 204 lines; additions stay well under 300 lines. CartItemCard stays under 100 lines |
| III. No Deep Nesting | PASS | Guard clauses for unavailable items; early returns for empty/error states already exist |
| III. No Magic Numbers | PASS | maxCount from API data; prices in cents; no hardcoded thresholds |
| III. No Catch-All Error Swallowing | PASS | Mutation errors trigger rollback + toast notification (same pattern as PLP) |
| IV. Self-Refactor | PASS | Applied during implementation |
| V. Readability | PASS | Explicit state transitions; props-based data flow; no clever constructs |

## Project Structure

### Documentation (this feature)

```text
specs/008-cart-page-actions/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── cart/
│       └── page.tsx                 # MODIFY: Add cart state management with mutations, wrap items with callbacks
├── components/
│   ├── cart-item.tsx                # MODIFY: Replace static quantity text with QuantityStepper, fix nested Link issue
│   ├── quantity-stepper.tsx         # REUSE: No changes expected
│   └── cart-toast.tsx               # REUSE: No changes expected
├── contexts/
│   └── cart-context.tsx             # REFERENCE: Pattern reference for mutation logic (not directly used by cart page)
├── lib/
│   ├── types.ts                     # MODIFY: Add maxCount to CartItem type
│   ├── parse-cart.ts                # MODIFY: Extract max_count from firstArticle in mapOrderLineToCartItem
│   └── mutation-queue.ts            # REUSE: No changes expected
```

**Structure Decision**: Extends the existing Next.js App Router structure. No new files needed — all changes are modifications to existing files or reuse of existing components. The cart page manages its own `CartData` state (rather than using CartProvider) because it needs the full cart response for OrderSummary, MinimumOrderIndicator, deposits, and suggestions — data that CartProvider does not expose. The mutation and optimistic update patterns are replicated from CartProvider but operate on the full CartData.

## Complexity Tracking

No constitution violations requiring justification.
