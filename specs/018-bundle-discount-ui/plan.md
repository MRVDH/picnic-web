# Implementation Plan: Bundle Discount UI

**Branch**: `018-bundle-discount-ui` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-bundle-discount-ui/spec.md`

## Summary

Update picnic-api to ^4.3.0 to unlock bundle discount data, remove the "Bundelkortingen niet zichtbaar" warning banner, and surface bundle discount information across PDP (price tier grid), PLP (savings badge, strikethrough pricing, dot indicators), and cart (BundelBonus badge with discounted/original pricing). Most of the underlying bundle infrastructure already exists in the codebase (BundleThreshold types, cart context bundle tracking, savings label, bundle dots, quantity stepper integration). The main work is: upgrading the package, removing the banner, redesigning the PDP bundle section as a tier grid, and adding bundle badge/pricing to cart line items.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20.9+
**Primary Dependencies**: Next.js 16.2.1 (App Router), React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0 → ^4.3.0
**Storage**: N/A (no persistent storage; cart state comes from Picnic API)
**Testing**: No testing framework configured; validation via `npm run build` and `npm run lint`
**Target Platform**: Web (desktop + mobile browsers)
**Project Type**: Web application (Next.js App Router, client-side rendering for interactive components)
**Performance Goals**: Bundle UI updates within 1 second of quantity changes (standard web app expectations)
**Constraints**: All components using bundle data are client-side ("use client"); bundle thresholds are registered from search results via cart context
**Scale/Scope**: 3 surfaces (PDP, PLP, Cart), ~6 files modified, ~2 new sub-components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SRP/DRY/DI | PASS | Each component has single responsibility; bundle logic is shared via cart context; new components (tier grid, bundle badge) follow same pattern |
| II. Naming | PASS | All new functions/components will use verb-first camelCase; existing patterns followed |
| III. Forbidden Anti-Patterns | PASS | No files exceed 300 lines; no deep nesting; no magic numbers (price constants from API) |
| IV. Self-Refactor | PASS | Will be applied during implementation |
| V. Readability | PASS | Explicit over implicit; early returns; Tailwind for styling consistency |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/018-bundle-discount-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── product/[id]/page.tsx          # Remove warning banner
│   └── api/                           # API routes (unchanged, picnic-api upgrade may affect)
├── components/
│   ├── product-card.tsx               # PLP tile (existing bundle support, verify after upgrade)
│   ├── product-price-section.tsx      # PDP bundles → redesign as tier grid
│   ├── cart-item.tsx                   # Add bundle badge + strikethrough pricing
│   ├── quantity-stepper.tsx           # Existing bundle dots/savings (unchanged)
│   ├── savings-label.tsx              # Existing savings label (unchanged)
│   ├── bundle-dots.tsx                # Existing bundle dots (unchanged)
│   ├── price-display.tsx              # Existing price display (unchanged)
│   └── badge.tsx                      # May need "bundelbonus" variant
├── contexts/
│   └── cart-context.tsx               # Existing bundle tracking (unchanged)
└── lib/
    ├── types.ts                       # May need type updates for picnic-api 4.3.0
    ├── parse-cart.ts                  # May need updates for bundle badge data
    └── parse-fusion-product.ts        # May need updates for bundle data
```

**Structure Decision**: Existing Next.js App Router structure. No new directories needed. Changes are modifications to existing components plus potential new sub-components within `src/components/`.
