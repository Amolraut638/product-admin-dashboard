'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// ConfirmDialog — lightweight accessible confirmation modal.
//
// Renders a fixed-position overlay with a card dialog centred on screen.
// Closes on Escape (unless loading), backdrop click (unless loading),
// and Cancel button.
//
// Props:
//  open          — whether the dialog is visible
//  title         — dialog heading
//  description   — body text (typically includes the item name)
//  confirmLabel  — label for the destructive confirm button (default "Confirm")
//  loading       — disables buttons and shows spinner on confirm button
//  error         — error message shown inside the dialog after a failed attempt
//  onCancel      — called when the user cancels or presses Escape
//  onConfirm     — called when the user confirms
// ---------------------------------------------------------------------------
interface ConfirmDialogProps {
  open:          boolean;
  title:         string;
  description:   string;
  confirmLabel?: string;
  loading?:      boolean;
  error?:        string | null;
  onCancel:      () => void;
  onConfirm:     () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  loading      = false,
  error,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // ── Keyboard: Escape closes the dialog (unless a deletion is in-flight) ──
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onCancel]);

  // ── Focus Cancel button when dialog opens ─────────────────────────────
  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && !loading) onCancel();
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Translucent backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      {/* Dialog card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl p-6"
      >
        {/* Header row: icon + title + close X */}
        <div className="flex items-start gap-3 mb-2">
          <div
            className="shrink-0 w-9 h-9 rounded-full bg-red-100 flex items-center justify-center"
            aria-hidden="true"
          >
            <AlertTriangle size={17} className="text-red-600" />
          </div>

          <h2
            id="confirm-dialog-title"
            className="flex-1 pt-1.5 text-base font-semibold text-gray-900 leading-snug"
          >
            {title}
          </h2>

          {!loading && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close dialog"
              className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600
                         hover:bg-gray-100 transition"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Description */}
        <p
          id="confirm-dialog-desc"
          className="ml-12 text-sm text-gray-600 mb-4"
        >
          {description}
        </p>

        {/* Inline error after a failed DELETE */}
        {error && (
          <div
            role="alert"
            className={cn(
              'ml-12 mb-4 px-3 py-2 rounded-lg text-xs text-red-700',
              'bg-red-50 border border-red-200',
            )}
          >
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            id="confirm-dialog-cancel"
            onClick={onCancel}
            disabled={loading}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition',
              'border border-gray-300 text-gray-600',
              'hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            Cancel
          </button>

          <button
            type="button"
            id="confirm-dialog-confirm"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium',
              'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            )}
          >
            {loading ? (
              <>
                <span
                  className="w-3 h-3 border-2 border-white border-t-transparent
                              rounded-full animate-spin"
                  aria-hidden="true"
                />
                Deleting…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
