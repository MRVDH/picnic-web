// Maps picnic-api's delivery details and tracking to the web's delivery types, adding the
// display texts.
import type PicnicClient from "picnic-api";

import { mapCartLine } from "@/lib/cart/map-cart";
import type { DeliveryDetailData, DeliveryTrackingData } from "@/lib/core/delivery-types";
import type { CountryCode } from "@/lib/core/types";
import { formatDeliveryWindowText, formatEtaText } from "@/lib/delivery/format-delivery-window";

type DeliveryDetails = PicnicClient.Types.delivery.DeliveryDetails;
type DeliveryTracking = PicnicClient.Types.delivery.DeliveryTracking;

export function mapDeliveryDetails(
  delivery: DeliveryDetails,
  countryCode: CountryCode
): DeliveryDetailData {
  return {
    id: delivery.id,
    status: delivery.status,
    creationTime: delivery.creationTime,
    windowStart: delivery.windowStart,
    windowEnd: delivery.windowEnd,
    deliveryWindowText: formatDeliveryWindowText(
      delivery.windowStart,
      delivery.windowEnd,
      countryCode
    ),
    orders: delivery.orders.map((order) => ({
      id: order.id,
      items: order.items.map(mapCartLine),
      totalPrice: order.totalPrice,
      checkoutTotalPrice: order.checkoutTotalPrice,
      totalSavings: order.promotionSavings,
      totalDeposit: order.depositTotal,
      membershipSavings: order.membershipSavings,
      cancellable: order.cancellable,
      status: order.status,
      creationTime: order.creationTime,
      fees: order.fees,
      depositBreakdown: order.deposits,
      payment: order.payment && {
        paymentType: order.payment.paymentType ?? "",
        redactedIban: order.payment.redactedIban ?? "",
        bankId: order.payment.bankId ?? "",
      },
    })),
    returnedContainers: delivery.returnedContainers,
    totalPrice: delivery.totalPrice,
    totalCount: delivery.totalCount,
    totalDiscount: delivery.discount,
    depositTotal: delivery.depositTotal,
    depositBreakdown: delivery.deposits,
    membershipSavings: delivery.membershipSavings,
    promoSavings: delivery.promotionSavings,
    fees: delivery.fees,
    cancellable: delivery.cancellable,
  };
}

export function mapDeliveryTracking(
  tracking: DeliveryTracking,
  countryCode: CountryCode
): DeliveryTrackingData {
  const { inProgress, ...rest } = tracking;
  return {
    ...rest,
    scenarioInProgress: inProgress,
    etaText: formatEtaText(tracking.eta, countryCode),
  };
}
