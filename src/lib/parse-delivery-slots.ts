/**
 * Delivery slot extraction and grouping.
 *
 * Parses the raw Picnic API response into strongly-typed delivery slot data.
 * All field access is defensive via type guards from src/lib/type-guards.ts.
 */
import type {
  DeliverySlotData,
  DeliverySlotPickerData,
  SelectedSlotData,
  SlotDayGroup,
} from "@/lib/delivery-slot-types";
import { formatDayTabLabel } from "@/lib/format-delivery-window";
import { asArray, asString, isObject } from "@/lib/type-guards";

// ─── Single slot extraction ──────────────────────────────────────────────────

/** Extract a single DeliverySlotData from a raw slot object. Returns null if invalid. */
function parseRawSlot(raw: Record<string, unknown>): DeliverySlotData | null {
  const slotId = asString(raw["slot_id"]);
  if (!slotId) return null;

  const windowStart = asString(raw["window_start"]);
  const windowEnd = asString(raw["window_end"]);
  const cutOffTime = asString(raw["cut_off_time"]);
  if (!windowStart || !windowEnd) return null;

  return {
    slotId,
    windowStart,
    windowEnd,
    cutOffTime,
    isAvailable: raw["is_available"] === true,
    isSelected: raw["selected"] === true,
    isGreenChoice: false, // Set later by identifyGreenSlotIds
    minimumOrderValue:
      typeof raw["minimum_order_value"] === "number" ? raw["minimum_order_value"] : null,
  };
}

// ─── Selected slot extraction ────────────────────────────────────────────────

/**
 * Extract the selected slot summary from the raw response.
 * Matches the selected slot_id against the delivery_slots array to get window times.
 */
export function parseSelectedSlot(
  rawSelectedSlot: unknown,
  rawDeliverySlots: unknown[]
): SelectedSlotData | null {
  if (!isObject(rawSelectedSlot)) return null;

  const slotId = asString(rawSelectedSlot["slot_id"]);
  if (!slotId) return null;

  const state = asString(rawSelectedSlot["state"]);
  const isExplicitSelection = state !== "IMPLICIT" && state !== "";

  // Find matching slot in delivery_slots for window times
  let windowStart: string | null = null;
  let windowEnd: string | null = null;

  for (const rawSlot of rawDeliverySlots) {
    if (!isObject(rawSlot)) continue;
    if (asString(rawSlot["slot_id"]) === slotId) {
      windowStart = asString(rawSlot["window_start"]) || null;
      windowEnd = asString(rawSlot["window_end"]) || null;
      break;
    }
  }

  return { slotId, state, windowStart, windowEnd, isExplicitSelection };
}

// ─── Green choice identification ─────────────────────────────────────────────

/**
 * Identify green-choice slot IDs using the paired window_start heuristic.
 * For pairs sharing the same window_start, the longer-duration slot is green.
 */
function identifyGreenSlotIds(slots: DeliverySlotData[]): Set<string> {
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
function groupSlotsByDay(slots: DeliverySlotData[]): SlotDayGroup[] {
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
    const { dayLabel, dateLabel } = formatDayTabLabel(dateKey);
    const greenSlots = daySlots.filter((s) => s.isGreenChoice);
    const regularSlots = daySlots.filter((s) => !s.isGreenChoice);

    return { date: dateKey, dayLabel, dateLabel, greenSlots, regularSlots };
  });
}

// ─── Full picker response parser ─────────────────────────────────────────────

/** Parse the full delivery slots picker response (from GET /cart/delivery_slots). */
export function parseDeliverySlotsPicker(rawData: unknown): DeliverySlotPickerData {
  if (!isObject(rawData)) {
    return { dayGroups: [], selectedSlot: null };
  }

  const rawSlots = asArray(rawData["delivery_slots"]);

  // Parse all slots
  const slots: DeliverySlotData[] = rawSlots
    .filter(isObject)
    .map(parseRawSlot)
    .filter((s): s is DeliverySlotData => s !== null);

  // Identify and mark green choices
  const greenIds = identifyGreenSlotIds(slots);
  for (const slot of slots) {
    slot.isGreenChoice = greenIds.has(slot.slotId);
  }

  // Group by day
  const dayGroups = groupSlotsByDay(slots);

  // Parse selected slot
  const selectedSlot = parseSelectedSlot(rawData["selected_slot"], rawSlots);

  return { dayGroups, selectedSlot };
}
