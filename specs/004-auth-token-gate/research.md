# Research: Auth Token Gate

**Feature**: 004-auth-token-gate  
**Date**: 2026-03-30  
**Purpose**: Resolve all technical unknowns before implementation planning.

## R-001: Token Storage Mechanism

**Decision**: Store the Picnic auth token as an HTTP-only cookie named `picnic_auth_token`.

**Rationale**: The spec clarification (2026-03-30) explicitly chose HTTP-only cookie over alternatives. Benefits:
- Auto-sent with every request to the server — no client-side fetch wrappers needed.
- Readable in Next.js middleware (`request.cookies.get()`), enabling route-level gating before rendering.
- HTTP-only flag prevents JavaScript access via `document.cookie`, reducing XSS token theft risk.
- `SameSite=Lax` provides CSRF protection for non-GET requests while allowing normal navigation.
- `Path=/` ensures the cookie is sent for all routes (API routes, page routes, middleware).

**Cookie configuration**:
- `httpOnly: true` — not accessible from client JS.
- `secure: process.env.NODE_ENV === 'production'` — HTTPS-only in production, allows HTTP in dev.
- `sameSite: 'lax'` — sent on same-site requests and top-level navigations.
- `path: '/'` — available to all routes.
- `maxAge: 30 * 24 * 60 * 60` (30 days) — reasonable session duration; user can always sign out.

**Alternatives considered**:
- `localStorage`: Not accessible server-side; requires client-side fetch interceptors; no middleware gating. Rejected per spec clarification.
- `sessionStorage`: Same drawbacks as `localStorage`, plus doesn't persist across browser sessions (violates User Story 1, Scenario 3). Rejected.
- Encrypted/signed cookie: Adds complexity without clear benefit — the token is already opaque to us (Picnic JWT), and we validate it against the Picnic API. Rejected — unnecessary layer.

## R-002: Route Gating Strategy

**Decision**: Use Next.js middleware (`src/middleware.ts`) with a matcher config to intercept all routes and redirect unauthenticated users to `/login`.

**Rationale**: Next.js middleware runs before the request reaches any page or API route. It has access to cookies via `request.cookies` and can return `NextResponse.redirect()`. This is the standard Next.js pattern for authentication gating and avoids duplicating auth checks in every page/route handler.

**Middleware matcher config**: Use a custom matcher that excludes:
- `/login` (the login page itself — must be accessible unauthenticated).
- `/api/auth/*` (the login/logout API routes — must be accessible unauthenticated).
- `/_next/*` (Next.js internal assets — static files, HMR, etc.).
- `/favicon.ico` and other static assets.

**Implementation pattern**:
```
middleware(request):
  token = request.cookies.get(AUTH_COOKIE_NAME)
  if (!token):
    return NextResponse.redirect('/login')
  return NextResponse.next()
```

**Alternatives considered**:
- Per-page auth checks (e.g., in layout.tsx): Would require checks in every page and wouldn't protect API routes. Rejected — middleware is more comprehensive and DRY.
- Higher-order component wrapper: Client-side only; doesn't protect server-rendered pages or API routes. Rejected.
- Next.js `getServerSideProps` auth check: Not applicable in App Router (no `getServerSideProps`). Rejected.

## R-003: PicnicClient Refactoring Strategy

**Decision**: Replace the singleton `getPicnicClient()` with a stateless factory function `buildPicnicClient(authToken: string)` that creates a new `PicnicClient` instance per call.

**Rationale**: The current singleton pattern (`let instance` at module level) caches a single `PicnicClient` bound to one auth token from `process.env`. With per-user tokens from cookies, each request may carry a different token. The singleton cannot serve multiple users.

**Performance consideration**: Creating a `PicnicClient` instance is cheap — it's a plain object construction with no I/O. The `picnic-api` package stores the auth token as a property and uses it in request headers. No connection pooling or session state is involved. Per-request instantiation has negligible overhead.

**Migration**:
- Remove `let instance` module-level state.
- Remove `process.env.PICNIC_AUTH_TOKEN` access.
- Change signature from `getPicnicClient()` to `buildPicnicClient(authToken: string)`.
- Each API route reads token from cookie → passes to `buildPicnicClient(token)`.

**Alternatives considered**:
- Token-keyed cache (`Map<string, PicnicClientInstance>`): Would cache clients per token, but adds complexity (cache eviction, memory leaks for expired tokens) with minimal benefit given cheap instantiation. Rejected — YAGNI.
- Request-scoped singleton via `AsyncLocalStorage`: Over-engineered for this use case. Rejected.

## R-004: Token Validation Approach

**Decision**: Validate the submitted token by creating a `PicnicClient` with it and calling `client.catalog.getSuggestions("")` (empty query). A successful response confirms the token is valid; an error indicates invalid/expired token or network failure.

**Rationale**: We don't have access to the Picnic JWT secret, so we cannot verify the token locally. The only way to confirm a token works is to make a real API call. `getSuggestions("")` is a lightweight read-only operation that returns an empty array — it has no side effects and minimal server load.

**Error classification**:
- HTTP 401/403 from Picnic API → token is invalid or expired → show "Invalid token" message.
- Network error / timeout → Picnic API unreachable → show "Unable to verify token at this time" message (per Edge Case in spec).
- HTTP 200 → token is valid → set cookie, redirect to `/` (or original URL).

**Alternatives considered**:
- `client.user.getDetails()`: Would work but returns user data we don't need and is heavier. Rejected — `getSuggestions` is lighter.
- JWT decode + expiry check: Can only check structure and expiry, not actual validity (token may be revoked). Rejected — false positives.
- No validation (trust the token): Bad UX — user enters wrong token and sees broken app. Rejected per FR-005.

## R-005: Login Page Architecture

**Decision**: Create `/login` as a client component (`"use client"`) with local state for the input field, show/hide toggle, loading state, and error messages. Form submission sends a POST to `/api/auth/login`.

**Rationale**: The login page needs interactive state (input value, show/hide toggle, loading spinner, error display). A client component is the natural choice. The actual token validation happens server-side in the API route — the client just submits the token and handles the response.

**UI elements** (per FR-010 and clarifications):
- Label: "Picnic Auth Token"
- Input field: `type="password"` by default (masked), with a toggle button to switch to `type="text"`.
- Submit button: "Inloggen" (Dutch, matching the app's language).
- Error area: Below the form, displays validation errors.
- Loading state: Submit button shows spinner/disabled state during validation.

**Alternatives considered**:
- Server Action (React 19 `useFormState`): Would work but mixes validation logic into the page component. Rejected — keeping validation in a separate API route is cleaner SRP.
- Server component with form action: Would require a redirect-based flow instead of inline error display. Rejected — inline errors provide better UX.

## R-006: Auth Cookie Utility Design

**Decision**: Create `src/lib/auth.ts` with shared constants and a `readAuthToken(request: NextRequest)` utility function.

**Rationale**: The auth cookie name and reading logic are needed in three places: middleware, `/api/auth/login` (to set it), `/api/auth/logout` (to clear it), `/api/search` (to read it), and `/api/suggestions` (to read it). Extracting this into a shared utility follows DRY and provides a single place to change cookie configuration.

**Exports**:
- `AUTH_COOKIE_NAME = "picnic_auth_token"` — named constant, UPPER_SNAKE_CASE per constitution.
- `AUTH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60` — 30 days, named constant.
- `LOGIN_PATH = "/login"` — avoids magic string in middleware and redirects.
- `readAuthToken(request: NextRequest): string | null` — reads token from cookie, returns null if absent.

**Alternatives considered**:
- Inline cookie reading in each route: Violates DRY — same `request.cookies.get(AUTH_COOKIE_NAME)?.value` in 4+ files. Rejected.
- Full auth service class: Over-engineered for reading a cookie. Rejected — utility functions are sufficient.

## R-007: Sign-Out Implementation

**Decision**: Add a sign-out button to the site header in `page.tsx` that sends a POST to `/api/auth/logout`, then redirects to `/login` via `window.location.href`.

**Rationale**: The sign-out action must clear the HTTP-only cookie (which can only be done server-side) and redirect the user. A POST request to a dedicated API route clears the cookie by setting `maxAge: 0`. Using `window.location.href` for the redirect (instead of `router.push`) ensures a full page reload, which clears any client-side cached state (search results, etc.).

**Alternatives considered**:
- `router.push('/login')` after logout: Would keep cached client state in memory. Rejected — full reload is cleaner.
- DELETE method on `/api/auth/login`: Semantically odd. Rejected — separate `/logout` route is clearer.

## R-008: Expired Token Handling During Active Use

**Decision**: When an API route receives a 401/403 from the Picnic API, return a specific error response (`{ error: "...", code: "TOKEN_EXPIRED" }`) that the client detects and uses to redirect to `/login` with a message.

**Rationale**: Per the spec edge case, if a token expires while the user is actively using the app, the next API call will fail. The API route catches this and returns a distinguishable error. The client-side code in `page.tsx` checks for this error code and redirects to `/login?expired=true`, where the login page shows an "Your token has expired" message.

**Alternatives considered**:
- Middleware-level token re-validation on every request: Would add latency to every page load. Rejected — validate on login, handle expiry reactively.
- Client-side error boundary: Would catch rendering errors but not API errors. Rejected — API route error handling is more targeted.
