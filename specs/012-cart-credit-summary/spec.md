# Feature Specification: Cart Credit Settlement Display

**Feature Branch**: `012-cart-credit-summary`  
**Created**: 2026-04-15  
**Status**: Draft  
**Input**: User description: "the cart api response returns something like 'verekening picnic-tegoed'. Add this to the cart summary."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Picnic Credit Settlement in Cart Summary (Priority: P1)

A user who has Picnic credit (tegoed) on their account opens their cart to review the order before checkout. The cart summary ("Besteloverzicht") displays a line item showing how much Picnic credit will be applied toward this order (labeled "Verrekening Picnic Tegoed" or similar, matching the label from the API). This gives the user transparency into the final amount they will pay out of pocket versus what is covered by their credit balance.

**Why this priority**: This is the core feature — without it, users have no visibility into their credit settlement in the cart summary. It directly addresses the user's request and is the minimum viable deliverable.

**Independent Test**: Can be fully tested by adding items to a cart on an account that has Picnic credit, then viewing the cart summary to confirm the credit settlement line appears with the correct amount.

**Acceptance Scenarios**:

1. **Given** the user has Picnic credit and items in the cart, **When** they view the cart summary, **Then** a "Verrekening Picnic Tegoed" line appears showing the credit amount being applied (displayed as a negative/deducted value, similar to how discounts are displayed).
2. **Given** the user has no Picnic credit, **When** they view the cart summary, **Then** no credit settlement line is shown.
3. **Given** the user has Picnic credit and modifies their cart (adds/removes items), **When** the cart updates, **Then** the credit settlement amount reflects the updated cart state.

---

### User Story 2 - Credit Settlement Included in Total Calculation (Priority: P2)

When Picnic credit is applied, the total displayed in the cart summary already accounts for the credit settlement (since `checkout_total_price` from the API reflects the final amount). The credit settlement line helps users understand why the total may be lower than the sum of item prices minus discounts and deposits.

**Why this priority**: Without this context, users may be confused by the total not matching the visible line items. Ensuring the credit line is displayed in the correct position (before the total) provides clarity.

**Independent Test**: Can be tested by comparing the visible line items (articles, discounts, deposits, credit settlement) against the total — they should add up correctly.

**Acceptance Scenarios**:

1. **Given** the user has Picnic credit applied to their cart, **When** they view the cart summary, **Then** the credit settlement line appears between the other adjustments (discounts, deposits, membership savings) and the total, and the total is consistent with all displayed line items.

---

### Edge Cases

- What happens when the credit settlement amount is zero? The line should be hidden (not shown with a zero value).
- What happens when the API does not return a credit settlement field at all (e.g., older API versions or accounts without credit)? The line should not appear and no error should occur.
- What happens when the credit amount exceeds the order value? The system should display whatever the API returns — the API handles the calculation; the frontend only displays it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST extract the Picnic credit settlement value (e.g., "verrekening picnic-tegoed") from the cart API response.
- **FR-002**: System MUST display a credit settlement line in the cart summary when the credit amount is greater than zero.
- **FR-003**: System MUST hide the credit settlement line when the credit amount is zero or the field is absent from the API response.
- **FR-004**: System MUST display the credit settlement amount as a deduction (negative value), visually consistent with how discounts and membership savings are currently displayed.
- **FR-005**: System MUST use the label from the API response or a reasonable Dutch-language label (e.g., "Verrekening Picnic Tegoed") that matches the Picnic app experience.
- **FR-006**: System MUST position the credit settlement line in the cart summary alongside other price adjustments (discounts, deposits, membership savings), before the total line.
- **FR-007**: System MUST update the credit settlement line when the cart is modified (items added/removed) and the API returns an updated response.

### Key Entities

- **Credit Settlement**: The amount of Picnic credit (tegoed) applied to the current order. Attributes: label (string from API), amount (monetary value). Relationship: reduces the checkout total shown to the user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users with Picnic credit can see the credit settlement line in their cart summary on 100% of cart views where credit is applied.
- **SC-002**: The credit settlement line is hidden when no credit is applied, with zero false appearances.
- **SC-003**: The credit amount displayed matches the value from the API response exactly.
- **SC-004**: Users can understand their total payment breakdown without needing to mentally calculate missing adjustments — the visible line items plus the total are consistent.

## Clarifications

### Session 2026-04-15

- Q: What is the exact raw API field name for the credit settlement? → A: Deferred to plan phase — requires inspecting actual API response. The parser (`src/lib/parse-cart.ts`) must be updated once the field name is discovered.

## Assumptions

- The Picnic cart API already returns a credit settlement field (something like "verrekening picnic-tegoed") in the response payload, even though this field is not currently captured by the application's type definitions.
- The credit settlement value is a monetary amount (in cents, consistent with other price fields in the API response).
- The API handles all credit calculation logic — the frontend only needs to display the value, not compute it.
- The existing cart summary visual style (green text for deductions, minus prefix) is appropriate for the credit settlement line.
- This feature does not require any new API endpoints — it uses data already present in the existing cart API response.
