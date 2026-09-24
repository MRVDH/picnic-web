"use client";

import type { ButtonHTMLAttributes } from "react";

import { CircularProgress } from "@/components/ui/circular-progress";
import { PILL_BASE_CLASSES } from "@/components/ui/pill";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Dims the label, centres a spinner over it and blocks further clicks. */
  loading?: boolean;
};

/** Shared action button: an outlined red pill, sized to match Chip. */
export function Button({
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      // While loading the dimming sits on the label alone: `opacity` on the
      // button would fade the spinner along with it.
      className={`${PILL_BASE_CLASSES} border-picnic-red text-picnic-red bg-card-bg enabled:hover:bg-picnic-red/10 relative px-3.5 ${
        loading ? "cursor-not-allowed" : "disabled:cursor-not-allowed disabled:opacity-40"
      } ${className}`}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <CircularProgress size={14} />
        </span>
      )}
      {/* Dimmed, never unmounted: the label still holds the button's width. */}
      <span className={loading ? "opacity-40" : undefined}>{children}</span>
    </button>
  );
}
