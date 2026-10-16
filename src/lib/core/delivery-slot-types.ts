// Delivery slot type definitions, in their own module to keep types.ts within the 300-line limit.
import type PicnicClient from "picnic-api";

/** Slot overview as returned by picnic-api's `cart.getDeliverySlotOverview`. */
export type DeliverySlotOverview = PicnicClient.Types.cart.DeliverySlotOverview;

/** A single delivery slot, including the green-choice flag picnic-api derives. */
export type DeliverySlotData = PicnicClient.Types.cart.DeliverySlotSummary;

/** Summary of the currently selected delivery slot for the banner. */
export type SelectedSlotData = PicnicClient.Types.cart.SelectedSlotSummary;

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
