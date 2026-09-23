import { type SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

/**
 * Styled select — rounded-full pill shape, matches Input visual style so filter
 * bars look visually consistent when mixed inputs and selects sit side-by-side.
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...rest }, ref) => {
    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-full border py-2.5 px-4 text-sm text-gray-900',
            'outline-none transition bg-white',
            'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
            error ? 'border-red-400' : 'border-gray-300',
            className
          )}
          {...rest}
        >
          {children}
        </select>

        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export default Select;
