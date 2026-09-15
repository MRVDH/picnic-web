"use client";

type CircularProgressProps = {
  /** Diameter in pixels. */
  size?: number;
  /** Accessible name. Omit for a spinner that only decorates labelled content. */
  label?: string;
  className?: string;
};

/**
 * Indeterminate circular progress in the Material style: a rotating arc whose
 * length and offset animate, so it stretches and contracts. Strokes in
 * `currentColor`, so it picks up the Picnic red of whatever it sits in.
 */
export function CircularProgress({ size = 20, label, className = "" }: CircularProgressProps) {
  return (
    <span
      role={label ? "progressbar" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ width: size, height: size }}
      className={`animate-spinner-rotate inline-block shrink-0 ${className}`}
    >
      <svg viewBox="22 22 44 44" className="h-full w-full">
        <circle
          cx="44"
          cy="44"
          r="20.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.6"
          strokeLinecap="round"
          className="animate-spinner-dash"
        />
      </svg>
    </span>
  );
}
