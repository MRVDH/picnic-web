"use client";

import Image from "next/image";
import Link from "next/link";

import { BackArrowIcon } from "@/components/ui/back-arrow-icon";
import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslations } from "@/contexts/country-context";
import { useApiResource } from "@/hooks/use-api-resource";
import { usePageTitle } from "@/hooks/use-page-title";
import type { PaymentProfileApiResponse } from "@/lib/core/checkout-types";

/**
 * The payment methods page ("Betaling" in the app), read-only: it lists the
 * stored payment methods and marks the preferred one. Adding, removing and
 * switching methods are left out for now.
 */
export default function WalletPaymentMethodsPage() {
  const t = useTranslations();
  const { state, retry } = useApiResource<PaymentProfileApiResponse>(
    "/api/cart/checkout/payment-profile",
    t.walletLoadError
  );
  usePageTitle(t.walletPaymentTitle);

  const profile = state.status === "success" ? state.data : null;

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

        <h1 className="text-foreground text-2xl font-bold">{t.walletPaymentTitle}</h1>

        {state.status === "loading" && <LoadingSpinner />}
        {state.status === "error" && <ErrorView message={state.message} onRetry={retry} />}

        {profile && (
          <section className="mt-8">
            <h2 className="text-foreground mb-2 text-xl font-bold">{t.walletYourPaymentMethod}</h2>
            {profile.storedOptions.length === 0 ? (
              <p className="text-text-muted text-sm">{t.walletNoPaymentMethod}</p>
            ) : (
              <ul className="divide-card-border divide-y">
                {profile.storedOptions.map((option) => {
                  const preferred = option.id === profile.preferredPaymentOptionId;
                  return (
                    <li key={option.id} className="flex items-center gap-4 py-4">
                      <span
                        aria-hidden="true"
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${preferred ? "border-[#4B8505]" : "border-gray-300"}`}
                      >
                        {preferred && <span className="h-2.5 w-2.5 rounded-full bg-[#4B8505]" />}
                      </span>
                      {option.iconUrl && (
                        <Image
                          src={option.iconUrl}
                          alt=""
                          width={44}
                          height={32}
                          unoptimized
                          className="h-8 w-11 shrink-0 object-contain"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-foreground">{option.displayName}</p>
                        {option.account && (
                          <p className="text-text-muted text-sm">{option.account}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
