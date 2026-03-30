# Data Model: Auth Token Gate

**Feature**: 004-auth-token-gate  
**Date**: 2026-03-30

## Entities

### AuthToken

The Picnic API authentication token provided by the user. Stored as an HTTP-only cookie and used server-side for all Picnic API requests.

| Field | Type | Description |
|-------|------|-------------|
| `value` | `string` | The raw JWT string. Opaque to this application — only the Picnic API can interpret and validate it. |
| `storage` | `HTTP-only cookie` | Browser-managed cookie named `picnic_auth_token`. Auto-sent with every request to the server. Not accessible via client-side JavaScript. |
| `maxAge` | `number` | Cookie expiry: 30 days (2,592,000 seconds). After expiry, the browser deletes the cookie and the user must re-enter their token. |

### AuthState (client-side)

The current authentication state of the user, as understood by the login page UI. This is ephemeral — exists only as React component state on the login page.

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `status` | `string` | `idle`, `validating`, `error` | Current state of the token submission flow. |
| `errorMessage` | `string \| null` | — | Human-readable error text shown to the user when `status === "error"`. Null otherwise. |

### AuthApiResponse

Response shape from the `/api/auth/login` route.

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Whether the token was accepted and the cookie was set. |
| `error` | `string \| undefined` | Error message if validation failed. Present only when `success === false`. |

### AuthErrorCode

Distinguishable error codes returned by API routes when a Picnic API call fails due to authentication.

| Code | Meaning | Trigger |
|------|---------|---------|
| `TOKEN_EXPIRED` | The stored token is no longer valid | Picnic API returns 401/403 during a search or suggestions request |
| `TOKEN_INVALID` | The submitted token failed validation | Picnic API returns 401/403 during login validation |
| `API_UNREACHABLE` | Cannot connect to Picnic API | Network error or timeout during token validation |

## Relationships

```
User (browser)
  │
  ├── Cookie: picnic_auth_token (AuthToken.value)
  │     │
  │     ├── Read by: src/middleware.ts (route gating)
  │     ├── Read by: src/app/api/search/route.ts (API calls)
  │     ├── Read by: src/app/api/suggestions/route.ts (API calls)
  │     ├── Set by: src/app/api/auth/login/route.ts (after validation)
  │     └── Cleared by: src/app/api/auth/logout/route.ts (sign-out)
  │
  └── Login page state (AuthState)
        │
        └── Transitions based on form submission → /api/auth/login response
```

## State Transitions

### Middleware Gate (every request)

```
Request arrives
  │
  ├── Path matches excluded routes (/login, /api/auth/*, /_next/*, /favicon.ico)
  │   └── ALLOW — pass through without auth check
  │
  └── Path requires auth
      │
      ├── Cookie picnic_auth_token EXISTS and non-empty
      │   └── ALLOW — pass through to page/route handler
      │
      └── Cookie MISSING or empty
          └── REDIRECT → /login
```

### Login Flow (login page)

```
AuthState: idle
  │
  └── User submits token
      │
      ├── Token is empty string
      │   └── AuthState: error ("Voer een token in")
      │
      └── Token is non-empty
          │
          └── POST /api/auth/login { token }
              │
              ├── AuthState: validating (show loading)
              │
              ├── Response: { success: true }
              │   └── Redirect to "/" (or original URL from ?redirect= param)
              │       └── AuthState: (page unloads, state discarded)
              │
              ├── Response: { success: false, error: "TOKEN_INVALID" }
              │   └── AuthState: error ("Token is ongeldig. Probeer opnieuw.")
              │
              └── Response: { success: false, error: "API_UNREACHABLE" }
                  └── AuthState: error ("Kan token niet verifiëren. Probeer het later opnieuw.")
```

### Sign-Out Flow

```
User clicks "Uitloggen" button in header
  │
  └── POST /api/auth/logout
      │
      ├── Server clears picnic_auth_token cookie (maxAge: 0)
      │
      └── Client receives response
          └── window.location.href = "/login"
              └── Full page reload — all client state cleared
```

### Token Expiry During Active Use

```
User makes search or suggestions request
  │
  └── API route reads token from cookie → calls Picnic API
      │
      ├── Picnic API returns 200 (success)
      │   └── Normal response to client
      │
      └── Picnic API returns 401/403
          └── API route returns { error: "...", code: "TOKEN_EXPIRED" }
              └── Client detects code === "TOKEN_EXPIRED"
                  └── window.location.href = "/login?expired=true"
                      └── Login page shows "Je token is verlopen. Voer een nieuw token in."
```

## Validation Rules

- **AuthToken.value**: MUST be a non-empty string. Client-side validation prevents empty submission. Server-side validation confirms the token works against the Picnic API.
- **AUTH_COOKIE_NAME**: MUST be `"picnic_auth_token"` — defined as a constant in `src/lib/auth.ts`.
- **Cookie flags**: MUST include `httpOnly: true`, `sameSite: 'lax'`, `path: '/'`.

## No Persistent Storage

This feature uses only browser cookies for token storage. No database, file system, or server-side session store is involved. The cookie is the single source of truth for authentication state. Clearing the cookie (via sign-out or browser settings) immediately revokes access.
