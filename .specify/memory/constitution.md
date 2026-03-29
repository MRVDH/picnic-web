<!--
  ============================================================================
  SYNC IMPACT REPORT
  ============================================================================
  Version change: N/A (initial) → 1.0.0
  Modified principles: N/A (first ratification)
  Added sections:
    - Core Principles (5 principles)
    - Forbidden Anti-Patterns (dedicated section)
    - Mandatory Self-Refactor Protocol (dedicated section)
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ No update needed
      (Constitution Check section is dynamic; gates are derived at
      plan-generation time from this constitution)
    - .specify/templates/spec-template.md ✅ No update needed
      (Spec template is requirements-focused; constitution principles
      are enforced at plan/task level, not spec level)
    - .specify/templates/tasks-template.md ✅ No update needed
      (Phase N "Polish" already includes refactoring and cleanup tasks;
      self-refactor protocol is enforced at implementation time)
    - .specify/templates/checklist-template.md ✅ No update needed
      (Checklist is dynamically generated per feature)
    - .specify/templates/agent-file-template.md ✅ No update needed
      (Code Style section will reference constitution at generation time)
  Follow-up TODOs:
    - RATIFICATION_DATE set to today (2026-03-20) as initial adoption.
  ============================================================================
-->

# Picnic Web Constitution

## Core Principles

### I. Architectural Integrity (SRP, DRY, Dependency Injection)

Every module, class, and function MUST have a single, well-defined
responsibility. Violations indicate a design flaw, not a shortcut.

- **Single Responsibility Principle (SRP)**: Each file, module, or
  function MUST do exactly one thing. If a component requires a
  compound description using "and" or "or," it MUST be split.
- **Don't Repeat Yourself (DRY)**: Duplicated logic MUST be extracted
  into a shared utility, service, or helper. Two or more occurrences
  of the same logic constitutes a violation. Exception: test setup
  code MAY repeat for clarity when abstraction would obscure intent.
- **Dependency Injection**: Components MUST NOT instantiate their own
  dependencies internally when those dependencies represent services,
  clients, or configurable behavior. Dependencies MUST be injected
  via constructor parameters, factory functions, or module-level
  configuration. This enables testability and decoupling.
- **Rationale**: These principles prevent monolithic files, tangled
  dependencies, and untestable code. They are the foundation upon
  which all other principles depend.

### II. Naming Conventions

Names MUST communicate intent without requiring the reader to inspect
the implementation. Ambiguous, abbreviated, or misleading names are
prohibited.

- **Functions**: MUST use verb-first camelCase that describes the
  action performed (e.g., `fetchProducts`, `buildPicnicClient`,
  `validateAuthToken`). Boolean-returning functions MUST use
  `is`, `has`, `can`, or `should` prefixes.
- **Variables**: MUST use descriptive noun-based camelCase. Single-
  letter variables are prohibited except for trivial loop iterators
  (`i`, `j`, `k`) in short loops (fewer than 5 lines).
- **Constants**: MUST use UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`,
  `DEFAULT_TIMEOUT_MS`).
- **Files/Modules**: MUST use kebab-case or camelCase consistently
  within each project layer. File names MUST reflect the primary
  export or responsibility (e.g., `api-service.js` or
  `ApiService.js`, not `utils2.js` or `helpers.js`).
- **Boolean Variables**: MUST use `is`, `has`, `can`, or `should`
  prefixes (e.g., `isAuthenticated`, `hasPermission`).
- **Rationale**: Consistent naming eliminates guesswork, reduces
  onboarding friction, and makes code searchable.

### III. Forbidden Anti-Patterns

The following patterns are unconditionally prohibited. Any occurrence
MUST be refactored immediately upon detection.

- **God Objects/Files**: No file MAY exceed 300 lines of code
  (excluding imports and comments). No class or object MAY accumulate
  responsibilities beyond its single defined purpose.
- **Deep Nesting**: No function MAY exceed 3 levels of indentation.
  Use early returns, guard clauses, and extracted helper functions to
  flatten logic.
- **Magic Numbers/Strings**: All literal values with domain meaning
  MUST be extracted into named constants. Exception: trivially
  obvious values (0, 1, empty string) in context where meaning is
  unambiguous.
- **Catch-All Error Swallowing**: Empty `catch` blocks or `catch`
  blocks that only log without rethrowing or handling are prohibited.
  Every error MUST be either handled meaningfully, wrapped with
  context and rethrown, or propagated to a centralized error handler.
- **Implicit Global State**: Mutable module-level state that is
  modified by multiple consumers without explicit synchronization or
  clear ownership is prohibited. State MUST be scoped, encapsulated,
  or managed through a state management pattern (e.g., Vuex store).
- **Copy-Paste Code**: Duplicated blocks of logic across files are
  prohibited. See Principle I (DRY).
- **Barrel Files That Re-Export Everything**: Index files that blindly
  re-export all contents of a directory without curation are
  prohibited. Each export MUST be intentional.
- **Rationale**: These patterns are the most common sources of
  technical debt, bugs, and maintenance burden. Banning them
  outright prevents accumulation.

### IV. Mandatory Self-Refactor Protocol (Strict Enforcement)

Before outputting any code to the user, you MUST silently perform a self-review against all guidelines listed above. If your drafted code violates ANY of these rules (e.g., a function exceeds the line limit, a variable name is abbreviated or generic, or a file is too large), you must completely refactor the code internally to achieve full compliance before presenting the final result. Do not explain the refactoring process; only output the final, compliant code.

### V. Readability Over Cleverness

Implementation MUST prioritize readability and maintainability over
brevity or cleverness. Code MUST be written as if the next reader has
no context about the original implementation decision.

- **Explicit Over Implicit**: Favor explicit, verbose constructs over
  compact expressions that require mental unpacking. If a ternary
  operator spans more than one simple condition/value pair, replace
  it with an `if/else` block.
- **Clever Constructs Prohibited**: Bitwise tricks for non-bitwise
  operations, obscure regex without documentation, chained method
  calls exceeding 3 levels, and any pattern that requires a comment
  to explain "what" it does (as opposed to "why") are prohibited.
- **Control Flow Clarity**: Use early returns and guard clauses to
  eliminate `else` blocks where possible. Each function MUST have a
  clear, linear reading path from top to bottom.
- **Consistent Formatting**: All code MUST conform to the project's
  ESLint configuration. Formatting MUST NOT be a topic of code
  review; automated tooling handles it.
- **Comments for "Why," Not "What"**: Comments MUST explain business
  decisions, non-obvious constraints, or workarounds. Comments that
  restate what the code does are prohibited (they indicate the code
  itself is not readable enough).
- **Rationale**: Readable code reduces debugging time, accelerates
  onboarding, and prevents misinterpretation during maintenance.
  Cleverness impresses no one when it causes a production incident
  at 2 AM.

## Enforcement and Compliance

All code contributions (new features, bug fixes, refactors) MUST
demonstrate compliance with every principle defined above. Compliance
is verified through:

- **Automated Linting**: ESLint rules MUST be enforced on every
  commit. Linting failures block merges.
- **Code Review Gates**: Reviewers MUST verify principle adherence
  as a first-order review criterion, before evaluating correctness
  or performance.

## Development Workflow

The following workflow applies to all implementation work:

1. **Understand**: Read the relevant spec and plan before writing
   code.
2. **Implement**: Write code that satisfies requirements while
   adhering to all five principles.
3. **Self-Refactor**: Execute the Mandatory Self-Refactor Protocol
   (Principle IV) against the changeset.
4. **Validate**: Run linting and any available tests. Fix all
   violations before proceeding.
5. **Commit**: Commit clean, principle-compliant code with a
   descriptive commit message.

## Governance

This constitution is the authoritative source of coding standards
for the Picnic Web project. It supersedes all informal conventions,
personal preferences, and legacy patterns.

- **Amendment Process**: Any change to this constitution MUST be
  documented with a rationale, reviewed, and approved before taking
  effect. Amendments MUST include a version bump following semantic
  versioning (see below).
- **Versioning Policy**: The constitution follows MAJOR.MINOR.PATCH
  semantic versioning:
  - MAJOR: Backward-incompatible principle removals or redefinitions
  - MINOR: New principles added or existing guidance materially
    expanded
  - PATCH: Clarifications, wording, typo fixes, non-semantic
    refinements
- **Compliance Review**: All pull requests and code reviews MUST
  verify compliance with this constitution. Violations MUST be
  resolved before merge.
- **Precedence**: When this constitution conflicts with other project
  documentation, this constitution takes precedence.
- **Guidance File**: See the agent guidance file (generated from
  `.specify/templates/agent-file-template.md`) for runtime
  development guidance including tech stack details and commands.

**Version**: 1.0.0 | **Ratified**: 2026-03-20 | **Last Amended**: 2026-03-20
