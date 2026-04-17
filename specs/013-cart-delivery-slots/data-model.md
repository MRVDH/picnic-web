# Data Model: Cart Delivery Slot Selection

**Feature**: 013-cart-delivery-slots
**Date**: 2026-04-15

## Overview

This feature introduces delivery slot types, a slot parser, and adds delivery slot summary data to the existing `CartData` type. The slot picker modal uses its own fetched data (from the dedicated delivery slots endpoint), while the banner reads from the cart response.

## New Types (in `src/lib/delivery-slot-types.ts`)

### `DeliverySlotData`

Our application-level representation of a single delivery slot, extracted defensively from the raw API response.

| Field | Type | Description |
|-------|------|-------------|
| `slotId` | `string` | Unique slot identifier |
| `windowStart` | `string` | ISO 8601 start time of the delivery window |
| `windowEnd` | `string` | ISO 8601 end time of the delivery window |
| `cutOffTime` | `string` | ISO 8601 cut-off time for selecting this slot |
| `isAvailable` | `boolean` | Whether the slot can be selected |
| `isSelected` | `boolean` | Whether this slot is currently selected |
| `isGreenChoice` | `boolean` | Whether this is the eco-friendly (wider window) option |
| `minimumOrderValue` | `number \| null` | Minimum order value in cents, or null if not specified |

```typescript
export type DeliverySlotData = {
  slotId: string;
  windowStart: string;
  windowEnd: string;
  cutOffTime: string;
  isAvailable: boolean;
  isSelected: boolean;
  isGreenChoice: boolean;
  minimumOrderValue: number | null;
};
```

### `SelectedSlotData`

Summary of the currently selected slot for the banner.

| Field | Type | Description |
|-------|------|-------------|
| `slotId` | `string` | Selected slot's identifier |
| `state` | `string` | Selection state: `"IMPLICIT"`, `"ACTIVE"`, or `"EXPLICIT"` |
| `windowStart` | `string \| null` | ISO 8601 start time, or null if slot not found in `delivery_slots` |
| `windowEnd` | `string \| null` | ISO 8601 end time, or null if slot not found |
| `isExplicitSelection` | `boolean` | `true` if user actively chose this slot (state !== "IMPLICIT") |

```typescript
export type SelectedSlotData = {
  slotId: string;
  state: string;
  windowStart: string | null;
  windowEnd: string | null;
  isExplicitSelection: boolean;
};
```

### `SlotDayGroup`

Slots grouped by calendar day for the picker UI.

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` | ISO date string (YYYY-MM-DD) for this day |
| `dayLabel` | `string` | Display label: "Vandaag", "Morgen", or Dutch day name |
| `dateLabel` | `string` | Abbreviated date: "16 apr", "17 apr" |
| `greenSlots` | `DeliverySlotData[]` | Eco-friendly (wider window) slots for this day |
| `regularSlots` | `DeliverySlotData[]` | Standard (narrower window) slots for this day |

```typescript
export type SlotDayGroup = {
  date: string;
  dayLabel: string;
  dateLabel: string;
  greenSlots: DeliverySlotData[];
  regularSlots: DeliverySlotData[];
};
```

### `DeliverySlotPickerData`

Complete data set for the slot picker modal, returned by the delivery slots API route.

| Field | Type | Description |
|-------|------|-------------|
| `dayGroups` | `SlotDayGroup[]` | Available slots grouped by day |
| `selectedSlot` | `SelectedSlotData \| null` | Currently selected slot info, or null |

```typescript
export type DeliverySlotPickerData = {
  dayGroups: SlotDayGroup[];
  selectedSlot: SelectedSlotData | null;
};
```

## Type Changes to Existing Types

### `CartData` (in `src/lib/types.ts`)

Add two fields to the existing type. These are populated from the cart response (not the dedicated slots endpoint).

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `selectedSlot` | `SelectedSlotData \| null` | `null` | Selected delivery slot summary for the banner. `null` when no slot data in response. |
| `deliveryBannerText` | `string` | `"Kies je bezorgmoment"` | Pre-formatted banner text. Either the prompt or the formatted time window. |

```typescript
// Added to CartData:
export type CartData = {
  // ... existing fields ...
  selectedSlot: SelectedSlotData | null;
  deliveryBannerText: string;
};
```

**Why `deliveryBannerText` is pre-computed**: The banner component should be a simple display component (SRP). Computing the text during parsing (where we already have all the data) avoids duplicating date-formatting logic or passing raw dates to the banner. The picker modal does its own formatting since it needs full slot data.

## Field Mapping

### Raw Cart API → CartData (delivery slot fields)

| Raw API field | CartData field | Extraction |
|--------------|----------------|------------|
| `rawData["selected_slot"]` | `selectedSlot` | `parseSelectedSlot(rawData)` — extracts slot_id, state, matches against delivery_slots for window times |
| `rawData["selected_slot"]` + `rawData["delivery_slots"]` | `deliveryBannerText` | If explicit selection: `formatBannerText(windowStart, windowEnd)`. If implicit: `"Kies je bezorgmoment"`. |

### Raw Delivery Slots API → DeliverySlotPickerData

| Raw API field | Picker field | Extraction |
|--------------|-------------|------------|
| `result["delivery_slots"]` | `dayGroups` | Group by day, identify green slots, sort by time |
| `result["selected_slot"]` | `selectedSlot` | Same parsing as cart response |

### DeliverySlotPickerData → Slot Picker Component

| Data field | Component usage |
|------------|----------------|
| `dayGroups` | Day tabs (horizontal scroll) + slot lists per day |
| `dayGroups[n].greenSlots` | "Groenste keuze voor jouw buurt" section |
| `dayGroups[n].regularSlots` | "Of kies een ander moment" section |
| `selectedSlot` | "Geselecteerd door jou" section (when selected slot is on current day tab) |

## Display Rules

### Banner

| Condition | Display |
|-----------|---------|
| `selectedSlot === null` | "Kies je bezorgmoment" |
| `selectedSlot.isExplicitSelection === false` | "Kies je bezorgmoment" |
| `selectedSlot.isExplicitSelection === true` | Formatted time window (e.g., "Morgen 14:40 - 15:40") |

### Picker — Day Grouping

| Condition | Display |
|-----------|---------|
| Day has green slots AND regular slots | Two sections: "Groenste keuze..." + "Of kies een ander moment" |
| Day has only regular slots (no green) | Single section: "Of kies een ander moment" |
| Day has only green slots | Single section: "Groenste keuze..." |
| Selected slot is on current day tab | Replace sections with: "Geselecteerd door jou" + "Of kies een ander moment" |
| Selected slot is on different day tab | Show normal green/regular grouping |

## State Transitions

### Cart Page (banner)

```
Cart fetch → parseCartResponse → CartData.selectedSlot + CartData.deliveryBannerText
  → CartPage renders <DeliverySlotBanner text={cart.deliveryBannerText} />
  → User taps banner → open picker modal
  → Slot selected → POST returns new Cart → reconcileFromServer → banner auto-updates
```

### Slot Picker Modal

```
Modal opens
  → State: LOADING
  → GET /api/cart/delivery-slots
  → State: READY (slots displayed)

User taps slot
  → State: SELECTING (spinner on tapped slot, all slots disabled)
  → POST /api/cart/delivery-slots { slotId }
  → Success: close modal, parent receives new CartData, reconciles
  → Failure: State: ERROR (show error message, retain previous selection)

User taps X
  → Close modal, no state change
```

## Existing Types Referenced

From `src/lib/types.ts` (unchanged):
- `CartItem` — not affected
- `DepositEntry` — not affected
- `FeeEntry` — not affected
- `SliderProduct` — not affected
- `ApiErrorResponse` — reused for delivery slots error responses
