# picnic-web Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-20

## Active Technologies
- TypeScript 5, Node.js 20.9+ + Next.js 16.2.1, React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0 (002-search-url-sections)
- N/A (no persistent storage; search state is URL + client memory) (002-search-url-sections)
- N/A (no persistent storage; all state is ephemeral client-side) (003-section-nav-badges)
- HTTP-only cookie (`picnic_auth_token`) — browser-managed, server-readable (004-auth-token-gate)
- N/A (no persistent storage; read-only product data from API) (005-product-detail-page)
- N/A (no persistent storage; cart state lives in the Picnic API) (006-cart-page)
- N/A (no persistent storage; cart state is URL + client memory) (007-plp-cart-actions)
- N/A (no persistent storage; pure CSS layout change) (010-product-card-polish)
- TypeScript 5.9.3, Node.js 20.9+ + Next.js 16.2.1 (App Router), React 19.2.4, Tailwind CSS 4.2.2, picnic-api ^4.1.0 (011-dynamic-page-title)
- N/A (no persistent storage; title state is ephemeral client-side) (011-dynamic-page-title)
- TypeScript 5, Node.js 20.9+ + Next.js 16.2.1 (App Router), React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0 (012-cart-credit-summary)
- N/A (no persistent storage; cart state comes from Picnic API) (012-cart-credit-summary)
- N/A (no persistent storage; category data is fetched on demand from Picnic API) (014-search-categories)
- N/A (no persistent storage; navigation state is ephemeral client-side) (015-subcategory-navigation)
- N/A (no persistent storage; product data fetched on demand from Picnic API) (016-subcategory-products)
- TypeScript 5, Node.js 20.9+ + Next.js 16.2.1 (App Router), React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0 → ^4.3.0 (018-bundle-discount-ui)

- TypeScript 5, Node.js 20.9+ + Next.js 16, React 19, Tailwind CSS 4, picnic-api (004-product-search)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5, Node.js 20.9+: Follow standard conventions

## Recent Changes
- 018-bundle-discount-ui: Added TypeScript 5, Node.js 20.9+ + Next.js 16.2.1 (App Router), React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0 → ^4.3.0
- 017-snel-naar-navigation: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]
- 016-subcategory-products: Added TypeScript 5, Node.js 20.9+ + Next.js 16.2.1 (App Router), React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
