# Implementation Plan: Product Card Layout Polish

**Branch**: `010-product-card-polish` | **Date**: 2026-04-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-product-card-polish/spec.md`

## Summary

Product card prices appear at inconsistent vertical positions across a grid row because variable-height content (optional subtitle, 1-vs-2-line name, optional brand row) sits between the fixed-height image and the price in normal document flow. Only badges have `mt-auto`. The fix is to restructure the card's flex layout so the price and badges are bottom-anchored, with variable text content absorbing the remaining space above.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20.9+  
**Primary Dependencies**: Next.js 16.2.1, React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0  
**Storage**: N/A (no persistent storage; pure CSS layout change)  
**Testing**: No test framework exists in this project. All validation is manual via the browser.  
**Target Platform**: Web — desktop and mobile browsers  
**Project Type**: Web application (Next.js)  
**Performance Goals**: N/A (CSS-only change, no runtime impact)  
**Constraints**: Product card file (`product-card.tsx`) is 248 lines, must stay under 300 lines. Changes are CSS/layout only — no data model or API changes.  
**Scale/Scope**: Single component (`ProductCard`) used in search results grid.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SRP, DRY, Dependency Injection | PASS | Single component change. No new responsibilities added. No duplication. |
| II. Naming Conventions | PASS | No new variables, functions, or files. Existing names unchanged. |
| III. Forbidden Anti-Patterns | PASS | `product-card.tsx` is 248 lines, well under 300. No deep nesting added. No magic numbers (spacing uses Tailwind's semantic scale). |
| IV. Mandatory Self-Refactor Protocol | PASS | Will self-review all class changes before committing. |
| V. Readability Over Cleverness | PASS | Tailwind utility classes are explicit and self-documenting. No clever CSS tricks. |

**Gate result**: All principles pass. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/010-product-card-polish/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: Layout approach research
├── data-model.md        # Phase 1: N/A (no data changes)
├── quickstart.md        # Phase 1: Implementation guide
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── product-card.tsx    # PRIMARY: Restructure flex layout for price alignment
│   ├── product-grid.tsx    # REFERENCE ONLY: Grid layout (gap-4, responsive cols)
│   ├── price-display.tsx   # REFERENCE ONLY: Price rendering (no changes)
│   ├── badge.tsx           # REFERENCE ONLY: Badge rendering (no changes)
│   └── quantity-stepper.tsx # REFERENCE ONLY: Cart overlay (no changes)
└── app/
    └── globals.css         # REFERENCE ONLY: Theme tokens (no changes)
```

**Structure Decision**: Single-file change in `src/components/product-card.tsx`. All modifications are Tailwind class adjustments within the existing component structure.

## Complexity Tracking

No violations. No complexity justifications needed.
