# Contract: Page URL State

**Feature**: 002-search-url-sections
**Date**: 2026-03-28
**File**: `src/app/page.tsx`

## URL Schema

```
/?q={searchTerm}
```

| State | URL | Behavior |
|-------|-----|----------|
| No search (landing) | `/` or `/?q=` | Show landing page. No API call. |
| Active search | `/?q=tomaten` | Execute search, display results with sections. |
| Empty results | `/?q=xyznotfound` | Execute search, display "no results" message. URL preserved. |

## URL Update Rules

| User Action | URL Change | Method |
|-------------|-----------|--------|
| Submit search | `/?q={newTerm}` | `router.push()` — creates history entry |
| Select suggestion | `/?q={suggestion}` | `router.push()` — creates history entry |
| Clear search | `/` | `router.push("/")` — removes `q` param |
| Browser back | Previous `/?q=` or `/` | Handled by Next.js router + `useSearchParams` |
| Browser forward | Next `/?q=` or `/` | Handled by Next.js router + `useSearchParams` |
| Page refresh | Same URL | `useSearchParams` reads `q`, triggers search |

## Component Contract: SearchBar

```typescript
type SearchBarProps = {
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;  // NEW: pre-populate input from URL
};
```

- When `initialQuery` is provided and non-empty, the input field is initialized with that value.
- The `initialQuery` prop is read once on mount (or when it changes from external navigation).

## Component Contract: ProductGrid

```typescript
type ProductGridProps = {
  sections: SearchSection[];  // CHANGED: from Product[] to SearchSection[]
};
```

- Renders each section with a header (`<h2>`) followed by a product grid.
- If `sections` has exactly one section, the header is still rendered.
- The grid layout within each section is the same as the current flat grid.

## Suspense Boundary

The page component wraps its content in `<Suspense>` as required by Next.js for `useSearchParams()`:

```tsx
export default function Home() {
  return (
    <Suspense fallback={<LoadingView />}>
      <SearchPage />
    </Suspense>
  );
}
```

The inner `<SearchPage>` component uses `useSearchParams()` and contains all search logic.
