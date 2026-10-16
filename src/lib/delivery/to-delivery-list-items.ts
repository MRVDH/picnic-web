import type { DeliverySummary } from "picnic-api/lib/domains/delivery/types";

import type { DeliveryListItem } from "@/lib/core/delivery-types";
import type { CountryCode } from "@/lib/core/types";
import { formatDeliveryWindowText } from "@/lib/delivery/format-delivery-window";

/** Adds the localized delivery window text to the summaries picnic-api returns. */
export function toDeliveryListItems(
  summaries: DeliverySummary[],
  countryCode: CountryCode
): DeliveryListItem[] {
  return summaries.map((summary) => ({
    ...summary,
    deliveryWindowText: formatDeliveryWindowText(
      summary.windowStart,
      summary.windowEnd,
      countryCode
    ),
  }));
}
