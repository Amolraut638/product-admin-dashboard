// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export type PageSize = typeof PAGE_SIZE_OPTIONS[number];
export const DEFAULT_PAGE_SIZE: PageSize = 20;
export const DEFAULT_PAGE = 1;

// ---------------------------------------------------------------------------
// URL param parsers
// ---------------------------------------------------------------------------

/**
 * Parses the raw "page" query param.
 * Valid: positive integers (1, 2, 3, …)
 * Anything else → 1
 */
export function parsePage(raw: string | null): number {
  if (!raw) return DEFAULT_PAGE;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return DEFAULT_PAGE;
  return n;
}

/**
 * Parses the raw "limit" query param.
 * Valid: one of 10 | 20 | 50
 * Anything else → 20
 */
export function parseLimit(raw: string | null): PageSize {
  const n = Number(raw);
  if ((PAGE_SIZE_OPTIONS as readonly number[]).includes(n)) return n as PageSize;
  return DEFAULT_PAGE_SIZE;
}

// ---------------------------------------------------------------------------
// Calculations
// ---------------------------------------------------------------------------

/** skip = (page − 1) × limit */
export function calcSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Total pages — minimum 1 so the Pagination component always has a valid
 * range even before the first API response arrives.
 */
export function calcTotalPages(total: number, limit: number): number {
  if (total <= 0 || limit <= 0) return 1;
  return Math.ceil(total / limit);
}

/**
 * Human-readable result range.
 *
 * Examples:
 *   page 1, limit 20, total 194  →  "Showing 1–20 of 194"
 *   page 10, limit 20, total 194 →  "Showing 181–194 of 194"   (capped at total)
 */
export function getResultRange(page: number, limit: number, total: number): string {
  if (total === 0) return 'No products found';
  const start = calcSkip(page, limit) + 1;
  const end   = Math.min(page * limit, total);
  return `Showing ${start}\u2013${end} of ${total}`;
}

/**
 * Returns the ordered list of page numbers (and '...' separators) to render.
 *
 * ≤7 pages  →  show all
 * >7 pages  →  1, [ellipsis], current±1, [ellipsis], lastPage
 *
 * Examples (total = 10):
 *   current = 1  →  [1, 2, '...', 10]
 *   current = 5  →  [1, '...', 4, 5, 6, '...', 10]
 *   current = 10 →  [1, '...', 9, 10]
 */
export function getVisiblePages(current: number, total: number): (number | '...')[] {
  if (total <= 0) return [];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const rangeStart = Math.max(2, current - 1);
  const rangeEnd   = Math.min(total - 1, current + 1);

  const pages: (number | '...')[] = [1];
  if (rangeStart > 2)       pages.push('...');
  for (let p = rangeStart; p <= rangeEnd; p++) pages.push(p);
  if (rangeEnd < total - 1) pages.push('...');
  pages.push(total);

  return pages;
}
