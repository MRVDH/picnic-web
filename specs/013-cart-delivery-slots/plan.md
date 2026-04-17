# Implementation Plan: Cart Delivery Slot Selection

**Branch**: `013-cart-delivery-slots` | **Date**: 2026-04-15 | **Spec**: `specs/013-cart-delivery-slots/spec.md`
**Input**: Feature specification from `/specs/013-cart-delivery-slots/spec.md`

## Summary

Add delivery slot viewing and selection to the cart page. A banner at the top of the cart content shows the current delivery window (or a prompt to choose one). Tapping the banner opens a modal slot picker with horizontally-scrollable day tabs, green-choice grouping, and single-tap selection that calls the Picnic API. Implementation requires: (1) new delivery slot types, (2) extracting slot data from the raw cart response, (3) a new API route for fetching/setting slots, (4) a date formatting utility, (5) a delivery slot banner component, and (6) a delivery slot picker modal component.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20.9+
**Primary Dependencies**: Next.js 16.2.1 (App Router), React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0
**Storage**: N/A (no persistent storage; delivery slot state comes from Picnic API)
**Testing**: No test framework installed; validation via `npm run lint` and `npm run build`
**Target Platform**: Web browser (desktop), Dutch locale (`lang="nl"`)
**Project Type**: Web application (Next.js App Router, client components)
**Performance Goals**: Slot picker must load and display all slots within 1 second of opening (SC-003)
**Constraints**: All page components are `"use client"`. Raw API response is `unknown` — all field access must be defensive (runtime type guards). Three existing files exceed the 300-line constitution limit (`page.tsx` 320, `parse-cart.ts` 460, `types.ts` 398) — new code must go into new files, not inflate these further.
**Scale/Scope**: 4 existing files modified, 5 new files created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. SRP / DRY / DI** | PASS | New responsibilities are isolated into dedicated files: banner component (display), picker component (interaction), date formatter (utility), slot parser (extraction), API route (server). The cart page only adds a banner slot and state wiring. |
| **II. Naming Conventions** | PASS | New files: `delivery-slot-banner.tsx`, `delivery-slot-picker.tsx`, `format-delivery-window.ts`, `parse-delivery-slots.ts`. New types: `DeliverySlotData`, `SelectedSlotData`, `SlotGroup`. Functions: `parseDeliverySlots`, `formatDeliveryWindow`, `identifyGreenSlots`. All verb-first camelCase or descriptive noun-based. |
| **III. Forbidden Anti-Patterns** | WARNING | Three existing files already exceed 300 lines. New delivery slot parsing MUST go into a new `parse-delivery-slots.ts` file, NOT into `parse-cart.ts` (460 lines). New types MUST go into a new section or dedicated file. Cart page changes must be minimal — the `CartPageContent` component just adds one `<DeliverySlotBanner>` element. |
| **IV. Self-Refactor Protocol** | PASS | Will be enforced during implementation. |
| **V. Readability Over Cleverness** | PASS | Green-choice heuristic (paired window_start, longer duration) will use explicit comparisons, not bitwise or chained tricks. Date formatting uses a simple map of Dutch day names. |

**Gate result: CONDITIONAL PASS** — existing file size violations require that ALL new logic goes into new files. No new code may be added to `parse-cart.ts`, `types.ts`, or `page.tsx` beyond the minimum wiring (type imports, a few lines of state, one component reference).

## Project Structure

### Documentation (this feature)

```text
specs/013-cart-delivery-slots/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (delivery slots API contract)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── cart/
│   │   └── page.tsx                         # MODIFY: add DeliverySlotBanner + state wiring (~10 lines)
│   └── api/
│       └── cart/
│           ├── route.ts                     # NO CHANGE (existing cart CRUD)
│           └── delivery-slots/
│               └── route.ts                 # NEW: GET (fetch slots) + POST (set slot)
├── components/
│   ├── delivery-slot-banner.tsx             # NEW: banner showing current slot or prompt
│   └── delivery-slot-picker.tsx             # NEW: modal with day tabs + slot list
└── lib/
    ├── types.ts                             # MODIFY: add delivery slot type imports (minimal)
    ├── delivery-slot-types.ts               # NEW: DeliverySlotData, SelectedSlotData, SlotGroup types
    ├── parse-delivery-slots.ts              # NEW: extract slots from raw cart/API response
    └── format-delivery-window.ts            # NEW: Dutch day names, relative labels, time formatting
```

**Structure Decision**: Next.js App Router single-project structure. New delivery slot logic is separated into dedicated files to respect the 300-line constitution limit on existing files. The `parse-delivery-slots.ts` file is a sibling to `parse-cart.ts`, following the same defensive extraction pattern but for slot-specific data. The delivery slots API route follows the same pattern as the existing cart route.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `types.ts` (398 lines) gets delivery slot type imports | Only imports/re-exports are added (~3 lines). New types live in `delivery-slot-types.ts`. | Putting all types in a separate file would break the existing import pattern used by 10+ files. |
| `page.tsx` (320 lines) gets banner + state | Only ~10 lines of wiring: one import, one state variable, one `<DeliverySlotBanner>` JSX element, and a callback for slot selection. The banner/picker logic lives in their own components. | Extracting the entire `CartPage` into sub-components would be a large refactor beyond this feature's scope. |
