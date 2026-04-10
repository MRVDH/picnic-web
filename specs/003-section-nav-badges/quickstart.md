# Quickstart: Section Navigation Badges

**Feature**: 003-section-nav-badges  
**Date**: 2026-03-29

## Prerequisites

- Node.js 20.9+
- `npm install` completed (no new dependencies required for this feature)

## Development

```bash
# Start dev server
npm run dev

# Run validation
npm run lint && npx tsc --noEmit && npm run build
```

## What This Feature Adds

A horizontal badge bar above search results that:
1. Shows one badge per search result section
2. Sticks below the site header while scrolling
3. Highlights the current section in Picnic red as you scroll
4. Scrolls to a section when you click its badge

## New Files

| File | Purpose |
|------|---------|
| `src/components/section-nav-bar.tsx` | Badge bar component — renders badges, handles click-to-scroll, manages active state styling |
| `src/hooks/use-scroll-spy.ts` | Custom hook — observes section elements with IntersectionObserver, returns active section index |

## Modified Files

| File | Change |
|------|--------|
| `src/components/product-grid.tsx` | Add `id="section-{index}"` and `scroll-margin-top` to `<section>` elements |
| `src/app/page.tsx` | Import and render `SectionNavBar` inside the sticky header, pass sections data |

## Testing

1. Search for "tomaten" (returns ~11 sections)
2. Verify badge bar appears with section titles
3. Click any badge — page should smooth-scroll to that section
4. Scroll through results — active badge should change to match the current section
5. With many sections, verify the badge bar scrolls horizontally
6. Search for something with no results — badge bar should not appear
