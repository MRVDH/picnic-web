# Tasks: Cart Page

**Input**: Design documents from `/specs/006-cart-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cart-api.md, quickstart.md

**Tests**: Not requested in the feature specification. No test framework is configured. Validation is via ESLint and manual browser testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Add cart-specific display types to the shared type system

- [X] T001 Add `CartItem`, `DepositEntry`, and `CartData` types to `src/lib/types.ts` per data-model.md. `CartItem` has fields: `id` (string), `productId` (string), `name` (string), `unitQuantity` (string), `imageId` (string), `displayPrice` (number), `originalPrice` (number | null), `quantity` (number), `badges` (Badge[]), `isUnavailable` (boolean), `unavailableExplanation` (string | null), `replacements` (SliderProduct[]). `DepositEntry` has: `type` (string), `value` (number), `count` (number), `total` (number). `CartData` has: `items` (CartItem[]), `totalPrice` (number), `totalCount` (number), `totalDiscount` (number), `depositTotal` (number), `depositBreakdown` (DepositEntry[]), `membershipSavings` (number), `minimumOrderValue` (number | null), `suggestions` (SliderProduct[]). Also add `CartApiResponse` as an alias for `CartData` (the API route returns the same shape). All prices are in cents (integers). Reuse existing `Badge`, `SliderProduct`, and `BadgeVariant` types already defined in the file.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data pipeline — shared utility, transformer, and API route. MUST complete before any user story UI work.

**Why blocking**: All UI components consume `CartData` from the API route, which depends on the transformer. No component can render without this pipeline.

- [X] T002 [P] Extract `isApiAuthError` into a shared utility at `src/lib/api-error.ts`. Create a new file exporting the function. The function takes `error: unknown` and returns `boolean`, checking `error instanceof Error` then `error.message.toLowerCase()` for "401", "403", "unauthorized", "forbidden". Update the three existing API routes that duplicate this function — `src/app/api/search/route.ts` (line ~80), `src/app/api/suggestions/route.ts` (line ~67), and `src/app/api/product/[id]/route.ts` (line ~84) — to import `isApiAuthError` from `src/lib/api-error.ts` and delete their local copies.
- [X] T003 [P] Create the cart response transformer at `src/lib/parse-cart.ts`. This pure function `parseCartResponse(rawData: unknown): CartData` accepts the raw `unknown` response from `sendRequest("GET", "/cart")` and performs runtime validation — no picnic-api types are imported for casting. Implementation: (a) assert `rawData` is a non-null object with expected top-level fields using type guards and optional chaining with fallback defaults; (b) merge `decorator_overrides` (a `{ [key: string]: unknown[] }` map) into each order line and order article by matching keys to item `id` fields — replace same-type decorators, keep others; (c) extract quantity from `QUANTITY` decorator (`type === "QUANTITY"`, read `quantity` property, default to 1 if absent); (d) map decorators to `Badge[]` using the mapping: `LABEL` → `"discount"` (text from `decorator.text`), `FRESH_LABEL` → `"freshness"` (text from `decorator.period`), `BASE_PRICE` → `"unit-price"` (text from `decorator.base_price_text`), `BUNDLES_BUTTON` → `"info"` (static text "Bundel"); (e) detect `UNAVAILABLE` decorator to set `isUnavailable`, extract `explanation.short_explanation` for `unavailableExplanation`, and map `replacements` to `SliderProduct[]`; (f) compute `originalPrice` = order line `price` if !== `display_price`, else null; (g) take first `image_ids[0]` or empty string for `imageId`; (h) extract `productId` from first article's `id`; (i) calculate `totalDiscount` = sum of (price - display_price) for lines where price > display_price; (j) calculate `depositTotal` = sum of (value × count) from `deposit_breakdown`; (k) map `deposit_breakdown` entries to `DepositEntry[]` with computed `total`; (l) extract `minimumOrderValue` by matching `selected_slot.slot_id` to `delivery_slots[]` array, reading `minimum_order_value` from matched slot (null if not found or field absent); (m) defensively parse `basket_sections` for suggestion products into `SliderProduct[]`, returning empty array if empty or unparseable; (n) read `checkout_total_price` for `totalPrice`, `total_count` for `totalCount`, `membership_savings` for `membershipSavings`. All field accesses use optional chaining with safe defaults. Import `CartData`, `CartItem`, `DepositEntry`, `Badge`, `SliderProduct` from `src/lib/types.ts`.
- [X] T004 Create the API route at `src/app/api/cart/route.ts`. Export an async `GET(request)` handler following the `sendRequest` cast pattern from `src/app/api/product/[id]/route.ts`. Steps: (1) call `readAuthToken(request)` from `src/lib/auth.ts` — if null, return `NextResponse.json({ error: "...", code: "TOKEN_EXPIRED" }, { status: 401 })`; (2) call `buildPicnicClient(token)` from `src/lib/picnic-client.ts`; (3) cast client to `sendRequest` interface (same pattern as search/product routes) and call `sendRequest("GET", "/cart", null, false)` — note `false` for the 4th arg because `/cart` returns structured JSON, not a Fusion page; (4) call `parseCartResponse(rawCart)` from `src/lib/parse-cart.ts` passing the `unknown` result; (5) return `NextResponse.json(cartData)`. In the catch block: if `isApiAuthError(error)` (imported from `src/lib/api-error.ts`), return 401 with `code: "TOKEN_EXPIRED"`; otherwise `console.error` the error and return 502 with Dutch message `"Kan winkelwagen niet ophalen. Probeer het later opnieuw."`. Depends on T002 and T003.

**Checkpoint**: The data pipeline is complete. `GET /api/cart` returns transformed cart data. All UI tasks can now proceed.

---

## Phase 3: User Story 1 — View Cart Contents (Priority: P1) 🎯 MVP

**Goal**: Display all cart items with image, name, unit quantity, quantity, price (with discount), and decorator badges. Show empty state when cart is empty. Each product links to its detail page. Loading and error states with retry.

**Independent Test**: Log in, add products to cart via the Picnic app, navigate to `/cart`, verify all items display with correct data. Test with discounted items, items with badges, and an empty cart.

### Implementation for User Story 1

- [X] T005 [US1] Create the `CartItemCard` component at `src/components/cart-item.tsx`. This is a `"use client"` component (needs `onError` for image fallback). Props: `{ item: CartItem }`. Renders: product image (using `buildImageUrl(item.imageId)` from `src/lib/image-url.ts`, with `next/image`, `unoptimized`, `onError` fallback to `/placeholder-product.svg`), product name, unit quantity subtitle, quantity display (e.g., "2×"), `PriceDisplay` component (from `src/components/price-display.tsx`) with `displayPrice={item.displayPrice}` and `originalPrice={item.originalPrice}`, and a row of `Badge` components (from `src/components/badge.tsx`) for each badge in `item.badges`. The entire card is wrapped in a `next/link` `Link` to `/product/${item.productId}`. Use Tailwind: flex row layout, `border-b border-card-border` separator, responsive padding. Image size ~80px on mobile, ~96px on desktop. Do NOT render unavailability state here — that is US4 scope. Do NOT render quantity modification controls — the cart is read-only (FR-022).
- [X] T006 [US1] Create the cart page at `src/app/cart/page.tsx`. This is a `"use client"` component. Implement the state machine from contracts/cart-api.md: `CartPageState = { status: "loading" } | { status: "success"; cart: CartData } | { status: "empty" } | { status: "error"; message: string }`. Define a standalone `async function fetchCart()` outside the component that fetches `/api/cart`, parses JSON, types response as `CartData | ApiErrorResponse`, checks for `TOKEN_EXPIRED` code (redirect to `/login?expired=true` via `window.location.href`), checks for error responses, and returns the appropriate state (if `totalCount === 0` return `empty`, otherwise `success`). In the component, use `useState<CartPageState>({ status: "loading" })` and `const [retryCount, setRetryCount] = useState(0)`. Use `useEffect` with `[retryCount]` dependency to call `fetchCart()` with `isCancelled` cleanup pattern (reference `src/app/product/[id]/page.tsx`). Render sub-views: `LoadingView` (spinner matching existing pattern: `animate-spin rounded-full border-4 border-gray-200 border-t-picnic-red`), `ErrorView` with sad face `:(` + Dutch message + retry button calling `setRetryCount(c => c + 1)`, `EmptyView` with "Je winkelwagen is leeg" message, and `CartPageContent` for success state. The `CartPageContent` sub-view renders: page title "Winkelwagen", a list of `CartItemCard` components for each `cart.items`, and placeholder `div`s for order summary, minimum order indicator, suggestions, and checkout CTA (to be filled in later stories). Use `max-w-4xl mx-auto` container matching the product detail page pattern. All sub-views are defined as plain functions in the same file below the main component, separated by comment headers. Include a temporary inline header matching the product detail page pattern (logo + back button) — this will be replaced by the shared header in US7.

**Checkpoint**: The cart page renders all products with full detail. Empty, loading, and error states work. This is the MVP — the cart page is usable at this point.

---

## Phase 4: User Story 2 — View Order Summary (Priority: P1)

**Goal**: Show financial summary with total price, total discount, deposit breakdown, item count, and membership savings.

**Independent Test**: Add products with known prices and discounts to cart, navigate to `/cart`, verify the summary displays correct totals formatted in Dutch locale.

### Implementation for User Story 2

- [X] T007 [US2] Create the `OrderSummary` component at `src/components/order-summary.tsx`. Props: `{ totalPrice: number; totalCount: number; totalDiscount: number; depositTotal: number; depositBreakdown: DepositEntry[]; membershipSavings: number }`. All prices are in cents. Renders a card/section with rows: "Artikelen ({totalCount})" with total price, "Korting" with `-€X,XX` (only shown if totalDiscount > 0), deposit rows for each non-zero deposit entry (labeled by type, e.g., "Statiegeld" for BAG), "Picnic-lidmaatschapsbesparing" with `-€X,XX` (only shown if membershipSavings > 0), and a bold "Totaal" row with `totalPrice`. Format all prices using `Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" })` with the value divided by `CENTS_DIVISOR` (100, imported from `src/lib/types.ts`). Use Tailwind: `bg-card-bg border border-card-border rounded-xl p-4`, rows use `flex justify-between`, total row uses `font-bold border-t`. Hide the deposit line if `depositBreakdown` is empty (FR edge case). Hide the entire component if `totalCount === 0`.
- [X] T008 [US2] Wire `OrderSummary` into the cart page `CartPageContent` sub-view in `src/app/cart/page.tsx`. Replace the placeholder div for order summary with the `OrderSummary` component, passing the relevant fields from `cart`: `totalPrice`, `totalCount`, `totalDiscount`, `depositTotal`, `depositBreakdown`, `membershipSavings`. Position it below the cart items list. On desktop (lg+), consider a sticky sidebar layout; on mobile, position below the items list.

**Checkpoint**: Cart page now shows both the product list and the financial summary. Both P1 cart-content stories are complete.

---

## Phase 5: User Story 3 — Minimum Order Value Indicator (Priority: P2)

**Goal**: Show a visual indicator of progress toward the minimum order value. Hidden when no minimum can be determined.

**Independent Test**: Use a cart with total below the minimum order value and verify the indicator shows the remaining amount. Add items to exceed the minimum and verify success state. Test with no delivery slot selected (indicator should be hidden).

### Implementation for User Story 3

- [X] T009 [US3] Create the `MinimumOrderIndicator` component at `src/components/minimum-order-indicator.tsx`. Props: `{ currentTotal: number; minimumOrderValue: number | null }`. If `minimumOrderValue` is null, return null (hidden). Calculate `remaining = minimumOrderValue - currentTotal` and `progress = Math.min(currentTotal / minimumOrderValue, 1)`. If `remaining <= 0`: render a success state with a green checkmark and text like "Je hebt de minimale bestelwaarde bereikt". If `remaining > 0`: render a progress bar (`bg-gray-200 rounded-full h-2` outer, `bg-picnic-green` inner with `width: ${progress * 100}%` via inline style) and text "Nog €X,XX tot de minimale bestelwaarde". Format remaining amount using `Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" })` with value divided by `CENTS_DIVISOR`. Use Tailwind: `bg-card-bg border border-card-border rounded-xl p-4`, place above the order summary.
- [X] T010 [US3] Wire `MinimumOrderIndicator` into the cart page `CartPageContent` sub-view in `src/app/cart/page.tsx`. Replace the placeholder div for minimum order indicator with the component, passing `currentTotal={cart.totalPrice}` and `minimumOrderValue={cart.minimumOrderValue}`. Position it between the cart items and the order summary.

**Checkpoint**: Users can see how close they are to the minimum order value.

---

## Phase 6: User Story 4 — Unavailable Product Handling (Priority: P2)

**Goal**: Visually distinguish unavailable products, show explanation text, and display replacement suggestions.

**Independent Test**: Have an unavailable product in the cart (via API/app). Verify it appears greyed out with explanation text. If replacements exist, verify they are shown with image, name, price, and link to product detail.

### Implementation for User Story 4

- [X] T011 [P] [US4] Create the `UnavailableOverlay` component at `src/components/unavailable-product.tsx`. Props: `{ explanation: string | null; replacements: SliderProduct[] }`. Renders: an explanation text paragraph (if `explanation` is not null) styled with `text-picnic-orange text-sm`, and if `replacements` is non-empty, a "Vergelijkbare producten" label followed by a `ProductSlider` component (from `src/components/product-slider.tsx`) or individual `ProductSliderCard` components (from `src/components/product-slider-card.tsx`), each with `href={/product/${replacement.id}}`. If both explanation and replacements are empty/null, return null.
- [X] T012 [US4] Update the `CartItemCard` component in `src/components/cart-item.tsx` to handle unavailability. When `item.isUnavailable` is true: apply a visual distinction to the card (e.g., `opacity-60` on the main content area, add a warning icon or `bg-picnic-yellow/10` background tint). Render the `UnavailableOverlay` component below the main cart item content, passing `explanation={item.unavailableExplanation}` and `replacements={item.replacements}`. When `item.isUnavailable` is false, render nothing extra. The product should still be clickable (link to product detail page) even when unavailable.

**Checkpoint**: Unavailable products are visually distinct with explanations and replacement suggestions.

---

## Phase 7: User Story 5 — "Niets vergeten?" Suggestions (Priority: P3)

**Goal**: Show a horizontal scrollable list of suggested products below the cart contents.

**Independent Test**: Load the cart page. If `basket_sections` contains product data, verify the "Niets vergeten?" section appears with product cards. If no data, verify the section is hidden without error.

### Implementation for User Story 5

- [X] T013 [US5] Wire the existing `ProductSlider` component into the cart page `CartPageContent` sub-view in `src/app/cart/page.tsx`. Replace the placeholder div for suggestions. Render `<ProductSlider title="Niets vergeten?" products={cart.suggestions} />` (imported from `src/components/product-slider.tsx`). The `ProductSlider` component already returns null when `products` is empty, so no conditional rendering is needed. Position it below the order summary. Each `ProductSliderCard` within the slider already accepts an `href` prop — verify that each suggestion passes `href={/product/${product.id}}` so each suggestion links to the product detail page.

**Checkpoint**: Suggested products appear when data is available, hidden otherwise.

---

## Phase 8: User Story 6 — Checkout Call-to-Action (Priority: P3)

**Goal**: Display a message directing users to complete checkout in the Picnic app.

**Independent Test**: With items in the cart, verify the CTA message appears. With an empty cart, verify it does not appear.

### Implementation for User Story 6

- [X] T014 [P] [US6] Create the `CheckoutCta` component at `src/components/checkout-cta.tsx`. No props (or optional `className` for layout). Renders a styled banner with text "Afrekenen kan via de Picnic app" and a secondary line like "Download de app om je bestelling af te ronden." Use Tailwind: `bg-picnic-red/5 border border-picnic-red/20 rounded-xl p-6 text-center`, primary text in `text-lg font-semibold text-foreground`, secondary text in `text-sm text-gray-500`. Include a Picnic-style visual element (e.g., a shopping bag icon or the Picnic red accent).
- [X] T015 [US6] Wire `CheckoutCta` into the cart page `CartPageContent` sub-view in `src/app/cart/page.tsx`. Replace the placeholder div for checkout CTA with the component. Position it at the bottom of the page, below the suggestions section. The CTA should only render in the `success` state (not `empty` state, per acceptance scenario 2 — the empty state has its own message).

**Checkpoint**: All cart-page-specific user stories are complete.

---

## Phase 9: User Story 7 — Cart Icon in Header (Priority: P1)

**Goal**: Extract a shared header component with cart icon and price badge. Replace per-page inline headers on all authenticated pages (search/home, product detail, cart). The cart icon shows a red badge with the total cart price, navigates to `/cart`, and degrades gracefully on loading/error.

**Independent Test**: Navigate to the search page (root `/`) with items in the cart — verify the cart icon appears in the header with the correct total price badge. Click the icon and verify navigation to `/cart`. Navigate to a product detail page and verify the same icon. Test with empty cart (no badge), loading state (no badge), and failed fetch (icon visible, no badge, still clickable).

### Implementation for User Story 7

- [X] T016 [US7] Create the `SharedHeader` component at `src/components/shared-header.tsx`. This is a `"use client"` component. Props: `{ children?: React.ReactNode }` (for page-specific header content like the search bar or back button). The component renders a sticky header matching the existing pattern: `sticky top-0 z-20 border-b border-card-border bg-white/95 backdrop-blur-sm`. Inner layout: left side has `Link href="/"` with "Picnic Web" logo text (matching existing `PicnicLogo` pattern), center has `{children}` slot, right side has the cart icon. The cart icon: on mount, fetch `/api/cart` in a `useEffect` to get cart data. Extract `totalPrice` and `totalCount` from the response. If `totalCount > 0` and fetch succeeded, show a red badge with the price formatted via `Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" })` (value / `CENTS_DIVISOR`). If loading, error, or empty cart — show the cart icon without badge. The icon is always wrapped in `Link href="/cart"`. Use an SVG shopping cart icon or emoji. Handle fetch errors silently (no error UI in header — just hide badge per FR-027). On the cart page itself, the header can optionally receive cart data via props to avoid a duplicate fetch — or simply re-fetch (acceptable per spec assumption).
- [X] T017 [US7] Update the search/home page at `src/app/page.tsx` to use the `SharedHeader` component. Replace the existing inline sticky header (the `<header>` element with logo, search bar, and sign-out button) with `<SharedHeader>`. Pass the search bar and sign-out button as `children`. Ensure the `SectionNavBar` (if present) remains positioned below the header. Verify the layout remains identical visually — same `max-w-7xl` container behavior.
- [X] T018 [US7] Update the product detail page at `src/app/product/[id]/page.tsx` to use the `SharedHeader` component. Replace the existing inline sticky header with `<SharedHeader>`. Pass the "Terug" (back) button as `children`. Verify the layout remains identical visually — same `max-w-4xl` container behavior for main content.
- [X] T019 [US7] Update the cart page at `src/app/cart/page.tsx` to use the `SharedHeader` component. Replace the temporary inline header (created in T006) with `<SharedHeader>`. No special children needed (or optionally a "Terug" button). On the cart page specifically, if `CartPageContent` already has the cart data loaded, consider passing it to `SharedHeader` to avoid a redundant `/api/cart` fetch — or accept the duplicate fetch as the simpler approach (per spec assumption that the full endpoint is reused on every page).

**Checkpoint**: All authenticated pages share the same header with cart icon and price badge. The user can navigate to the cart from any page.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Responsiveness, edge cases, lint, and final validation

- [X] T020 [P] Review responsive layout of `src/app/cart/page.tsx` and all cart components. for screens from 320px to 1920px+ (SC-008). Verify: cart items stack vertically on mobile, summary may move to sidebar on desktop (lg+), suggestion slider scrolls horizontally without breaking layout, no horizontal page scrolling at any breakpoint. Adjust Tailwind classes as needed.
- [X] T021 [P] Verify edge cases in `src/lib/parse-cart.ts`. (a) cart with 50+ items produces correct output without errors; (b) `deposit_breakdown` is empty → `depositTotal` is 0, `depositBreakdown` is []; (c) item with both `LABEL` and `BUNDLES_BUTTON` decorators → both badges appear; (d) `display_price` differs from `price` → originalPrice is set correctly; (e) `image_ids` is empty → `imageId` is empty string; (f) no `QUANTITY` decorator → quantity defaults to 1; (g) `basket_sections` is empty → suggestions is []; (h) `decorator_overrides` is empty or missing → items unchanged; (i) `selected_slot` is missing → `minimumOrderValue` is null; (j) `membership_savings` is missing → defaults to 0.
- [X] T022 Run `npm run lint` from repo root — 0 errors, 0 warnings. and fix any ESLint errors across all new and modified files: `src/lib/types.ts`, `src/lib/api-error.ts`, `src/lib/parse-cart.ts`, `src/app/api/cart/route.ts`, `src/app/cart/page.tsx`, `src/components/cart-item.tsx`, `src/components/order-summary.tsx`, `src/components/minimum-order-indicator.tsx`, `src/components/unavailable-product.tsx`, `src/components/checkout-cta.tsx`, `src/components/shared-header.tsx`, `src/app/page.tsx`, `src/app/product/[id]/page.tsx`, `src/app/api/search/route.ts`, `src/app/api/suggestions/route.ts`, `src/app/api/product/[id]/route.ts`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (types must exist for transformer and API route)
- **Phase 3 (US1)**: Depends on Phase 2 (API route must exist for page to fetch data)
- **Phase 4 (US2)**: Depends on Phase 3 (wires into the cart page created in US1)
- **Phase 5 (US3)**: Depends on Phase 3 (wires into the cart page created in US1)
- **Phase 6 (US4)**: Depends on Phase 3 (extends the CartItemCard created in US1)
- **Phase 7 (US5)**: Depends on Phase 3 (wires into the cart page created in US1)
- **Phase 8 (US6)**: Depends on Phase 3 (wires into the cart page created in US1)
- **Phase 9 (US7)**: Depends on Phase 2 (needs `/api/cart` route for header badge fetch) and Phase 3 (cart page must exist for header integration)
- **Phase 10 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational (Phase 2) only — MVP
- **US2 (P1)**: Depends on US1 (wires into the page shell)
- **US3 (P2)**: Depends on US1 (wires into the page shell). Independent of US2.
- **US4 (P2)**: Depends on US1 (modifies CartItemCard). Independent of US2, US3.
- **US5 (P3)**: Depends on US1 (wires into the page shell). Independent of US2–US4.
- **US6 (P3)**: Depends on US1 (wires into the page shell). Independent of US2–US5.
- **US7 (P1)**: Depends on Foundational (Phase 2) for the API route. Modifies existing pages (`src/app/page.tsx`, `src/app/product/[id]/page.tsx`) and the cart page. Can be implemented after US1 but recommended after US2–US6 to avoid repeated edits to `page.tsx`.

### Within Foundational Phase

- T002 (api-error.ts) and T003 (parse-cart.ts) can run in parallel — different files
- T004 (API route) depends on both T002 and T003

### Parallel Opportunities (Post-US1)

Once US1 is complete, US2 through US6 can proceed in parallel since they each create or modify different files:
- US2: `order-summary.tsx` + page wiring
- US3: `minimum-order-indicator.tsx` + page wiring
- US4: `unavailable-product.tsx` + modifies `cart-item.tsx`
- US5: page wiring only (reuses existing `ProductSlider`)
- US6: `checkout-cta.tsx` + page wiring

**Caution**: US2, US3, US5, US6 all add wiring to `src/app/cart/page.tsx`. If run in parallel, merge conflicts may occur. Recommended: implement US2–US6 sequentially, or coordinate page wiring carefully. US7 should be done after US1–US6 to avoid repeated header replacement edits.

---

## Parallel Example: Post-US1

```
# These create independent component files (can run in parallel):
Task T007: "Create OrderSummary component in src/components/order-summary.tsx"
Task T009: "Create MinimumOrderIndicator component in src/components/minimum-order-indicator.tsx"
Task T011: "Create UnavailableOverlay component in src/components/unavailable-product.tsx"
Task T014: "Create CheckoutCta component in src/components/checkout-cta.tsx"
Task T016: "Create SharedHeader component in src/components/shared-header.tsx"

# Then wire all into pages (must be sequential or coordinated):
Task T008: "Wire OrderSummary into cart page"
Task T010: "Wire MinimumOrderIndicator into cart page"
Task T012: "Update CartItemCard for unavailability"
Task T013: "Wire ProductSlider into cart page"
Task T015: "Wire CheckoutCta into cart page"
Task T017: "Update search/home page to use SharedHeader"
Task T018: "Update product detail page to use SharedHeader"
Task T019: "Update cart page to use SharedHeader"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Types setup
2. Complete Phase 2: Foundational (transformer + API route)
3. Complete Phase 3: User Story 1 (cart items + page shell)
4. **STOP and VALIDATE**: Navigate to `/cart`, verify products display correctly
5. The cart page is usable — all other stories are incremental enhancements

### Incremental Delivery

1. Phase 1 + Phase 2 → Data pipeline ready
2. Add US1 → Cart items display → **MVP usable**
3. Add US2 → Order summary appears → Financial context complete
4. Add US3 → Min order indicator → User guidance improved
5. Add US4 → Unavailable handling → Edge case coverage
6. Add US5 → Suggestions → Upsell opportunity
7. Add US6 → Checkout CTA → User experience complete
8. Add US7 → Shared header with cart icon → Cross-page navigation and cart visibility
9. Phase 10 → Polish → Production ready

---

## Notes

- No test tasks generated — no test framework is configured (lint-only via ESLint 9)
- All prices in the Picnic API are in euro cents (integers) — use `CENTS_DIVISOR` constant from `src/lib/types.ts`
- The API route uses `sendRequest("GET", "/cart", null, false)` — the same cast-based pattern as search and product-detail routes, NOT `client.cart.getCart()`. The response is `unknown` and validated at runtime in `parseCartResponse` — no picnic-api types are imported for casting.
- The middleware at `src/middleware.ts` already gates `/cart` — no auth changes needed
- All user-facing text must be in Dutch
- The search/home page is at `src/app/page.tsx` (root route), not `src/app/search/page.tsx`
- Commit after each task or logical group
