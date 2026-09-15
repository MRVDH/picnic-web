"use client";

import type { ButtonHTMLAttributes } from "react";

import { CircularProgress } from "@/components/ui/circular-progress";
import { PILL_BASE_CLASSES } from "@/components/ui/pill";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Shows a spinner next to the label and blocks further clicks. */
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
      // While loading the button keeps full contrast: the spinner is the point,
      // so it must not sit behind the dimmed-disabled treatment.
      className={`${PILL_BASE_CLASSES} border-picnic-red text-picnic-red bg-card-bg enabled:hover:bg-picnic-red/10 gap-2 px-3.5 ${
        loading ? "cursor-progress" : "disabled:cursor-not-allowed disabled:opacity-40"
      } ${className}`}
    >
      {loading && <CircularProgress size={14} />}
      {children}
    </button>
  );
}
