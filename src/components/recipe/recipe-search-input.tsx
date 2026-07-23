"use client";

type Props = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

export function RecipeSearchInput({ value, placeholder, onChange }: Props) {
  return (
    <div className="relative flex-1 sm:max-w-xs">
      <svg
        className="text-text-muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
          clipRule="evenodd"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-picnic-red focus:outline-none focus:ring-2 focus:ring-picnic-red"
      />
    </div>
  );
}
