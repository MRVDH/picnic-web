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

/** One parcel row on the Pakketservice page, with texts as Picnic sends them. */
export type ParcelRow = {
  id: string;
  /** e.g. "DHL-pakket". */
  name: string;
  /** e.g. "Opgehaald door Picnic". */
  statusText: string;
  /** Color Picnic renders the status in (e.g. "#308807"), or null for the default. */
  statusColor: string | null;
  /** Localized date, e.g. "28 oktober 2024". */
  dateText: string;
  /** Picnic's parcel id (the shipment number), from the row's tracking deep link. */
  parcelId: string | null;
};

/** A group of parcels under a heading, e.g. "Verwerkt". */
export type ParcelSection = {
  title: string;
  parcels: ParcelRow[];
};

/** The Pakketservice page (parcels-overview-page-root). */
export type ParcelsPageData = {
  title: string;
  subtitle: string;
  sections: ParcelSection[];
};

/** One step of a parcel's tracking timeline, e.g. "Opgehaald door Picnic". */
export type ParcelTrackingStep = {
  title: string;
  /** Localized date, e.g. "Maandag 28 oktober 2024". */
  dateText: string;
  /** Whether the step shows a checkmark (it has happened). */
  done: boolean;
  /** Marker background color from Picnic, e.g. "#295813". */
  markerColor: string | null;
  /** Marker diameter in px; the current step is drawn larger. */
  markerSize: number;
  /** Color of the line to the next step, or null when there is none. */
  lineColor: string | null;
};

/** The parcel tracking page (parcel-tracking-page-root). */
export type ParcelDetailData = {
  /** e.g. "Jouw pakketje". */
  title: string;
  /** e.g. "Zendingsnummer:". */
  shipmentLabel: string;
  /** The shipment number, which the app lets you copy. */
  shipmentNumber: string;
  /** Message the app shows after copying, e.g. "Zendingsnummer gekopieerd!". */
  copiedMessage: string | null;
  steps: ParcelTrackingStep[];
  /** e.g. "Dankjewel! Samen besparen we een onnodig ritje in de buurt." */
  footerText: string;
};

export type DeliveriesApiResponse = {
  deliveries: DeliveryListItem[];
};

export type DeliveryDetailApiResponse = DeliveryDetailData;

export type DeliveryTrackingApiResponse = DeliveryTrackingData;

export type ParcelsApiResponse = ParcelsPageData;

export type ParcelDetailApiResponse = ParcelDetailData;
