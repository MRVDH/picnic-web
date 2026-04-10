# Implementation Plan: Section Navigation Badges

**Branch**: `003-section-nav-badges` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/003-section-nav-badges/spec.md`

## Summary

Add a sticky horizontal badge bar to the search results page, with one badge per section header. Clicking a badge smooth-scrolls to that section. The active badge dynamically tracks the user's scroll position via IntersectionObserver and is highlighted in Picnic red. The badge bar uses native horizontal overflow scrolling and auto-scrolls to keep the active badge visible.

**Technical approach**: Two new files — a `SectionNavBar` component and a `useScrollSpy` hook — plus minor modifications to `ProductGrid` (add section `id` attributes) and `page.tsx` (render the badge bar inside the sticky header). No new dependencies; uses native browser APIs (`IntersectionObserver`, `scrollIntoView`, `scroll-margin-top` CSS).

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20.9+  
**Primary Dependencies**: Next.js 16.2.1, React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0  
**Storage**: N/A (no persistent storage; all state is ephemeral client-side)  
**Testing**: `npm run lint && npx tsc --noEmit && npm run build` (no test runner configured)  
**Target Platform**: Web (desktop + mobile browsers)  
**Project Type**: Web application (Next.js SPA)  
**Performance Goals**: Scroll-spy updates must feel instant (<100ms perceived latency); badge click-to-scroll must animate smoothly  
**Constraints**: No new npm dependencies; 300-line file limit per constitution; all files kebab-case  
**Scale/Scope**: Typical search returns 5-15 sections; badge bar must handle up to ~20 sections gracefully

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Gate Evaluation

| Principle | Status | Assessment |
|-----------|--------|------------|
| **I. SRP** | PASS | Two new files with single responsibilities: `section-nav-bar.tsx` (render badge bar) and `use-scroll-spy.ts` (observe scroll position). No existing files gain compound responsibilities. |
| **I. DRY** | PASS | No duplicated logic. The scroll-spy hook is a single shared abstraction. Badge rendering is localized to one component. |
| **I. Dependency Injection** | PASS | `useScrollSpy` receives section count as a parameter. `SectionNavBar` receives sections as props. No internal instantiation of services. |
| **II. Naming** | PASS | `SectionNavBar` (component), `useScrollSpy` (hook), `activeSectionIndex` (state), `scrollToSection` (handler) — all verb-first camelCase or descriptive noun-based. Files: `section-nav-bar.tsx`, `use-scroll-spy.ts` (kebab-case). |
| **III. No God Files** | PASS | New files estimated at ~60-80 lines each. Modified files (`product-grid.tsx` at 40 lines, `page.tsx` at 208 lines) remain well under 300 lines after changes. |
| **III. No Deep Nesting** | PASS | Component rendering is flat (map over sections). Hook logic uses early returns. |
| **III. No Magic Numbers** | PASS | Constants for section ID prefix (`SECTION_ID_PREFIX`), scroll behavior options, and observer thresholds will be named. |
| **III. No Error Swallowing** | PASS | No try/catch needed — IntersectionObserver and scrollIntoView don't throw in normal usage. |
| **IV. Self-Refactor** | ACKNOWLEDGED | Will be applied during implementation. |
| **V. Readability** | PASS | Explicit state management, clear prop threading, no clever constructs. |

### Post-Phase 1 Gate Re-Evaluation

| Principle | Status | Assessment |
|-----------|--------|------------|
| **I. SRP** | PASS | Design confirms separation: hook for observation, component for rendering, ProductGrid for section IDs. |
| **I. DRY** | PASS | Section ID generation logic (`buildSectionId`) defined once, used by both ProductGrid and useScrollSpy. |
| **III. No God Files** | PASS | `page.tsx` gains ~5 lines (import + badge bar render). `product-grid.tsx` gains ~3 lines (id attribute + className). Both stay under 300 lines. |
| All others | PASS | No changes from pre-Phase 0 assessment. |

**Gate result: ALL PASS. No violations to track.**

## Project Structure

### Documentation (this feature)

```text
specs/003-section-nav-badges/
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
│   ├── page.tsx                # MODIFIED: Render SectionNavBar inside sticky header
│   ├── globals.css             # UNCHANGED (picnic-red already defined)
│   └── api/search/route.ts     # UNCHANGED
├── components/
│   ├── section-nav-bar.tsx     # NEW: Badge bar component
│   ├── product-grid.tsx        # MODIFIED: Add id + scroll-margin-top to sections
│   ├── product-card.tsx        # UNCHANGED
│   └── search-bar.tsx          # UNCHANGED
├── hooks/
│   ├── use-scroll-spy.ts       # NEW: IntersectionObserver-based scroll spy hook
│   └── use-debounce.ts         # UNCHANGED
└── lib/
    ├── types.ts                # UNCHANGED (no new types needed; uses existing SearchSection)
    └── ...                     # UNCHANGED
```

**Structure Decision**: Single Next.js web application. No new directories needed — new files go into existing `src/components/` and `src/hooks/` directories. The project uses a flat component structure (no nested feature folders), which is appropriate given the small codebase size.

## Design Decisions (from research.md)

| # | Decision | Rationale |
|---|----------|-----------|
| R-001 | Native `IntersectionObserver` via custom `useScrollSpy` hook | No scroll libraries installed; native API is sufficient and performant |
| R-002 | Index-based section IDs (`section-0`, `section-1`) | Avoids Unicode/duplicate issues with title slugification |
| R-003 | Badge bar inside existing sticky `<header>` container | Eliminates need to calculate header height for `top` offset |
| R-004 | Two new files: `section-nav-bar.tsx` + `use-scroll-spy.ts` | SRP compliance; component renders, hook observes |
| R-005 | Active: `bg-picnic-red text-white`, Inactive: `bg-gray-100 text-gray-700` | Matches Picnic brand; clear visual distinction |
| R-006 | `scroll-margin-top` CSS on section elements | Pure CSS offset compensation; no JS height measurement |
| R-007 | `scrollIntoView({ inline: 'center' })` on active badge | Auto-centers active badge in horizontal overflow |

## Complexity Tracking

> No violations detected. Table intentionally left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
