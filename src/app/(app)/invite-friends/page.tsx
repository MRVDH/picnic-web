"use client";

import { useCallback, useState } from "react";

import Image from "next/image";

import { CartToast } from "@/components/cart/cart-toast";
import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCountryCode, useTranslations } from "@/contexts/country-context";
import { useApiResource } from "@/hooks/use-api-resource";
import { usePageTitle } from "@/hooks/use-page-title";
import type { CountryCode } from "@/lib/core/types";
import type { ReferralApiResponse, ReferralData } from "@/lib/core/user-types";

/** Picnic's terms for the referral offer, as linked from the app. No French page is known. */
const TERMS_URLS: Partial<Record<CountryCode, string>> = {
  NL: "https://www.picnic.nl/voorwaarden-vriendenkorting",
  DE: "https://www.picnic.de/bedingungen-freundschaftsrabatt",
};

/** The app's illustration (xhdpi, 526×608): two people holding a blank sign for the code. */
const ILLUSTRATION = { src: "/images/app/invite-friends.png", width: 350, height: 405 };

/**
 * The Vriendenkorting page, like the app's invite-friend screen: the user's
 * code on the illustration's sign, what it's worth and a share button. The
 * code and amounts come from Picnic; the texts are ours, since the app keeps
 * them in its own bundle.
 */
export default function InviteFriendsPage() {
  const t = useTranslations();
  const { state, retry } = useApiResource<ReferralApiResponse>(
    "/api/user/referral",
    t.referralLoadError
  );
  usePageTitle(t.accountFriends);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-8">
        <h1 className="text-foreground text-center text-2xl font-bold">{t.accountFriends}</h1>
        {state.status === "loading" && <LoadingSpinner />}
        {state.status === "error" && <ErrorView message={state.message} onRetry={retry} />}
        {state.status === "success" && <Referral referral={state.data} />}
      </main>
    </div>
  );
}

function Referral({ referral }: { referral: ReferralData }) {
  const t = useTranslations();
  const countryCode = useCountryCode();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToastMessage(null), []);

  const amount = formatWholeEuros(referral.inviterValue);
  const inviteeAmount = formatWholeEuros(referral.inviteeValue);
  const termsUrl = TERMS_URLS[countryCode];

  // Opens the browser's share sheet; where that's missing, copies the link instead.
  const handleShare = useCallback(async () => {
    const url = referral.shareUrl ?? "";
    const text = t.referralShareText
      .replace("{code}", referral.code)
      .replace("{amount}", inviteeAmount);
    try {
      if (navigator.share) {
        await navigator.share({ text, url: url || undefined });
        return;
      }
      await navigator.clipboard.writeText(url ? `${text} ${url}` : text);
      setToastMessage(t.referralCopied);
    } catch {
      // Cancelled share or no clipboard access: nothing to do.
    }
  }, [referral, inviteeAmount, t]);

  return (
    <>
      <div className="relative mx-auto mt-10" style={{ width: ILLUSTRATION.width }}>
        <Image
          src={ILLUSTRATION.src}
          alt=""
          width={ILLUSTRATION.width}
          height={ILLUSTRATION.height}
          unoptimized
          priority
        />
        {/* The sign spans about 13–83% of the width and 40–59% of the height of the image. */}
        <p className="text-foreground absolute top-[40%] right-[17%] left-[13%] flex h-[19%] items-center justify-center text-4xl font-bold">
          {referral.code}
        </p>
        <span className="bg-picnic-red absolute top-[33%] left-[74%] flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-white">
          {amount}
        </span>
      </div>

      <p className="text-foreground mt-10 text-center text-lg">
        {t.referralBodyBefore} <strong>{t.referralBodyBold}</strong>
        {t.referralBodyAfter.replace("{amount}", amount)}
      </p>

      <button
        type="button"
        onClick={handleShare}
        className="bg-picnic-red hover:bg-picnic-red-dark mt-8 w-full rounded-lg px-4 py-3 text-lg text-white transition-colors"
      >
        {t.referralShare}
      </button>

      {termsUrl && (
        <p className="mt-8 text-center">
          <a
            href={termsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted underline hover:text-gray-700"
          >
            {t.referralTerms}
          </a>
        </p>
      )}

      <CartToast message={toastMessage} onDismiss={dismissToast} />
    </>
  );
}

/** "€10" for whole euros, "€7.50" otherwise, like the app's badge. */
function formatWholeEuros(cents: number): string {
  const euros = cents / 100;
  return `€${Number.isInteger(euros) ? euros : euros.toFixed(2)}`;
}
