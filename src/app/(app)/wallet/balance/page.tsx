"use client";

import Link from "next/link";

import { ChevronRightIcon } from "@/components/layout/nav-icons";
import { BackArrowIcon } from "@/components/ui/back-arrow-icon";
import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BalanceCard } from "@/components/wallet/balance-card";
import { useTranslations } from "@/contexts/country-context";
import { useApiResource } from "@/hooks/use-api-resource";
import { usePageTitle } from "@/hooks/use-page-title";
import type { BalanceApiResponse, BalanceHistoryRow } from "@/lib/core/wallet-types";

/**
 * The Picnic-tegoed page, mirroring the app's saldo-overview-page: the balance
 * card and the balance changes per day, each linking to its order. The
 * cash-out button is left out; the page only shows data.
 */
export default function WalletBalancePage() {
  const t = useTranslations();
  const { state, retry } = useApiResource<BalanceApiResponse>(
    "/api/wallet/balance",
    t.walletLoadError
  );
  const page = state.status === "success" ? state.data : null;

  usePageTitle(page?.balance?.label || t.accountWallet);

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

        {page && (
          <>
            {page.balance && <BalanceCard balance={page.balance} />}

            {page.sections.map((section) => (
              <section key={section.title} className="border-card-border mt-6 border-b pb-2">
                <h2 className="text-foreground mb-1 text-sm font-medium">{section.title}</h2>
                <ul>
                  {section.rows.map((row, index) => (
                    <BalanceRow key={`${row.deliveryId}-${index}`} row={row} />
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </main>
    </div>
  );
}

function BalanceRow({ row }: { row: BalanceHistoryRow }) {
  const content = (
    <>
      <span>{row.label}</span>
      <span className="flex items-center gap-2">
        <span>{row.amount}</span>
        {row.deliveryId && <ChevronRightIcon className="h-4 w-4 text-[#c9c6c3]" />}
      </span>
    </>
  );
  const className = "text-text-muted flex items-center justify-between py-4 text-sm";

  return (
    <li>
      {row.deliveryId ? (
        <Link
          href={`/deliveries/${encodeURIComponent(row.deliveryId)}`}
          className={`${className} transition-colors hover:bg-gray-50`}
        >
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </li>
  );
}
