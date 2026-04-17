# Data Model: Dynamic Page Titles

**Feature**: 011-dynamic-page-title
**Date**: 2026-04-13

## Overview

This feature introduces no persistent entities or data storage. The "data model" consists of constants, a hook interface, and the mapping of existing data to page titles.

## Constants

Defined in `src/lib/constants.ts`:

| Constant | Type | Value | Purpose |
|----------|------|-------|---------|
| `APP_NAME` | `string` | `"Picnic Web"` | Base application name used in all titles |
| `TITLE_SEPARATOR` | `string` | `" - "` | Separator between page context and app name |
| `MAX_TITLE_CONTEXT_LENGTH` | `number` | `60` | Maximum characters for page context before truncation |

## Hook Interface

`usePageTitle(pageContext?: string): void`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageContext` | `string \| undefined` | No | Page-specific prefix (e.g., product name, "Inloggen", search query) |

**Behavior**:
- When `pageContext` is a non-empty string: sets `document.title` to `"${truncate(pageContext)} - Picnic Web"`
- When `pageContext` is `undefined`, `null`, or empty string: sets `document.title` to `"Picnic Web"`
- Truncation: if `pageContext.length > 60`, truncate to 60 characters and append `"…"` (U+2026)
- Reactive: re-runs on `pageContext` change via `useEffect` dependency

## Title Mapping

Maps existing data sources in each page to `usePageTitle` arguments:

| Route | Page Context Source | Example Title |
|-------|-------------------|---------------|
| `/` (no search) | `undefined` | `Picnic Web` |
| `/?q=melk` | `urlQuery` from `useSearchParams().get("q")` | `melk - Picnic Web` |
| `/login` | Static `"Inloggen"` | `Inloggen - Picnic Web` |
| `/cart` | Static `"Winkelwagen"` | `Winkelwagen - Picnic Web` |
| `/product/[id]` | `product.name` from `ProductDetail` (after fetch) | `Halfvolle melk - Picnic Web` |
| `/product/[id]` (loading) | `undefined` (data not yet available) | `Picnic Web` |
| Error boundary | `undefined` (fallback) | `Picnic Web` |

## Existing Types Referenced

From `src/lib/types.ts`:

- `ProductDetail.name: string` — product name used as title context on product pages
- `SearchSection` — search state carries `query: string` but `urlQuery` from URL params is preferred (more immediate)

## State Transitions

The title is purely derived state — it has no lifecycle of its own. It changes as a side effect of:

```
Page mount → useEffect fires → document.title set
Page data loads → state update → useEffect re-fires → document.title updated
Navigation → React unmounts old page, mounts new → new useEffect fires
```

No cleanup is needed on unmount because the next page's `usePageTitle` will overwrite `document.title`.
