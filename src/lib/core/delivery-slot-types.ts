// Delivery slot type definitions, in their own module to keep types.ts within the 300-line limit.
import type PicnicClient from "picnic-api";

/** The slots as returned by picnic-api's `cart.getDeliverySlots`. */
export type DeliverySlots = PicnicClient.Types.cart.DeliverySlots;

/** A single delivery slot, including the green-choice flag picnic-api derives. */
export type DeliverySlotData = PicnicClient.Types.cart.DeliverySlot;

/** Summary of the currently selected delivery slot for the banner. */
export type SelectedSlotData = PicnicClient.Types.cart.SelectedDeliverySlot;

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
