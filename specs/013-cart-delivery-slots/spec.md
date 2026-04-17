# Feature Specification: Cart Delivery Slot Selection

**Feature Branch**: `013-cart-delivery-slots`  
**Created**: 2026-04-15  
**Status**: Draft  
**Input**: User description: "Implement delivery slots on the cart. Same as in the app, the user should be able to view the current slot and change to a different slot."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Current Delivery Slot on Cart Page (Priority: P1)

When a user views their cart, they see a delivery slot banner at the top of the cart content. If no slot has been explicitly selected, the banner displays the prompt "Kies je bezorgmoment" (Choose your delivery moment). If a slot has been selected, the banner displays the selected time window in a human-friendly format (e.g., "Morgen 14:40 - 15:40" or "Donderdag 08:00 - 09:00"). The banner includes a delivery truck icon with a clock overlay on the left side and a three-dot menu icon on the right.

**Why this priority**: Users need to see their current delivery status at a glance before they can decide whether to change it. This is the foundation that the slot picker (US2) builds upon.

**Independent Test**: Load the cart page with no slot selected — the banner shows "Kies je bezorgmoment". Select a slot via the API, reload — the banner shows the selected window with a relative day label. This delivers immediate value by giving users visibility into their delivery timing.

**Acceptance Scenarios**:

1. **Given** a cart with no explicitly selected delivery slot, **When** the user views the cart page, **Then** the delivery banner displays "Kies je bezorgmoment" with a truck/clock icon and a three-dot menu icon.
2. **Given** a cart with a selected delivery slot for tomorrow at 14:40-15:40, **When** the user views the cart page, **Then** the delivery banner displays "Morgen 14:40 - 15:40" with the same icons.
3. **Given** a cart with a selected delivery slot for a day further than tomorrow, **When** the user views the cart page, **Then** the banner displays the day name and time window (e.g., "Vrijdag 08:00 - 09:00").
4. **Given** a cart with a selected delivery slot for today, **When** the user views the cart page, **Then** the banner displays "Vandaag" followed by the time window.

---

### User Story 2 - Select or Change Delivery Slot (Priority: P2)

When a user taps the delivery banner or the three-dot menu on the cart page, a slot selection view opens. This view displays:

- A header "Kies je bezorgmoment" with a subtitle "Altijd gratis bezorgd!" and a close button (X).
- A horizontally scrollable row of day tabs showing the day name and date (e.g., "Donderdag 16 apr"). The first available day is selected by default.
- For the selected day tab, the available time slots are listed in two groups:
  - **"Groenste keuze voor jouw buurt"** — wider delivery windows (eco-friendly option), each displayed with a leaf icon.
  - **"Of kies een ander moment"** — narrower delivery windows without the leaf icon.
- If the user already has a slot selected, the view shows:
  - **"Geselecteerd door jou"** — the currently selected slot with a green checkmark.
  - **"Of kies een ander moment"** — the remaining available slots for that day, with leaf icons on wider windows.

When the user taps a time slot, it becomes the selected slot. The view closes and the cart page banner updates to reflect the new selection.

**Why this priority**: This is the core interaction — without it, the banner from US1 is informational only and the user cannot act on it.

**Independent Test**: Open the slot selection view, verify day tabs are correct, tap a slot, confirm the banner updates. Test with and without a pre-existing selection.

**Acceptance Scenarios**:

1. **Given** the cart page with no slot selected, **When** the user taps the delivery banner, **Then** the slot selection view opens showing day tabs and available time windows grouped by eco-friendliness.
2. **Given** the slot selection view is open on "Donderdag", **When** the user taps "Vrijdag", **Then** the view updates to show time slots available on Friday.
3. **Given** the slot selection view with no prior selection, **When** the user taps a time slot (e.g., "14:40 - 15:40"), **Then** a loading state is shown, the API confirms the selection, the view closes, and the cart banner updates to show "Morgen 14:40 - 15:40" (or equivalent relative label).
4. **Given** the slot selection view with a previously selected slot, **When** the user views the current day tab, **Then** the selected slot appears under "Geselecteerd door jou" with a green checkmark, and remaining slots appear under "Of kies een ander moment".
5. **Given** the slot selection view, **When** the user taps the X close button, **Then** the view closes without changing the selection.
6. **Given** the slot selection view with a selected slot on Donderdag, **When** the user taps a different day tab, **Then** the "Geselecteerd door jou" section is not shown (since the selected slot is on a different day), and all slots for the new day appear under the normal grouping.
7. **Given** the slot selection view, **When** the user taps a slot and the API call fails, **Then** an error message is displayed, the previous selection is retained, and the user can retry or dismiss.

---

### Edge Cases

- What happens when there are no available delivery slots at all? The banner should still appear but indicate no slots are available.
- What happens when the previously selected slot is no longer available (e.g., cut-off time has passed)? The system should revert to the "Kies je bezorgmoment" unselected state.
- What happens when there is only one day with available slots? The day tab row should show only that day, and it should be selected by default.
- What happens when a day has no "green choice" (wider window) slots? The "Groenste keuze voor jouw buurt" section should be hidden for that day, showing only "Of kies een ander moment".
- What happens when the slot selection API call fails? The view should show an error state and allow the user to retry or dismiss.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The cart page MUST display a delivery slot banner above the cart items, showing either the selected slot's time window or a prompt to choose one.
- **FR-002**: The delivery banner MUST display a truck icon with a clock overlay on the left and a three-dot menu icon on the right, matching the app's visual style.
- **FR-003**: When a slot is selected, the banner MUST show the delivery window using relative day labels: "Vandaag" for today, "Morgen" for tomorrow, or the day name (e.g., "Donderdag") for other days, followed by the time range (e.g., "14:40 - 15:40").
- **FR-004**: Tapping the delivery banner or three-dot menu MUST open a slot selection view.
- **FR-005**: The slot selection view MUST display a horizontally scrollable row of day tabs, each showing the day name and abbreviated date.
- **FR-006**: The slot selection view MUST group available slots into "Groenste keuze voor jouw buurt" (slots that are the longer-duration member of a same-start-time pair, displayed with leaf icons) and "Of kies een ander moment" (all other slots, without leaf icons).
- **FR-007**: When the user already has a selected slot, the slot selection view MUST show it under "Geselecteerd door jou" with a green checkmark icon, and list remaining slots under "Of kies een ander moment".
- **FR-008**: Tapping a time slot MUST send the selection to the API and show a loading state. Once the API confirms the selection, the view closes and the cart banner updates to reflect the new selection. If the API call fails, an error is shown and the previous selection is retained.
- **FR-009**: The slot selection view MUST include a close button (X) that dismisses without changing the selection.
- **FR-010**: The slot selection view MUST display "Altijd gratis bezorgd!" as a subtitle under the header.
- **FR-011**: Only slots where the cut-off time has not yet passed MUST be shown as available.
- **FR-012**: The slot selection view MUST only show slots with `is_available: true`.

### Key Entities

- **Delivery Slot**: A time window for delivery, with a start time, end time, cut-off time, availability status, and whether it is the "green choice" (wider window). Grouped by day.
- **Selected Slot**: The user's currently chosen delivery slot, identified by slot ID and selection state (implicit or explicit).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view their current delivery slot status on the cart page without any additional navigation.
- **SC-002**: Users can select a delivery slot within 3 taps (tap banner, tap day if needed, tap slot).
- **SC-003**: The slot selection view loads and displays all available slots within 1 second of opening.
- **SC-004**: After selecting a slot, the cart banner updates immediately to reflect the chosen time window.
- **SC-005**: The delivery slot UI matches the visual design of the Picnic app (icons, colors, grouping, layout) as shown in the provided screenshots.
- **SC-006**: The feature integrates without regressions into the existing cart page functionality.

## Assumptions

- The cart API already returns delivery slot and selected slot data — no new API endpoints are needed.
- "Green choice" slots are identified by comparing window duration within time-block pairs: slots sharing the same `window_start` are paired, and the one with the longer duration is marked as the eco-friendly "green choice". If a slot has no shorter-duration pair, it is not marked as green.
- The slot selection view is implemented as a modal/overlay on the cart page, not a separate page.
- Slot selection is persisted through the existing cart API, which will update the selected slot in subsequent cart responses.
- Icons for eco-friendly slots (leaf) and the delivery banner (truck with clock) will match the app's visual style as shown in the provided screenshots.
- Dutch day names and labels are used throughout, matching the app's locale (Maandag, Dinsdag, Woensdag, Donderdag, Vrijdag, Zaterdag, Zondag).
- The `slot_characteristics` field in the API may in the future indicate eco-friendly slots explicitly; for now, the paired-duration heuristic is used.

## Clarifications

### Session 2026-04-15

- Q: How should "green choice" (eco-friendly) slots be identified? → A: Wider window duration heuristic — slots sharing the same `window_start` are paired; the longer one is "green".
- Q: Should slot selection be optimistic or wait for API confirmation? → A: Blocking — show a loading state, wait for API confirmation, then update banner. On failure, show error and retain previous selection.
- Deferred to plan phase: How to distinguish "user has actively chosen a slot" vs "API default/suggestion". The `selected_slot.state` field (observed value: `"IMPLICIT"`) likely changes after an explicit user selection. Needs runtime investigation during implementation.
