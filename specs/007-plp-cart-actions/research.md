# Research: PLP Cart Actions

**Feature**: 007-plp-cart-actions | **Date**: 2026-04-09

## Research Items

### R-001: Bundle Data Availability in API

**Decision**: Bundle data is NOT currently available from any Picnic API endpoint for any tested product. Implement bundle UI with the known data shapes from the decompiled Android app, wired to activate automatically when the API starts returning data. Use mock data for development and testing.

**Rationale**: Extensive testing of 20+ products across three API endpoints (search, PDP, cart) found:
- **Search API** (`/pages/search-page-results`): All selling units have `price_ranges: null` and empty `decorators[]`. Confirmed across 250+ products (cola, optimel, chocomel, keukenpapier, yoghurt, bier, chips, brood, kaas, melk, aanbieding, 2 voor).
- **PDP API** (`/pages/product-details-page-root`): No `product-page-bundles-*` nodes found for any tested product, including `s1013635` (confirmed by the user to have had bundle discounts). The `extractBundles()` function returns `[]` for all tested products.
- **Cart API** (`/cart`, `add_product`, `remove_product`): No `promoProgress` field, no `BUNDLES_BUTTON` decorator, no `price_ranges` data. Tested `s1013635` up to qty 5 — price remained €2.99/unit with no discount applied.

Bundle promotions appear to be seasonal/rotating. The API infrastructure exists (decompiled app has `PromoProgress`, `BundleProduct`, `PriceRange`, `BUNDLES_BUTTON` models) but no products currently have active bundle promotions.

**Alternatives considered**:
- Skipping bundle UI entirely — rejected because the spec requires it (US3, FR-010 through FR-012) and the UI should be ready when promotions activate.
- Waiting for active bundle promotions — rejected because P1 cart actions can ship independently, and bundle UI can be built with known shapes + mock data.

---

### R-002: Bundle Data Sources (from Decompiled App)

**Decision**: Bundle data can arrive from two sources: (1) `promoProgress` field on the Cart response, and (2) `product-page-bundles-*` PML nodes on the PDP page. The implementation will check both.

**Rationale**: The decompiled Android app reveals:
- **Cart-level**: The `Cart` object (class `C1072f`) has a `promoProgress: PromoProgress` field returned inline with `GET /cart`. `PromoProgress` contains `type` (SINGLE_PRODUCT / CROSS_PRODUCT / BUNDLE), `promotionId`, `label`, `productIds`, `bundleProducts`, `completedSavings`, `total`, and a `button` with `deeplink` and `text`.
- **PDP-level**: The PDP Fusion page tree may contain nodes with IDs matching `product-page-bundles-*`, each holding `STATE_BOUNDARY` nodes with selling units at different price tiers. The existing `extractBundles()` function in `src/lib/extract-product-data.ts` handles this.
- **Cart article-level**: `OrderArticle` has `price_ranges: PriceRange[]` (where `PriceRange = { price: int, fromQuantity: int }`). The pricing algorithm `getUnitPriceForQuantity(qty)` filters ranges where `fromQuantity <= qty` and picks the highest matching `fromQuantity`.
- **Decorator**: `BUNDLES_BUTTON` decorator on cart articles contains `deeplink`, `backgroundColor`, `iconColor`.
- No dedicated bundle API endpoint exists — all bundle data is embedded in cart and PDP responses.

**Alternatives considered**:
- Fetching bundle data from a dedicated endpoint — rejected; no such endpoint exists in the decompiled app's Retrofit definitions.

---

### R-003: Cart Mutation API Pattern

**Decision**: Use `sendRequest("POST", "/cart/add_product", { product_id, count })` and `sendRequest("POST", "/cart/remove_product", { product_id, count })` via the existing cast-based pattern. Both return the full updated Cart response.

**Rationale**: The Picnic API has two cart mutation endpoints:
- `POST /cart/add_product` — body: `{ product_id: string, count: number }` — adds `count` units.
- `POST /cart/remove_product` — body: `{ product_id: string, count: number }` — removes `count` units.

Both return the full Cart response (same shape as `GET /cart`), which includes `items`, `decorator_overrides`, `total_count`, `checkout_total_price`, etc. This means each mutation response can be parsed with the existing `parseCartResponse` function to get the updated cart state — no separate cart fetch needed after mutation.

The `picnic-api` library has typed wrappers (`CartService.addProductToCart` and `removeProductFromCart`), but following the codebase convention of using `sendRequest` with runtime validation is preferred for consistency.

**Alternatives considered**:
- Using `client.cart.addProductToCart()` typed wrappers — rejected for consistency with the codebase's `sendRequest` pattern.
- Making a separate `GET /cart` after each mutation — rejected because `add_product` and `remove_product` already return the full cart.

---

### R-004: Cart State Management on PLP

**Decision**: Use a React context (`CartContext`) to hold cart state client-side, providing product-to-quantity lookup and cart mutation functions. The context wraps the search results page.

**Rationale**: The PLP needs to:
1. Show current quantity for each product (cross-referenced by product ID).
2. Update all instances of a product across sections when quantity changes (FR-015).
3. Keep the header cart badge in sync (FR-009).
4. Handle optimistic updates with rollback (FR-013).

A React context is the simplest approach that satisfies all requirements. The context holds a `Map<productId, quantity>` derived from the cart response, plus the total price for the header badge. No external state library is needed — this is scoped to the PLP and doesn't need to persist across pages (the cart page has its own fetch).

**Alternatives considered**:
- Prop drilling from page to product cards — rejected because the header also needs cart data, and product cards are nested inside a grid inside sections. Context eliminates prop threading.
- Global state library (Zustand, Jotai) — rejected as over-engineering for a single-page feature; React context is sufficient.
- SWR/React Query for cart data — rejected because cart mutations need optimistic updates with per-product queuing, which is easier to control in a custom context than through a generic caching layer.

---

### R-005: Per-Product Mutation Queue

**Decision**: Implement a per-product sequential mutation queue within the cart context. Each product maintains its own queue of pending mutations. Mutations are processed sequentially per product but in parallel across products.

**Rationale**: The spec requires (FR-018) that rapid taps on +/- for the same product are processed in order using a per-product mutation queue. The queue works as follows:
1. Each tap pushes a mutation (add or remove) to the product's queue.
2. The UI updates optimistically immediately (showing the new quantity).
3. The queue processor sends the first pending mutation to the server.
4. When the server responds, the queue processor sends the next pending mutation (if any).
5. If a mutation fails, the queue is cleared and the UI rolls back to the last confirmed state.
6. Different products' queues run independently — adding product A doesn't block product B.

The queue is implemented as a `Map<productId, Promise>` where each product's current in-flight promise is tracked. New mutations for the same product chain onto the existing promise.

**Alternatives considered**:
- Debouncing taps (send only the final quantity after a delay) — rejected because the API uses `add_product(count=1)` / `remove_product(count=1)` rather than `set_quantity(qty=N)`, so each tap must be a separate call.
- Global sequential queue — rejected because it would serialize all mutations, making the UI feel sluggish when adjusting multiple products.

---

### R-006: Reusable Component Assessment

**Decision**: Extend `ProductCard` with a cart action overlay (add button or quantity stepper) rather than creating a separate card component. Create new components for the quantity stepper and bundle indicator.

**Rationale**: The `ProductCard` already displays product information with the correct layout. The cart action is a visual overlay on the bottom of the image area — it doesn't change the card's data shape, only adds an interactive control. Extending the existing component keeps a single source of truth for product display and avoids duplicating the image, name, price, and badge rendering logic.

New components needed:
- `QuantityStepper` — the minus/count/plus control with optional bundle dots.
- `BundleDots` — dot indicators showing progress toward a bundle threshold.
- `SavingsLabel` — "€X.XX bespaard" label shown when a bundle threshold is met.
- `CartToast` — global toast for error feedback on mutation failure.

**Alternatives considered**:
- Creating a separate `ProductCardWithCart` component — rejected because it would duplicate the entire product card layout (violates DRY, Constitution Principle I).
- Embedding stepper logic directly in `ProductCard` — rejected because it would make the card responsible for cart state management (violates SRP). The stepper is a separate component that receives quantity and callbacks via props.

---

### R-007: Header Cart Badge Reactivity

**Decision**: The `SharedHeader` component subscribes to the cart context for reactive total price updates. No separate fetch is needed when mutations occur on the PLP.

**Rationale**: `SharedHeader` already fetches cart data on mount (for the cart price badge). On the PLP, cart mutations update the cart context, which holds the latest `totalPrice` and `totalCount`. Since `SharedHeader` is rendered inside the PLP page component tree, it can consume the cart context directly. This provides instant badge updates without an extra network round-trip.

On non-PLP pages (cart page, PDP), `SharedHeader` continues to fetch cart data independently on mount.

**Alternatives considered**:
- Broadcasting cart updates via a custom event — rejected as over-engineering; React context propagation is simpler and more idiomatic.
- Refetching cart in header after each mutation — rejected because it adds unnecessary latency; the mutation response already contains the updated totals.
