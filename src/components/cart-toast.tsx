"use client";

/**
 * Global toast component for cart mutation error feedback.
 *
 * Shows a fixed-position toast at the bottom of the screen that auto-dismisses
 * after 3 seconds. Controlled via the `message` and `onDismiss` props.
 */

import { useEffect } from "react";

const AUTO_DISMISS_MS = 3000;

type CartToastProps = {
  /** The message to display. When null/empty, the toast is hidden. */
  message: string | null;
  /** Callback to clear the message (hides the toast). */
  onDismiss: () => void;
};

export function CartToast({ message, onDismiss }: CartToastProps) {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-lg bg-text-dark px-4 py-3 text-sm text-white shadow-lg">
        <span>{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 font-bold text-white/70 transition-colors hover:text-white"
          aria-label="Sluiten"
        >
          ×
        </button>
      </div>
    </div>
  );
}
