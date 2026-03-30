"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { SearchSuggestions } from "./search-suggestions";
import type {
  SearchSuggestion,
  SuggestionsApiResponse,
  ApiErrorResponse,
} from "@/lib/types";
import { DEBOUNCE_DELAY_MS, MIN_SUGGESTION_LENGTH } from "@/lib/types";

type SearchBarProps = {
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;
};

export function SearchBar({ onSearch, isLoading, initialQuery }: SearchBarProps) {
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
    [shouldFetch, rawSuggestions],
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
              window.location.href = "/login?expired=true";
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
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed === "") return;

      setShowSuggestions(false);
      onSearch(trimmed);
    },
    [inputValue, onSearch],
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      setInputValue(suggestion);
      setShowSuggestions(false);
      onSearch(suggestion);
    },
    [onSearch],
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
            placeholder="Zoek producten..."
            aria-label="Zoek producten"
            className="w-full rounded-full border border-input-border bg-white px-6 py-3.5 pr-14 text-base text-foreground shadow-sm outline-none transition-shadow placeholder:text-gray-400 focus:border-input-focus focus:ring-2 focus:ring-input-focus/20"
          />
          <button
            type="submit"
            disabled={isLoading}
            aria-label="Zoeken"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-picnic-red p-2.5 text-white transition-colors hover:bg-picnic-red-dark disabled:opacity-50"
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
