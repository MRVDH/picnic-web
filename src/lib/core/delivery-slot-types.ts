// Delivery slot type definitions, in their own module to keep types.ts within the 300-line limit.

/** Slot overview as returned by picnic-api's `cart.getDeliverySlotOverview`. */
export type DeliverySlotOverview = Awaited<
  ReturnType<InstanceType<typeof import("picnic-api")>["cart"]["getDeliverySlotOverview"]>
>;

/** A single delivery slot, including the green-choice flag picnic-api derives. */
export type DeliverySlotData = DeliverySlotOverview["slots"][number];

/** Summary of the currently selected delivery slot for the banner. */
export type SelectedSlotData = NonNullable<DeliverySlotOverview["selectedSlot"]>;

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
