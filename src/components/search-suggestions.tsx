import type { SearchSuggestion } from "@/lib/types";

type SearchSuggestionsProps = {
  suggestions: SearchSuggestion[];
  onSelect: (suggestion: string) => void;
  isVisible: boolean;
};

export function SearchSuggestions({ suggestions, onSelect, isVisible }: SearchSuggestionsProps) {
  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <ul
      role="listbox"
      className="border-card-border bg-card-bg absolute top-full left-0 z-10 mt-1 w-full overflow-hidden rounded-lg border shadow-lg"
    >
      {suggestions.map((suggestion) => (
        <li key={suggestion.id} role="option" aria-selected={false}>
          <button
            type="button"
            className="text-foreground w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            onClick={() => onSelect(suggestion.suggestion)}
          >
            {suggestion.suggestion}
          </button>
        </li>
      ))}
    </ul>
  );
}
