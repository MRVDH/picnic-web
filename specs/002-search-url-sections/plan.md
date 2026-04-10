# Implementation Plan: Search URL State and Section Headers

**Branch**: `002-search-url-sections` | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-search-url-sections/spec.md`

## Summary

Enhance the search results page with two capabilities: (1) sync the search query to a URL query parameter (`?q=`) so the page state survives refresh and is shareable, and (2) parse and display dynamic section headers from the Picnic Fusion API response so products are grouped under categories like "Tros- en pruimtomaten" and "Cherrytomaten" instead of a flat list.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20.9+
**Primary Dependencies**: Next.js 16.2.1, React 19.2.4, Tailwind CSS 4, picnic-api ^4.1.0
**Storage**: N/A (no persistent storage; search state is URL + client memory)
**Testing**: `npm run lint` + `npx tsc --noEmit` + `npm run build` (no test runner configured)
**Target Platform**: Web browser (desktop/mobile responsive)
**Project Type**: Web application (Next.js App Router, client-side rendered search page)
**Performance Goals**: Search results displayed within the same latency as current implementation (no additional round trips)
**Constraints**: Must not break existing search functionality; must work with the raw Fusion page API response
**Scale/Scope**: ~20 source files, single-page search app, ~200 products per search response

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Architectural Integrity (SRP, DRY, DI) | PASS | Each change touches a single responsibility: parser extracts sections, API returns sections, page syncs URL, components render sections. No duplication introduced. |
| II. Naming Conventions | PASS | New types (`SearchSection`), functions (`parseFusionSearchSections`), and components will follow existing verb-first camelCase and kebab-case file conventions. |
| III. Forbidden Anti-Patterns | PASS | No files will exceed 300 lines. No deep nesting. No magic strings (section header extraction uses structured PML traversal, not string matching). |
| IV. Self-Refactor Protocol | PASS | Will be applied during implementation. |
| V. Readability Over Cleverness | PASS | URL state uses standard Next.js `useSearchParams` pattern. Section parsing is explicit PML traversal. No clever tricks. |

**Gate result**: PASS — no violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-search-url-sections/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   └── search/
│   │       └── route.ts          # MODIFY: return sections in response
│   ├── page.tsx                  # MODIFY: URL state sync, section-aware rendering
│   └── globals.css
├── components/
│   ├── product-grid.tsx          # MODIFY: accept and render sections with headers
│   ├── product-card.tsx
│   ├── search-bar.tsx            # MODIFY: accept initialQuery prop
│   └── ...
├── hooks/
│   └── use-debounce.ts
└── lib/
    ├── parse-fusion-search.ts    # MODIFY: extract sections with headers from PML
    ├── types.ts                  # MODIFY: add SearchSection type, update API response
    └── ...
```

**Structure Decision**: Existing single-project Next.js App Router structure. No new directories needed. Changes span 6 existing files + type definitions.

## Constitution Check — Post-Design Re-evaluation

*Re-evaluated after Phase 1 design (data-model.md, contracts/, quickstart.md).*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Architectural Integrity (SRP, DRY, DI) | PASS | Parser has one job (PML → sections + products). API route has one job (fetch + serialize). Page has one job (URL state + render orchestration). ProductGrid has one job (render sections). No duplication between contracts. |
| II. Naming Conventions | PASS | `SearchSection` (noun type), `parseFusionSearchSections` (verb-first function), `initialQuery` (descriptive prop). All follow conventions. |
| III. Forbidden Anti-Patterns | **NEEDS REMEDIATION** | `parse-fusion-search.ts` is already 559 lines (pre-existing violation of 300-line limit). Adding section extraction would increase it further. **Remediation**: split the file during implementation — extract PML helper functions (`pml-helpers.ts`) and tile extraction (`extract-tile-data.ts`) to bring each file under 300 lines. |
| IV. Self-Refactor Protocol | PASS | The file split in Principle III is the self-refactor action. Will be applied during implementation. |
| V. Readability Over Cleverness | PASS | All patterns are standard: `useSearchParams`, `router.push`, PML tree walking with explicit ID matching. No cleverness. |

**Post-design gate result**: PASS with remediation — the 300-line violation on `parse-fusion-search.ts` is pre-existing and will be resolved by splitting the file during implementation.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `parse-fusion-search.ts` exceeds 300 lines (pre-existing) | Contains all PML parsing logic for product extraction | Splitting is the remediation — extract `pml-helpers.ts` (markdown/icon/tree helpers) and `extract-tile-data.ts` (per-tile extraction) from the monolithic file |

## Phase 1 Deliverables

- [x] `data-model.md` — SearchSection type, updated SearchApiResponse, URL state schema
- [x] `contracts/search-api.md` — Updated GET /api/search response contract
- [x] `contracts/page-url-state.md` — URL schema, component prop changes, Suspense boundary
- [x] `quickstart.md` — Implementation order and file-by-file guide
- [x] Agent context update (`AGENTS.md`) — ran `update-agent-context.sh opencode`
- [x] Constitution Check re-evaluation — PASS with remediation (300-line file split)
