# Data Model: Snel Naar Category Navigation

**Feature**: 017-snel-naar-navigation
**Date**: 2026-04-16

## Existing Entities (No Changes)

### ShortcutItem

Already defined in `src/lib/category-types.ts`.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Image ID (used as unique key) |
| name | string | Display name (e.g. "Brood & gebak") |
| imageId | string | Image asset identifier |
| deepLinkTarget | string | Raw deep-link URI from Picnic API |
| badge | string \| null | Optional badge text (e.g. "900+ producten") |

### CategoryItem

Already defined in `src/lib/category-types.ts`.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Category ID (stripped from PML item ID prefix) |
| name | string | Display name |
| imageId | string | Image asset identifier |
| deepLinkTarget | string | Raw deep-link URI from Picnic API |

## Relationships

- `ShortcutItem.deepLinkTarget` → parsed → `CategoryItem.id` (via deep link parser utility)
- A shortcut navigates to the same category page as a `CategoryItem` with matching ID

## New Types / Interfaces

### Component Props (modifications)

**ShortcutListProps** (updated):
| Field | Type | Description |
|-------|------|-------------|
| shortcuts | ShortcutItem[] | List of shortcuts to render |
| onShortcutTap | (shortcut: ShortcutItem) => void | Callback when a shortcut is tapped |

**CategoryBrowserProps** (updated):
| Field | Type | Description |
|-------|------|-------------|
| categoriesState | CategoriesState | Current categories loading state |
| onCategoryTap | (category: CategoryItem) => void | Callback for category tile tap |
| onShortcutTap | (shortcut: ShortcutItem) => void | Callback for shortcut tile tap |

## State Transitions

No new state. Navigation is stateless — tap triggers `router.push` which is handled by Next.js App Router.
