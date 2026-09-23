import { type InputHTMLAttributes, forwardRef } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Lucide icon rendered as a left prefix */
  icon?: LucideIcon;
}

/**
 * Styled text input — rounded-full, indigo focus ring, optional icon prefix,
 * optional label and inline error message. Matches the Roxiler filter input style.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, className, id, ...rest }, ref) => {
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

        <div className="relative">
          {Icon && (
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
              <Icon size={16} />
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full rounded-full border py-2.5 text-sm text-gray-900',
              'placeholder-gray-400 outline-none transition',
              'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
              Icon ? 'pl-9 pr-4' : 'px-4',
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-gray-300',
              className
            )}
            {...rest}
          />
        </div>

        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export default Input;
