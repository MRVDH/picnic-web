# Implementation Plan: Cart Credit Settlement Display

**Branch**: `012-cart-credit-summary` | **Date**: 2026-04-15 | **Spec**: `specs/012-cart-credit-summary/spec.md`
**Input**: Feature specification from `/specs/012-cart-credit-summary/spec.md`

## Summary

Display the Picnic credit settlement ("Verrekening Picnic Tegoed") as a line item in the cart order summary when the user has credit applied to their order. The credit settlement value already exists in the raw Picnic API cart response but is not currently extracted by the cart parser or displayed in the UI. Implementation requires: (1) discovering the exact field name/location in the raw API response, (2) extracting it in `parseCartResponse`, (3) adding a `creditSettlement` field to `CartData`, and (4) rendering a new deduction row in the `OrderSummary` component.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20.9+
**Primary Dependencies**: Next.js 16.2.1 (App Router), React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0
**Storage**: N/A (no persistent storage; cart state comes from Picnic API)
**Testing**: No test framework installed; validation via `npm run lint` and `npm run build`
**Target Platform**: Web browser (desktop), Dutch locale (`lang="nl"`)
**Project Type**: Web application (Next.js App Router, client components)
**Performance Goals**: N/A (display-only feature; no measurable latency impact)
**Constraints**: All page components are `"use client"`. Raw API response is `unknown` — all field access must be defensive (runtime type guards). The exact API field name for credit settlement is NEEDS CLARIFICATION (see Research R1).
**Scale/Scope**: 4 files modified (types, parser, component, page), 0 new files created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. SRP / DRY / DI** | PASS | Changes touch 4 files, each with a single responsibility: types (CartData), parser (extraction), component (display), page (prop passing). The credit row reuses the same display pattern as existing deduction rows (DRY). |
| **II. Naming Conventions** | PASS | New field `creditSettlement` follows camelCase. Extraction helper (if needed) follows verb-first camelCase. |
| **III. Forbidden Anti-Patterns** | PASS | `parse-cart.ts` is 448 lines — adding ~5 lines keeps it under 300 active code lines (excluding imports/comments). No magic strings (label comes from API or named constant). No deep nesting. |
| **IV. Self-Refactor Protocol** | PASS | Will be enforced during implementation. |
| **V. Readability Over Cleverness** | PASS | Simple field extraction + conditional rendering. No clever constructs needed. |

**Gate result: PASS** — no violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/012-cart-credit-summary/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (updated cart API contract)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── cart/
│   │   └── page.tsx            # Update: pass creditSettlement prop to OrderSummary
│   └── api/
│       └── cart/
│           └── route.ts        # No change (already returns raw parsed CartData)
├── components/
│   └── order-summary.tsx       # Update: add credit settlement deduction row
└── lib/
    ├── types.ts                # Update: add creditSettlement field to CartData
    └── parse-cart.ts           # Update: extract credit settlement from raw response
```

**Structure Decision**: Next.js App Router single-project structure. All changes are modifications to existing files — no new files or directories needed. The `contracts/` directory contains an updated cart API contract documenting the new field.

## Complexity Tracking

> No constitution violations to justify — all clear.
