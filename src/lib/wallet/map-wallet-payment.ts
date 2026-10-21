// Maps picnic-api's wallet payment to the web's payment detail.
import type PicnicClient from "picnic-api";

import { mapCartLine } from "@/lib/cart/map-cart";
import type { TransactionDetailData } from "@/lib/core/wallet-types";

type WalletPayment = PicnicClient.Types.payment.WalletPayment;

export function mapWalletPayment(payment: WalletPayment): TransactionDetailData {
  return { ...payment, items: payment.items.map(mapCartLine) };
}
