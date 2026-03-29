# Research: Section Navigation Badges

**Feature**: 003-section-nav-badges  
**Date**: 2026-03-29  
**Purpose**: Resolve all technical unknowns before implementation planning.

## R-001: Scroll-Spy Implementation Strategy

**Decision**: Use native `IntersectionObserver` API via a custom `useScrollSpy` hook.

**Rationale**: The project has zero scroll-related dependencies (no `framer-motion`, `react-scroll`, `react-intersection-observer`). Adding a library for a single scroll-spy feature would violate the DRY-adjacent principle of minimal dependency surface. The native `IntersectionObserver` API is well-supported, performant (callback-based rather than polling), and sufficient for tracking which section header is nearest the viewport top.

**Alternatives considered**:
- `react-intersection-observer` package: Adds an external dependency for something achievable in ~40 lines of custom hook code. Rejected — unnecessary dependency.
- Scroll event listener with manual offset calculation: Less performant (fires on every scroll frame), requires manual throttling/debouncing. Rejected — IntersectionObserver is purpose-built for this.
- CSS `scroll-snap` with `:target` pseudo-class: Does not provide the active-state-tracking behavior needed. Rejected — insufficient for scroll-spy.

## R-002: Section Element Identification for Scroll Targets

**Decision**: Add stable `id` attributes to each `<section>` element in `ProductGrid`, derived from the section index (e.g., `id="section-0"`, `id="section-1"`).

**Rationale**: Currently, `<section>` elements in `product-grid.tsx` have `key={section.title}` but no DOM `id`. Scroll-to-section requires a stable DOM identifier. Using the array index is more reliable than slugifying the title because section titles can contain Unicode characters, duplicates (already handled with deduplication in the parser, but safer to avoid), and special characters.

**Alternatives considered**:
- Slugified title (`id={slugify(section.title)}`): Requires a slugify utility, risk of collisions or encoding issues with Dutch characters. Rejected — index-based is simpler and collision-free.
- `useRef` array: Would work for `scrollIntoView` but complicates the IntersectionObserver setup (need refs to be stable across renders). Rejected — `id` attributes are simpler and work with `document.getElementById`.
- Data attributes (`data-section-index`): Work for JS selection but not for anchor links. `id` attributes are standard and support `#anchor` navigation as a bonus.

## R-003: Sticky Badge Bar Positioning

**Decision**: Place the badge bar as a sticky element between `<header>` and `<main>` in `SearchPage`, with `sticky top-[header-height]` and `z-10`.

**Rationale**: The site header is `sticky top-0 z-20` with an estimated height of ~72-80px (content-dependent). The badge bar must stick below the header. Placing it at the same DOM level as `<header>` and `<main>` gives it full page width and clean sticky stacking. Using `z-10` (below the header's `z-20`) ensures proper layering.

**The header height challenge**: The header has no fixed height — it's content-driven. Two approaches:
1. **CSS `top` with a fixed pixel value**: Fragile if header height changes.
2. **Measure header height dynamically with `useRef` + `getBoundingClientRect`**: Accurate but adds complexity.
3. **Place badge bar inside the header's sticky container**: Both elements stick together naturally.

**Revised decision**: Place the badge bar inside the `<header>` sticky container (after the existing header content). This way, both the header content and badge bar are part of the same sticky block, and no manual height calculation is needed. The badge bar will naturally sit below the search bar and above `<main>`.

**Alternatives considered**:
- Separate sticky element with calculated `top` offset: Requires measuring header height, fragile on resize. Rejected — co-locating inside the sticky header is simpler.
- JavaScript-driven `position: fixed` with dynamic top: Overly complex for a pure CSS-solvable problem. Rejected.

## R-004: Badge Bar Component Architecture

**Decision**: Create two new files following the project's component conventions:
1. `src/components/section-nav-bar.tsx` — The badge bar container (sticky, horizontally scrollable, renders badges).
2. `src/hooks/use-scroll-spy.ts` — Custom hook that observes section elements and returns the active section index.

**Rationale**: Follows SRP (constitution Principle I) — the component handles rendering, the hook handles scroll observation. Both files will be well under the 300-line limit. The hook is reusable and testable in isolation.

**Naming**: `section-nav-bar` (kebab-case file, `SectionNavBar` export) clearly describes the component's purpose. `useScrollSpy` follows verb-first camelCase for hooks.

## R-005: Active Badge Visual Design

**Decision**: Active badge uses `bg-picnic-red text-white`. Inactive badges use `bg-gray-100 text-gray-700`. Both use rounded pill shape (`rounded-full`), horizontal padding, and `text-sm` font size.

**Rationale**: `picnic-red` (`#e1171e`) is already defined as a Tailwind color token in `globals.css:37`. White text on red provides strong contrast (WCAG AA compliant). Gray-100/700 for inactive badges provides clear visual distinction (FR-011) while remaining neutral. The pill shape is a standard badge/chip pattern matching the Picnic mobile app style.

**Alternatives considered**:
- Outlined active badge (red border, no fill): Less visually prominent than filled. Rejected — user explicitly asked for Picnic red color, filled is more visible.
- Underline indicator: Common for tabs but less appropriate for horizontally scrolling chip/badge lists. Rejected.

## R-006: Scroll Offset Compensation (FR-010)

**Decision**: Use `scrollIntoView({ behavior: 'smooth', block: 'start' })` combined with `scroll-margin-top` CSS on section elements to account for the sticky header+badge bar height.

**Rationale**: The `scroll-margin-top` CSS property is specifically designed for this purpose — it defines an offset from the scroll snap/target position. By setting `scroll-margin-top` on each `<section>` element to the combined height of the sticky header and badge bar, `scrollIntoView` will automatically position the section header just below the sticky elements. This is a pure-CSS solution that doesn't require JavaScript height calculations.

**Alternatives considered**:
- `window.scrollTo` with manual offset: Requires measuring header+badge bar height, fragile on resize. Rejected.
- `scrollBy` after `scrollIntoView`: Two-step animation looks janky. Rejected.

## R-007: Badge Bar Horizontal Auto-Scroll (FR-008)

**Decision**: When the active badge changes, call `element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })` on the active badge element within the horizontal scroll container.

**Rationale**: The badge bar uses `overflow-x: auto` for horizontal scrolling. When the active badge is off-screen (e.g., user scrolled page to a far section), the badge bar should auto-scroll to show it. Using `scrollIntoView` with `inline: 'center'` on the badge element centers it in the visible area of the scroll container, providing good UX.

**Alternatives considered**:
- Manual `scrollLeft` calculation: More code, same result. Rejected.
- CSS `scroll-snap`: Doesn't auto-scroll to the active badge on state change. Rejected.
