# Quickstart: Product Search

**Feature**: `004-product-search`
**Date**: 2026-03-27

## Prerequisites

- Node.js 20.9 or later
- npm
- A valid Picnic auth token (obtained via `picnic-api` login)

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment variables**:

   Create or verify `.env` in the project root contains:

   ```env
   PICNIC_AUTH_TOKEN=<your-auth-key>
   ```

   Optionally create `.env.local` for overrides:

   ```env
   PICNIC_COUNTRY_CODE=NL
   NEXT_PUBLIC_PICNIC_COUNTRY_CODE=nl
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

4. **Open the application**:

   Navigate to `http://localhost:3000` in your browser.

## Verify Feature

1. You should see a search bar on the home page.
2. Type "tomaten" in the search bar and press Enter.
3. A list of product cards should appear showing:
   - Product image
   - Product name
   - Brand (if available)
   - Price (with original price struck through if discounted)
   - Unit/quantity info (e.g., "500 g")
   - Labels/badges (e.g., "10% korting", "Klein")
4. Clear the search bar and type "bie" — suggestions should appear
   in a dropdown after a brief pause.
5. Click a suggestion to trigger a full search.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page with search
│   ├── globals.css             # Tailwind imports + design tokens
│   ├── loading.tsx             # Root loading state
│   ├── error.tsx               # Root error boundary
│   └── api/
│       ├── search/route.ts     # GET /api/search?q=...
│       └── suggestions/route.ts # GET /api/suggestions?q=...
├── components/
│   ├── search-bar.tsx          # Search input with suggestions
│   ├── search-suggestions.tsx  # Suggestion dropdown
│   ├── product-grid.tsx        # Grid layout for product cards
│   ├── product-card.tsx        # Individual product display
│   ├── price-display.tsx       # Price with optional strikethrough
│   └── badge.tsx               # Label/badge component
├── lib/
│   ├── picnic-client.ts        # PicnicClient singleton factory
│   ├── extract-products.ts     # Fusion page → Product[] extraction
│   ├── image-url.ts            # CDN image URL builder
│   └── types.ts                # Application-level type definitions
└── hooks/
    └── use-debounce.ts         # Debounce hook for search input
```

## Troubleshooting

- **"Unable to fetch search results"**: Check that `PICNIC_AUTH_TOKEN`
  in `.env` is valid and not expired. You may need to re-authenticate
  via the `picnic-api` package.
- **No images loading**: Verify `NEXT_PUBLIC_PICNIC_COUNTRY_CODE` is set
  (defaults to `nl`). Check browser console for CDN URL errors.
- **Build fails on TypeScript errors**: Run `npx tsc --noEmit` to see
  detailed type errors.
