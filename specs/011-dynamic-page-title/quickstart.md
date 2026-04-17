# Quickstart: Dynamic Page Titles

**Feature**: 011-dynamic-page-title
**Date**: 2026-04-13

## What This Feature Does

Adds dynamic browser tab titles to all pages in the Picnic Web application. Each page displays a descriptive title following the pattern `"[Page Context] - Picnic Web"` instead of the previous static `"Picnic Web — Product Search"` on every page.

## Files to Create

### `src/hooks/use-page-title.ts`

New custom hook. Single responsibility: set `document.title` reactively based on a page context string.

```ts
import { useEffect } from "react";
import { APP_NAME, TITLE_SEPARATOR, MAX_TITLE_CONTEXT_LENGTH } from "@/lib/constants";

/**
 * Sets the browser tab title. Pass a page-specific context string
 * to display "[context] - Picnic Web", or omit to reset to "Picnic Web".
 */
export function usePageTitle(pageContext?: string): void {
  useEffect(() => {
    if (pageContext) {
      const truncatedContext =
        pageContext.length > MAX_TITLE_CONTEXT_LENGTH
          ? `${pageContext.slice(0, MAX_TITLE_CONTEXT_LENGTH)}…`
          : pageContext;
      document.title = `${truncatedContext}${TITLE_SEPARATOR}${APP_NAME}`;
    } else {
      document.title = APP_NAME;
    }
  }, [pageContext]);
}
```

## Files to Modify

### `src/lib/constants.ts`

Add 3 constants:

```ts
/** Application name displayed in browser tab titles. */
export const APP_NAME = "Picnic Web";

/** Separator between page context and app name in titles. */
export const TITLE_SEPARATOR = " - ";

/** Maximum character length for page context before truncation. */
export const MAX_TITLE_CONTEXT_LENGTH = 60;
```

### `src/app/layout.tsx`

Change metadata title from `"Picnic Web — Product Search"` to `"Picnic Web"`.

### `src/app/page.tsx` (home/search)

In `SearchPage` component, add: `usePageTitle(urlQuery || undefined)`

### `src/app/login/page.tsx`

In `LoginForm` component, add: `usePageTitle("Inloggen")`

### `src/app/cart/page.tsx`

In `CartPage` component, add: `usePageTitle("Winkelwagen")`

### `src/app/product/[id]/page.tsx`

In `ProductPage` component, add:
```ts
const pageContext = pageState.status === "success" ? pageState.product.name : undefined;
usePageTitle(pageContext);
```

### `src/app/error.tsx`

In `Error` component, add: `usePageTitle()` (no argument — uses fallback)

## Verification

1. Run `npm run lint` — should pass with no errors
2. Run `npm run build` — should compile successfully
3. Manual check: visit each route and verify the browser tab title:
   - `/` → `Picnic Web`
   - `/?q=melk` → `melk - Picnic Web`
   - `/login` → `Inloggen - Picnic Web`
   - `/cart` → `Winkelwagen - Picnic Web`
   - `/product/{any-id}` → `{product name} - Picnic Web`
   - Trigger an error → `Picnic Web`
