# Quickstart: Auth Token Gate

**Feature**: 004-auth-token-gate  
**Date**: 2026-03-30

## Prerequisites

- Node.js 20.9+
- `npm install` completed (no new dependencies required for this feature)
- A valid Picnic auth token (JWT) for testing

## Development

```bash
# Start dev server
npm run dev

# Run validation
npm run lint && npx tsc --noEmit && npm run build
```

## What This Feature Adds

Authentication gating for the entire application:
1. Users must enter their Picnic auth token on a login page before accessing any content
2. Token is stored as an HTTP-only cookie (survives browser restarts)
3. Next.js middleware redirects unauthenticated users to `/login`
4. Sign-out button in the header clears the token and returns to login
5. The `.env` file is no longer used for `PICNIC_AUTH_TOKEN`

## New Files

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Next.js middleware — intercepts all requests, redirects unauthenticated users to `/login` |
| `src/app/login/page.tsx` | Login page — masked token input with show/hide toggle, submit button, error display |
| `src/app/api/auth/login/route.ts` | POST route — validates token against Picnic API, sets HTTP-only cookie on success |
| `src/app/api/auth/logout/route.ts` | POST route — clears auth cookie, returns success |
| `src/lib/auth.ts` | Shared auth constants (`AUTH_COOKIE_NAME`, `LOGIN_PATH`) and `readAuthToken()` utility |

## Modified Files

| File | Change |
|------|--------|
| `src/lib/picnic-client.ts` | Replace singleton `getPicnicClient()` with factory `buildPicnicClient(authToken)` — accepts token parameter, no module-level state |
| `src/app/api/search/route.ts` | Read token from cookie via `readAuthToken()`, pass to `buildPicnicClient()`, handle 401 as `TOKEN_EXPIRED` |
| `src/app/api/suggestions/route.ts` | Same changes as search route |
| `src/app/page.tsx` | Add sign-out button to site header (POST to `/api/auth/logout`, full redirect to `/login`) |
| `.env` | Remove `PICNIC_AUTH_TOKEN` variable |

## Removed

| Item | Reason |
|------|--------|
| `PICNIC_AUTH_TOKEN` in `.env` | Replaced by per-user token entry via login page (FR-001) |
| Singleton pattern in `picnic-client.ts` | Incompatible with per-user tokens; replaced by stateless factory |

## Testing

### Happy Path
1. Clear all cookies for localhost (or use incognito)
2. Visit `http://localhost:3000` — should redirect to `/login`
3. Enter a valid Picnic auth token in the masked input
4. Click "Inloggen" — should redirect to the main search page
5. Search for "tomaten" — should return results (confirms token is being used)
6. Close and reopen the browser — should still be logged in (cookie persists)

### Invalid Token
1. On the login page, enter "abc123" and submit
2. Should see an error message: "Token is ongeldig"
3. Should remain on the login page

### Sign Out
1. While logged in, click "Uitloggen" in the header
2. Should redirect to `/login`
3. Should not be able to access `http://localhost:3000` without entering a token again

### Expired Token
1. Log in with a valid token
2. If the token expires (or is revoked externally), the next search should redirect to `/login` with an expiry message

### Deep Link
1. Clear cookies, then visit `http://localhost:3000/?q=melk`
2. Should redirect to `/login`
3. After entering a valid token, should redirect back to `/?q=melk`
