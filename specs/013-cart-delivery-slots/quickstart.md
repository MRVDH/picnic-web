# Quickstart: Cart Delivery Slot Selection

**Feature**: 013-cart-delivery-slots
**Date**: 2026-04-15

## What This Feature Does

Adds delivery slot viewing and selection to the cart page. Users see a banner showing their current delivery window (or a prompt to choose one), and can tap it to open a modal slot picker with day tabs, green-choice grouping, and single-tap selection — matching the native Picnic app's UI.

## Prerequisites

Before implementing, run a quick runtime check to confirm the `selected_slot.state` field behavior:

```ts
// Temporary: In src/lib/parse-cart.ts, inside parseCartResponse, after isObject check:
console.log("selected_slot:", JSON.stringify(rawData["selected_slot"]));
console.log("delivery_slots count:", asArray(rawData["delivery_slots"]).length);
```

Load the cart page, check server console. Note the `state` value (expected: `"IMPLICIT"`). Then use the Picnic app to select a slot, reload the web cart, and check if the state changes to `"EXPLICIT"` or `"ACTIVE"`. Remove the logging after verification.

## Files to Create (in implementation order)

### 1. `src/lib/delivery-slot-types.ts` — New types

```ts
/** A single delivery slot, extracted from the raw API response. */
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

/** Summary of the currently selected delivery slot. */
export type SelectedSlotData = {
  slotId: string;
  state: string;
  windowStart: string | null;
  windowEnd: string | null;
  isExplicitSelection: boolean;
};

/** Slots grouped by calendar day for the picker UI. */
export type SlotDayGroup = {
  date: string;
  dayLabel: string;
  dateLabel: string;
  greenSlots: DeliverySlotData[];
  regularSlots: DeliverySlotData[];
};

/** Complete data for the slot picker modal. */
export type DeliverySlotPickerData = {
  dayGroups: SlotDayGroup[];
  selectedSlot: SelectedSlotData | null;
};

/** Request body for POST /api/cart/delivery-slots. */
export type SetDeliverySlotRequest = {
  slotId: string;
};
```

### 2. `src/lib/format-delivery-window.ts` — Date formatting utility

```ts
const DUTCH_DAY_NAMES = [
  "Zondag", "Maandag", "Dinsdag", "Woensdag",
  "Donderdag", "Vrijdag", "Zaterdag",
] as const;

const DUTCH_MONTH_ABBREVIATIONS = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
] as const;

const NO_SLOT_TEXT = "Kies je bezorgmoment";

/** Format a delivery window for the cart banner. */
export function formatBannerText(
  windowStart: string | null,
  windowEnd: string | null,
): string {
  if (!windowStart || !windowEnd) return NO_SLOT_TEXT;

  const start = new Date(windowStart);
  const end = new Date(windowEnd);
  const dayLabel = getRelativeDayLabel(start);
  const startTime = formatTime(start);
  const endTime = formatTime(end);

  return `${dayLabel} ${startTime} - ${endTime}`;
}

/** Format a day tab label: "Vandaag", "Morgen", or "Donderdag 16 apr". */
export function formatDayTabLabel(dateStr: string): {
  dayLabel: string;
  dateLabel: string;
} {
  const date = new Date(dateStr);
  const dayLabel = getRelativeDayLabel(date);
  const day = date.getDate();
  const month = DUTCH_MONTH_ABBREVIATIONS[date.getMonth()];
  return { dayLabel, dateLabel: `${day} ${month}` };
}

/** Format HH:MM from a Date. */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** "Vandaag", "Morgen", or Dutch day name. */
function getRelativeDayLabel(date: Date): string {
  const today = new Date();
  const todayDate = toDateString(today);
  const tomorrowDate = toDateString(addDays(today, 1));
  const targetDate = toDateString(date);

  if (targetDate === todayDate) return "Vandaag";
  if (targetDate === tomorrowDate) return "Morgen";
  return DUTCH_DAY_NAMES[date.getDay()];
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export { NO_SLOT_TEXT };
```

### 3. `src/lib/parse-delivery-slots.ts` — Slot extraction and grouping

Key functions to implement:

```ts
import { isObject, asString, asNumber, asArray } from "@/lib/type-guards";
import type { DeliverySlotData, SelectedSlotData, SlotDayGroup, DeliverySlotPickerData } from "@/lib/delivery-slot-types";
import { formatDayTabLabel } from "@/lib/format-delivery-window";

/** Extract a single DeliverySlotData from a raw slot object. */
function parseRawSlot(raw: Record<string, unknown>): DeliverySlotData | null { ... }

/** Extract the selected slot summary from the raw response. */
export function parseSelectedSlot(
  rawSelectedSlot: unknown,
  rawDeliverySlots: unknown[],
): SelectedSlotData | null { ... }

/** Identify green-choice slot IDs using the paired window_start heuristic. */
function identifyGreenSlotIds(slots: DeliverySlotData[]): Set<string> { ... }

/** Group slots by calendar day and separate green vs regular. */
function groupSlotsByDay(slots: DeliverySlotData[]): SlotDayGroup[] { ... }

/** Parse the full delivery slots picker response. */
export function parseDeliverySlotsPicker(rawData: unknown): DeliverySlotPickerData { ... }
```

### 4. `src/app/api/cart/delivery-slots/route.ts` — API route

Follow the same pattern as `src/app/api/cart/route.ts`:

```ts
// GET: fetch available delivery slots
export async function GET(request: NextRequest): Promise<NextResponse<DeliverySlotPickerData | ApiErrorResponse>> {
  // 1. Read auth token
  // 2. Build client
  // 3. client.cart.getDeliverySlots() via sendRequest pattern
  // 4. parseDeliverySlotsPicker(rawResult)
  // 5. Return JSON
}

// POST: set delivery slot
export async function POST(request: NextRequest): Promise<NextResponse<CartData | ApiErrorResponse>> {
  // 1. Read auth token
  // 2. Validate request body (slotId)
  // 3. Build client
  // 4. sendRequest("POST", "/cart/set_delivery_slot", { slot_id: slotId })
  // 5. parseCartResponse(rawCart) — returns full CartData including updated slot
  // 6. Return JSON
}
```

### 5. `src/components/delivery-slot-banner.tsx` — Banner component

Simple display component showing the delivery slot status on the cart page.

Props:
```ts
type DeliverySlotBannerProps = {
  bannerText: string;       // "Kies je bezorgmoment" or "Morgen 14:40 - 15:40"
  isExplicit: boolean;      // true if user has selected a slot
  onTap: () => void;        // opens the picker modal
};
```

Layout (matching native app):
- Left: truck icon with clock overlay (SVG inline or emoji placeholder)
- Center: banner text (bold when explicit selection, regular when prompt)
- Right: three-dot menu icon (⋯)
- Background: white with subtle border, rounded corners
- Full-width, clickable

### 6. `src/components/delivery-slot-picker.tsx` — Modal picker

Complex interactive component with its own fetch + state management.

Props:
```ts
type DeliverySlotPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSlotSelected: (updatedCart: CartData) => void;
};
```

Internal state:
```ts
type PickerState =
  | { status: "loading" }
  | { status: "ready"; data: DeliverySlotPickerData; selectedDayIndex: number }
  | { status: "selecting"; data: DeliverySlotPickerData; selectedDayIndex: number; selectingSlotId: string }
  | { status: "error"; message: string };
```

Layout sections:
1. **Header**: "Kies je bezorgmoment" + "Altijd gratis bezorgd!" + X close button
2. **Day tabs**: Horizontal scroll of day buttons
3. **Slot list** for selected day:
   - If user has a selected slot on this day: "Geselecteerd door jou" section + "Of kies een ander moment" section
   - Else: "Groenste keuze voor jouw buurt" (green slots with leaf icon) + "Of kies een ander moment" (regular slots)
4. Each slot row: time window text + leaf icon (if green) or checkmark (if selected)

## Files to Modify

### `src/lib/types.ts`

Add import and two fields to `CartData`:

```ts
import type { SelectedSlotData } from "@/lib/delivery-slot-types";

// In CartData:
selectedSlot: SelectedSlotData | null;
deliveryBannerText: string;
```

Add to `emptyCartData()` in parse-cart.ts:
```ts
selectedSlot: null,
deliveryBannerText: "Kies je bezorgmoment",
```

### `src/lib/parse-cart.ts`

Add ~5 lines to `parseCartResponse` to extract delivery slot data:

```ts
import { parseSelectedSlot } from "@/lib/parse-delivery-slots";
import { formatBannerText, NO_SLOT_TEXT } from "@/lib/format-delivery-window";

// In parseCartResponse, after suggestions extraction:
const selectedSlot = parseSelectedSlot(rawData["selected_slot"], asArray(rawData["delivery_slots"]));
const deliveryBannerText = selectedSlot?.isExplicitSelection
  ? formatBannerText(selectedSlot.windowStart, selectedSlot.windowEnd)
  : NO_SLOT_TEXT;

// In the return object:
return {
  ...existingFields,
  selectedSlot,
  deliveryBannerText,
};
```

### `src/app/cart/page.tsx`

Add banner component and picker modal state (~15 lines):

```tsx
import { DeliverySlotBanner } from "@/components/delivery-slot-banner";
import { DeliverySlotPicker } from "@/components/delivery-slot-picker";

// In CartPageContent:
const [isPickerOpen, setIsPickerOpen] = useState(false);

// In JSX, before the items list:
<DeliverySlotBanner
  bannerText={cart.deliveryBannerText}
  isExplicit={cart.selectedSlot?.isExplicitSelection ?? false}
  onTap={() => setIsPickerOpen(true)}
/>

<DeliverySlotPicker
  isOpen={isPickerOpen}
  onClose={() => setIsPickerOpen(false)}
  onSlotSelected={(updatedCart) => {
    reconcileFromServer(updatedCart);
    setIsPickerOpen(false);
  }}
/>
```

Note: `reconcileFromServer` needs to be accessible from `CartPageContent`. Either pass it as a prop or lift the picker state to `CartPage`.

## Verification

1. Run `npm run lint` — should pass with no errors
2. Run `npm run build` — should compile successfully
3. Manual checks:
   - Load cart page → banner shows "Kies je bezorgmoment" (if no explicit slot)
   - Tap banner → picker modal opens with loading state, then shows slots
   - Verify day tabs are horizontally scrollable
   - Verify green slots show leaf icon under "Groenste keuze voor jouw buurt"
   - Tap a slot → loading state on slot → modal closes → banner updates with time window
   - Tap banner again → picker shows "Geselecteerd door jou" section for selected slot
   - Tap X → modal closes without changing selection
   - Verify "Vandaag"/"Morgen"/day names are correct for the dates shown
