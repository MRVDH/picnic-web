"use client";

import { useEffect, useRef } from "react";

type Option = { id: string | null; name: string; count?: number };

type Props = {
  options: Option[];
  value: (string | null)[];
  onChange: (ids: (string | null)[]) => void;
  disabled?: boolean;
  selectAllLabel: string;
};

export function CategoryCheckboxPanel({
  options,
  value,
  onChange,
  disabled = false,
  selectAllLabel,
}: Props) {
  const allSelected = value.length === options.length;
  const someSelected = value.length > 0 && !allSelected;
  const masterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (masterRef.current) {
      masterRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function handleMaster() {
    if (allSelected) return;
    onChange(options.map((o) => o.id));
  }

  function handleToggle(id: string | null) {
    if (value.includes(id)) {
      if (value.length === 1) return;
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  const rowClass = `flex items-center gap-2 px-4 py-2 text-sm select-none ${
    disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-gray-50"
  }`;

  return (
    <div className="relative inline-block min-w-48">
      <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-sm">
        <label className={rowClass}>
          <input
            ref={masterRef}
            type="checkbox"
            checked={allSelected}
            onChange={handleMaster}
            disabled={disabled}
            className="accent-picnic-red h-4 w-4 shrink-0"
          />
          <span className="text-foreground font-medium">{selectAllLabel}</span>
        </label>
        <div className="my-1 border-t border-gray-100" />
        {options.map((opt) => {
          const isChecked = value.includes(opt.id);
          return (
            <label key={opt.id ?? "__featured__"} className={rowClass}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => !disabled && handleToggle(opt.id)}
                disabled={disabled}
                className="accent-picnic-red h-4 w-4 shrink-0"
              />
              <span className="text-foreground flex-1 truncate">{opt.name}</span>
              {opt.count !== undefined && (
                <span
                  className={`ml-2 shrink-0 text-xs font-medium ${
                    isChecked
                      ? "text-picnic-red/70"
                      : opt.count > 500
                        ? "text-amber-500"
                        : "text-gray-400"
                  }`}
                >
                  {opt.count > 500 ? `${opt.count} ★` : opt.count}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
