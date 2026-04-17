# Research: Snel Naar Category Navigation

**Feature**: 017-snel-naar-navigation
**Date**: 2026-04-16

## R1: Deep Link Target Format & Category ID Extraction

**Decision**: Create a utility function `parseCategoryIdFromDeepLink(target: string): string | null` that extracts the category ID from the Picnic API's deep link target string.

**Rationale**: The `deepLinkTarget` field on `ShortcutItem` contains a raw deep-link URI from the Picnic API (e.g., `picnic://categories/<id>` or similar). The existing `CategoryItem` navigation uses `category.id` which is derived by stripping the `core-list-item-category-` prefix from PML item IDs. We need a bridge function to extract the routable category ID from the shortcut's deep link string. This keeps parsing logic isolated and testable per constitution Principle I (SRP).

**Alternatives considered**:
- Storing a pre-parsed `categoryId` on `ShortcutItem` during PML parsing — rejected because it couples the parser to routing assumptions and the deep link target may be useful for other purposes later.
- Using the shortcut's `id` field directly — rejected because `ShortcutItem.id` is set to `imageId`, not a category ID.

## R2: Navigation Wiring Pattern

**Decision**: Follow the exact same callback-prop pattern used by `CategoryGrid`/`onCategoryTap`. Add an `onShortcutTap` callback prop to `ShortcutList`, wire it through `CategoryBrowser`, and handle it in `page.tsx` with a `handleShortcutTap` callback that parses the deep link and calls `router.push`.

**Rationale**: This is the established pattern in the codebase (`CategoryGrid` → `onCategoryTap` → `handleCategoryTap` → `router.push`). Reusing it maintains consistency and avoids introducing new navigation paradigms. Constitution Principle I (DRY) supports reusing the existing pattern.

**Alternatives considered**:
- Using Next.js `<Link>` components directly in `ShortcutRow` — rejected because the other tile components use `onClick` + `router.push` and we'd introduce inconsistency.
- Navigating directly inside `ShortcutList` using `useRouter` — rejected because it couples the presentational component to routing, violating the established separation where the page component owns navigation logic.

## R3: Error Handling for Invalid Deep Links

**Decision**: If `parseCategoryIdFromDeepLink` returns `null`, the shortcut tap is a no-op (no navigation). The existing category page error handling covers cases where a valid-looking category ID doesn't resolve to data.

**Rationale**: Two failure modes exist: (1) unparseable deep link target — handled by the parser returning null, (2) valid category ID that no longer exists — handled by existing category page error states. No new error UI needed.

**Alternatives considered**:
- Showing a toast or error message on unparseable deep links — rejected as over-engineering; this would indicate an API data issue that should be fixed upstream.
