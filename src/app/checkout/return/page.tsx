"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { CHECKOUT_STORAGE_KEY } from "@/lib/core/constants";
import { CartToast } from "@/components/cart/cart-toast";
import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SharedHeader } from "@/components/layout/shared-header";
import { useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
import type { ApiErrorResponse } from "@/lib/core/types";

const POLL_INTERVAL_MS = 3000;

type ReturnState =
  | { status: "loading" }
  | { status: "polling"; checkoutStatus: string }
  | { status: "finished" }
  | { status: "error"; message: string }
  | { status: "missing_session" };

export default function CheckoutReturnPage() {
  const t = useTranslations();
  const router = useRouter();
  usePageTitle(t.checkoutReturnTitle);

  const [state, setState] = useState<ReturnState>({ status: "loading" });
  const [toast, setToast] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const sessionRef = useRef<{ orderId: string; transactionId: string } | null>(null);

  const pollStatus = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;

    try {
      const res = await fetch(
        `/api/cart/checkout/status?transactionId=${encodeURIComponent(session.transactionId)}`
      );
      const data = (await res.json()) as { checkoutStatus?: string } & ApiErrorResponse;

      if ("error" in data && data.error) {
        if (data.code === "TOKEN_EXPIRED") {
          window.location.href = TOKEN_EXPIRED_REDIRECT;
          return;
        }
        setState({ status: "error", message: data.error });
        return;
      }

      const checkoutStatus = data.checkoutStatus ?? "UNKNOWN";
      if (checkoutStatus === "FINISHED") {
        setState({ status: "finished" });
        return;
      }

      setState({ status: "polling", checkoutStatus });
    } catch {
      setState({ status: "error", message: t.checkoutStatusError });
    }
  }, [t.checkoutStatusError]);

  useEffect(() => {
    const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) {
      setState({ status: "missing_session" });
      return;
    }

    try {
      sessionRef.current = JSON.parse(raw) as { orderId: string; transactionId: string };
    } catch {
      setState({ status: "missing_session" });
      return;
    }

    void pollStatus();
  }, [pollStatus]);

  useEffect(() => {
    if (state.status !== "polling") return;

    const timer = setInterval(() => {
      void pollStatus();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [state.status, pollStatus]);

  useEffect(() => {
    if (state.status !== "finished" || !sessionRef.current) return;

    const session = sessionRef.current;

    void (async () => {
      try {
        const res = await fetch("/api/cart/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: session.orderId,
            transactionId: session.transactionId,
          }),
        });

        const data = (await res.json()) as ApiErrorResponse & { success?: boolean };
        sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);

        if (!res.ok || data.error) {
          setToast(data.error ?? t.checkoutConfirmError);
          return;
        }

        router.replace("/deliveries");
      } catch {
        setToast(t.checkoutConfirmError);
      }
    })();
  }, [state.status, router, t.checkoutConfirmError]);

  const handleCancel = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;

    setCancelling(true);
    try {
      await fetch("/api/cart/checkout/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: session.transactionId }),
      });
      sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
      router.replace("/cart");
    } catch {
      setToast(t.checkoutCancelError);
    } finally {
      setCancelling(false);
    }
  }, [router, t.checkoutCancelError]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SharedHeader />
      <CartToast message={toast} onDismiss={() => setToast(null)} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <h1 className="text-foreground mb-6 text-2xl font-bold">{t.checkoutReturnTitle}</h1>

        {state.status === "loading" && <LoadingSpinner />}

        {state.status === "missing_session" && (
          <div className="space-y-4">
            <p className="text-text-muted text-sm">{t.checkoutMissingSession}</p>
            <Link href="/cart" className="text-picnic-red text-sm font-medium hover:underline">
              {t.cartTitle}
            </Link>
          </div>
        )}

        {state.status === "polling" && (
          <div className="space-y-4">
            <LoadingSpinner />
            <p className="text-text-muted text-sm">{t.checkoutPollingMessage}</p>
            <p className="text-text-muted text-xs">
              {t.checkoutStatusLabel}: {state.checkoutStatus}
            </p>
            <button
              type="button"
              disabled={cancelling}
              onClick={() => void handleCancel()}
              className="border-card-border rounded-md border px-4 py-2 text-sm font-medium text-gray-700"
            >
              {t.checkoutCancelPaymentButton}
            </button>
          </div>
        )}

        {state.status === "finished" && <LoadingSpinner />}

        {state.status === "error" && (
          <ErrorView message={state.message} onRetry={() => void pollStatus()} />
        )}
      </main>
    </div>
  );
}
