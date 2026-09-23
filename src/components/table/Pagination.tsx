import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  PAGE_SIZE_OPTIONS,
  getVisiblePages,
  getResultRange,
} from '@/lib/pagination';
import type { PageSize } from '@/lib/pagination';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: PageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
}

/**
 * Pagination — presentational component.
 * Makes NO API calls. Communicates requested state changes via callbacks.
 * The parent (ProductsContent) owns URL updates and data fetching.
 *
 * Layout:
 *   [Rows per page: <select>]  [← prev] [1] [2] … [10] [next →]  [Showing 1–20 of 194]
 */
export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const visiblePages = getVisiblePages(currentPage, totalPages);
  const resultText   = getResultRange(currentPage, pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3">
      {/* ── Page size selector ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-gray-500 order-2 sm:order-1">
        <label htmlFor="pagination-page-size" className="whitespace-nowrap">
          Rows per page
        </label>
        <select
          id="pagination-page-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)}
          className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* ── Page buttons ───────────────────────────────────────────── */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* Previous */}
        <button
          type="button"
          id="pagination-prev"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center justify-center w-8 h-8 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers + ellipsis */}
        {visiblePages.map((item, idx) =>
          item === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-8 h-8 flex items-center justify-center text-sm text-gray-400"
            >
              …
            </span>
          ) : (
            <button
              key={`page-${item}`}
              type="button"
              id={`pagination-page-${item}`}
              onClick={() => onPageChange(item)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition ${
                item === currentPage
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-current={item === currentPage ? 'page' : undefined}
            >
              {item}
            </button>
          )
        )}

        {/* Next */}
        <button
          type="button"
          id="pagination-next"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center justify-center w-8 h-8 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Result range ───────────────────────────────────────────── */}
      <p className="text-sm text-gray-500 order-3 sm:order-3">
        {resultText}
      </p>
    </div>
  );
}
