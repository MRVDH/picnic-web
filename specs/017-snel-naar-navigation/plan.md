# Implementation Plan: Snel Naar Category Navigation

**Branch**: `017-snel-naar-navigation` | **Date**: 2026-04-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-snel-naar-navigation/spec.md`

## Summary

Make "Snel naar" shortcut tiles clickable so they navigate to the corresponding category page. The implementation adds an `onShortcutTap` callback prop to `ShortcutList` (mirroring `CategoryGrid`'s `onCategoryTap` pattern), creates a deep-link parser utility to extract category IDs from the API's `deepLinkTarget` strings, and wires navigation in the home page component.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20.9+
**Primary Dependencies**: Next.js 16.2.1 (App Router), React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0
**Storage**: N/A (no persistent storage; navigation is stateless)
**Testing**: ESLint (no test runner configured)
**Target Platform**: Web browser
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Navigation under 2 seconds (standard web expectations)
**Constraints**: Follow existing callback-prop navigation pattern; no new routing infrastructure
**Scale/Scope**: 3 files modified, 1 new file (~30 lines)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SRP/DRY/DI | PASS | Deep-link parser is a separate utility (SRP). Navigation callback pattern reused from CategoryGrid (DRY). |
| II. Naming | PASS | `onShortcutTap`, `handleShortcutTap`, `parseCategoryIdFromDeepLink` — verb-first camelCase, descriptive. |
| III. Forbidden Anti-Patterns | PASS | No god objects, no deep nesting, no magic strings. All files stay well under 300 lines. |
| IV. Self-Refactor | PASS | Will apply before output. |
| V. Readability | PASS | Follows established patterns; no clever constructs. |

**Post-Phase 1 re-check**: PASS — no violations introduced by design decisions.

## Project Structure

### Documentation (this feature)

```text
specs/017-snel-naar-navigation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── page.tsx                    # MODIFY: add handleShortcutTap, thread through CategoryBrowser
├── components/
│   └── shortcut-list.tsx           # MODIFY: add onShortcutTap prop, wire onClick on ShortcutRow
└── lib/
    ├── category-types.ts           # EXISTING: ShortcutItem type (no changes)
    ├── parse-shortcuts.ts          # EXISTING: shortcut PML parser (no changes)
    └── parse-deep-link.ts          # NEW: parseCategoryIdFromDeepLink utility
```

**Structure Decision**: Single Next.js web application. All changes are in the existing `src/` tree. One new utility file in `src/lib/` for deep-link parsing; the rest are modifications to existing components.

## Complexity Tracking

No constitution violations. This table is intentionally empty.
