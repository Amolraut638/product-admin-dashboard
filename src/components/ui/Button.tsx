import { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button while true */
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------
const variantCls: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white',
  outline: 'border border-gray-300 text-gray-600 hover:bg-gray-50',
  ghost:   'text-gray-600 hover:bg-gray-100',
  danger:  'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white',
};

const sizeCls: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2 text-sm',
  lg: 'px-6 py-2.5 text-sm',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Button({
  variant = 'primary',
  size    = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variantCls[variant],
        sizeCls[size],
        className
      )}
    >
      {loading ? (
        <>
          <span
            className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
