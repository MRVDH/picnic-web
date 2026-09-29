"use client";

import { PILL_BASE_CLASSES } from "@/components/ui/pill";

type ChipProps = {
  label: string;
  /** Renders the filled/selected tone and reports pressed state to screen readers. */
  selected?: boolean;
  /** Clicking the chip body. Omit for a static chip. */
  onClick?: () => void;
  /** Clicking the trailing ×. Omit to hide the delete icon. */
  onDelete?: () => void;
  /** Accessible name for the delete icon, e.g. "Clear plan". */
  deleteLabel?: string;
  disabled?: boolean;
};

/**
 * Material-style chip that is both clickable and deletable: the body toggles
 * `selected`, the trailing × runs `onDelete`. Rendered as a wrapper with two
 * sibling buttons because a button may not nest inside another button; the
 * hover tone sits on the wrapper so the whole chip lights up as one.
 */
export function Chip({
  label,
  selected = false,
  onClick,
  onDelete,
  deleteLabel,
  disabled = false,
}: ChipProps) {
  const tone = selected
    ? "border-picnic-red bg-picnic-red text-white"
    : "border-card-border bg-card-bg text-text-dark";
  const hover = disabled
    ? "opacity-40"
    : selected
      ? "hover:bg-picnic-red-dark"
      : "hover:bg-gray-100";

  return (
    <span className={`${PILL_BASE_CLASSES} ${tone} ${hover}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || !onClick}
        aria-pressed={onClick ? selected : undefined}
        className={`h-full rounded-full pl-3.5 disabled:cursor-not-allowed ${
          onDelete ? "pr-1.5" : "pr-3.5"
        }`}
      >
        {label}
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          aria-label={deleteLabel}
          title={deleteLabel}
          className={`flex h-full items-center pr-1.5 pl-0.5 transition-colors disabled:cursor-not-allowed ${
            selected
              ? "text-white/70 enabled:hover:text-white"
              : "text-gray-400 enabled:hover:text-gray-600"
          }`}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4.5 w-4.5">
            <circle cx="10" cy="10" r="10" className="fill-current" />
            <path
              d="M6.8 6.8 13.2 13.2M13.2 6.8 6.8 13.2"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              className={selected ? "stroke-picnic-red" : "stroke-card-bg"}
            />
          </svg>
        </button>
      )}
    </span>
  );
}
