/**
 * Delivery slot grouping for the slot picker.
 *
 * picnic-api parses the slots and marks the green choices
 * (`client.cart.getDeliverySlots`); this file only groups them by day.
 */
import type {
  DeliverySlotData,
  DeliverySlotPickerData,
  DeliverySlots,
  SlotDayGroup,
} from "@/lib/core/delivery-slot-types";
import type { CountryCode } from "@/lib/core/types";
import { formatDayTabLabel } from "@/lib/delivery/format-delivery-window";

// ─── Day grouping ────────────────────────────────────────────────────────────

/** Extract YYYY-MM-DD date string from an ISO timestamp. */
function extractDateKey(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Group slots by calendar day and separate green vs regular. */
function groupSlotsByDay(slots: DeliverySlotData[], countryCode: CountryCode): SlotDayGroup[] {
  const dayMap = new Map<string, DeliverySlotData[]>();
  const dayOrder: string[] = [];

  for (const slot of slots) {
    const dateKey = extractDateKey(slot.windowStart);
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, []);
      dayOrder.push(dateKey);
    }
    dayMap.get(dateKey)!.push(slot);
  }

  return dayOrder.map((dateKey) => {
    const daySlots = dayMap.get(dateKey)!;
    const { dayLabel, dateLabel } = formatDayTabLabel(dateKey, countryCode);
    const greenSlots = daySlots.filter((s) => s.isGreenChoice);
    const regularSlots = daySlots.filter((s) => !s.isGreenChoice);

    return { date: dateKey, dayLabel, dateLabel, greenSlots, regularSlots };
  });
}

// ─── Picker data ─────────────────────────────────────────────────────────────

/** Build the slot picker data from the slots picnic-api returns. */
export function buildSlotPicker(
  slots: DeliverySlots,
  countryCode: CountryCode
): DeliverySlotPickerData {
  return {
    dayGroups: groupSlotsByDay(slots.slots, countryCode),
    selectedSlot: slots.selectedSlot,
  };
}
