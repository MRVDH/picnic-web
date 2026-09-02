"use client";

import { useEffect, useRef, useState } from "react";

import { useTranslations } from "@/contexts/country-context";

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
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const masterRef = useRef<HTMLInputElement>(null);

  const allSelected = value.length === options.length;
  const someSelected = value.length > 0 && !allSelected;

  useEffect(() => {
    if (masterRef.current) {
      masterRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Force-closed while disabled (e.g. search becomes active)
  const isOpen = open && !disabled;

  function handleMaster() {
    onChange(allSelected ? [] : options.map((o) => o.id));
  }

  function handleToggle(id: string | null) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  const rowClass =
    "flex cursor-pointer items-center gap-2 px-4 py-2 text-sm select-none hover:bg-gray-50";

  return (
    <div ref={containerRef} className="relative inline-block min-w-48">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={`focus:ring-picnic-red border-card-border bg-card-bg flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition-colors focus:ring-2 focus:outline-none ${disabled ? "cursor-not-allowed opacity-40" : "hover:border-gray-400"}`}
      >
        <span className="text-foreground truncate">{t.cookbookCategoryLabel}</span>
        <svg
          className={`text-text-muted h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="border-card-border bg-card-bg absolute left-0 z-50 mt-1.5 max-h-[70vh] w-full overflow-y-auto rounded-xl border py-1 shadow-lg">
          <label className={rowClass}>
            <input
              ref={masterRef}
              type="checkbox"
              checked={allSelected}
              onChange={handleMaster}
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
                  onChange={() => handleToggle(opt.id)}
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
      )}
    </div>
  );
}
