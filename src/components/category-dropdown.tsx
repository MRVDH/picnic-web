"use client";

import { useEffect, useRef, useState } from "react";

type Option = { id: string | null; name: string };

type Props = {
  options: Option[];
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
};

export function CategoryDropdown({ options, value, onChange, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.id === value) ?? options[0];

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

  // Scroll selected option into view when opening
  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector("[data-selected=true]") as HTMLElement | null;
    active?.scrollIntoView({ block: "nearest" });
  }, [open]);

  function pick(id: string | null) {
    onChange(id);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative inline-block min-w-48">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={`focus:ring-picnic-red flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition-colors focus:ring-2 focus:outline-none ${disabled ? "cursor-not-allowed opacity-40" : "hover:border-gray-400"}`}
      >
        <span className="text-foreground truncate">{selected.name}</span>
        <svg
          className={`text-text-muted h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
      {open && (
        <ul
          ref={listRef}
          className="absolute left-0 z-50 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {options.map((opt) => {
            const isSelected = opt.id === value;
            return (
              <li key={opt.id ?? "__featured__"}>
                <button
                  type="button"
                  data-selected={isSelected}
                  onClick={() => pick(opt.id)}
                  className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "text-picnic-red bg-red-50 font-semibold"
                      : "text-foreground hover:bg-gray-50"
                  }`}
                >
                  <span>{opt.name}</span>
                  {isSelected && (
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
