# Research: Cart Delivery Slot Selection

**Feature**: 013-cart-delivery-slots
**Date**: 2026-04-15

## Research Questions & Findings

### R1: How to Distinguish "No Slot Chosen" vs "Slot Selected"

**Question**: The `selected_slot.state` field has been observed as `"IMPLICIT"`. How should we determine whether the user has actively chosen a slot (show the time window) vs the API just assigned a default (show "Kies je bezorgmoment")?

**Decision**: Treat `state === "IMPLICIT"` as "no user selection" (show prompt), and `state === "ACTIVE"` or `state === "EXPLICIT"` as "user has chosen" (show time window). If the state is unrecognized, fall back to checking whether `selected_slot.slot_id` is non-empty and the matched slot's `selected` field is `true`.

**Rationale**: The picnic-api types define `SelectedSlot.state` as `string` with the comment `E.g. "IMPLICIT" | "ACTIVE" | "EXPLICIT"`. The native Picnic app shows "Kies je bezorgmoment" when no explicit selection has been made, even though the API always returns a `selected_slot` with a valid `slot_id`. This means `IMPLICIT` maps to the system-default assignment (user hasn't chosen), while `ACTIVE`/`EXPLICIT` map to user-initiated selection. This will be confirmed at runtime during implementation — if the API returns a different state after `setDeliverySlot`, the heuristic is validated.

**Alternatives considered**:
- Always show the time window if `slot_id` is non-empty: Would never show "Kies je bezorgmoment", breaking US1 acceptance scenario 1.
- Only check the `selected` boolean on the matched `DeliverySlot`: The `selected` field may be `true` even for implicit selections. The `state` field on `SelectedSlot` is more semantically meaningful.

### R2: API Endpoint Strategy for Delivery Slots

**Question**: Should we use the dedicated `getDeliverySlots()` endpoint or rely on the slot data already present in the cart response?

**Decision**: Use both:
- **Banner display**: Extract `selected_slot` and `delivery_slots` from the existing cart response (already fetched on page load). Parse the selected slot's time window for the banner. This avoids an extra API call.
- **Slot picker modal**: When the modal opens, call `GET /api/cart/delivery-slots` (which calls `client.cart.getDeliverySlots()`) to get the freshest slot availability. The dedicated endpoint returns `GetDeliverySlotsResult` with `delivery_slots[]`, `selected_slot`, and `slot_selector_message`.
- **Slot selection**: `POST /api/cart/delivery-slots` calls `client.cart.setDeliverySlot(slotId)`, which returns a full `Cart` object. Parse the returned cart to update the entire cart state (including the banner).

**Rationale**: The cart response already contains `delivery_slots` and `selected_slot` — we already fetch this data. For the banner, re-fetching is wasteful. However, slot availability changes over time (cut-off times pass), so the picker should fetch fresh data when opened. The `setDeliverySlot` response is a full `Cart`, so after slot selection we can reconcile the entire cart state — banner, items, totals — in one shot.

**Alternatives considered**:
- Always use `getDeliverySlots()` for everything: Adds an unnecessary API call on page load just to display the banner. The cart response already has the data.
- Never call `getDeliverySlots()`, always use cart data: Stale slot availability in the picker if the user has been on the page for a while. Cut-off times may have passed.

### R3: Green Choice Slot Identification Algorithm

**Question**: How should "green choice" (eco-friendly) slots be identified from the API response?

**Decision**: Group all slots by `window_start`. For each group with exactly 2 slots sharing the same `window_start`, the slot with the longer duration (`window_end - window_start`) is the green choice. Slots without a same-start pair are not marked as green.

**Rationale**: Confirmed in the spec clarification session. The Picnic app pairs a narrow delivery window (e.g., 1 hour) with a wider eco-friendly window (e.g., 3 hours) starting at the same time. The wider window allows more route optimization. The `slot_characteristics` array is currently empty in observed data but may contain `"PREFERRED"` in the future — we should check for it as a secondary signal but not rely on it.

**Implementation**:
```typescript
function identifyGreenSlots(slots: DeliverySlotData[]): Set<string> {
  const greenSlotIds = new Set<string>();
  const byWindowStart = new Map<string, DeliverySlotData[]>();

  for (const slot of slots) {
    const key = slot.windowStart;
    const group = byWindowStart.get(key) ?? [];
    group.push(slot);
    byWindowStart.set(key, group);
  }

  for (const group of byWindowStart.values()) {
    if (group.length !== 2) continue;
    const [a, b] = group;
    const durationA = new Date(a.windowEnd).getTime() - new Date(a.windowStart).getTime();
    const durationB = new Date(b.windowEnd).getTime() - new Date(b.windowStart).getTime();
    if (durationA > durationB) greenSlotIds.add(a.slotId);
    else if (durationB > durationA) greenSlotIds.add(b.slotId);
  }

  return greenSlotIds;
}
```

**Alternatives considered**:
- Use `slot_characteristics` exclusively: Currently empty; would result in no green choices being identified.
- Mark all wide-window slots as green (even without pairs): Would incorrectly mark slots that don't have a narrow counterpart, confusing the grouping UI.

### R4: Date Formatting for Dutch Delivery Windows

**Question**: How should delivery time windows be formatted for the banner and picker?

**Decision**: Create a `format-delivery-window.ts` utility with two functions:
1. `formatBannerText(windowStart, windowEnd)` → e.g., "Morgen 14:40 - 15:40", "Vandaag 08:00 - 09:00", "Donderdag 14:40 - 15:40"
2. `formatDayTab(windowStart)` → e.g., "Vandaag", "Morgen", "Donderdag 16 apr"

**Rules**:
- **Today**: "Vandaag" (if `windowStart` is today's date)
- **Tomorrow**: "Morgen" (if `windowStart` is tomorrow's date)
- **Other days**: Dutch day name (e.g., "Maandag", "Dinsdag", ..., "Zondag")
- **Time format**: HH:MM in 24-hour format (e.g., "14:40"), extracted from the ISO 8601 `window_start`/`window_end` strings

**Dutch day names map**:
```typescript
const DUTCH_DAY_NAMES = [
  "Zondag", "Maandag", "Dinsdag", "Woensdag",
  "Donderdag", "Vrijdag", "Zaterdag",
] as const;

const DUTCH_MONTH_ABBREVIATIONS = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
] as const;
```

**Rationale**: No existing date formatting utility exists in the project. The `Intl.DateTimeFormat` API could be used with `locale: "nl-NL"`, but explicit maps give full control over abbreviation style and avoid locale-dependent behavior differences across environments (server vs client). The `format-price.ts` utility follows the same "explicit formatting" pattern.

**Alternatives considered**:
- Use `Intl.DateTimeFormat("nl-NL")`: Works but abbreviation style varies across Node.js versions and browsers. "Donderdag" vs "do" vs "Do" is not guaranteed. Explicit map is more predictable.
- Use a date library (date-fns, dayjs): Adds a dependency for a simple formatting task. Over-engineered.

### R5: Slot Picker State Management

**Question**: How should the slot picker's state be managed? What happens during loading, selection, and errors?

**Decision**: The slot picker modal manages its own local state:

```
States:
  LOADING    → fetching slots from API
  READY      → slots displayed, user can interact
  SELECTING  → user tapped a slot, waiting for API confirmation
  ERROR      → API call failed (fetch or set)
```

**State transitions**:
1. Modal opens → `LOADING` → fetch `GET /api/cart/delivery-slots` → `READY`
2. User taps slot → `SELECTING` (disable all slots, show spinner on tapped slot) → `POST /api/cart/delivery-slots` → success → close modal, update cart state
3. Fetch fails → `ERROR` with retry button
4. Set fails → `ERROR` overlay on picker, retain previous selection, allow retry or dismiss

**Rationale**: Slot selection is blocking per the spec clarification. The modal must show a loading state and wait for API confirmation. The picker fetches fresh data on every open (not cached) to ensure cut-off times are current.

**Alternatives considered**:
- Optimistic selection: Close modal immediately, update banner, roll back on failure. Rejected per spec clarification — user expects confirmation.
- Cache slots between opens: Stale data risk. Slots become unavailable as cut-off times pass. Fresh fetch on every open is safer.

### R6: Reconciliation After Slot Selection

**Question**: After calling `setDeliverySlot`, how should the cart state be updated?

**Decision**: `setDeliverySlot` returns a full `Cart` object. Parse it with `parseCartResponse` (same as cart mutations) and use the existing `reconcileFromServer` callback in `CartPage` to update the entire cart state. This updates: items, totals, fees, minimum order value, and — critically — the `selected_slot` and `delivery_slots` data used by the banner.

**Rationale**: This follows the exact same pattern as `postCartMutation` → `reconcileFromServer`. The cart page already has this reconciliation mechanism. The only addition is that `CartData` needs to carry delivery slot info so the banner can read it.

**Implementation**: Add `selectedSlot` and `deliverySlots` (or a computed `deliveryBanner` summary) to `CartData`. When `setDeliverySlot` returns a new cart, parse it, and reconcile — the banner auto-updates because it reads from `cart.selectedSlot` (or similar).

**Alternatives considered**:
- Separate state for delivery slots (not part of CartData): Would require a separate fetch and reconciliation path. Adds complexity. The cart response already contains slot data.
- Only update the banner, not the full cart: Misses potential cart changes (e.g., minimum order value changes per slot). Full reconciliation is safer.

### R7: File Organization — Where to Put New Types

**Question**: `types.ts` is already 398 lines. Where should the new delivery slot types go?

**Decision**: Create `src/lib/delivery-slot-types.ts` for all new types (`DeliverySlotData`, `SelectedSlotData`, `SlotGroup`, `DeliveryBannerData`). In `types.ts`, add only a re-export line and the minimal additions to `CartData` (2-3 new fields referencing the imported types).

**Rationale**: The constitution's 300-line limit is already violated. Adding ~40 lines of new type definitions would push `types.ts` to ~440 lines. A dedicated file keeps the new types isolated and under the limit. The re-export from `types.ts` maintains the existing import pattern (`import type { ... } from "@/lib/types"`).

**Alternatives considered**:
- Add everything to `types.ts` and accept the violation: Explicitly prohibited by the constitution. The plan's Constitution Check already flagged this.
- Create a `types/` directory and split all types: Too invasive — would require updating imports in 10+ files. Out of scope for this feature.

## Summary

All research questions resolved. Key decisions:

| Topic | Decision |
|-------|----------|
| Implicit vs explicit slot | `state === "IMPLICIT"` → show prompt; `"ACTIVE"/"EXPLICIT"` → show time window |
| API strategy | Banner from cart response; picker fetches fresh via dedicated endpoint; selection returns full cart |
| Green choice | Paired `window_start`, longer duration = green |
| Date formatting | Explicit Dutch day name map, no Intl or libraries |
| Picker state | Local component state: LOADING → READY → SELECTING → close/ERROR |
| Cart reconciliation | Parse `setDeliverySlot` response with `parseCartResponse`, use existing `reconcileFromServer` |
| File organization | New `delivery-slot-types.ts` + `parse-delivery-slots.ts` files; minimal additions to existing files |
