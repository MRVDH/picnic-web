# Picnic Web — Agent Instructions

## General Instructions

- This is the **picnic-web** project, a web interface for the Picnic online supermarket.
- Built with **Next.js 16**, **React 19**, **TypeScript 5**, and **Tailwind CSS 4**.
- The web project should match the styling of the Picnic mobile app. Reference the decompiled `picnic-app/` codebase (in the parent folder) for design cues.
- The web project uses the **picnic-api** package from the parent folder (`../`) as its backend client. It is imported via CommonJS `require()` in `src/lib/picnic-client.ts`.
- If you need new API endpoints during development, add them to the picnic-api package and update its documentation.
- If anything is unclear, ask the user for clarification.
- For everything that you do, check the AGENTS.md file and update afterwards if necessary. This file should be the single source of truth for how to work on the picnic-web project.

## Project Structure

```
picnic-web/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (fonts, metadata)
│   │   ├── page.tsx                # Home page (loads home_page_root)
│   │   ├── globals.css             # Design tokens & global styles
│   │   ├── api/                    # Server-side API proxy routes
│   │   │   ├── bootstrap/route.ts  # GET  → client.app.getBootstrap()
│   │   │   ├── pages/[pageId]/route.ts  # GET → client.app.getPage(pageId, queryParams)
│   │   │   ├── search/route.ts     # POST → client.catalog.search(term)
│   │   │   └── suggestions/route.ts # POST → client.catalog.getSuggestions(term)
│   │   ├── cart/page.tsx           # Cart page (placeholder — needs implementation)
│   │   ├── page/[pageId]/page.tsx  # Dynamic page route (generic Fusion renderer)
│   │   ├── purchases/page.tsx      # Purchases page (loads purchases-page-root)
│   │   ├── recipes/page.tsx        # Recipes page (loads meals-page-root)
│   │   └── search/page.tsx         # Search results (loads search-page-results)
│   ├── components/
│   │   ├── AppShell.tsx            # Top-level shell: fetches bootstrap, renders tabs + content
│   │   ├── GenericFusionPage.tsx   # Fetches a page by ID and renders via FusionPageRenderer
│   │   ├── SearchBar.tsx           # Debounced search with suggestion dropdown
│   │   ├── TabBar.tsx              # Bottom navigation bar (driven by bootstrap tabs)
│   │   └── pml/                    # PML rendering engine (see below)
│   │       ├── FusionPageRenderer.tsx  # Fusion page → recursive PML tree
│   │       ├── PMLRenderer.tsx         # Dispatcher: PML node type → component
│   │       ├── PMLAccordion.tsx
│   │       ├── PMLActivityIndicator.tsx
│   │       ├── PMLContainer.tsx
│   │       ├── PMLIcon.tsx
│   │       ├── PMLImage.tsx
│   │       ├── PMLPrice.tsx
│   │       ├── PMLRichText.tsx
│   │       ├── PMLSellingUnitTile.tsx
│   │       ├── PMLStack.tsx
│   │       ├── PMLStepper.tsx
│   │       ├── PMLTextButton.tsx
│   │       └── PMLTouchable.tsx
│   └── lib/
│       ├── picnic-client.ts        # Singleton PicnicClient factory
│       ├── image-url.ts            # CDN image URL builder
│       └── pml-styles.ts           # PML style value → CSS converters
```

## Setup & Running

### Environment Variables

Create a `.env.local` file in the `picnic-web/` root:

```env
# Required — auth token from client.auth.login() response
PICNIC_AUTH_KEY=<your-auth-key>

# Optional — "NL" or "DE" (default: "NL")
PICNIC_COUNTRY_CODE=NL

# Optional — exposed to client for CDN image URLs (default: "nl")
NEXT_PUBLIC_PICNIC_COUNTRY_CODE=nl
```

### Commands

```bash
cd picnic-web
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
```

## Architecture

### Data Flow (Page Load)

```
1. Page component mounts (e.g. page.tsx)
2. Client-side fetch("/api/pages/{pageId}")
3. API route (server-side) calls picnic-api: client.app.getPage(pageId)
4. Returns Fusion page JSON: { body: { type: "STATE_BOUNDARY", ... }, images: {...} }
5. FusionPageRenderer recursively renders page.body
6. For each BLOCK → render flex container with children
7. For each PML node → PMLRenderer dispatches to matching component
```

### Navigation Flow

```
1. AppShell fetches /api/bootstrap on mount
2. bootstrap.tabs defines the visible navigation tabs
3. TabBar renders tabs with route mapping:
   - home_page_root       → /
   - purchases-page-root  → /purchases
   - meals-page-root      → /recipes
   - (other page IDs)     → /page/{pageId}
4. Clicking a tab navigates via Next.js router
```

### API Proxy Pattern

All Picnic API calls go through Next.js server-side route handlers in `src/app/api/`. The client never talks to Picnic servers directly. Each route handler:

1. Calls `getPicnicClient()` to get the singleton API client
2. Invokes the appropriate picnic-api method
3. Returns `NextResponse.json(data)` or `NextResponse.json({ error }, { status })`

## PML Rendering System

PML (Picnic Markup Language) is a declarative format describing UI components. The Picnic API returns Fusion pages containing a tree of PML nodes. The web app renders these generically.

### Fusion Page Structure

A Fusion page body is a recursive tree:
```
STATE_BOUNDARY → SUSPENSE → BLOCK → [PML nodes...]
```

`FusionPageRenderer` handles the structural types (STATE_BOUNDARY, SUSPENSE, BLOCK). It also maps `layout.alignment` and `layout.distribution` to CSS `align-items` and `justify-content`, and applies `overflow: hidden` on blocks with corner radii. PML items without a fixed main-axis size use `flex-grow: 1` to fill available space. `PMLRenderer` handles leaf/component types.

### Supported PML Components

| PML Type | Component | Description |
|----------|-----------|-------------|
| `STACK` | PMLStack | Flex container (row or column) with border, corner radius, shadow, opacity, absolute positioning |
| `CONTAINER` | PMLContainer | Flex box with size, padding, borders, corner radius, shadow, opacity, absolute positioning |
| `IMAGE` | PMLImage | Image with CDN resolution, lazy loading, border radius, opacity, absolute positioning |
| `RICH_TEXT` | PMLRichText | Markdown text (headers, bold, italic, lists, strikethrough, links, colored spans) |
| `ICON` | PMLIcon | SVG icon lookup by normalized name |
| `TOUCHABLE` | PMLTouchable | Clickable element with deeplink-based routing |
| `SELLING_UNIT_TILE` | PMLSellingUnitTile | Product card with image, name, price, quantity |
| `PRICE` | PMLPrice | Formatted price display (€X,XX) |
| `ACCORDION` | PMLAccordion | Collapsible section with chevron |
| `STEPPER` | PMLStepper | +/- quantity control (placeholder — needs cart state) |
| `TEXT_BUTTON` | PMLTextButton | Styled button |
| `ACTIVITY_INDICATOR` | PMLActivityIndicator | Loading spinner |

### Intentionally Unsupported PML Types (render as null)

These types are known but intentionally not rendered:
`UNAVAILABILITY_CONTAINER`, `SELLING_UNIT_MUTATION`, `EXPRESSION`, `MODAL`, `SOCIAL_SHARE`, `SEARCH_RESULT_ENTITY`

Unknown PML types log a warning in development and render nothing.

### PML Style Mapping (`src/lib/pml-styles.ts`)

PML uses its own size/style format that must be converted to CSS:

- **Sizes**: `"12g"` → `"100%"` (grid units: N/12 × 100%), `"SCREEN_WIDTH"` → `"100%"`, `"SCREEN_HEIGHT"` → `"100vh"`, `"CONTAINER_HEIGHT"` → `"auto"`, supports calc() expressions
- **Padding**: PML padding object → CSS padding string
- **Colors**: Hex passthrough
- **Font weights**: Named values (`THIN`→100, `REGULAR`→400, `BOLD`→700, etc.)
- **Text sizes**: Named types (`TITLE`→24px, `BODY`→14px, etc.)

### Image Handling (`src/lib/image-url.ts`)

- **CDN base**: `https://storefront-prod.{countryCode}.picnicinternational.com/static/images`
- **URL format**: `{imageId}/{size}.png`
- **Available sizes**: `tiny`, `small`, `medium` (default), `large`, `extra-large`
- **Resolution**: Images are looked up via the `page.images` map using `imageId` as key. Falls back to using `imageId` directly if not in the map.
- **Passthrough**: If an imageId is already an HTTP(S) URL, it's used as-is.

### Deeplink Routing (`PMLTouchable`)

PML touchable elements use deeplink strings for navigation. The component parses these into web routes:

- `store/page;id={pageId}` → `/page/{pageId}`
- `product-details-page-root?id={id}` → `/page/product-details-page-root?id={id}`
- Category links → `/page/L1-or-L2-category-page-root?category_id={id}`
- Search terms → `/search?q={term}`
- External HTTP(S) URLs → `window.open()`

### RichText Markdown Format

`PMLRichText` parses a Picnic-specific markdown variant:
- `# Header` through `###### Header` — rendered as `<h1>`–`<h6>` with CSS classes
- `**bold**` and `*italic*`
- `~~strikethrough~~` — rendered as `<del>`
- `- item` or `* item` — unordered lists
- `1. item` — ordered lists
- `[link text](url)` — rendered in Picnic red
- `#(#FF0000)colored text#(#FF0000)` — inline color spans
- `\n` — line breaks
- Content is sanitized to prevent XSS

## Styling

### Design Tokens (`globals.css`)

```css
--picnic-red: #e1171e;       /* Primary brand color */
--picnic-green: #4a8c3f;
--picnic-yellow: #f5a623;
--picnic-bg: #f5f5f5;        /* Page background */
--picnic-white: #ffffff;
--nav-height: 56px;          /* Top/bottom nav height */
--max-content-width: 1280px; /* Content max width */
```

### Conventions

- Use Tailwind CSS utility classes where possible.
- Use CSS variables from `globals.css` for brand colors and layout constants.
- PML component styles are computed dynamically from the PML style data (via `pml-styles.ts`), applied as inline `style` objects.

## Coding Conventions

- All page components use the `"use client"` directive (client-side rendering with `useEffect` + `useState`).
- Data fetching happens client-side via `fetch()` to the `/api/` proxy routes.
- Loading states are managed locally per component.
- The `@/*` path alias maps to `./src/*` (configured in `tsconfig.json`).

## Fusion/PML Types

The TypeScript types for Fusion pages and PML nodes are defined in the picnic-api package at `src/types/fusion.ts`. If you need to add new PML component types or update existing type definitions, edit that file. The key types are `FusionPage`, `FusionPageBody`, and the various PML node interfaces.

## Known Limitations & TODOs

- **Cart page**: Currently a static placeholder — needs full implementation with cart state management.
- **PMLStepper**: Renders UI but has no cart interaction logic.
- **No error boundaries**: Component rendering failures are not gracefully caught.
