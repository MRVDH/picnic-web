# Quickstart: Cart Page

**Feature**: 006-cart-page | **Date**: 2026-04-07

## Prerequisites

- Node.js 20.9+ installed
- `npm install` completed in the repo root
- A valid `picnic_auth_token` cookie (log in via the app first, or use the login page)

## Run the Dev Server

```bash
npm run dev
```

Then navigate to `http://localhost:3000/cart`.

## Key Files to Create

| File | Purpose |
|------|---------|
| `src/app/cart/page.tsx` | Cart page client component |
| `src/app/api/cart/route.ts` | API route proxying Picnic cart endpoint via `sendRequest` |
| `src/lib/parse-cart.ts` | Cart response → display types transformer (runtime validation of `unknown` response) |
| `src/lib/api-error.ts` | Shared `isApiAuthError` utility (extracted from existing routes) |
| `src/components/cart-item.tsx` | Single cart line item component |
| `src/components/order-summary.tsx` | Order totals summary component |
| `src/components/minimum-order-indicator.tsx` | Min order value progress indicator |
| `src/components/unavailable-product.tsx` | Unavailable product with replacements |
| `src/components/checkout-cta.tsx` | "Complete in Picnic app" message |
| `src/components/shared-header.tsx` | Shared header with cart icon + price badge (used on all auth pages) |

## Key Files to Modify

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add `CartData`, `CartItem`, `DepositEntry`, `CartApiResponse` types |
| `src/app/search/page.tsx` | Replace inline header with `SharedHeader` component |
| `src/app/product/[id]/page.tsx` | Replace inline header with `SharedHeader` component |
| `src/app/api/search/route.ts` | Replace local `isApiAuthError` with shared import from `src/lib/api-error.ts` |
| `src/app/api/product/[id]/route.ts` | Replace local `isApiAuthError` with shared import from `src/lib/api-error.ts` |

## Existing Files to Reference (Do Not Modify)

| File | Why |
|------|-----|
| `src/app/product/[id]/page.tsx` | Reference pattern for page structure, state machine, error handling |
| `src/app/api/product/[id]/route.ts` | Reference pattern for API route with `sendRequest` cast, auth check, error handling |
| `src/app/api/search/route.ts` | Reference pattern for `sendRequest` cast (same pattern to follow for cart) |
| `src/components/price-display.tsx` | Reuse directly for price rendering |
| `src/components/badge.tsx` | Reuse directly for decorator-derived badges |
| `src/components/product-slider.tsx` | Reuse directly for "Niets vergeten?" section |
| `src/components/product-slider-card.tsx` | Reuse directly for suggestion/replacement cards |
| `src/lib/picnic-client.ts` | Use `buildPicnicClient(token)` in API route |
| `src/lib/auth.ts` | Use `readAuthToken(request)` in API route |
| `src/lib/image-url.ts` | Use `buildImageUrl(imageId)` for product images |

## Lint Check

```bash
npm run lint
```

No test framework is configured. Validation is done via linting and manual browser testing.

## Implementation Order

1. **Shared utility** — Extract `isApiAuthError` to `src/lib/api-error.ts` and update existing routes to import it
2. **Types** — Add display types to `src/lib/types.ts`
3. **Transformer** — Create `src/lib/parse-cart.ts` (pure function, runtime validation of `unknown` input, no picnic-api type imports)
4. **API route** — Create `src/app/api/cart/route.ts` using `sendRequest("GET", "/cart")` cast pattern
5. **Components** — Create cart-specific display components
6. **Page** — Create `src/app/cart/page.tsx` wiring everything together
7. **Shared header** — Extract shared header component with cart icon + price badge; integrate into search, product detail, and cart pages
8. **Polish** — Edge cases, responsiveness, empty/error states

## Architecture Notes

- The cart API route uses `sendRequest("GET", "/cart", null, false)` — the same cast-based pattern as search and product-detail routes. The `false` for `includePicnicHeaders` is because `/cart` returns structured JSON, not a Fusion page.
- The raw response from `sendRequest` is `unknown`. The `parseCartResponse` function validates and extracts fields at runtime using type guards and optional chaining with fallback defaults. No picnic-api `Cart` type is imported for casting.
- The middleware at `src/middleware.ts` already gates all routes except `/login`, `/api/auth/*`, `/_next/*`, and `/favicon.ico`. The `/cart` route is automatically protected — no auth changes needed.
- All prices in the Picnic API are in **euro cents** (integers). Use `PriceDisplay` for rendering and `Intl.NumberFormat("nl-NL")` for formatting.
- The shared header component with cart icon and price badge is used on all authenticated pages. It fetches cart data via the same `GET /api/cart` endpoint. On fetch failure or during loading, the icon is shown without a badge.
