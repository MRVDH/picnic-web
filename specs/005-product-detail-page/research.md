# Research: Product Detail Page

**Feature**: 005-product-detail-page  
**Date**: 2026-03-30

## R-001: Fusion Page Structure for Product Details

**Decision**: The `product-details-page-root` Fusion page uses well-defined node IDs to organize product information into a nested tree of components. Our custom parser will navigate this tree using the same node IDs that the picnic-api `extractProductDetails` helper uses, but implemented with the local `pml-helpers.ts` traversal utilities (no `jsonpath-plus` dependency).

**Rationale**: The existing `parse-fusion-search.ts` parser already demonstrates the pattern of using local helper functions (`collectMarkdowns`, `stripColorTags`, `findNodeById`) instead of the picnic-api's JSONPath-based approach. Replicating this pattern keeps the codebase consistent and avoids adding a new dependency.

**Key Node IDs to Parse**:

| Node ID | Data Extracted |
|---------|---------------|
| `product-details-page-root-main-container` | Product name, brand, unit quantity, unit price (markdown indices 0-3) |
| `product-page-image-gallery-main-image-container` | Gallery image IDs (via `source.id` in nested image components) |
| `description` | Product description text (joined markdowns) |
| `product-page-highlights` | Highlight bullet points (stripped markdown formatting) |
| `product-page-allergies` | Allergen names as badges; filter out "Bevat" / "Bevat mogelijk" heading text |
| `accordion-list` | Collapsible info sections: header/body pairs (bereiding, ingrediënten, voedingswaarde, extra info) |
| `product-page-bundles-*` (prefix match) | Bundle options with selling unit data and per-unit pricing |
| `alternatives-container` | Similar product selling units |

**Price extraction** requires a multi-step fallback: first from `sellingUnit` matching the product ID, then from a bundle node matching the ID, then from price components in the main container.

**Promotion data** is extracted via deep property search for `promotion_id` and `promotion_label` fields anywhere in the page tree.

**Alternatives considered**:
- Using `jsonpath-plus` for tree queries (rejected: adds dependency, inconsistent with existing codebase patterns)
- Using the picnic-api `extractProductDetails` directly (rejected: spec explicitly prohibits using `getProductDetails` and `getProductDetailsPage`)

---

## R-002: Recipe and "Combine With" Data Availability

**Decision**: The `product-details-page-root` Fusion page does **NOT** contain recipe associations or "combine with" / complementary product data. Only `alternatives-container` (similar products) is present. The spec assumptions about recipe and "combine with" data being available were incorrect.

**Rationale**: Exhaustive search of the picnic-api package reveals:
- No node IDs containing "recipe", "combine", "complementary", or "recommend" exist in the product detail page parser
- The `extractProductDetails` helper only extracts `similarProducts` from `alternatives-container` — no other related-product sections
- Recipes are a separate domain (`RecipeService`) with their own page endpoints (`recipe-details-page-root`) — they are not embedded in product detail pages
- The only related-product section in the page tree is `alternatives-container`

**Impact on spec**:
- FR-013 ("Combineer met" slider): Will use any second related-products container if present in the Fusion page, but may not be available for most products. The implementation should check for a "combine with" or similar secondary container; if absent, this section is simply omitted per FR-016.
- FR-014 (Recipe associations): No recipe data is available in the product detail Fusion page. This requirement cannot be fulfilled from this data source. The section will be omitted per FR-016 unless a separate API call to the recipe domain is added in a future feature.

**Alternatives considered**:
- Making a separate API call to a recipe endpoint per product (rejected: no known endpoint maps products to recipes; would add latency and complexity for uncertain data availability)
- Parsing the full Fusion page tree more aggressively for undocumented nodes (rejected: the picnic-api helper is comprehensive and any undocumented nodes would be unreliable)

---

## R-003: Voedingswaarde Data Format

**Decision**: The voedingswaarde (nutritional values) section content is delivered as markdown text within an accordion body section. The markdown typically contains a pipe-delimited table structure or line-separated key-value pairs that can be parsed into an HTML table.

**Rationale**: The accordion-list node contains `items` where each item has a `header` (section title like "Voedingswaarde") and `body` (content). The body markdowns are raw text that may contain markdown table formatting (`| Column | Column |`), or simple `Label: Value` pairs separated by newlines. The existing `extractProductDetails` helper joins body markdowns with newlines and stores them as raw strings — it does not parse table structure.

**Implementation approach**: The parser will extract the raw markdown content from the accordion body. The UI component (`nutrition-table.tsx`) will attempt to parse markdown table syntax into structured rows; falling back to rendering the raw text if the format is unrecognized. This is resilient to format variations across products.

**Alternatives considered**:
- Pre-parsing all accordion content into structured data at the parser level (rejected: not all sections are tabular; mixing structured and unstructured parsing adds complexity)
- Rendering raw markdown directly without table parsing (rejected: spec explicitly requires "structured table format" for voedingswaarde)

---

## R-004: Parser Architecture — Reuse of Existing Utilities

**Decision**: The new `parse-fusion-product.ts` parser will reuse existing utilities from `pml-helpers.ts` and add a new generic `findNodeById` function to `pml-helpers.ts` (promoting the local function from `parse-fusion-search.ts`).

**Rationale**: `parse-fusion-search.ts` already defines a local `findNodeById(obj, idSubstring)` that does recursive substring matching. The product detail parser needs exact-match ID lookup (like the picnic-api `findById`). Both variants are useful and should be centralized in `pml-helpers.ts`.

**Functions to reuse from `pml-helpers.ts`**:
- `collectMarkdowns(node)` — equivalent to picnic-api's `extractMarkdowns`
- `stripColorTags(md)` — equivalent to picnic-api's `stripColorMarkup`
- `cleanMarkdown(md)` — equivalent to picnic-api's `stripMarkdownFormatting` + `stripColorMarkup`

**New functions to add to `pml-helpers.ts`**:
- `findNodeById(obj, id)` — exact match by `id` property, traverses `child`, `children`, and all object values recursively
- `findNodeByIdPrefix(obj, prefix)` — prefix match (for `product-page-bundles-*`)
- `collectPropertyValues(node, key)` — recursive deep property search (replaces JSONPath `$..key` pattern), returns all values for a given property name

**Alternatives considered**:
- Keeping parser-specific helpers private in `parse-fusion-product.ts` (rejected: violates DRY since `parse-fusion-search.ts` needs similar functions)
- Adding `jsonpath-plus` as a dependency (rejected: inconsistent with existing approach, adds bundle size)

---

## R-005: API Route and Rendering Strategy

**Decision**: Use a server-side API route (`/api/product/[id]`) that fetches and parses the Fusion page, with a client-side product detail page that calls this route. This mirrors the existing `/api/search` + client-side search page pattern.

**Rationale**: The existing architecture consistently uses:
1. API routes in `src/app/api/` that handle auth, call picnic-api via `sendRequest`, parse responses, and return typed JSON
2. Client-side pages (`"use client"`) that fetch from these API routes and manage UI state

Following this pattern ensures consistency. The API route handles:
- Auth token validation
- Raw `sendRequest` call to `product-details-page-root`
- Fusion page parsing via `parse-fusion-product.ts`
- Error handling (401/403 → `TOKEN_EXPIRED`, 404 → not found, 502 → API error)

**Alternatives considered**:
- Server Component with direct data fetching (rejected: would require different auth handling, breaks consistency with existing client-side page pattern)
- Direct client-side API call to Picnic API (rejected: would expose auth token to browser, bypasses server-side parsing)

---

## R-006: Allergen Badge Categorization

**Decision**: The allergens section in the Fusion page contains a mixed list of markdown texts. The heading texts "Bevat" and "Bevat mogelijk" serve as category separators. All allergen names that appear after "Bevat" (until "Bevat mogelijk" or end) are confirmed allergens. All that appear after "Bevat mogelijk" are may-contain allergens.

**Rationale**: The picnic-api helper filters out texts matching `/^bevat(\s+mogelijk)?$/i` and treats the remaining texts as a flat list. However, the spec requires distinguishing confirmed from "bevat mogelijk" allergens with visual badge differentiation. The parser needs to preserve this categorization by tracking which heading precedes each allergen text.

**Implementation approach**: Walk the allergen markdown texts in order. Track current category (default: "confirmed"). When encountering "Bevat", set category to "confirmed". When encountering "Bevat mogelijk", set category to "may_contain". All other texts are allergen names assigned to the current category.

**Alternatives considered**:
- Using the picnic-api's flat allergen list and losing categorization (rejected: spec explicitly requires visual distinction between confirmed and may-contain)
- Hardcoding known allergen names to categories (rejected: brittle, won't work for all products)

---

## R-007: Product Card Linking Strategy

**Decision**: Wrap the existing `ProductCard` component content in a Next.js `Link` component pointing to `/product/{productId}`. The `ProductCard` itself will accept an optional `href` prop; when provided, the card content is wrapped in a link.

**Rationale**: The existing `ProductCard` renders a `<div>` with product information. To make it clickable:
- Adding an `href` prop keeps the component backward-compatible (cards without `href` remain non-interactive)
- Using Next.js `Link` enables client-side navigation without full page reload
- The link wraps the entire card, making the full card area clickable
- Hover styles (cursor pointer, subtle highlight) are applied when `href` is present

**Alternatives considered**:
- Creating a separate `ProductCardLink` wrapper component (rejected: unnecessary indirection, violates DRY)
- Using `onClick` + `router.push` instead of `Link` (rejected: loses built-in Next.js prefetching, accessibility, and right-click "open in new tab")
