# Data Model: Product Detail Page

**Feature**: 005-product-detail-page  
**Date**: 2026-03-30

## Entities

### ProductDetail

The comprehensive product information set displayed on the product detail page. Parsed from the `product-details-page-root` Fusion page.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Selling unit ID (e.g. `"s1001524"`) |
| `name` | `string` | Yes | Product name (e.g. `"Blond"`) |
| `brand` | `string` | Yes | Brand/producer name (e.g. `"Affligem"`). Empty string if unavailable. |
| `unitQuantity` | `string` | Yes | Unit quantity description (e.g. `"6 x 300 ml"`). Empty string if unavailable. |
| `unitPrice` | `string \| null` | No | Unit price description (e.g. `"€4.81/l"`). `null` if not available. |
| `displayPrice` | `number` | Yes | Selling price in euro cents (e.g. `865` for €8.65). |
| `maxCount` | `number` | Yes | Maximum items that can be added to cart. |
| `imageIds` | `string[]` | Yes | Gallery image IDs. May be empty (placeholder shown). |
| `description` | `string \| null` | No | Product description text (may contain markdown). |
| `highlights` | `string[]` | Yes | Short highlight phrases. May be empty. |
| `allergens` | `AllergenInfo` | Yes | Categorized allergen data. |
| `infoSections` | `ProductInfoSection[]` | Yes | Collapsible accordion sections. May be empty. |
| `promotion` | `ProductPromotion \| null` | No | Active promotion, if any. |
| `bundles` | `BundleOption[]` | Yes | Bundle pricing options. May be empty. |
| `similarProducts` | `SliderProduct[]` | Yes | Alternative products. May be empty. |

### AllergenInfo

Categorized allergen data, distinguishing confirmed from "may contain" allergens.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `confirmed` | `string[]` | Yes | Confirmed allergens (e.g. `["Gluten", "Gerst"]`). |
| `mayContain` | `string[]` | Yes | "Bevat mogelijk" allergens. |

### ProductInfoSection

A collapsible content section from the product details accordion.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | Yes | Section header (e.g. `"Ingrediënten"`, `"Voedingswaarde"`). |
| `content` | `string` | Yes | Section body as raw markdown text. |

### ProductPromotion

Active promotion/discount information.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Promotion identifier. |
| `label` | `string` | Yes | Human-readable promotion label (e.g. `"1+1 gratis"`). |

### BundleOption

A quantity-based pricing option (buy-more-pay-less).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Selling unit ID for this bundle option. |
| `quantity` | `number` | Yes | Number of items in this bundle (1, 2, 3, ...). |
| `pricePerUnit` | `number` | Yes | Price per unit in euro cents. |
| `imageId` | `string` | Yes | Product image ID for this bundle option. |
| `maxCount` | `number` | Yes | Maximum items for this bundle. |

### SliderProduct

A condensed product reference used in the "similar products" slider. Also reusable for any future "combine with" slider.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Selling unit ID. |
| `name` | `string` | Yes | Product name. |
| `imageId` | `string` | Yes | Product image ID. |
| `displayPrice` | `number` | Yes | Price in euro cents. |
| `unitQuantity` | `string` | Yes | Unit quantity description. |
| `maxCount` | `number` | Yes | Maximum cart quantity. |
| `deposit` | `number \| undefined` | No | Deposit amount in cents, if applicable. |

## Relationships

```
ProductDetail
├── has one AllergenInfo
├── has many ProductInfoSection (0..n)
├── has one? ProductPromotion (optional)
├── has many BundleOption (0..n)
└── has many SliderProduct as similarProducts (0..n)
```

## Validation Rules

- `id` must be a non-empty string starting with `"s"` (selling unit ID format).
- `displayPrice` must be a non-negative integer (cents).
- `imageIds` array may be empty; the UI handles this with a placeholder image.
- `infoSections` titles must be non-empty strings.
- `bundles` items must have `quantity >= 1` and `pricePerUnit >= 0`.
- `allergens.confirmed` and `allergens.mayContain` may both be empty (allergen section hidden).

## State Transitions

No state transitions apply. `ProductDetail` is a read-only snapshot fetched from the API on each page load. There is no client-side mutation of product data.

## API Response Type

The API route (`GET /api/product/[id]`) returns one of:

| Response | Shape |
|----------|-------|
| Success | `ProductDetail` (the full object above) |
| Auth error | `{ error: string; code: "TOKEN_EXPIRED" }` with HTTP 401 |
| Not found | `{ error: string }` with HTTP 404 |
| API failure | `{ error: string }` with HTTP 502 |
