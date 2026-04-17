# Research: Dynamic Page Titles

**Feature**: 011-dynamic-page-title
**Date**: 2026-04-13

## Research Questions & Findings

### R1: Implementation Mechanism for Client-Side Titles

**Question**: All pages are `"use client"` components. How should dynamic titles be set?

**Decision**: Use `document.title` assignment inside a shared `usePageTitle` custom hook with `useEffect`.

**Rationale**: All four page routes (`/`, `/login`, `/cart`, `/product/[id]`) and the error boundary are client components. The Next.js `metadata` export and `generateMetadata` function are only available in server components. Since the spec explicitly chose not to refactor pages to server components (clarification session 2026-04-13), client-side `document.title` is the only viable mechanism.

**Alternatives considered**:
- `generateMetadata` in server components: Would require refactoring all pages from `"use client"` to server components with client child wrappers. Rejected for scope/risk.
- Hybrid (route-level `layout.tsx` with `metadata` for static pages, `document.title` for dynamic): Would work but introduces inconsistency in the title mechanism. Rejected for DRY/consistency.
- `next/head` component: Deprecated in Next.js App Router. Not applicable.

### R2: Hook Design Pattern

**Question**: What pattern should the `usePageTitle` hook follow?

**Decision**: Named export from `src/hooks/use-page-title.ts`, accepting an optional `pageContext?: string` parameter. When provided, sets title to `"${pageContext} - Picnic Web"`. When omitted/undefined/empty, sets title to `"Picnic Web"`.

**Rationale**: Matches the existing hook pattern in the project (`use-debounce.ts`): kebab-case filename, named `export function`, JSDoc comment, `useEffect` with cleanup consideration. The hook should handle truncation internally (60-char limit on `pageContext` with ellipsis) so callers don't need to worry about it.

**Alternatives considered**:
- Accept a full title string (e.g., `usePageTitle("Halfvolle melk - Picnic Web")`): Would duplicate the format pattern across all callers. Violates DRY.
- Return the title string instead of setting it: Adds an unnecessary step; callers would still need to set `document.title` themselves. No benefit.

### R3: Root Layout Metadata Update

**Question**: What should the root layout's static `metadata.title` be?

**Decision**: Update from `"Picnic Web — Product Search"` to `"Picnic Web"`.

**Rationale**: The root layout's `metadata.title` is the server-rendered `<title>` tag that appears before any client-side JavaScript executes. Changing it to `"Picnic Web"` ensures: (1) no flash of the old title before `useEffect` fires, (2) the fallback title for pages without dynamic title data is consistent, (3) the `metadata.description` can remain unchanged as it describes the app accurately.

**Alternatives considered**:
- Leave as `"Picnic Web — Product Search"`: Would cause a brief flash of the old title on every page load before `useEffect` overwrites it. Rejected for UX polish.
- Use `metadata.title.template` from Next.js: Only works with server-component `metadata` exports in child routes, not with `document.title`. Not applicable.

### R4: Title Format and Constants

**Question**: How should the title format `"[Context] - Picnic Web"` be consistently enforced?

**Decision**: Extract three named constants to `src/lib/constants.ts`:
- `APP_NAME = "Picnic Web"` — the base application title
- `TITLE_SEPARATOR = " - "` — space-dash-space separator (matching spec format)
- `MAX_TITLE_CONTEXT_LENGTH = 60` — truncation threshold for page context

The `usePageTitle` hook imports these constants and applies the format internally.

**Rationale**: The constitution (Principle III) forbids magic strings. Centralizing in `constants.ts` (where existing constants live) makes the format single-source-of-truth and easily changeable.

**Alternatives considered**:
- Inline strings in each page: Violates DRY and Principle III (magic strings). Rejected.
- Separate `title-config.ts` module: Overkill for 3 constants; `constants.ts` is the established pattern. Rejected.

### R5: Truncation Strategy

**Question**: How should excessively long page contexts be truncated?

**Decision**: Truncate `pageContext` to 60 characters and append `"…"` (Unicode ellipsis U+2026) if it exceeds the limit. Truncation happens inside the `usePageTitle` hook before composing the full title. The 60-character limit applies to the context portion only, not the full title string.

**Rationale**: FR-009 specifies 60 characters as the threshold with ellipsis. Using Unicode ellipsis (`…`) instead of three dots (`...`) is cleaner and uses a single character. Truncating inside the hook keeps callers simple — they pass the raw product name or search query without worrying about length.

**Alternatives considered**:
- Truncate at the caller site: Scatters truncation logic. Violates DRY.
- No truncation (browser handles it): Browser tab titles are visually truncated by the browser, but `document.title` still holds the full string. This could affect bookmarks and accessibility tools that read the full title. Explicit truncation is more predictable.

### R6: Hook Placement in Page Components

**Question**: Where exactly should `usePageTitle` be called in each page component?

**Decision**: Call `usePageTitle` inside the innermost client component that has access to the title data:

| Page | Component | Call Location | Argument |
|------|-----------|---------------|----------|
| Home/Search | `SearchPage` | After `urlQuery` declaration | `urlQuery \|\| undefined` |
| Login | `LoginForm` | Top of component body | `"Inloggen"` |
| Cart | `CartPage` | Top of component body | `"Winkelwagen"` |
| Product | `ProductPage` | After `pageState` declaration | `pageState.status === "success" ? pageState.product.name : undefined` |
| Error | `Error` | Top of component body | `undefined` (fallback to "Picnic Web") |

**Rationale**: Placing the hook in the inner component (e.g., `SearchPage` instead of `Home`) ensures the title data (like `urlQuery` from `useSearchParams`) is already available. For the product page, the conditional handles the loading state naturally — `undefined` means the hook sets the fallback title until the product name loads.

**Alternatives considered**:
- Call in the wrapper component (e.g., `Home`): The wrapper doesn't have access to `useSearchParams` (it's above the Suspense boundary). Would require lifting state or adding another hook call.
- Separate `useEffect` in each page instead of shared hook: Violates DRY; duplicates the format/truncation logic.

### R7: Error Page Title Behavior

**Question**: Should the error boundary set a specific title like "Fout - Picnic Web" or just fall back to "Picnic Web"?

**Decision**: Fall back to `"Picnic Web"` (pass `undefined` to `usePageTitle`).

**Rationale**: The spec (edge cases section, line 63) says "The title should display a reasonable fallback such as 'Picnic Web'." The error page is an exceptional state, and showing "Fout" in the tab could be confusing or alarming. The neutral default is safer.

**Alternatives considered**:
- `"Fout - Picnic Web"`: Would explicitly signal an error state in the tab title. Could be useful for debugging but potentially alarming for users. Rejected per spec guidance.

## Summary

All research questions resolved. No NEEDS CLARIFICATION items remain. The implementation approach is:

1. Add 3 constants to `src/lib/constants.ts`
2. Create `src/hooks/use-page-title.ts` with the `usePageTitle` hook
3. Update `src/app/layout.tsx` metadata title to `"Picnic Web"`
4. Add `usePageTitle` calls to all 5 page components (home, login, cart, product, error)
