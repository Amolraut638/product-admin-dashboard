import Badge from '@/components/ui/Badge';

interface StockBadgeProps {
  stock: number;
}

/**
 * Displays stock quantity with a colour-coded Badge:
 *  0          → red   "Out of stock"
 *  1–9        → amber "Low (N)"
 *  10+        → emerald "N in stock"
 */
export default function StockBadge({ stock }: StockBadgeProps) {
  if (stock === 0) {
    return <Badge variant="red">Out of stock</Badge>;
  }
  if (stock < 10) {
    return <Badge variant="amber">Low ({stock})</Badge>;
  }
  return <Badge variant="emerald">{stock} in stock</Badge>;
}
