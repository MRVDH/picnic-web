# picnic-web Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-09

## Active Technologies
- TypeScript 5, Node.js 20.9+ + Next.js 16.2.1, React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0 (002-search-url-sections)
- N/A (no persistent storage; search state is URL + client memory) (002-search-url-sections)
- N/A (no persistent storage; all state is ephemeral client-side) (003-section-nav-badges)
- HTTP-only cookie (`picnic_auth_token`) — browser-managed, server-readable (004-auth-token-gate)
- N/A (no persistent storage; read-only product data from API) (005-product-detail-page)
- N/A (no persistent storage; cart state lives in the Picnic API) (006-cart-page)
- N/A (no persistent storage; cart state is URL + client memory) (007-plp-cart-actions)

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
- 007-plp-cart-actions: Added TypeScript 5, Node.js 20.9+ + Next.js 16.2.1, React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0
- 006-cart-page: Added TypeScript 5, Node.js 20.9+ + Next.js 16.2.1, React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0
- 006-cart-page: Added TypeScript 5, Node.js 20.9+ + Next.js 16.2.1, React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
