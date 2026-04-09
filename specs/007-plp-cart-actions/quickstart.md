# Quickstart: PLP Cart Actions

**Feature**: 007-plp-cart-actions | **Date**: 2026-04-09

## Prerequisites

- Node.js 20.9+ installed
- `npm install` completed in the repo root
- A valid `picnic_auth_token` cookie (log in via the app first, or use the login page)

## Run the Dev Server

```bash
npm run dev
```

Then navigate to `http://localhost:3000?q=roomboter` to see search results with cart actions.

## Key Files to Create

| File | Purpose |
|------|---------|
| `src/contexts/cart-context.tsx` | CartProvider + useCart hook: manages cart state, optimistic mutations, bundle data |
| `src/lib/mutation-queue.ts` | Per-product sequential mutation queue utility (pure logic, no React) |
| `src/components/quantity-stepper.tsx` | Minus/count/plus control overlay for product cards |
| `src/components/bundle-dots.tsx` | Dot indicators showing progress toward bundle threshold |
| `src/components/savings-label.tsx` | "€X.XX bespaard" label for active bundle discounts |
| `src/components/cart-toast.tsx` | Global toast for cart mutation error feedback |

## Key Files to Modify

| File | Change |
|------|--------|
| `src/app/api/cart/route.ts` | Add `POST` handler for cart mutations (add/remove product) |
| `src/app/page.tsx` | Wrap content with `CartProvider`; fetch initial cart on mount |
| `src/components/product-card.tsx` | Add cart action overlay (add button or quantity stepper) |
| `src/components/shared-header.tsx` | Subscribe to `CartContext` for reactive cart badge updates when available |
| `src/lib/types.ts` | Add `CartMutationRequest`, `BundleProgress`, `BundleThreshold`, `CartContextState` types |

## Existing Files to Reference (Do Not Modify)

| File | Why |
|------|-----|
| `src/lib/parse-cart.ts` | Reuse for parsing cart mutation responses (same shape as GET /cart) |
| `src/lib/extract-product-data.ts` | Reference for `extractBundles()` — bundle extraction from PDP pages |
| `src/app/api/search/route.ts` | Reference for `sendRequest` cast pattern |
| `src/lib/picnic-client.ts` | Use `buildPicnicClient(token)` in API route |
| `src/lib/auth.ts` | Use `readAuthToken(request)` in API route |
| `src/lib/api-error.ts` | Use `isApiAuthError(error)` for auth error detection |

## Lint Check

```bash
npm run lint
```

No test framework is configured. Validation is done via linting and manual browser testing.

## Implementation Order

1. **Types** — Add new types to `src/lib/types.ts` (`CartMutationRequest`, `BundleProgress`, `BundleThreshold`)
2. **Mutation queue** — Create `src/lib/mutation-queue.ts` (pure utility, testable in isolation)
3. **API route** — Add `POST` handler to `src/app/api/cart/route.ts` (add/remove mutations)
4. **Cart context** — Create `src/contexts/cart-context.tsx` (state, optimistic updates, bundle data)
5. **Stepper component** — Create `src/components/quantity-stepper.tsx` (display-only, receives props)
6. **Bundle components** — Create `src/components/bundle-dots.tsx` and `src/components/savings-label.tsx`
7. **Toast component** — Create `src/components/cart-toast.tsx` (global error feedback)
8. **Product card integration** — Modify `src/components/product-card.tsx` to show cart action overlay
9. **Page integration** — Modify `src/app/page.tsx` to wrap with `CartProvider` and fetch initial cart
10. **Header integration** — Modify `src/components/shared-header.tsx` to consume `CartContext` when available

## Architecture Notes

- **Optimistic UI**: The cart context updates the local quantity map immediately on tap, before the server confirms. If the server fails, the context rolls back to the last confirmed state and shows a toast.
- **Mutation queue**: Each product has its own sequential queue. Tapping +/+/+ quickly on product A queues 3 add-product calls that execute one after another. Meanwhile, tapping + on product B runs concurrently.
- **Bundle data**: Currently no Picnic products have active bundle promotions. The bundle UI components (`BundleDots`, `SavingsLabel`) are built against the known data shapes and will activate automatically when the API starts returning `promoProgress` (Cart) or `product-page-bundles-*` (PDP) data.
- **Cart POST route**: Uses `sendRequest("POST", "/cart/add_product", { product_id, count })` and `sendRequest("POST", "/cart/remove_product", { product_id, count })`. Both return the full cart response, parsed by the existing `parseCartResponse`.
- **Context scope**: `CartProvider` wraps only the search results page. The cart page has its own independent cart fetch. `SharedHeader` optionally consumes the context (uses it when available, falls back to its own fetch otherwise).
