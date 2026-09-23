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
