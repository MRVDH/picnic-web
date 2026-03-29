# Data Model: Product Search

**Feature**: `004-product-search`
**Date**: 2026-03-27

## Entities

### Product (extracted from API response)

Represents a sellable item in the Picnic catalog as displayed in search
results. This is our application-level model, extracted from the upstream
API's `SellingUnit` + `Decorator[]` data.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `id` | string | `sellingUnit.id` | Unique product identifier (e.g., `"s1001524"`) |
| `name` | string | `sellingUnit.name` | Product display name |
| `imageId` | string | `sellingUnit.image_id` | Image identifier for CDN URL construction |
| `currentPrice` | number | `sellingUnit.display_price` | Current price in cents (e.g., `865` = €8.65) |
| `originalPrice` | number or null | `PRICE` decorator or PML `isCrossed` | Original price in cents if discounted, null otherwise |
| `unitQuantity` | string | `sellingUnit.unit_quantity` | Quantity/unit text (e.g., `"6 x 300 ml"`) |
| `basePrice` | string or null | `BASE_PRICE` decorator | Price per unit text (e.g., `"€4.81/l"`) |
| `brand` | string or null | PML tree extraction (best-effort) | Brand/company name, null if not extractable |
| `labels` | Label[] | Extracted from `decorators[]` | All badges and labels |
| `isAvailable` | boolean | Absence of `UNAVAILABLE` decorator | Whether product can be ordered |
| `unavailableReason` | string or null | `UNAVAILABLE` decorator | Reason text if unavailable |
| `maxCount` | number | `sellingUnit.max_count` | Maximum order quantity |

### Label

Represents a visual badge/tag displayed on a product card.

| Field | Type | Description |
|-------|------|-------------|
| `type` | LabelType enum | Category of the label |
| `text` | string | Display text for the label |

**LabelType values**:
- `promotion` — Promotional labels (e.g., "3 voor €5", "1+1 gratis", "10% korting")
- `size` — Size indicator (e.g., "Klein", "Groot")
- `freshness` — Freshness guarantee (e.g., "Vers gegarandeerd 3 dagen")
- `availability` — Availability notices (e.g., "Snel weer terug", "Nu buiten het seizoen")
- `characteristic` — Product characteristics (e.g., "Diepvries")
- `validity` — Promotion expiry (e.g., "Geldig t/m 30 maart")

### SearchSuggestion

Represents an autocomplete suggestion returned by the API.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `id` | string | `SearchSuggestion.id` | Unique suggestion identifier |
| `text` | string | `SearchSuggestion.suggestion` | The suggestion display text |

### SearchResult

Container for a complete search response.

| Field | Type | Description |
|-------|------|-------------|
| `products` | Product[] | List of matching products |
| `query` | string | The search query that produced these results |

## Relationships

```
SearchResult 1──* Product
Product 1──* Label
```

- A `SearchResult` contains zero or more `Product` entities.
- A `Product` contains zero or more `Label` entities.
- `SearchSuggestion` is independent (returned by a different endpoint).

## Data Transformation Pipeline

```
Upstream API Response (FusionPage)
  ↓ extract SellingUnit[] via JSONPath
  ↓ extract decorators per SellingUnit
  ↓ parse PML tree for brand, crossed-out prices (best-effort)
  ↓ map to Product[] with Label[]
  ↓
Application Model (Product[])
  ↓
UI Components (ProductCard, Badge, Price)
```

## Validation Rules

- `currentPrice` MUST be a non-negative integer (cents).
- `originalPrice`, when present, MUST be greater than `currentPrice`
  (otherwise it is not a discount and should be null).
- `name` MUST be a non-empty string.
- `imageId` MUST be a non-empty string (use placeholder image if missing
  from API response).
- `labels` MAY be an empty array (product has no badges).

## State Transitions

No state mutations in this feature. All data is read-only from the API.
Future features (cart, favorites) would introduce state transitions on
Product entities.
