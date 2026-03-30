# Implementation Plan: Auth Token Gate

**Branch**: `004-auth-token-gate` | **Date**: 2026-03-30 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/004-auth-token-gate/spec.md`

## Summary

Replace the server-side `PICNIC_AUTH_TOKEN` environment variable with a per-user authentication flow. Users must enter their Picnic auth token on a login page before accessing any application content. The token is stored as an HTTP-only cookie, validated against the Picnic API, and read server-side on every request via Next.js middleware. A sign-out button in the site header clears the cookie and returns the user to the login screen.

**Technical approach**: Create a Next.js middleware (`src/middleware.ts`) that gates all routes except `/login` and `/api/auth/*`. Add a `/login` page with a masked token input. Add `/api/auth/login` and `/api/auth/logout` API routes for cookie management. Refactor `picnic-client.ts` from a singleton to a per-request factory that accepts an auth token parameter. Modify existing API routes to read the token from the cookie.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20.9+  
**Primary Dependencies**: Next.js 16.2.1, React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0  
**Storage**: HTTP-only cookie (`picnic_auth_token`) — browser-managed, server-readable  
**Testing**: `npm run lint && npx tsc --noEmit && npm run build` (no test runner configured)  
**Target Platform**: Web (desktop + mobile browsers)  
**Project Type**: Web application (Next.js)  
**Performance Goals**: Token validation must complete within 5 seconds (SC-003); returning users access instantly (no validation on every page load)  
**Constraints**: No new npm dependencies; 300-line file limit per constitution; all files kebab-case  
**Scale/Scope**: Single-user per browser session; one auth token active at a time

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Gate Evaluation

| Principle | Status | Assessment |
|-----------|--------|------------|
| **I. SRP** | PASS | Each new file has a single responsibility: middleware (route gating), login page (token entry UI), auth API routes (cookie CRUD), picnic-client factory (client instantiation). No existing file gains compound responsibilities. |
| **I. DRY** | PASS | Token-from-cookie extraction is a single utility function shared by all API routes. PicnicClient creation logic remains in one factory function. |
| **I. Dependency Injection** | PASS | `getPicnicClient()` is refactored to accept `authToken` as a parameter instead of reading from `process.env` internally. API routes inject the token they read from cookies. |
| **II. Naming** | PASS | `buildPicnicClient(authToken)` — verb-first camelCase. `isAuthenticated` — boolean prefix. `AUTH_COOKIE_NAME` — UPPER_SNAKE_CASE constant. Files: `middleware.ts`, `login/page.tsx`, `auth/login/route.ts` — kebab-case or Next.js convention. |
| **III. No God Files** | PASS | Login page estimated ~80 lines. Middleware ~40 lines. Auth routes ~40 lines each. Modified `picnic-client.ts` shrinks (removes singleton). `page.tsx` adds sign-out button (~10 lines). All under 300 lines. |
| **III. No Deep Nesting** | PASS | Login page has flat rendering. Middleware uses early returns for unauthenticated/excluded paths. |
| **III. No Magic Numbers** | PASS | Cookie name, cookie max-age, and public paths extracted as named constants. |
| **III. No Error Swallowing** | PASS | Token validation errors are caught, classified (invalid vs. unreachable), and surfaced to the user. API route 401/403 responses trigger redirect with message. |
| **III. No Implicit Global State** | PASS | The mutable module-level singleton (`let instance`) is removed. `buildPicnicClient` is a pure factory function — no cached state. |
| **IV. Self-Refactor** | ACKNOWLEDGED | Will be applied during implementation. |
| **V. Readability** | PASS | Explicit cookie reading, clear guard clauses in middleware, straightforward login form. No clever constructs. |

### Post-Phase 1 Gate Re-Evaluation

| Principle | Status | Assessment |
|-----------|--------|------------|
| **I. SRP** | PASS | Design confirms clean separation: middleware for gating, auth routes for cookie management, login page for UI, client factory for instantiation. |
| **I. DRY** | PASS | Cookie reading utility (`readAuthToken`) used by all API routes and middleware. `buildPicnicClient` used by all API routes. No duplication. |
| **I. Dependency Injection** | PASS | Confirmed — `buildPicnicClient(authToken)` replaces `getPicnicClient()` singleton. Token is injected, not read from environment. |
| **III. No Implicit Global State** | PASS | Singleton removed. Each request creates its own client instance. |
| All others | PASS | No changes from pre-Phase 0 assessment. |

**Gate result: ALL PASS. No violations to track.**

## Project Structure

### Documentation (this feature)

```text
specs/004-auth-token-gate/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: Technical research decisions
├── data-model.md        # Phase 1: Entity and state model
├── quickstart.md        # Phase 1: Development guide
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── page.tsx                    # MODIFIED: Add sign-out button to header
│   ├── layout.tsx                  # UNCHANGED
│   ├── globals.css                 # UNCHANGED
│   ├── login/
│   │   └── page.tsx                # NEW: Token entry page (masked input, show/hide toggle, submit)
│   └── api/
│       ├── auth/
│       │   ├── login/
│       │   │   └── route.ts        # NEW: POST — validate token, set HTTP-only cookie
│       │   └── logout/
│       │       └── route.ts        # NEW: POST — clear auth cookie, return success
│       ├── search/
│       │   └── route.ts            # MODIFIED: Read token from cookie, pass to buildPicnicClient
│       └── suggestions/
│           └── route.ts            # MODIFIED: Read token from cookie, pass to buildPicnicClient
├── components/
│   └── ...                         # UNCHANGED
├── hooks/
│   └── ...                         # UNCHANGED
├── lib/
│   ├── picnic-client.ts            # MODIFIED: Remove singleton, export buildPicnicClient(authToken)
│   ├── auth.ts                     # NEW: Auth constants and cookie utilities (AUTH_COOKIE_NAME, readAuthToken, etc.)
│   └── types.ts                    # UNCHANGED
└── middleware.ts                    # NEW: Next.js middleware — redirect unauthenticated users to /login
```

**Structure Decision**: Continues the existing Next.js app structure. Auth-related API routes go under `api/auth/` following REST resource conventions. Shared auth utilities go in `src/lib/auth.ts` (single file, estimated ~30 lines). The middleware file is at `src/middleware.ts` per Next.js convention. Login page follows Next.js app router convention at `src/app/login/page.tsx`.

## Design Decisions (from research.md)

| # | Decision | Rationale |
|---|----------|-----------|
| R-001 | HTTP-only cookie for token storage | Auto-sent with every request; enables middleware-level gating; immune to XSS-based token theft via `document.cookie` |
| R-002 | Next.js middleware for route gating | Runs before rendering; intercepts all routes at the edge; cleaner than per-page auth checks |
| R-003 | Replace singleton with `buildPicnicClient(authToken)` factory | Singleton caches one token — incompatible with per-user tokens; factory pattern is stateless and constitution-compliant (no implicit global state) |
| R-004 | Token validation via test API call (`getSuggestions("")`) | No JWT secret available client-side; only the Picnic API can confirm a token works; empty suggestion query is lightweight |
| R-005 | Separate `/api/auth/login` and `/api/auth/logout` routes | SRP — one route sets cookie, one clears it; enables future extension (e.g., token refresh) |
| R-006 | `readAuthToken(request)` utility in `src/lib/auth.ts` | DRY — shared by middleware and all API routes; single place to update cookie name or parsing logic |
| R-007 | Sign-out button in site header via `page.tsx` | Spec requirement (FR-007, clarification); visible on every page; triggers POST to `/api/auth/logout` then redirects to `/login` |

## Complexity Tracking

> No violations detected. Table intentionally left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
