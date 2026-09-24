'use client';

import { Search, X } from 'lucide-react';

interface SearchInputProps {
  /** Controlled value — should come from local input state, NOT directly from URL. */
  value: string;
  onChange: (value: string) => void;
  /** Called when the user clicks the X button to clear the search. */
  onClear: () => void;
  placeholder?: string;
}

/**
 * SearchInput — a controlled, single-responsibility search field.
 *
 * Makes NO API calls.  Does NOT read URL params.
 * The parent (ProductsContent) owns debouncing and URL updates.
 */
export default function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search products…',
}: SearchInputProps) {
  return (
    <div className="relative w-full max-w-sm">
      {/* Search icon */}
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        aria-hidden="true"
      />

      <input
        id="product-search-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-full text-sm bg-white text-gray-900 outline-none
                   focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
                   placeholder:text-gray-400 transition"
      />

      {/* Clear button — only visible when there is text */}
      {value && (
        <button
          type="button"
          id="product-search-clear"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
