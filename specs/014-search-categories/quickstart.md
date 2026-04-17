# Quickstart: Search Page Category Browsing

**Feature**: 014-search-categories
**Date**: 2026-04-15

## What This Feature Does

Replaces the empty "Welkom bij Picnic Web" landing page with a browsable category grid. When users visit the home page without a search query, they see all 26 grocery categories (Fruit, Aardappelen & groente, Maaltijden & gemak, etc.) with images and names, matching the native Picnic app's search landing screen.

## Prerequisites

The debug API route at `src/app/api/debug/route.ts` was used during research to inspect the raw `empty-search-page-root` response. **Delete this file** before or after implementation — it should not ship to production.

## Files to Create (in implementation order)

### 1. `src/lib/category-types.ts` — New types

```ts
/** A single browsable product category. */
export type CategoryItem = {
  id: string;
  name: string;
  imageId: string;
  deepLinkTarget: string;
};

/** Response shape for GET /api/categories. */
export type CategoriesApiResponse = {
  categories: CategoryItem[];
};
```

### 2. `src/lib/parse-categories.ts` — Category extraction from FusionPage

Uses existing pml-helpers for tree traversal. Defensive extraction with fallbacks.

```ts
import { findNodeByIdSubstring, collectPropertyValues } from "@/lib/pml-helpers";
import type { CategoryItem } from "@/lib/category-types";

const CATEGORY_LIST_BLOCK_ID = "category-tree-wrapper-list";
const CATEGORY_ITEM_PREFIX = "core-list-item-category-";

/**
 * Parse the raw empty-search-page-root FusionPage into CategoryItem[].
 *
 * Navigates the PML tree to the known category list block, then extracts
 * each PML item's name, image ID, and deep link target.
 */
export function parseCategoryPage(rawPage: unknown): CategoryItem[] {
  // 1. Find the category list block
  const listBlock = findNodeByIdSubstring(rawPage, CATEGORY_LIST_BLOCK_ID);
  if (!listBlock) return [];

  const children = listBlock.children as Record<string, unknown>[] | undefined;
  if (!Array.isArray(children)) return [];

  // 2. Extract each PML item
  const categories: CategoryItem[] = [];
  for (const child of children) {
    if (child.type !== "PML") continue;
    const itemId = child.id as string | undefined;
    if (!itemId?.startsWith(CATEGORY_ITEM_PREFIX)) continue;

    const category = extractCategoryFromPmlItem(child, itemId);
    if (category) categories.push(category);
  }

  return categories;
}

function extractCategoryFromPmlItem(
  item: Record<string, unknown>,
  itemId: string,
): CategoryItem | null {
  const id = itemId.slice(CATEGORY_ITEM_PREFIX.length);
  if (!id) return null;

  // Navigate into pml.component (the TOUCHABLE)
  const pml = item.pml as Record<string, unknown> | undefined;
  const component = pml?.component as Record<string, unknown> | undefined;
  if (!component) return null;

  // Name: prefer accessibilityLabel (clean string, no markdown)
  const name = (component.accessibilityLabel as string) ?? "";
  if (!name) return null;

  // Deep link target: onPress.target
  const onPress = component.onPress as Record<string, unknown> | undefined;
  const deepLinkTarget = (onPress?.target as string) ?? "";

  // Image ID: find first IMAGE source.id in the component tree
  const sources = collectPropertyValues(component, "source");
  let imageId = "";
  for (const source of sources) {
    if (typeof source === "object" && source !== null) {
      const sid = (source as Record<string, unknown>).id;
      if (typeof sid === "string") {
        imageId = sid;
        break;
      }
    }
  }
  if (!imageId) return null;

  return { id, name, imageId, deepLinkTarget };
}
```

### 3. `src/app/api/categories/route.ts` — API route

Follow the same pattern as `src/app/api/search/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { readAuthToken } from "@/lib/auth";
import { buildPicnicClient } from "@/lib/picnic-client";
import { parseCategoryPage } from "@/lib/parse-categories";
import { isApiAuthError } from "@/lib/api-error";
import type { CategoriesApiResponse } from "@/lib/category-types";
import type { ApiErrorResponse } from "@/lib/types";

export async function GET(
  request: NextRequest,
): Promise<NextResponse<CategoriesApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);
  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "TOKEN_EXPIRED" as const },
      { status: 401 },
    );
  }

  try {
    const client = buildPicnicClient(token);
    const rawPage = await client.app.getPage("empty-search-page-root");
    const categories = parseCategoryPage(rawPage);
    return NextResponse.json({ categories });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 },
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/categories] Failed:", message);
    return NextResponse.json(
      { error: "Kan categorieën niet laden. Probeer het later opnieuw." },
      { status: 502 },
    );
  }
}
```

### 4. `src/components/category-grid.tsx` — Grid component

Renders a responsive grid of category tiles. Each tile shows an image and name.

```tsx
"use client";

import Image from "next/image";
import { buildImageUrl } from "@/lib/image-url";
import type { CategoryItem } from "@/lib/category-types";

type CategoryGridProps = {
  categories: CategoryItem[];
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Alle categorieën
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categories.map((category) => (
          <CategoryTile key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}

function CategoryTile({ category }: { category: CategoryItem }) {
  const handleClick = () => {
    // US2: Navigate to category product listing
    // For now, no-op — navigation will be added in a follow-up feature
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center rounded-xl bg-white p-3 shadow-sm
                 transition-shadow hover:shadow-md active:bg-gray-50"
    >
      <div className="relative mb-2 h-20 w-20 overflow-hidden rounded-lg">
        <Image
          src={buildImageUrl(category.imageId)}
          alt={category.name}
          fill
          className="object-contain"
          sizes="80px"
        />
      </div>
      <span className="line-clamp-2 text-center text-sm font-medium text-foreground">
        {category.name}
      </span>
    </button>
  );
}
```

## Files to Modify

### `src/app/page.tsx`

Replace `LandingView` with a `CategoryBrowseView` that fetches and displays categories.

Key changes:

1. **Add a categories state** alongside the existing search state:
```ts
type CategoriesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; categories: CategoryItem[] }
  | { status: "error"; message: string };
```

2. **Fetch categories on mount** (when `searchState.status === "idle"`):
```ts
useEffect(() => {
  if (searchState.status !== "idle") return;
  setCategoriesState({ status: "loading" });

  fetch("/api/categories")
    .then((res) => res.json())
    .then((data) => {
      if ("error" in data) {
        if (data.code === "TOKEN_EXPIRED") {
          window.location.href = TOKEN_EXPIRED_REDIRECT;
          return;
        }
        setCategoriesState({ status: "error", message: data.error });
        return;
      }
      setCategoriesState({ status: "success", categories: data.categories });
    })
    .catch(() => {
      setCategoriesState({
        status: "error",
        message: "Kan categorieën niet laden.",
      });
    });
}, [searchState.status]);
```

3. **Replace `<LandingView />` in JSX**:
```tsx
{searchState.status === "idle" && (
  <>
    {categoriesState.status === "loading" && <LoadingSpinner />}
    {categoriesState.status === "error" && (
      <ErrorView message={categoriesState.message} />
    )}
    {categoriesState.status === "success" && (
      <CategoryGrid categories={categoriesState.categories} />
    )}
  </>
)}
```

4. **Remove `LandingView` and `PicnicLogo`** functions (no longer needed).

## Files to Delete

### `src/app/api/debug/route.ts`

The temporary debug endpoint created during research. Must be removed before merging.

## Verification

1. Run `npm run lint` — should pass with no errors
2. Run `npm run build` — should compile successfully
3. Manual checks:
   - Load home page while logged in → category grid appears with images and names
   - Verify all 26 categories are displayed in order
   - Verify category images load correctly from the CDN
   - Verify responsive layout: 2 cols on mobile, 3 on tablet, 4-5 on desktop
   - Type a search query → categories disappear, search results appear
   - Clear the search query → categories reappear
   - Log out → redirected to login page (existing auth gate handles this)
