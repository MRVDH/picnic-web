# Quickstart: Cart Page Product Actions

**Feature**: 008-cart-page-actions | **Date**: 2026-04-09

## Prerequisites

- Node.js 20.9+
- Picnic account with items in cart (use PLP cart actions to add products)
- Auth token set (login via `/login` page)

## Development Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open cart page
open http://localhost:3000/cart
```

## Key Files to Understand

Read these files in order before implementing:

1. **Spec**: `specs/008-cart-page-actions/spec.md` — Requirements and acceptance scenarios
2. **Plan**: `specs/008-cart-page-actions/plan.md` — Technical approach and structure decisions
3. **Research**: `specs/008-cart-page-actions/research.md` — Architecture analysis and risk mitigations
4. **Data Model**: `specs/008-cart-page-actions/data-model.md` — Type changes needed

## Existing Infrastructure (from Feature 007)

These files are reused directly — understand their APIs:

| File | What It Does | Key Exports |
|------|-------------|-------------|
| `src/components/quantity-stepper.tsx` | Minus/count/plus UI with bundle support | `QuantityStepper` component |
| `src/components/cart-toast.tsx` | Auto-dismissing toast notification | `CartToast` component |
| `src/lib/mutation-queue.ts` | Per-product sequential queue | `createMutationQueue<T>(onSettled)` |
| `src/contexts/cart-context.tsx` | PLP cart state (pattern reference) | `CartProvider`, `useCart`, `useCartOptional` |
| `src/app/api/cart/route.ts` | GET (fetch cart) + POST (add/remove) | API route handlers |

## Files to Modify

| File | What Changes |
|------|-------------|
| `src/lib/types.ts` | Add `maxCount: number` to `CartItem` |
| `src/lib/parse-cart.ts` | Extract `max_count` in `mapOrderLineToCartItem` |
| `src/components/cart-item.tsx` | Restructure Link, add QuantityStepper, accept callbacks |
| `src/app/cart/page.tsx` | Add mutation state management, CartToast, pass callbacks |

## Validation

```bash
# Lint check
npm run lint

# Manual testing checklist:
# 1. Cart page loads with items showing quantity steppers
# 2. Tap + → quantity increments, totals update
# 3. Tap − at quantity 1 → item removed from list
# 4. Remove last item → empty cart state appears
# 5. Stepper + disabled at maxCount
# 6. Unavailable items show no stepper
# 7. Rapid taps process correctly (no duplicates/skips)
# 8. Network error → quantity rolls back, toast appears
# 9. PLP cart actions still work (no regression)
```

## Architecture Notes

- The cart page manages its own `CartData` state (not using `CartProvider`)
- This is intentional: the cart page needs the full cart response (items, deposits, suggestions, etc.) which CartProvider doesn't expose
- The mutation queue pattern is the same: optimistic update → enqueue API call → reconcile from response → rollback on error
- `CartItemCard` receives increment/decrement callbacks via props (dependency injection, per constitution)
