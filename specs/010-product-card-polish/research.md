# Research: Product Card Layout Polish

**Feature**: 010-product-card-polish  
**Date**: 2026-04-10

## Research Questions

### RQ-1: What is the best CSS technique to bottom-anchor the price while keeping variable-height text above?

**Context**: The product card is a flex column (`flex flex-col h-full`). The content between the fixed-height image (h-32) and the price is variable: optional subtitle, 1-or-2-line name, optional brand row, unit quantity. The grid uses CSS Grid with implicit `align-items: stretch`, so all cards in a row have equal height. We need the price to always appear at the same vertical position across cards in a row.

**Options evaluated**:

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| A. `mt-auto` wrapper | Wrap price + badges in a `div` with `mt-auto` that pushes them to the bottom of the flex column | Simple, one structural change, works with existing flex layout | Adds one wrapper div |
| B. CSS subgrid | Use `display: subgrid` on cards so rows align across grid cells | Perfect alignment of every row (name, brand, price) | Browser support incomplete, complex, overkill for this feature |
| C. Fixed-height text area | Give the text content area a fixed height and let it overflow-clip | Simple | Fragile, doesn't adapt to varying content, wastes space on minimal cards |

**Decision**: Option A — `mt-auto` wrapper around price + badges.

**Rationale**: This is the simplest approach that solves the problem. By wrapping the price display and badges in a single `div` with `mt-auto`, the variable-height text area above naturally absorbs the remaining space. All cards in a row have equal height (from CSS Grid stretch), so the `mt-auto` wrapper pushes price + badges to the same bottom position in every card.

CSS subgrid (Option B) would provide even more precise row-by-row alignment (e.g., names all at the same height too), but it's significantly more complex, has incomplete browser support in older Safari versions, and is overkill when the spec only requires price alignment.

Fixed-height text area (Option C) is fragile and wasteful — it forces cards with minimal content to have unnecessary empty space, and choosing the right fixed height is brittle across breakpoints.

**Alternatives considered**: See table above.

### RQ-2: What specific layout changes are needed in product-card.tsx?

**Decision**: Three changes to the card's Tailwind classes:

1. **Remove `mt-auto` from badges container** (line 152 current): The badges currently have `mt-auto` which pushes them to the bottom. This needs to move to a wrapper that includes both price and badges.

2. **Add a bottom-anchor wrapper**: Wrap the price `<div>` and the badges `<div>` in a new `<div className="mt-auto">`. This pushes the price-and-badges group to the bottom of the flex column.

3. **Visual spacing polish**: Review and adjust margin/padding between elements for better balance:
   - The text content area (subtitle → name → brand → unit qty) flows naturally.
   - The `mt-auto` wrapper creates a clean visual separation between variable text and the bottom-anchored price.
   - Adjust `mb-*` classes as needed to balance spacing.

**Rationale**: Minimal structural change. One new wrapper `div` is added. No component splits, no new files, no new CSS. The fix stays within Tailwind's utility classes.

### RQ-3: Will the `mt-auto` approach work with the cart action overlay?

**Decision**: Yes, no conflict. The cart action overlay (`CartActionOverlay`) is positioned with `absolute bottom-1 right-1` inside the image area div. It's completely independent of the text/price flex layout below. The `mt-auto` wrapper only affects the flex flow of the card's main children.

**Rationale**: The overlay is absolutely positioned within the image container, which has `relative`. It doesn't participate in the flex layout.

### RQ-4: Will the unavailability overlay still work?

**Decision**: Yes. The unavailability dim overlay is `absolute inset-0` on the card's root `div` (which has `relative`). Adding a wrapper `div` inside the flex flow does not affect absolutely positioned children of the card root.

**Rationale**: Absolute positioning is relative to the nearest positioned ancestor (the card root with `relative`), not to flex children.

### RQ-5: What visual polish improvements should be applied beyond price alignment?

**Decision**: Focus on spacing balance and visual hierarchy:

1. **Consistent spacing scale**: Ensure margin-bottom values follow a clear pattern (currently a mix of `mb-0.5`, `mb-2`, `mb-3`). Standardize to a clear rhythm.
2. **Text area breathing room**: The text elements (subtitle, name, brand, unit qty) currently have tight `mb-0.5` spacing. This is acceptable for density but could benefit from slight adjustment.
3. **Price prominence**: Ensure the price has enough visual weight by maintaining its current `text-lg font-bold` styling and giving it adequate spacing from the text above and badges below.
4. **No color or typography changes**: Per spec assumptions, this is layout/spacing only — no redesign.

**Rationale**: The spec says "make it look a bit nicer" — interpreted as spacing and alignment improvements, not a visual redesign.

## Summary of Findings

| Question | Finding | Action |
|----------|---------|--------|
| RQ-1: Layout technique | `mt-auto` wrapper around price + badges | Implement in product-card.tsx |
| RQ-2: Specific changes | Add wrapper div, move `mt-auto`, adjust spacing | 3 changes in one file |
| RQ-3: Cart overlay compat | No conflict — overlay is absolute-positioned | No action needed |
| RQ-4: Unavailability compat | No conflict — overlay is absolute-positioned | No action needed |
| RQ-5: Visual polish scope | Spacing balance, no color/typography changes | Minor spacing adjustments |

## Unresolved Items

None — all research questions resolved.
