# Quickstart: Snel Naar Category Navigation

**Feature**: 017-snel-naar-navigation
**Branch**: `017-snel-naar-navigation`

## What This Feature Does

Makes the "Snel naar" (quick-access) shortcut tiles on the home page clickable. Tapping a shortcut navigates to the corresponding category page — the same pages reached via the regular category grid.

## Files to Modify

1. **`src/lib/parse-deep-link.ts`** (NEW) — Utility to extract category ID from a deep link target string
2. **`src/components/shortcut-list.tsx`** — Add `onShortcutTap` prop, wire `onClick` on `ShortcutRow` button
3. **`src/app/page.tsx`** — Add `handleShortcutTap` callback, thread it through `CategoryBrowser` to `ShortcutList`

## Implementation Steps

1. Create `parseCategoryIdFromDeepLink()` in `src/lib/parse-deep-link.ts`
2. Add `onShortcutTap` prop to `ShortcutList` component
3. Wire `onClick={() => onShortcutTap?.(shortcut)}` on the `ShortcutRow` button
4. Update `CategoryBrowserProps` to include `onShortcutTap`
5. Pass `onShortcutTap` through `CategoryBrowser` to `ShortcutList`
6. Create `handleShortcutTap` in `page.tsx` that parses deep link → `router.push`
7. Pass `handleShortcutTap` as `onShortcutTap` to `CategoryBrowser`

## Validate

```bash
npm run lint
```

## Key Patterns to Follow

- Follow the `CategoryGrid` → `onCategoryTap` → `handleCategoryTap` → `router.push` pattern exactly
- Keep navigation logic in the page component, not in presentational components
- Use `encodeURIComponent` on category IDs in URLs (matching existing pattern)
