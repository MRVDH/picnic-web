import type { CartItem, DepositEntry, FeeEntry } from "@/lib/core/types";

export type DeliveryStatus = "CURRENT" | "COMPLETED" | "CANCELLED" | string;

export type DeliveryListItem = {
  id: string;
  status: DeliveryStatus;
  creationTime: string;
  windowStart: string | null;
  windowEnd: string | null;
  deliveryWindowText: string;
  orderCount: number;
  totalPrice: number;
  itemCount: number;
};

export type DeliveryPaymentInfo = {
  paymentType: string;
  redactedIban: string;
  bankId: string;
};

export type ReturnedContainerItem = {
  type: string;
  name: string;
  quantity: number;
  price: number;
};

export type DeliveryOrderSummary = {
  id: string;
  items: CartItem[];
  totalPrice: number;
  checkoutTotalPrice: number;
  totalSavings: number;
  totalDeposit: number;
  membershipSavings: number;
  cancellable: boolean;
  status: DeliveryStatus;
  creationTime: string;
  fees: FeeEntry[];
  depositBreakdown: DepositEntry[];
  payment: DeliveryPaymentInfo | null;
};

export type DeliveryDetailData = {
  id: string;
  status: DeliveryStatus;
  creationTime: string;
  windowStart: string | null;
  windowEnd: string | null;
  deliveryWindowText: string;
  orders: DeliveryOrderSummary[];
  returnedContainers: ReturnedContainerItem[];
  totalPrice: number;
  totalCount: number;
  totalDiscount: number;
  depositTotal: number;
  depositBreakdown: DepositEntry[];
  membershipSavings: number;
  fees: FeeEntry[];
  cancellable: boolean;
};

export type DeliveryRoutePoint = {
  lat: number;
  lng: number;
  ts: number;
};

export type DeliveryTrackingData = {
  scenarioVersion: number;
  scenarioInProgress: boolean;
  queryInterval: number;
  eta: number | null;
  etaWindowStart: string | null;
  etaWindowEnd: string | null;
  etaText: string | null;
  currentPosition: DeliveryRoutePoint | null;
  route: DeliveryRoutePoint[];
  driverName: string | null;
  driverPhotoUrl: string | null;
  vehicleName: string | null;
  vehicleImageDataUrl: string | null;
  destination: {
    lat: number;
    lng: number;
    street: string | null;
    city: string | null;
    postcode: string | null;
  } | null;
};

export type ParcelItem = {
  id: string;
  /** Carrier handling the parcel, e.g. "DHL". */
  carrier: string;
  /** False once the parcel has left Picnic and tracking is done. */
  active: boolean;
  /** Raw Picnic status code, e.g. "HANDED_OVER". */
  status: string;
  statusTimestamp: string;
};

export type DeliveriesApiResponse = {
  deliveries: DeliveryListItem[];
};

export type DeliveryDetailApiResponse = DeliveryDetailData;

export type DeliveryTrackingApiResponse = DeliveryTrackingData;

export type ParcelsApiResponse = {
  parcels: ParcelItem[];
};
