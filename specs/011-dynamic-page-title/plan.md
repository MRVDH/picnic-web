# Implementation Plan: Dynamic Page Titles

**Branch**: `011-dynamic-page-title` | **Date**: 2026-04-13 | **Spec**: `specs/011-dynamic-page-title/spec.md`
**Input**: Feature specification from `/specs/011-dynamic-page-title/spec.md`

## Summary

Set dynamic, page-specific browser tab titles across all routes in the Picnic Web application using client-side `document.title` via `useEffect` hooks. Each page will display a title following the pattern `"[Page Context] - Picnic Web"` (or just `"Picnic Web"` for the default). The root layout's static metadata will be updated from `"Picnic Web — Product Search"` to `"Picnic Web"` to serve as a consistent server-rendered default. A shared `usePageTitle` custom hook will centralize title formatting, truncation (60-char limit with ellipsis), and fallback logic.

## Technical Context

**Language/Version**: TypeScript 5.9.3, Node.js 20.9+
**Primary Dependencies**: Next.js 16.2.1 (App Router), React 19.2.4, Tailwind CSS 4.2.2, picnic-api ^4.1.0
**Storage**: N/A (no persistent storage; title state is ephemeral client-side)
**Testing**: No test framework currently installed; validation via manual browser inspection and `npm run lint`
**Target Platform**: Web browser (desktop), Dutch locale (`lang="nl"`)
**Project Type**: Web application (Next.js App Router, all pages are client components)
**Performance Goals**: Title updates within 1 second of page content becoming visible (SC-003)
**Constraints**: All page components are `"use client"`; titles set via `document.title` in `useEffect` (no server-side metadata APIs at page level). Title context truncated at 60 characters with ellipsis.
**Scale/Scope**: 4 page routes (`/`, `/login`, `/cart`, `/product/[id]`) + 1 error boundary + 1 root layout

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. SRP / DRY / DI** | PASS | Title logic will be extracted into a single shared `usePageTitle` hook (DRY). Each page calls the hook with its own context string (SRP). No dependency instantiation needed. |
| **II. Naming Conventions** | PASS | Hook named `usePageTitle` (verb-first camelCase). Constants like `APP_NAME`, `TITLE_SEPARATOR`, `MAX_TITLE_CONTEXT_LENGTH` will use UPPER_SNAKE_CASE. |
| **III. Forbidden Anti-Patterns** | PASS | No god objects (hook is <30 lines). No deep nesting. Magic strings ("Picnic Web", " - ") extracted to named constants. No error swallowing. |
| **IV. Self-Refactor Protocol** | PASS | Will be enforced during implementation. |
| **V. Readability Over Cleverness** | PASS | Simple `useEffect` + `document.title` assignment. No clever constructs needed. |

**Gate result: PASS** — no violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/011-dynamic-page-title/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx              # Update: metadata.title → "Picnic Web"
│   ├── page.tsx                # Update: add usePageTitle (home/search)
│   ├── error.tsx               # Update: add usePageTitle fallback
│   ├── login/
│   │   └── page.tsx            # Update: add usePageTitle("Inloggen")
│   ├── cart/
│   │   └── page.tsx            # Update: add usePageTitle("Winkelwagen")
│   └── product/
│       └── [id]/
│           └── page.tsx        # Update: add usePageTitle(product.name)
├── hooks/
│   ├── use-debounce.ts         # Existing
│   ├── use-scroll-spy.ts       # Existing
│   └── use-page-title.ts       # NEW: shared page title hook
└── lib/
    └── constants.ts            # Update: add APP_NAME, TITLE_SEPARATOR, MAX_TITLE_CONTEXT_LENGTH
```

**Structure Decision**: Next.js App Router single-project structure. New code is one custom hook (`src/hooks/use-page-title.ts`) plus constants additions. All other changes are modifications to existing page files. No new directories needed. The `contracts/` directory is omitted as this feature has no external interfaces.

## Complexity Tracking

> No constitution violations to justify — all clear.
