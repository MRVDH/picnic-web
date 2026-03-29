# Data Model: Section Navigation Badges

**Feature**: 003-section-nav-badges  
**Date**: 2026-03-29

## Entities

### SectionNavItem

Represents one navigable section in the badge bar. Derived from the existing `SearchSection` type — no new API data needed.

| Field | Type | Description |
|-------|------|-------------|
| `index` | `number` | Zero-based position of the section in the results list. Used as unique identifier for DOM `id` attributes (`section-0`, `section-1`, etc.) and for scroll-spy matching. |
| `title` | `string` | Display text for the badge, taken directly from `SearchSection.title`. |

### ScrollSpyState

Represents the current scroll-spy observation state. Managed by the `useScrollSpy` hook.

| Field | Type | Description |
|-------|------|-------------|
| `activeSectionIndex` | `number` | Index of the section whose header is currently nearest the top of the viewport. Defaults to `0` (first section). Updated by IntersectionObserver callbacks. |

## Relationships

- **SearchSection[] → SectionNavItem[]**: One-to-one mapping. Each `SearchSection` in the search results produces one `SectionNavItem` for the badge bar. The `index` corresponds to the array position.
- **SectionNavItem.index → DOM section element**: The `index` maps to a DOM element with `id="section-{index}"` rendered in `ProductGrid`.
- **ScrollSpyState.activeSectionIndex → SectionNavItem.index**: The active index determines which badge receives the active (Picnic red) visual style.

## State Transitions

```
SearchState.status === "idle" | "loading" | "error"
  → Badge bar: NOT RENDERED

SearchState.status === "success" AND sections.length === 0
  → Badge bar: NOT RENDERED

SearchState.status === "success" AND sections.length >= 1
  → Badge bar: RENDERED
  → activeSectionIndex: 0 (initial)
  → On scroll: activeSectionIndex updates to topmost visible section
  → On badge click: page scrolls to target section, activeSectionIndex updates after scroll
```

## Validation Rules

- `SectionNavItem.index` MUST be a non-negative integer within bounds of the sections array.
- `SectionNavItem.title` MUST be a non-empty string (guaranteed by the search parser which filters empty sections).
- `activeSectionIndex` MUST always be within `[0, sections.length - 1]`.

## No Persistence

This feature is entirely client-side and ephemeral. No data is stored, cached, or synchronized. The badge bar state is derived from the current search results and the current scroll position.
