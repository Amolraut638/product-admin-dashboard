'use client';

import { AlertCircle } from 'lucide-react';
import SearchInput from './SearchInput';
import { formatCategory, formatSortField, SORT_FIELDS } from '@/lib/filters';
import type { SortField, SortOrder } from '@/lib/filters';

interface FilterBarProps {
  // ── Search ─────────────────────────────────────────────────────────────
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;

  // ── Category ───────────────────────────────────────────────────────────
  categories: string[];
  categoriesLoading: boolean;
  categoriesError: boolean;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;

  // ── Sort ───────────────────────────────────────────────────────────────
  selectedSort: SortField | '';
  selectedOrder: SortOrder;
  onSortChange: (sort: SortField | '', order: SortOrder) => void;

  // ── Derived ────────────────────────────────────────────────────────────
  /** When true the category select is disabled and a hint is shown. */
  isSearchActive: boolean;
}

/**
 * FilterBar — presentational component.
 *
 * Renders:
 *  • SearchInput (from Phase 5)
 *  • Category <select>   — disabled while search is active
 *  • Sort-by <select>    — Price / Rating / Title / None
 *  • Order <select>      — Ascending / Descending (only when sort is set)
 *
 * Makes NO API calls and owns NO state.
 * All interaction is communicated via callback props.
 */
export default function FilterBar({
  searchValue,
  onSearchChange,
  onSearchClear,
  categories,
  categoriesLoading,
  categoriesError,
  selectedCategory,
  onCategoryChange,
  selectedSort,
  selectedOrder,
  onSortChange,
  isSearchActive,
}: FilterBarProps) {
  // ── Shared select class ───────────────────────────────────────────────
  const selectClass =
    'rounded-full border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white ' +
    'outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';

  // ── Sort field change ─────────────────────────────────────────────────
  function handleSortFieldChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newSort = e.target.value as SortField | '';
    // When clearing sort, pass '' and reset order to 'asc'
    onSortChange(newSort, newSort ? selectedOrder : 'asc');
  }

  // ── Sort order change ─────────────────────────────────────────────────
  function handleOrderChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onSortChange(selectedSort, e.target.value as SortOrder);
  }

  return (
    <div className="space-y-2 mb-4">
      {/* ── Controls row ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input — flex-grows to fill available space */}
        <div className="flex-1 min-w-[180px]">
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            onClear={onSearchClear}
          />
        </div>

        {/* Category filter */}
        <select
          id="product-category-filter"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          disabled={isSearchActive || categoriesLoading}
          title={
            isSearchActive
              ? 'Category filtering is unavailable while searching.'
              : undefined
          }
          className={selectClass}
        >
          <option value="">All Categories</option>
          {!categoriesLoading && !categoriesError &&
            categories.map((cat) => (
              <option key={cat} value={cat}>
                {formatCategory(cat)}
              </option>
            ))}
        </select>

        {/* Sort-by field */}
        <select
          id="product-sort-field"
          value={selectedSort}
          onChange={handleSortFieldChange}
          className={selectClass}
        >
          <option value="">Sort by</option>
          {SORT_FIELDS.map((field) => (
            <option key={field} value={field}>
              {formatSortField(field)}
            </option>
          ))}
        </select>

        {/* Sort order — only visible when a sort field is chosen */}
        {selectedSort && (
          <select
            id="product-sort-order"
            value={selectedOrder}
            onChange={handleOrderChange}
            className={selectClass}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        )}
      </div>

      {/* ── Search-active hint ──────────────────────────────────────── */}
      {isSearchActive && (
        <p className="flex items-center gap-1.5 text-xs text-gray-400 pl-1">
          <AlertCircle size={12} aria-hidden="true" />
          Category filtering is unavailable while searching.&nbsp;
          <button
            type="button"
            onClick={onSearchClear}
            className="text-indigo-500 hover:underline"
          >
            Clear search
          </button>
          &nbsp;to use categories.
        </p>
      )}

      {/* ── Categories error hint ─────────────────────────────────── */}
      {categoriesError && (
        <p className="text-xs text-red-400 pl-1">
          Could not load categories. Category filter is unavailable.
        </p>
      )}
    </div>
  );
}
