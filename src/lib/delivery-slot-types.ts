// Delivery slot type definitions.
// Separated from types.ts to respect the 300-line constitution limit.

/** A single delivery slot, extracted defensively from the raw API response. */
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

/** Summary of the currently selected delivery slot for the banner. */
export type SelectedSlotData = {
  slotId: string;
  /** Selection state: "IMPLICIT", "ACTIVE", or "EXPLICIT". */
  state: string;
  windowStart: string | null;
  windowEnd: string | null;
  /** True if the user actively chose this slot (state !== "IMPLICIT"). */
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

