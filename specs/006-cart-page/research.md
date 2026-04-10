# Research: Cart Page

**Feature**: 006-cart-page | **Date**: 2026-04-07

## Research Items

### R-001: "Niets vergeten?" Suggestion Data Source

**Decision**: Attempt to extract suggestions from the raw cart response's `basket_sections` field; fall back to hiding the section if empty or unparseable.

**Rationale**: The raw cart API response includes a `basket_sections` field (typically an array) that could contain grouped display data. There is no dedicated recommendations endpoint in the Picnic API. Since we're working with an `unknown` response and validating at runtime, the transformer must defensively inspect the runtime shape of `basket_sections`. If the array is empty or does not contain product-like objects, the "Niets vergeten?" section is hidden per FR-013. This approach avoids a speculative API call to an undocumented endpoint while still capturing the data if it arrives.

**Alternatives considered**:
- Calling an undocumented `/cart/recommendations` endpoint — rejected because no evidence it exists, and it would add a network call that may fail with 404.
- Hardcoding the section as always hidden — rejected because the spec explicitly wants it shown when data is available.
- Using a separate `sendRequest("GET", "/cart/delivery_slots")` or other cart endpoints — these return slot data, not product suggestions.

---

### R-002: `decorator_overrides` Handling

**Decision**: Merge `decorator_overrides` into each order line/article by matching the map key to the item's `id` field. Override decorators replace any same-type decorator on the item; decorators not present in the override are kept.

**Rationale**: The raw cart response contains a `decorator_overrides` field — a `{ [key: string]: Decorator[] }` map. The keys correspond to order line or article `id` values. The API uses this to inject cart-level state changes (e.g., `UNAVAILABLE` with replacement suggestions, `ARTICLE_DELIVERY_FAILURES`) without modifying the individual item. Since the response is `unknown`, the transformer must defensively check for the presence and shape of `decorator_overrides` before merging. The merge strategy replaces by decorator `type` discriminant: if an override contains a `QUANTITY` decorator, it replaces the item's own `QUANTITY` decorator; decorators with types not present in the override remain untouched.

**Alternatives considered**:
- Ignoring `decorator_overrides` entirely — rejected because it could mean missing unavailability information or updated decorators.
- Appending overrides without deduplication — rejected because it could result in duplicate decorators (e.g., two `QUANTITY` entries).

---

### R-003: Quantity Extraction from Decorators

**Decision**: Extract quantity from the `QUANTITY` decorator (`type: "QUANTITY"`, `quantity: number`) on the order line's `decorators` array.

**Rationale**: The order line objects in the raw response have no top-level `quantity` field. The quantity-in-cart is encoded as a decorator within the `decorators` array. This is consistent with the Picnic API's decorator pattern where display-relevant metadata is attached as typed decorators rather than flat fields. The transformer must find the first decorator with `type === "QUANTITY"` and read its `quantity` property. If no `QUANTITY` decorator is found, default to 1 (single item). Since the response is `unknown`, all field accesses use runtime checks.

**Alternatives considered**:
- Using order line `items.length` as quantity — incorrect; `items` contains article objects representing the product definition, not the cart quantity.
- Using article `max_count` — incorrect; this is the maximum orderable, not the current quantity.

---

### R-004: Minimum Order Value — Dual Source Strategy

**Decision**: Extract minimum order value from the selected delivery slot's `minimum_order_value` field within the raw response's `delivery_slots` array. Do not make a separate API call.

**Rationale**: The raw cart response includes `delivery_slots` (array) and `selected_slot` (with `slot_id`). By matching `selected_slot.slot_id` to a delivery slot in the array, the minimum order value can be read directly from the cart response — no extra API call needed. This is simpler, faster (one fewer network round-trip), and avoids error scenarios. If the field is absent on the matched slot (it is optional), the indicator is hidden per the clarification. Since all access is from an `unknown` response, each step uses defensive runtime validation.

**Alternatives considered**:
- Separate `sendRequest("GET", "/user-slot-minimum-order-value/minimum")` call — rejected because it requires a selected slot (500 on missing), needs special headers, and adds latency. The cart response already contains this data.
- Always making both calls in parallel — rejected because the separate call can fail independently and adds complexity for no additional value.

---

### R-005: Cart API Error Patterns

**Decision**: Use the existing `isApiAuthError` string-matching pattern for auth detection, but extract it to a shared utility in `src/lib/api-error.ts`.

**Rationale**: The `picnic-api` HTTP client throws plain `Error` objects with the HTTP status code and status text embedded in the error message string (e.g., `"401 Unauthorized"`, `"403 Forbidden"`). There is no structured error class or `.status` property. The existing codebase copy-pastes an `isApiAuthError` function across API route files that checks `error.message.toLowerCase()` for `"401"`, `"403"`, `"unauthorized"`, or `"forbidden"`. This pattern works but violates DRY (Constitution Principle I). The cart API route should use a shared version.

**Alternatives considered**:
- Wrapping `picnic-api` errors in a custom error class — over-engineering for this feature scope; the string matching works reliably.
- Keeping the copy-pasted function — violates Constitution Principle I (DRY).

---

### R-006: Deposit Total Calculation

**Decision**: Sum deposit totals from the raw response's `deposit_breakdown` by multiplying each entry's `value * count`.

**Rationale**: The deposit breakdown entries have `{ type: string, value: number, count: number }`. The total deposit is `sum(entry.value * entry.count)` across all breakdown entries. This should match the difference between `total_price` and `checkout_total_price` minus any fees, though we display `checkout_total_price` as the total (per clarification) and show the deposit breakdown separately for transparency. Since the response is `unknown`, each field is validated before arithmetic.

**Alternatives considered**:
- Calculating deposit from `checkout_total_price - total_price` — rejected because `fees` could also contribute to the difference, making this inaccurate.

---

### R-007: Reusable Component Assessment

**Decision**: Reuse `PriceDisplay`, `Badge`, `ProductSlider`, and `ProductSliderCard` directly. Create new cart-specific components for cart items, order summary, minimum order indicator, unavailable products, and checkout CTA. Extract a shared header component with cart icon and price badge.

**Rationale**: 
- `PriceDisplay` accepts `displayPrice: number` (cents) and `originalPrice: number | null` (cents). Cart line items have `display_price` and `price` — direct mapping.
- `Badge` accepts `{ text: string, variant: BadgeVariant }`. Cart decorators (`LABEL`, `FRESH_LABEL`, `BASE_PRICE`) can be mapped to badge variants.
- `ProductSlider` + `ProductSliderCard` accept `SliderProduct[]` with `{ id, name, imageId, displayPrice, unitQuantity, maxCount, deposit? }`. Replacement products can be mapped to `SliderProduct` since they have the same fields (`id`, `name`, `image_id` → `imageId`, `display_price` → `displayPrice`, `unit_quantity` → `unitQuantity`, `max_count` → `maxCount`).
- `ProductCard` accepts a `Product` type which is structurally different from cart order articles (different field names, different badge system). A dedicated `CartItem` component is cleaner and adheres to SRP.
- The shared header component replaces per-page inline headers on all authenticated pages (search, product detail, cart). It fetches cart data via `GET /api/cart` for the price badge.

**Alternatives considered**:
- Adapting `ProductCard` for cart items — rejected because `Product` and order line/article objects have meaningfully different structures (e.g., `imageId` vs `image_ids[]`, `badges` vs `decorators`, no `quantity` on `Product`). Forcing a mapping would create a leaky abstraction.

---

### R-008: sendRequest vs. getCart — API Access Pattern

**Decision**: Use `sendRequest("GET", "/cart", null, false)` via the same cast-based pattern as search and product-detail routes, instead of the typed `client.cart.getCart()` domain service method.

**Rationale**: The spec (clarification 2026-04-07) explicitly requires using `sendRequest` with the `/cart` endpoint. This aligns the cart route with the existing codebase pattern used by search (`/pages/search-page-results`) and product detail (`/pages/product-details-page-root`) routes. The key difference is that `includePicnicHeaders` is `false` for the cart endpoint since it returns structured JSON, not a Fusion page. The response is treated as `unknown` and validated/extracted at runtime in `parseCartResponse` — no picnic-api `Cart` type is imported for casting.

**Alternatives considered**:
- Using `client.cart.getCart()` — rejected per spec clarification; this was the original approach but was changed to maintain consistency with the codebase's `sendRequest` pattern.
- Importing the picnic-api `Cart` type for casting the `unknown` response — rejected per spec clarification; runtime validation is preferred.
