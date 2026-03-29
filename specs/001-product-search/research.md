# Research: Product Search

**Feature**: `004-product-search`
**Date**: 2026-03-27

## R1: Framework and Version Selection

### Decision: Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4

**Rationale**: The user explicitly requested "latest versions of Next and React"
with "all the latest patterns." As of March 2026:

- **Next.js 16.2.x** is the latest stable release. App Router is the default
  and recommended approach. Turbopack is the default bundler.
- **React 19.2** is the latest stable release. Introduces `<Activity />`,
  `useEffectEvent`, and improved Server Components support.
- **TypeScript 5** is required (minimum 5.1 for Next.js 16).
- **Tailwind CSS 4.2** is the latest stable. Setup changed significantly from
  v3: no `tailwind.config.js`, configuration via CSS `@theme` directive and
  CSS custom properties, `@import "tailwindcss"` replaces old directives,
  plugin is `@tailwindcss/postcss`.

**Alternatives considered**:
- Next.js 15 (older, missing Cache Components and PPR improvements)
- Tailwind CSS 3 (older config model, not the latest)
- CSS Modules (viable but Tailwind is more productive for rapid UI development)

## R2: Data Fetching Architecture

### Decision: Server-side API proxy via Route Handlers + client-side fetch

**Rationale**: The picnic-api package requires an auth token
(`PICNIC_AUTH_TOKEN` in `.env`). This token MUST NOT be exposed to the
browser. The architecture uses:

1. **Next.js Route Handlers** (`app/api/`) on the server side that
   instantiate `PicnicClient` with the auth token.
2. **Client Components** fetch from these proxy routes via `fetch()`.
3. Search results require client-side interactivity (typing, debounce,
   suggestion dropdown), making Server Components unsuitable for the
   search interaction itself.

**Pattern**: The search page uses a Client Component for the interactive
search bar and results display. Data flows through server-side Route
Handlers that call `picnic-api` methods.

**Alternatives considered**:
- Server Components with `async/await` (rejected: search is interactive,
  requires client-side state for typing/debounce/suggestions)
- Server Actions (rejected: better suited for mutations, not GET queries)
- Direct API calls from browser (rejected: exposes auth token)

## R3: Data Extraction Strategy

### Decision: Custom extraction from raw Fusion page response

**Rationale**: The user specified "extract the relevant data points from the
returned search result fusion/pml pages" and "do not base [the design system]
on the returned Fusion/PML but create your own based on the extracted data
points."

The `picnic-api` `catalog.search()` method returns `SellingUnit[]` by
extracting objects via JSONPath from the Fusion page response. This provides:

| Field | Source | Available from `search()` |
|-------|--------|---------------------------|
| Name | `sellingUnit.name` | Yes |
| Image | `sellingUnit.image_id` | Yes |
| Current price | `sellingUnit.display_price` (cents) | Yes |
| Unit/quantity | `sellingUnit.unit_quantity` | Yes |
| Labels/badges | `sellingUnit.decorators[]` | Yes |
| Original price | `decorators` with `type: "PRICE"` | Yes |
| Base price text | `decorators` with `type: "BASE_PRICE"` | Yes |
| Size label | `decorators` with `type: "PRODUCT_SIZE"` | Yes |
| Freshness | `decorators` with `type: "FRESH_LABEL"` | Yes |
| Availability | `decorators` with `type: "UNAVAILABLE"` | Yes |
| Brand/company | NOT in `SellingUnit` | No |

**Brand/company gap**: The `SellingUnit` type does not contain a brand field.
Brand is only available from the product details page PML tree. However, the
raw Fusion page for search results may contain brand text in `RICH_TEXT`
nodes surrounding each `SELLING_UNIT_TILE`. Two options:

1. **Option A**: Parse the raw Fusion page response to extract brand from
   PML nodes adjacent to each `SELLING_UNIT_TILE`. Requires writing a
   custom parser, fragile if Picnic changes the page layout.
2. **Option B**: Call `catalog.getProductDetails(id)` per product to get
   the brand. Adds N API calls per search (slow, rate-limit risk).
3. **Option C**: Accept that brand is not available in search results and
   display it only when the user clicks through to a product detail page
   (out of scope for v1).

**Chosen approach**: Option A with Option C as fallback. We will access the
raw Fusion page endpoint directly (same as `search()` does internally) and
write a custom extractor that pulls both `SellingUnit` data AND surrounding
PML context (brand text, crossed-out prices via `isCrossed` flag). If the PML
tree does not reliably contain brand info, we gracefully omit it (matching
Option C behavior). This avoids N+1 API calls while extracting maximum data.

**Alternatives considered**:
- Using `catalog.search()` as-is (rejected: misses brand and crossed-out
  price context from PML tree)
- Calling `getProductDetails()` per result (rejected: N+1 API calls,
  performance concern)

## R4: Design System Approach

### Decision: Custom component library, NOT based on Fusion/PML rendering

**Rationale**: The user explicitly stated "create your own [design system]
based on the extracted data points." We build our own React components that
consume structured data (extracted from the API), not PML node trees.

Components needed:
- `SearchBar` — input with debounce and suggestion dropdown
- `ProductCard` — displays product image, name, brand, price, unit, labels
- `ProductGrid` — layout container for product cards
- `Badge` — renders label/badge text (promotional, size, availability)
- `Price` — formatted price display with optional strikethrough
- `SearchSuggestions` — dropdown list of autocomplete suggestions

Styling uses Tailwind CSS 4 with custom `@theme` tokens for Picnic brand
colors and spacing.

**Alternatives considered**:
- Re-using the PML rendering engine from the previous v2 attempt (rejected:
  user explicitly said not to)
- Using a UI library like shadcn/ui (viable but unnecessary for the small
  component surface area; adds dependency complexity)

## R5: Search Suggestions Implementation

### Decision: Debounced client-side fetch to `/api/suggestions` proxy

**Rationale**: The `picnic-api` package provides
`catalog.getSuggestions(query)` which returns `SearchSuggestion[]` with
`{ type, id, suggestion }` objects. The implementation:

1. User types in search bar
2. After 2+ characters AND a 300ms debounce pause, fetch suggestions
3. Display suggestions in a dropdown
4. Clicking a suggestion populates the search bar and triggers full search
5. Pressing Enter triggers full search with current input

**Alternatives considered**:
- Server Component with streaming (rejected: requires client-side
  interactivity for typing and dropdown)
- SWR/React Query (viable but adds dependency; native `useState` +
  `useEffect` with `AbortController` suffices for this scope)

## R6: Image Handling

### Decision: Use Picnic CDN URLs directly via image ID mapping

**Rationale**: Product images are served from Picnic's CDN at
`https://storefront-prod.{countryCode}.picnicinternational.com/static/images/{imageId}/{size}.png`.
We construct URLs directly rather than proxying image bytes.

Available sizes: `tiny`, `small`, `medium`, `large`, `extra-large`.
Default to `medium` for product cards.

**Alternatives considered**:
- Proxying images through our server (rejected: unnecessary bandwidth,
  latency; CDN is publicly accessible)
- Using `getImageAsDataUri()` (rejected: base64 encoding inflates payload
  size by ~33%)

## R7: Price Display Logic

### Decision: Extract price data from SellingUnit + decorators

**Price display rules**:
1. `sellingUnit.display_price` is the current (possibly discounted) price
   in cents.
2. If a `PRICE` decorator exists with a different `display_price`, one of
   them is the original price. The decorator price typically represents
   the original price when it's higher than the selling unit price.
3. For crossed-out display: if the raw Fusion PML contains a
   `FusionPriceComponent` with `isCrossed: true`, that price should be
   displayed with strikethrough.
4. Format: prices in cents divided by 100, displayed as `€X,XX` (Dutch
   locale uses comma as decimal separator).

## R8: Decorator-to-Label Mapping

### Decision: Map relevant decorator types to visual badges

| Decorator Type | Badge Display |
|----------------|---------------|
| `LABEL` | Show `text` as promotional badge |
| `PRODUCT_SIZE` | Show `text` as size badge |
| `FRESH_LABEL` | Show freshness badge with `period` |
| `BASE_PRICE` | Show `base_price_text` as unit price |
| `UNAVAILABLE` | Show availability notice with `reason` |
| `PRODUCT_CHARACTERISTICS` | Show relevant characteristics |
| `QUANTITY` | Show quantity indicator |
| `VALIDITY_LABEL` | Show promotion validity date |

Decorators not relevant for search card display (ignored):
`BACKGROUND_IMAGE`, `BANNERS`, `TITLE_STYLE`, `MORE_BUTTON`, `IMMUTABLE`,
`ARTICLE_DELIVERY_FAILURES`, `BUNDLES_BUTTON`, `ORDERED_QUANTITY`,
`UNIT_QUANTITY` (already shown via `unit_quantity` field).
