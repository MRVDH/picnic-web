# Quickstart: Bundle Discount UI

**Feature**: 018-bundle-discount-ui
**Branch**: `018-bundle-discount-ui`

## Prerequisites

- Node.js 20.9+
- Access to Picnic API (authenticated session with `picnic_auth_token` cookie)

## Setup

```bash
git checkout 018-bundle-discount-ui
npm install   # Installs picnic-api ^4.3.0
```

## Development

```bash
npm run dev   # Starts Next.js dev server
```

## Key Files to Modify

| File | Change |
|------|--------|
| `package.json` | Update picnic-api to ^4.3.0 |
| `src/app/product/[id]/page.tsx` | Remove amber warning banner (lines 104-106) |
| `src/components/product-price-section.tsx` | Redesign bundle display as horizontal tier grid |
| `src/components/cart-item.tsx` | Wire up bundle badge display, ensure strikethrough pricing |
| `src/lib/parse-cart.ts` | Update BUNDLES_BUTTON mapper to produce "BundelBonus" badge |
| `src/components/badge.tsx` | Add "bundle" variant if needed for red BundelBonus styling |
| `src/lib/types.ts` | Add "bundle" badge variant if needed |

## Validation

```bash
npm run build   # Must complete without errors
npm run lint    # Must pass ESLint checks
```

## Manual Testing

1. **PDP**: Navigate to a bundle-eligible product → verify tier grid with "Vanaf" labels, active tier highlighting
2. **PLP**: Search for a bundle product → add 1, 2, 3 items → verify savings badge, price updates, dot indicators
3. **Cart**: Add 3+ of a bundle product → open cart → verify "BundelBonus" badge, strikethrough pricing
4. **No banner**: Any PDP → verify amber "Bundelkortingen" banner is gone
