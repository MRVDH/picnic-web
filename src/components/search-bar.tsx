"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useTranslations } from "@/contexts/country-context";
import { useDebounce } from "@/hooks/use-debounce";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/constants";
import type { ApiErrorResponse, SearchSuggestion, SuggestionsApiResponse } from "@/lib/types";
import { DEBOUNCE_DELAY_MS, MIN_SUGGESTION_LENGTH } from "@/lib/types";

import { SearchSuggestions } from "./search-suggestions";

type SearchBarProps = {
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;
};

export function SearchBar({ onSearch, isLoading, initialQuery }: SearchBarProps) {
  const t = useTranslations();
  const [inputValue, setInputValue] = useState(initialQuery ?? "");
  const [rawSuggestions, setRawSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedInput = useDebounce(inputValue, DEBOUNCE_DELAY_MS);
  const trimmedInput = debouncedInput.trim();
  const shouldFetch = trimmedInput.length >= MIN_SUGGESTION_LENGTH;

  // Derive visible suggestions from raw data + input length
  const suggestions = useMemo(
    () => (shouldFetch ? rawSuggestions : []),
    [shouldFetch, rawSuggestions]
  );

  // Fetch suggestions when debounced input meets minimum length
  useEffect(() => {
    if (!shouldFetch) return;

    const controller = new AbortController();

    async function fetchSuggestions() {
      try {
        const url = `/api/suggestions?q=${encodeURIComponent(trimmedInput)}`;
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          if (response.status === 401) {
            const data: ApiErrorResponse = await response.json();
            if (data.code === "TOKEN_EXPIRED") {
              window.location.href = TOKEN_EXPIRED_REDIRECT;
              return;
            }
          }
          return;
        }

        const data: SuggestionsApiResponse = await response.json();
        setRawSuggestions(data.suggestions);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch suggestions:", error);
      }
    }

    fetchSuggestions();

    return () => {
      controller.abort();
    };
  }, [shouldFetch, trimmedInput]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = useCallback(
    (e: { preventDefault(): void }) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed === "") return;

      setShowSuggestions(false);
      onSearch(trimmed);
    },
    [inputValue, onSearch]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      setInputValue(suggestion);
      setShowSuggestions(false);
      onSearch(suggestion);
    },
    [onSearch]
  );

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} role="search">
        <div className="relative">
          <input
            type="search"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchAriaLabel}
            className="border-input-border text-foreground focus:border-input-focus focus:ring-input-focus/20 w-full rounded-full border bg-white px-4 py-2 pr-12 text-sm shadow-sm transition-shadow outline-none placeholder:text-gray-400 focus:ring-2"
          />
          <button
            type="submit"
            disabled={isLoading}
            aria-label={t.searchButtonAriaLabel}
            className="bg-picnic-red hover:bg-picnic-red-dark absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full p-1.5 text-white transition-colors disabled:opacity-50"
          >
            <SearchIcon />
          </button>
        </div>
      </form>

      <SearchSuggestions
        suggestions={suggestions}
        onSelect={handleSuggestionSelect}
        isVisible={showSuggestions}
      />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
