// Types for the Portemonnee (wallet) pages. Texts on the wallet and balance
// pages come localized from Picnic's Fusion pages; the transaction detail is
// plain data, so its labels are ours.
import type { ReturnedContainerItem } from "@/lib/core/delivery-types";
import type { CartItem } from "@/lib/core/types";

/** A piece of text with the color Picnic renders it in (null for the default). */
export type ColoredText = { text: string; color: string | null };

/** The Picnic-tegoed card: label, amount and the explanation below it. */
export type WalletBalance = {
  /** e.g. "Picnic-tegoed". */
  label: string;
  /** e.g. "€0.00". */
  amount: string;
  /** e.g. a green "Wordt verrekend met je volgende bestelling." and a grey follow-up. */
  info: ColoredText[];
};

/** A label next to a payment's date, e.g. "Family". */
export type WalletLabel = {
  text: string;
  backgroundColor: string | null;
};

/** One row of the Betaaloverzicht. */
export type WalletPaymentRow = {
  transactionId: string;
  /** e.g. "23 september". */
  date: string;
  labels: WalletLabel[];
  /** e.g. "€107.35" or "+ €24.04" for money back. */
  amount: ColoredText;
};

/** The Portemonnee page (portemonnee-page). */
export type WalletPageData = {
  title: string;
  balance: WalletBalance | null;
  /** The "Betaalmethodes" row: its label and the icons of the stored methods. */
  paymentMethods: { label: string; iconUrls: string[] } | null;
  /** e.g. "Betaaloverzicht". */
  paymentsTitle: string;
  payments: WalletPaymentRow[];
};

/** One balance change on the Picnic-tegoed page, e.g. "Update tegoed − 7.46". */
export type BalanceHistoryRow = {
  label: string;
  /** Sign and amount as Picnic shows them, e.g. "- 7.46". */
  amount: string;
  /** The order the change belongs to, for a link to its receipt. */
  deliveryId: string | null;
};

/** Balance changes of one day, e.g. "Woensdag 17 juni". */
export type BalanceHistorySection = {
  title: string;
  rows: BalanceHistoryRow[];
};

/** The Picnic-tegoed page (saldo-overview-page). */
export type BalancePageData = {
  balance: WalletBalance | null;
  sections: BalanceHistorySection[];
};

/** A product that replaced a missing one, e.g. Chinese kool for Shanghai paksoi. */
export type TransactionSubstitution = {
  /** The missing product, looked up in the order's items. */
  original: { name: string; imageId: string | null; quantity: number };
  /** Amount refunded for the missing product, in cents. */
  refundAmount: number;
  replacements: { name: string; imageId: string | null; quantity: number }[];
};

/** One payment (wallet transaction). */
export type TransactionDetailData = {
  id: string;
  deliveryId: string | null;
  /** Payment time as epoch milliseconds. */
  paidAt: number | null;
  /** Amount in cents. */
  amount: number;
  /** "PAYMENT", or e.g. "REFUND" for money back. */
  type: string;
  status: string;
  items: CartItem[];
  substitutions: TransactionSubstitution[];
  /** Deposits paid, in cents. */
  depositTotal: number;
  /** Deposits returned, in cents. */
  returnedDepositTotal: number;
  returnedContainers: ReturnedContainerItem[];
  paymentMethod: { displayName: string; account: string | null; iconUrl: string | null } | null;
};

export type WalletApiResponse = WalletPageData;
export type BalanceApiResponse = BalancePageData;
export type TransactionDetailApiResponse = TransactionDetailData;
