// ---------------------------------------------------------------------------
// Sort field
// ---------------------------------------------------------------------------
export const SORT_FIELDS = ['price', 'rating', 'title'] as const;
export type SortField = (typeof SORT_FIELDS)[number];
export type SortOrder = 'asc' | 'desc';

/**
 * Parse and validate the `sort` URL param.
 * Returns '' if the value is absent or not a recognised field.
 */
export function parseSortField(raw: string | null): SortField | '' {
  if (raw && (SORT_FIELDS as readonly string[]).includes(raw)) return raw as SortField;
  return '';
}

/**
 * Parse the `order` URL param.
 * Defaults to 'asc' for any absent or unrecognised value.
 */
export function parseSortOrder(raw: string | null): SortOrder {
  return raw === 'desc' ? 'desc' : 'asc';
}

// ---------------------------------------------------------------------------
// Category helpers
// ---------------------------------------------------------------------------

/** "home-decoration" → "Home Decoration" */
export function formatCategory(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** "price" → "Price" (same as capitalise, but explicit mapping for clarity) */
export function formatSortField(field: SortField): string {
  const names: Record<SortField, string> = {
    price:  'Price',
    rating: 'Rating',
    title:  'Title',
  };
  return names[field];
}
