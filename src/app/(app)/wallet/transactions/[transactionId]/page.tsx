"use client";

import { type ReactNode, use } from "react";

import Image from "next/image";
import Link from "next/link";

import { CartItemCard } from "@/components/cart/cart-item";
import { ChevronRightIcon } from "@/components/layout/nav-icons";
import { BackArrowIcon } from "@/components/ui/back-arrow-icon";
import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCountryCode, useTranslations } from "@/contexts/country-context";
import { useApiResource } from "@/hooks/use-api-resource";
import { usePageTitle } from "@/hooks/use-page-title";
import { formatPrice } from "@/lib/core/format-price";
import { buildImageUrl } from "@/lib/core/image-url";
import type {
  TransactionDetailApiResponse,
  TransactionDetailData,
  TransactionSubstitution,
} from "@/lib/core/wallet-types";
import { formatDayMonth } from "@/lib/delivery/format-delivery-window";

const PAYMENT_TYPE = "PAYMENT";

/**
 * One payment from the Betaaloverzicht ("Betaling" in the app): the products
 * it covers, substitutions, deposits, the total and the payment method.
 * Read-only; the app's contact buttons are left out.
 */
export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const { transactionId } = use(params);
  const t = useTranslations();
  const { state, retry } = useApiResource<TransactionDetailApiResponse>(
    `/api/wallet/transactions/${encodeURIComponent(transactionId)}`,
    t.walletLoadError
  );
  usePageTitle(t.walletPaymentTitle);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <Link
          href="/wallet"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
        >
          <BackArrowIcon />
          {t.backButton}
        </Link>

        {state.status === "loading" && <LoadingSpinner />}
        {state.status === "error" && <ErrorView message={state.message} onRetry={retry} />}
        {state.status === "success" && <TransactionDetail payment={state.data} />}
      </main>
    </div>
  );
}

function TransactionDetail({ payment }: { payment: TransactionDetailData }) {
  const t = useTranslations();
  const countryCode = useCountryCode();
  const date = payment.paidAt ? formatDayMonth(payment.paidAt, countryCode) : "";
  const totalLabel = (payment.type === PAYMENT_TYPE ? t.walletPaidOn : t.walletRefundedOn).replace(
    "{date}",
    date
  );

  return (
    <>
      <h1 className="text-foreground text-2xl font-bold">{t.walletPaymentTitle}</h1>
      {date && <p className="text-text-muted mt-1">{date}</p>}

      {payment.deliveryId && (
        <Link
          href={`/deliveries/${encodeURIComponent(payment.deliveryId)}`}
          className="text-foreground mt-4 inline-flex items-center gap-1 rounded-full bg-[#f8f5f2] px-4 py-2 text-sm transition-colors hover:bg-[#f1ece7]"
        >
          {t.walletViewReceipt}
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      )}

      {(payment.items.length > 0 || payment.substitutions.length > 0) && (
        <div className="border-card-border bg-card-bg mt-6 rounded-xl border px-4">
          {payment.items.map((item) => (
            <CartItemCard key={item.id} item={item} />
          ))}
          {payment.substitutions.map((substitution, index) => (
            <SubstitutionRow key={index} substitution={substitution} />
          ))}
        </div>
      )}

      <dl className="mt-6">
        {payment.depositTotal > 0 && (
          <SummaryRow label={t.depositGeneric} value={formatPrice(payment.depositTotal)} />
        )}
        {payment.returnedDepositTotal > 0 && (
          <SummaryRow
            label={t.walletReturnedDeposits}
            value={formatPrice(payment.returnedDepositTotal)}
          />
        )}
        <div className="flex items-center justify-between py-4">
          <dt className="text-foreground text-lg font-bold">{totalLabel}</dt>
          <dd className="text-foreground text-lg font-semibold">{formatPrice(payment.amount)}</dd>
        </div>
      </dl>

      {payment.paymentMethod && (
        <div className="flex items-center gap-4">
          {payment.paymentMethod.iconUrl && (
            <Image
              src={payment.paymentMethod.iconUrl}
              alt=""
              width={44}
              height={32}
              unoptimized
              className="h-8 w-11 shrink-0 object-contain"
            />
          )}
          <div>
            <p className="text-foreground">{payment.paymentMethod.displayName}</p>
            {payment.paymentMethod.account && (
              <p className="text-text-muted text-sm">{payment.paymentMethod.account}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-card-border flex items-center justify-between border-b border-dashed py-4">
      <dt className="text-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

/** A missing product (greyed, with its refund) and what replaced it. */
function SubstitutionRow({ substitution }: { substitution: TransactionSubstitution }) {
  const t = useTranslations();
  return (
    <div className="border-card-border border-t py-3">
      <ProductLine
        name={substitution.original.name}
        imageId={substitution.original.imageId}
        quantity={substitution.original.quantity}
        muted
        trailing={<span className="text-gray-500">-{formatPrice(substitution.refundAmount)}</span>}
      />
      <p className="ml-3 py-1 text-[#4B8505]" aria-hidden="true">
        ↓
      </p>
      {substitution.replacements.map((replacement, index) => (
        <ProductLine
          key={index}
          name={replacement.name}
          imageId={replacement.imageId}
          quantity={replacement.quantity}
          subtitle={t.walletSubstitution}
        />
      ))}
    </div>
  );
}

function ProductLine({
  name,
  imageId,
  quantity,
  muted = false,
  subtitle,
  trailing,
}: {
  name: string;
  imageId: string | null;
  quantity: number;
  muted?: boolean;
  subtitle?: string;
  trailing?: ReactNode;
}) {
  const countryCode = useCountryCode();
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm ${muted ? "border-gray-300 text-gray-400" : "border-[#4B8505] text-[#4B8505]"}`}
      >
        {quantity}
      </span>
      <span className="relative h-14 w-14 shrink-0">
        {imageId && (
          <Image
            src={buildImageUrl(imageId, countryCode)}
            alt={name}
            fill
            unoptimized
            className="object-contain"
            sizes="56px"
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block ${muted ? "text-gray-500" : "text-foreground"}`}>{name}</span>
        {subtitle && <span className="block text-sm text-[#4B8505]">{subtitle}</span>}
      </span>
      {trailing}
    </div>
  );
}
