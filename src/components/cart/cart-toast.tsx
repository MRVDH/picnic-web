"use client";

/**
 * Global toast for transient feedback, fixed to the bottom of the screen and
 * dismissing itself.
 *
 * An error stays up twice as long as a confirmation: a cart update that worked
 * only has to be noticed, while a failure has to be read and understood before
 * it disappears.
 */
import { useEffect } from "react";

import { useTranslations } from "@/contexts/country-context";

const AUTO_DISMISS_MS = { info: 3000, error: 6000 } as const;

type ToastVariant = keyof typeof AUTO_DISMISS_MS;

type CartToastProps = {
  /** The message to display. When null/empty, the toast is hidden. */
  message: string | null;
  /** Callback to clear the message (hides the toast). */
  onDismiss: () => void;
  /** "error" reads as a failure and lingers; defaults to a neutral confirmation. */
  variant?: ToastVariant;
};

export function CartToast({ message, onDismiss, variant = "info" }: CartToastProps) {
  const t = useTranslations();
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS[variant]);
    return () => clearTimeout(timer);
  }, [message, onDismiss, variant]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div
        role={variant === "error" ? "alert" : "status"}
        className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
          variant === "error" ? "bg-red-600" : "bg-text-dark"
        }`}
      >
        <span>{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 font-bold text-white/70 transition-colors hover:text-white"
          aria-label={t.dismissAriaLabel}
        >
          ×
        </button>
      </div>
    </div>
  );
}
