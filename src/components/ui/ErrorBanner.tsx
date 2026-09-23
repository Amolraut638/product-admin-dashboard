import { RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  /** Optional id for automated testing */
  id?: string;
}

/**
 * Error state banner — red-tinted alert with optional Retry button.
 * Rendered above the table/content area when an API call fails.
 */
export default function ErrorBanner({ message, onRetry, id }: ErrorBannerProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
      <p className="text-sm text-red-600">{message}</p>

      {onRetry && (
        <button
          id={id}
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 shrink-0 transition"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}
