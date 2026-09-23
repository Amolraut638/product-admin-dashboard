import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Whether to apply default padding (p-6).
   * Pass false for tables that need edge-to-edge content inside the card.
   */
  padding?: boolean;
}

/**
 * Surface card — bg-white, border-gray-200, rounded-2xl.
 * The foundational container for filter bars, tables, forms, and stat widgets.
 */
export default function Card({ children, className, padding = true }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-2xl',
        padding && 'p-6',
        className
      )}
    >
      {children}
    </div>
  );
}
