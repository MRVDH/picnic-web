# Quickstart: Product Card Layout Polish

**Feature**: 010-product-card-polish  
**Date**: 2026-04-10

## Goal

Fix the product card layout so prices are always bottom-anchored (aligned across cards in a grid row) and improve overall spacing for a cleaner look.

## Prerequisites

- Dev server running (`npm run dev`)
- Browser open to search results page (e.g., `/?q=tomaten`)

## Single File to Modify

`src/components/product-card.tsx` — the `ProductCard` component.

## Step-by-Step

### Step 1: Add bottom-anchor wrapper around price + badges

The current card layout is a flex column where the price sits in normal flow and only badges have `mt-auto`. Wrap the price and badges in a single `<div>` with `mt-auto` to push them to the card bottom.

**Before** (simplified):
```tsx
{/* Unit quantity */}
<p className="mb-2 text-xs ...">{product.unitQuantity}</p>

{/* Price */}
<div className="mb-2">
  <PriceDisplay ... />
</div>

{/* Badges */}
{product.badges.length > 0 && (
  <div className="mt-auto flex flex-wrap gap-1">
    ...badges...
  </div>
)}
```

**After** (simplified):
```tsx
{/* Unit quantity */}
<p className="text-xs ...">{product.unitQuantity}</p>

{/* Bottom-anchored: price + badges */}
<div className="mt-auto">
  <div className="...">
    <PriceDisplay ... />
  </div>

  {product.badges.length > 0 && (
    <div className="flex flex-wrap gap-1">
      ...badges...
    </div>
  )}
</div>
```

Key changes:
1. New `<div className="mt-auto">` wrapping price + badges
2. Remove `mt-auto` from badges container (the wrapper has it now)
3. Adjust `mb-*` spacing classes to balance the new structure

### Step 2: Polish spacing

Review and adjust margin/padding for visual balance:
- Text elements should have consistent, tight spacing
- The `mt-auto` wrapper creates natural separation from text above
- Price and badges should have appropriate gap between them

### Step 3: Verify

1. Search "tomaten" — check prices align across rows
2. Search "roomboter" — check re-order section cards too
3. Resize browser from mobile (2-col) to desktop (5-col)
4. Verify cart add/stepper buttons still work
5. Check cards with unavailability overlays
6. Check cards with bundle pricing (strikethrough)

## Validation Commands

```bash
npm run lint
npm run build
```

## Files Changed

| File | Change |
|------|--------|
| `src/components/product-card.tsx` | Restructure flex layout: add `mt-auto` wrapper around price + badges, adjust spacing classes |
