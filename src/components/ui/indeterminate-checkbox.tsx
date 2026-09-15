"use client";

import { useEffect, useRef } from "react";
import type { InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  checked: boolean;
  /** Renders the tri-state dash. Only settable from JS, never from markup. */
  indeterminate: boolean;
};

/** Checkbox that can show the "some but not all" dash. */
export function IndeterminateCheckbox({ checked, indeterminate, className = "", ...props }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      {...props}
      ref={ref}
      type="checkbox"
      checked={checked}
      className={`accent-picnic-red h-4 w-4 shrink-0 ${className}`}
    />
  );
}
