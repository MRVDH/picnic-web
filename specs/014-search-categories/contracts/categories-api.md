# API Contract: Categories

**Feature**: 014-search-categories | **Date**: 2026-04-15
**New endpoint**: `GET /api/categories`

## Change Summary

1. **New API route**: `/api/categories` with GET (fetch browsable categories from the empty search page).
2. **No existing endpoints modified**.

---

## Endpoint: GET /api/categories

Fetches the list of browsable product categories shown on the search landing page.

**Upstream**: Calls `client.app.getPage("empty-search-page-root")` → `GET /pages/empty-search-page-root` (with Picnic headers)

### Success Response (200)

**Content-Type**: `application/json`

```typescript
type CategoriesApiResponse = {
  categories: CategoryItem[];
};

type CategoryItem = {
  id: string;            // "21724" or "CustomCatGlutenvrijL1"
  name: string;          // "Fruit"
  imageId: string;       // "396767b8acb6f8f3..."
  deepLinkTarget: string; // "app.picnic://store/page;id=L1-category-page-root,category_id=21724"
};
```

**Example response**:

```json
{
  "categories": [
    {
      "id": "21724",
      "name": "Fruit",
      "imageId": "396767b8acb6f8f3aa60953c7f62b8d51a2c7c6391bf6580ac0b4240f4b9dc71",
      "deepLinkTarget": "app.picnic://store/page;id=L1-category-page-root,category_id=21724"
    },
    {
      "id": "21725",
      "name": "Aardappelen & groente",
      "imageId": "09434bf6eecd13f53dc8f20f0a601f57e752613de5793c556d40a38bb42034b5",
      "deepLinkTarget": "app.picnic://store/page;id=L1-category-page-root,category_id=21725"
    },
    {
      "id": "21727",
      "name": "Maaltijden & gemak",
      "imageId": "c3c9245f2faea8b7be63376980281372ec36cc93d2885ac885252150c509557c",
      "deepLinkTarget": "app.picnic://store/page;id=L1-category-page-root,category_id=21727"
    }
  ]
}
```

*Full response contains ~26 categories in the order returned by the API.*

### Error Responses

| Status | Body | When |
|--------|------|------|
| 401 | `{ "error": "Authentication required", "code": "TOKEN_EXPIRED" }` | Missing/expired auth token |
| 502 | `{ "error": "Kan categorieën niet laden. Probeer het later opnieuw." }` | Upstream API failure |

---

## Processing Pipeline

### GET /api/categories

```text
1. Read auth token from cookie
2. Build Picnic client
3. client.app.getPage("empty-search-page-root") → raw FusionPage
4. parseCategoryPage(rawPage) → CategoryItem[]
   a. Navigate to body.child (root BlockComponent)
   b. Find BlockComponent with id containing "category-tree-wrapper-list"
   c. Extract children where type === "PML" and id starts with "core-list-item-category-"
   d. For each PMLItem:
      - id: strip "core-list-item-category-" prefix
      - name: read pml.component.accessibilityLabel
      - imageId: find IMAGE source.id in PML tree
      - deepLinkTarget: read pml.component.onPress.target
   e. Filter out items with missing name or imageId
5. Return { categories: CategoryItem[] } as JSON
```

## Backward Compatibility

- **Additive only**: New endpoint, no existing endpoints modified.
- **No type changes**: `CartData`, `Product`, and other existing types are unchanged.
