# Research: Cart Page Product Actions

**Feature**: 008-cart-page-actions | **Date**: 2026-04-09

## 1. Cart Page Architecture

### Current State (`src/app/cart/page.tsx`, 204 lines)

The cart page uses a discriminated union `CartPageState` with four states: `loading`, `success`, `empty`, `error`. Cart data is fetched once on mount via `GET /api/cart` and stored as full `CartData`. There is no shared state management — the page owns all state.

Sub-components are **props-based** (no context consumption):
- `CartItemCard` — receives a single `CartItem` prop
- `OrderSummary` — receives 6 individual fields (totalPrice, totalCount, totalDiscount, depositTotal, depositBreakdown, membershipSavings)
- `MinimumOrderIndicator` — receives `currentTotal` and `minimumOrderValue`
- `CheckoutCta` — takes NO props (completely static)
- `ProductSlider` — receives title and products array

### Why CartProvider Is Not Suitable

The existing `CartProvider` (from feature 007) stores only `Map<string, number>` quantities + `totalPrice` + `totalCount`. It does **not** expose:
- Full `CartData` (items array with names, images, badges, etc.)
- Deposit breakdown and total
- Minimum order value
- Membership savings
- Suggestion products

The cart page needs all of this data to render its sub-components. Extending CartProvider to hold full CartData would violate SRP — it would become a "PLP state manager AND cart page data store."

### Chosen Approach: Cart-Page-Level State

The cart page will manage its own `CartData` state, reusing the **patterns** from CartProvider:
1. Optimistic quantity updates in local state
2. Per-product mutation queue via `createMutationQueue`
3. Server reconciliation from POST response
4. Rollback on failure + toast notification

This keeps the PLP and cart page concerns separated while sharing the core infrastructure.

## 2. CartItem Missing maxCount

### Problem

The `CartItem` type (`src/lib/types.ts:276-301`) does NOT have a `maxCount` field. The `QuantityStepper` component requires `maxCount` to disable the plus button at the limit.

### Evidence

- The raw cart API response includes `max_count` on article objects — confirmed by `mapRawToSliderProduct` in `parse-cart.ts:231` which reads `raw["max_count"]`.
- `mapOrderLineToCartItem` (`parse-cart.ts:310-372`) extracts many fields from `firstArticle` (id, name, unitQuantity, imageIds) but **skips** `max_count`.

### Fix

1. Add `maxCount: number` to the `CartItem` type definition
2. In `mapOrderLineToCartItem`, extract from `firstArticle["max_count"]` with fallback: `asNumber(firstArticle["max_count"], 99)`

The fallback of 99 matches the convention used in `mapRawToSliderProduct`.

## 3. CartItemCard Nested Link Issue

### Problem

`CartItemCard` (`src/components/cart-item.tsx:31-76`) wraps the **entire row content** in a `<Link>` to `/product/{productId}`. The static quantity text at line 69 (`<span>{item.quantity}×</span>`) is inside this Link.

Replacing that text with a `QuantityStepper` (which contains `<button>` elements) creates **nested interactive elements** — buttons inside an anchor. This is:
- Invalid HTML (accessibility violation)
- Causes unpredictable click behavior (click on button also navigates)

### Solution Options Considered

1. **Move stepper outside the Link** — Restructure so the Link wraps only image + product info, and the stepper sits outside. This is the cleanest HTML structure.
2. **Use `stopPropagation`** — Same pattern as PLP's `CartActionOverlay` where buttons prevent event bubbling. Technically works but keeps invalid nesting.
3. **Replace Link with onClick navigation** — Use a div with `onClick` + `router.push` for the product info area, stepper naturally sits outside.

**Chosen: Option 1** — Move the stepper outside the Link. The Link wraps the image and product info (name, badges). The quantity/price column sits outside the Link in the same row using flexbox. This is the simplest, most accessible approach.

## 4. Reactive Cart Totals

### How It Works

When a mutation succeeds, the POST `/api/cart` route returns the full updated `CartData`. The cart page replaces its entire `cartData` state with this response. Since all sub-components receive props derived from `cartData`, React's normal re-rendering handles reactivity:

- `OrderSummary` re-renders with new `totalPrice`, `totalCount`, `totalDiscount`, etc.
- `MinimumOrderIndicator` re-renders with new `currentTotal`
- `CartItemCard` list re-renders with updated quantities
- Items removed (quantity → 0) disappear from the items array
- If all items removed, page transitions to `empty` state

### Optimistic Updates

For immediate feedback before the server responds:
- **Quantity**: Update the specific item's `quantity` field in the local `CartData` state
- **Totals**: Increment/decrement `totalCount` by 1 (price reconciled on server response)
- **Item removal**: When quantity hits 0, filter the item from the local items array

### Header Badge

The cart page currently uses `SharedHeader` without `CartProvider`. The header's `useCartOptional` returns null, so it shows no badge (or the page could pass totalCount). After mutations, the server response reconciles the count. For feature 008, the simplest approach is for the header to derive its badge from the page's `totalCount` state. This can be done by passing `totalCount` as a prop to a new variant or by wrapping just the header in a lightweight context.

## 5. Reusable Infrastructure (from Feature 007)

| Component | File | Reuse Strategy |
|-----------|------|----------------|
| `QuantityStepper` | `src/components/quantity-stepper.tsx` | Direct reuse — pass quantity, maxCount, onIncrement, onDecrement. Bundle props not needed (out of scope). |
| `CartToast` | `src/components/cart-toast.tsx` | Direct reuse — render at cart page level, pass show/hide callback to mutation error handler. |
| `createMutationQueue` | `src/lib/mutation-queue.ts` | Direct reuse — instantiate in cart page with onSettled callback for reconciliation/rollback. |
| `postCartMutation` pattern | `src/contexts/cart-context.tsx` | Extract or replicate the 15-line function. It's a simple `fetch("/api/cart", { method: "POST", ... })` call. |
| `POST /api/cart` route | `src/app/api/cart/route.ts` | No changes — already handles add/remove and returns full CartData. |
| `parseCartResponse` | `src/lib/parse-cart.ts` | Already used by the API route — just needs maxCount extraction added. |

## 6. Files to Modify

| File | Change | Lines Affected |
|------|--------|---------------|
| `src/lib/types.ts` | Add `maxCount: number` to `CartItem` type | ~1 line addition at line 300 |
| `src/lib/parse-cart.ts` | Extract `max_count` from `firstArticle` in `mapOrderLineToCartItem` | ~1 line addition at line 370 |
| `src/components/cart-item.tsx` | Restructure Link, replace static quantity with QuantityStepper, add callback props | Major refactor (~40 lines changed) |
| `src/app/cart/page.tsx` | Add mutation state management, CartToast, pass callbacks to CartItemCard | ~60 lines added to CartPageContent |

## 7. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Nested interactive elements in CartItemCard | High (a11y, broken clicks) | Restructure Link to exclude stepper area |
| Cart page exceeding 300-line limit | Medium (constitution violation) | Extract mutation logic into a custom hook if needed |
| Stale state after rapid mutations | Low (already solved) | Mutation queue ensures sequential processing per product |
| PLP regression from CartItem type change | Low | Adding a field is non-breaking; PLP doesn't use maxCount on CartItem |
