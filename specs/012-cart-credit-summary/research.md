# Research: Cart Credit Settlement Display

**Feature**: 012-cart-credit-summary
**Date**: 2026-04-15

## Research Questions & Findings

### R1: API Field Discovery Strategy for Credit Settlement

**Question**: The raw Picnic cart API response contains a credit settlement field ("verrekening picnic-tegoed") that is not currently extracted. What is the exact field name, and where does it appear in the response?

**Decision**: Add a temporary `console.log` of the raw API response keys in the cart route handler to discover the exact field. Two candidate locations have been identified through code analysis.

**Rationale**: The `picnic-api` library (v4.1.0) is an unofficial reverse-engineered wrapper. Its `Cart` type definition does not include any credit/tegoed/verrekening field. However, `sendRequest` returns raw unfiltered JSON (`response.json()` passthrough) — any fields the real Picnic API includes will be present at runtime even if not in the library's types. The project already uses the `sendRequest` cast-to-`unknown` pattern specifically to access untyped fields defensively.

**Candidate locations** (ordered by likelihood):

| Location | Pattern | Evidence |
|----------|---------|----------|
| Top-level scalar field | `rawData["verrekening_picnic_tegoed"]` or similar snake_case key | Follows the pattern of `checkout_total_price`, `membership_savings`, `total_count` — all are top-level numeric scalars on the raw cart object |
| Entry in `fees` array | `rawData["fees"]` containing `{ type: "...", amount: number, label: "..." }` | The `fees` field is typed as `any[]` and documented as "usually empty." Credit settlement could be a fee-type line item with a negative amount |

**Discovery implementation**: In `parseCartResponse`, temporarily log `Object.keys(rawData)` and `rawData["fees"]` to identify the field. Once discovered, remove the logging and implement the extraction.

**Alternatives considered**:
- Inspect `basket_sections`: These contain product suggestions, not financial data. Unlikely location.
- Call a separate API endpoint: The spec explicitly states no new endpoints are needed. The user's original request says the cart API response already returns this data.

### R2: Extraction Pattern for the Credit Settlement Value

**Question**: How should the credit settlement value be extracted from the raw response?

**Decision**: Use the same defensive extraction pattern as `membership_savings`: `asNumber(rawData["<discovered_field_name>"])`, falling back to `0`.

**Rationale**: The existing `parseCartResponse` function uses `asNumber()` for all monetary scalar fields (`checkout_total_price`, `total_count`, `membership_savings`). This type guard safely returns `0` for missing/undefined/non-numeric values, which naturally satisfies FR-003 (hide when zero or absent). No special null handling is needed.

**Alternatives considered**:
- Return `null` instead of `0` for absent field: Would require changing the component to check `!== null` instead of `> 0`. The existing pattern (return `0`, check `> 0`) is simpler and consistent with `membershipSavings`.
- Extract from `fees` array with filtering: Only needed if the field lives inside `fees`. Would require iterating the array and matching by type. More complex but follows the `depositBreakdown` pattern if needed.

### R3: Display Label Source

**Question**: Should the credit settlement label be hardcoded or extracted from the API response?

**Decision**: Use a hardcoded Dutch label as the default, with the ability to use an API-provided label if one is discovered during R1 field inspection.

**Rationale**: FR-005 says "use the label from the API response or a reasonable Dutch-language label." If the field is a top-level scalar (like `membership_savings`), there is no associated label — the frontend provides it (as it does for "Korting", "Picnic-lidmaatschapsbesparing", etc.). If the field is inside `fees` with a `label` property, that label can be used. The default label should be "Verrekening Picnic Tegoed" to match the Picnic app terminology.

**Alternatives considered**:
- Always hardcode: Simple but misses the opportunity to use an API-provided label that may change.
- Always require API label: Would break if the API only returns a numeric value without a label (the top-level scalar case).

### R4: Component Prop Design

**Question**: How should the credit settlement data be passed to the `OrderSummary` component?

**Decision**: Add a single `creditSettlement: number` prop (in cents, like all other monetary props). The component renders the row when `creditSettlement > 0`.

**Rationale**: Follows the exact pattern of the existing `membershipSavings` prop: a numeric value in cents, conditionally displayed with green text and minus prefix. No label prop is needed because the label is static (same as all other summary rows — "Korting", "Picnic-lidmaatschapsbesparing" are all hardcoded in the component).

**Alternatives considered**:
- Pass an object `{ label: string; amount: number }`: Would only be useful if the API provides a dynamic label. Over-engineered for the current use case. Can be refactored later if R1 reveals a label field.
- Pass as part of a generic "adjustments" array: Would require refactoring all existing rows (discount, deposits, membership savings) to use the same array pattern. Too invasive for this feature.

### R5: Row Positioning in Order Summary

**Question**: Where exactly should the credit settlement row appear relative to existing rows?

**Decision**: Place the credit settlement row after the membership savings row and before the minimum order value / total rows.

**Rationale**: FR-006 specifies "alongside other price adjustments, before the total line." The current order is: Artikelen → Korting → Deposit rows → Picnic-lidmaatschapsbesparing → Minimale bestelwaarde → Totaal. Credit settlement is a price deduction like membership savings, so it logically belongs after membership savings and before the minimum order value indicator. This matches the visual grouping: all deductions (green text) appear together.

**Alternatives considered**:
- Before membership savings: Less natural since membership savings is a permanent account benefit while credit is a one-time balance. But either position works.
- After minimum order value: Would separate it from the other deduction rows, reducing visual grouping clarity.

## Summary

All research questions resolved. One NEEDS CLARIFICATION item remains — the exact API field name (R1) — but the implementation strategy is fully defined for all possible outcomes:

| Scenario | Extraction | Label |
|----------|-----------|-------|
| Top-level scalar (e.g., `verrekening_picnic_tegoed`) | `asNumber(rawData["field_name"])` | Hardcoded "Verrekening Picnic Tegoed" |
| Entry in `fees` array | Filter `fees` by type, extract amount | Use `label` from fee entry if present, else hardcoded |
| Field absent from response | `asNumber` returns `0` → row hidden | N/A |

**First implementation task**: Discover the field by logging raw API response keys. The rest of the implementation can proceed immediately after.
