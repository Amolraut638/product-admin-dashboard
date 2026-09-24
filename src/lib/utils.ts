// ---------------------------------------------------------------------------
// cn — lightweight class-name merging (no extra dependency)
// ---------------------------------------------------------------------------
export function cn(
  ...classes: (string | undefined | null | false | 0)[]
): string {
  return classes.filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatStock(stock: number): string {
  if (stock === 0) return 'Out of stock';
  if (stock < 10) return `Low (${stock})`;
  return String(stock);
}

// ---------------------------------------------------------------------------
// Route / ID helpers
// ---------------------------------------------------------------------------

/**
 * Parses a URL segment string to a valid positive integer product ID.
 *
 * Rules:
 *  - Must be parseable as an integer (not NaN)
 *  - Must be > 0  (excludes 0 and negative IDs)
 *  - String representation must exactly match the input (excludes "1.5", "1abc")
 *
 * Returns null for any invalid input: "abc", "-1", "1.5", "0", "".
 */
export function parseProductId(raw: string): number | null {
  const n = parseInt(raw, 10);
  if (isNaN(n) || n <= 0 || String(n) !== raw) return null;
  return n;
}

