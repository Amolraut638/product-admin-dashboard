import { type LucideIcon } from 'lucide-react';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  /** Lucide icon rendered large and muted above the message */
  icon: LucideIcon;
  message: string;
  /** Optional call-to-action link (e.g. "Clear filters") */
  action?: EmptyStateAction;
}

/**
 * Empty state — centered icon + message with optional action link.
 * Rendered as a full table row via colSpan, or standalone in a card.
 */
export default function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="px-4 py-12 text-center">
      <Icon size={36} className="mx-auto text-gray-200 mb-2" />
      <p className="text-sm text-gray-400 mb-3">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-sm text-indigo-600 hover:text-indigo-800 transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
