# Tasks: Auth Token Gate

**Input**: Design documents from `/specs/004-auth-token-gate/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No test framework is configured. Validation is `npm run lint && npx tsc --noEmit && npm run build`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared auth utilities and refactor the PicnicClient from singleton to per-request factory. These are the building blocks all subsequent phases depend on.

- [X] T001 Create auth constants and cookie utility functions in src/lib/auth.ts — export AUTH_COOKIE_NAME ("picnic_auth_token"), AUTH_COOKIE_MAX_AGE_SECONDS (30 days), LOGIN_PATH ("/login"), and readAuthToken(request: NextRequest): string | null that reads the token from the request cookie
- [X] T002 Refactor src/lib/picnic-client.ts — remove the singleton pattern (delete module-level `let instance`), remove `process.env.PICNIC_AUTH_TOKEN` access, rename `getPicnicClient()` to `buildPicnicClient(authToken: string)` that creates and returns a new PicnicClient instance per call
- [X] T003 Add auth-related types to src/lib/types.ts — add AuthApiResponse type ({ success: boolean; error?: string }), AuthErrorCode union type ("TOKEN_EXPIRED" | "TOKEN_INVALID" | "API_UNREACHABLE"), and ApiErrorResponse extension with optional `code` field for error classification

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the middleware route gate and auth API routes. These MUST be complete before any user story can be fully implemented and tested.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Create Next.js middleware in src/middleware.ts — import AUTH_COOKIE_NAME and LOGIN_PATH from src/lib/auth.ts, read token from request.cookies, redirect to LOGIN_PATH if token is missing, pass through if token exists. Export a matcher config that excludes /login, /api/auth/:path*, /_next/:path*, and /favicon.ico
- [X] T005 [P] Create POST /api/auth/login route in src/app/api/auth/login/route.ts — read { token } from request body, validate token by calling buildPicnicClient(token).catalog.getSuggestions(""), on success set HTTP-only cookie (using AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE_SECONDS, httpOnly, sameSite lax, path /, secure in production) and return { success: true }, on 401/403 return { success: false, error: "TOKEN_INVALID" }, on network error return { success: false, error: "API_UNREACHABLE" }
- [X] T006 [P] Create POST /api/auth/logout route in src/app/api/auth/logout/route.ts — clear the auth cookie by setting it with maxAge 0 and return { success: true }

**Checkpoint**: Auth infrastructure ready — middleware gates all routes, login/logout API routes handle cookie CRUD.

---

## Phase 3: User Story 1 — Enter Auth Token to Access the Application (Priority: P1) 🎯 MVP

**Goal**: Users can enter their Picnic auth token on a login page, have it validated, and gain access to the application. Token persists across sessions via HTTP-only cookie.

**Independent Test**: Clear all cookies, visit http://localhost:3000 — should redirect to /login. Enter a valid Picnic token, click "Inloggen" — should redirect to the main search page. Search for "tomaten" — should return results. Close and reopen browser — should still be logged in.

### Implementation for User Story 1

- [X] T007 [US1] Create login page in src/app/login/page.tsx — client component ("use client") with: Picnic logo, "Picnic Auth Token" label, masked input field (type="password") with show/hide toggle button, "Inloggen" submit button, loading state (disabled button + spinner during validation). On submit: POST to /api/auth/login with { token }, on success redirect via window.location.href to "/" (or ?redirect= param if present). Read ?expired=true query param to show expiry message on load.
- [X] T008 [US1] Update src/app/api/search/route.ts — replace getPicnicClient() with readAuthToken(request) + buildPicnicClient(token), return 401 with { error: "Authentication required", code: "TOKEN_EXPIRED" } if token is missing, detect 401/403 from Picnic API and return { error: "Your token has expired", code: "TOKEN_EXPIRED" } instead of generic 502
- [X] T009 [US1] Update src/app/api/suggestions/route.ts — same changes as T008: replace getPicnicClient() with readAuthToken(request) + buildPicnicClient(token), handle missing token with 401, detect 401/403 from Picnic API and return TOKEN_EXPIRED error
- [X] T010 [US1] Update src/app/page.tsx — detect TOKEN_EXPIRED error code in search/suggestions responses and redirect to /login?expired=true via window.location.href
- [X] T011 [US1] Remove PICNIC_AUTH_TOKEN from .env file — delete the line containing PICNIC_AUTH_TOKEN (keep any other env vars if present). This fulfills FR-001.
- [X] T012 [US1] Run validation: npm run lint && npx tsc --noEmit && npm run build — fix any type errors from the getPicnicClient → buildPicnicClient migration and auth.ts imports

**Checkpoint**: User Story 1 complete — unauthenticated users are redirected to /login, can enter a valid token, and access the full application. Token persists across sessions.

---

## Phase 4: User Story 2 — Token Validation Feedback (Priority: P1)

**Goal**: Users see clear, distinguished error messages when they enter an invalid token or when the Picnic API is unreachable during validation.

**Independent Test**: On the login page, enter "abc123" and submit — should see "Token is ongeldig. Probeer opnieuw." error. Remain on login page, able to try again.

### Implementation for User Story 2

- [X] T013 [US2] Enhance error display in src/app/login/page.tsx — display error messages from the API response: map "TOKEN_INVALID" to "Token is ongeldig. Probeer opnieuw.", map "API_UNREACHABLE" to "Kan token niet verifiëren. Probeer het later opnieuw.", show client-side validation "Voer een token in" for empty submissions. Style error text in red below the form. Clear error when user starts typing.
- [X] T014 [US2] Verify error classification in src/app/api/auth/login/route.ts — ensure the catch block distinguishes between Picnic API auth errors (401/403 → TOKEN_INVALID) and network/timeout errors (→ API_UNREACHABLE). Test by reviewing error handling paths.
- [X] T015 [US2] Run validation: npm run lint && npx tsc --noEmit && npm run build

**Checkpoint**: User Story 2 complete — invalid tokens show specific error messages, unreachable API shows distinct message, empty submissions are caught client-side.

---

## Phase 5: User Story 3 — Sign Out / Change Token (Priority: P2)

**Goal**: Authenticated users can sign out via a button in the site header, clearing their token and returning to the login screen.

**Independent Test**: Log in with a valid token. Click "Uitloggen" in the header. Verify redirect to /login. Verify that navigating to http://localhost:3000 redirects back to /login (token fully cleared).

### Implementation for User Story 3

- [X] T016 [US3] Add sign-out button to site header in src/app/page.tsx — add an "Uitloggen" button next to the Picnic logo in the sticky header. On click: POST to /api/auth/logout, then redirect via window.location.href = "/login" for full page reload. Style as a text button (not primary) to avoid visual conflict with search.
- [X] T017 [US3] Run validation: npm run lint && npx tsc --noEmit && npm run build

**Checkpoint**: User Story 3 complete — sign-out clears the cookie, redirects to login, and prevents access until a new token is entered.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, deep link support, and final validation across all stories.

- [X] T018 Add deep link redirect support to src/middleware.ts — when redirecting an unauthenticated user to /login, append the original URL as a ?redirect= query parameter (e.g., /login?redirect=%2F%3Fq%3Dmelk). The login page (T007) already reads this param and redirects after successful login.
- [X] T019 [P] Verify middleware excludes static assets — confirm /_next/static, /_next/image, and /favicon.ico are not gated by the middleware matcher config. Test by loading the login page CSS/JS without a cookie.
- [X] T020 Run full validation: npm run lint && npx tsc --noEmit && npm run build — ensure all changes compile cleanly with no lint errors
- [X] T021 Run quickstart.md manual validation — walk through all 5 test scenarios from specs/004-auth-token-gate/quickstart.md (happy path, invalid token, sign out, expired token, deep link)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion (T001, T002, T003) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 3 (US2 enhances the login page created in US1)
- **User Story 3 (Phase 5)**: Depends on Phase 2 completion (independent of US1/US2 for implementation, but better tested after US1 is working)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — Creates the login page and wires up the full auth flow
- **User Story 2 (P1)**: Depends on US1 (Phase 3) — Enhances the login page with error classification and display
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) — Adds sign-out button and logout flow. Independent of US2 but practical to implement after US1.

### Within Each User Story

- Shared infrastructure before story-specific code
- API routes before UI components that consume them
- Core implementation before integration/polish
- Validation run at end of each phase

### Parallel Opportunities

- T001, T002, T003 in Phase 1 are independent files — all can run in parallel
- T005 and T006 in Phase 2 are independent API routes — can run in parallel (after T001-T003)
- T008 and T009 in Phase 3 are independent route modifications — can run in parallel

---

## Parallel Example: Phase 1

```text
# All three setup tasks touch different files — run in parallel:
Task T001: "Create auth constants and cookie utility in src/lib/auth.ts"
Task T002: "Refactor src/lib/picnic-client.ts — singleton to factory"
Task T003: "Add auth-related types to src/lib/types.ts"
```

## Parallel Example: Phase 2

```text
# Both auth API routes are independent — run in parallel:
Task T005: "Create POST /api/auth/login route in src/app/api/auth/login/route.ts"
Task T006: "Create POST /api/auth/logout route in src/app/api/auth/logout/route.ts"
```

## Parallel Example: Phase 3

```text
# Both API route modifications are the same pattern, different files — run in parallel:
Task T008: "Update src/app/api/search/route.ts"
Task T009: "Update src/app/api/suggestions/route.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006)
3. Complete Phase 3: User Story 1 (T007-T012)
4. Complete Phase 4: User Story 2 (T013-T015)
5. **STOP and VALIDATE**: Test login flow with valid and invalid tokens
6. Application is fully functional with auth gating at this point

### Incremental Delivery

1. Setup + Foundational → Auth infrastructure ready
2. Add User Story 1 → Login works, app is gated (MVP)
3. Add User Story 2 → Error messages are clear and helpful
4. Add User Story 3 → Sign-out works → Full feature complete
5. Polish → Deep links, edge cases, final validation

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- No test framework — validation is lint + typecheck + build after each phase
- The `.env` file removal (T011) should happen last in Phase 3 to avoid breaking the build mid-phase
- US2 depends on US1 because it enhances the same login page — cannot be parallelized with US1
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
