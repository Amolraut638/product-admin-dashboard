import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'indigo' | 'emerald' | 'amber' | 'red';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantCls: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-600',
  indigo:  'bg-indigo-50 text-indigo-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber:   'bg-amber-50 text-amber-700',
  red:     'bg-red-50 text-red-700',
};

/**
 * Inline pill badge — rounded-full, xs font, semantic color variants.
 * Used for category labels, stock status, availability, etc.
 */
export default function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
        variantCls[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
