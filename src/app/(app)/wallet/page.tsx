"use client";

import Image from "next/image";
import Link from "next/link";

import { ChevronRightIcon } from "@/components/layout/nav-icons";
import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BalanceCard } from "@/components/wallet/balance-card";
import { useTranslations } from "@/contexts/country-context";
import { useApiResource } from "@/hooks/use-api-resource";
import { usePageTitle } from "@/hooks/use-page-title";
import type { WalletApiResponse, WalletPaymentRow } from "@/lib/core/wallet-types";

/**
 * The Portemonnee page, mirroring the app's portemonnee-page: the
 * Picnic-tegoed card, the payment methods row and the payment history. All
 * texts come from Picnic.
 */
export default function WalletPage() {
  const t = useTranslations();
  const { state, retry } = useApiResource<WalletApiResponse>("/api/wallet", t.walletLoadError);
  const wallet = state.status === "success" ? state.data : null;

  usePageTitle(wallet?.title || t.accountWallet);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        {state.status === "loading" && <LoadingSpinner />}
        {state.status === "error" && <ErrorView message={state.message} onRetry={retry} />}

        {wallet && (
          <>
            <h1 className="text-foreground mb-6 text-2xl font-bold">
              {wallet.title || t.accountWallet}
            </h1>

            {wallet.balance && <BalanceCard balance={wallet.balance} href="/wallet/balance" />}

            {wallet.paymentMethods && (
              <Link
                href="/wallet/payment-methods"
                className="border-card-border text-foreground mt-2 flex items-center justify-between border-b py-4 transition-colors hover:bg-gray-50"
              >
                <span>{wallet.paymentMethods.label}</span>
                <span className="flex items-center gap-3">
                  {wallet.paymentMethods.iconUrls.map((url) => (
                    <Image
                      key={url}
                      src={url}
                      alt=""
                      width={32}
                      height={24}
                      unoptimized
                      className="h-6 w-8 object-contain"
                    />
                  ))}
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                </span>
              </Link>
            )}

            {wallet.payments.length > 0 && (
              <section className="mt-6">
                {wallet.paymentsTitle && (
                  <h2 className="text-foreground mb-2 text-xl font-bold">{wallet.paymentsTitle}</h2>
                )}
                <ul className="divide-card-border divide-y">
                  {wallet.payments.map((payment) => (
                    <PaymentRow key={payment.transactionId} payment={payment} />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function PaymentRow({ payment }: { payment: WalletPaymentRow }) {
  return (
    <li>
      <Link
        href={`/wallet/transactions/${encodeURIComponent(payment.transactionId)}`}
        className="flex items-center justify-between gap-3 py-4 transition-colors hover:bg-gray-50"
      >
        <span className="flex items-center gap-2">
          <span className="text-text-muted">{payment.date}</span>
          {payment.labels.map((label) => (
            <span
              key={label.text}
              className="text-foreground rounded px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: label.backgroundColor ?? undefined }}
            >
              {label.text}
            </span>
          ))}
        </span>
        <span className="flex items-center gap-4">
          <span
            className="text-text-muted text-lg"
            style={{ color: payment.amount.color ?? undefined }}
          >
            {payment.amount.text}
          </span>
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
        </span>
      </Link>
    </li>
  );
}
