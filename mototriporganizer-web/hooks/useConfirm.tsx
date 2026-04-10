'use client';

import { useState, useCallback, ReactNode } from 'react';

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface DialogState {
  message: string;
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

export function useConfirm() {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const confirm = useCallback((message: string, options: ConfirmOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ message, options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    dialog?.resolve(true);
    setDialog(null);
  };

  const handleCancel = () => {
    dialog?.resolve(false);
    setDialog(null);
  };

  const ConfirmDialogComponent: ReactNode = dialog ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      />
      {/* Dialog */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-700 p-6 flex flex-col gap-4">
        {dialog.options.title && (
          <h2 className="text-base font-semibold text-black dark:text-white">
            {dialog.options.title}
          </h2>
        )}
        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {dialog.message}
        </p>
        <div className="flex gap-3 justify-end pt-1">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            {dialog.options.cancelLabel ?? 'Otkaži'}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              dialog.options.danger
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {dialog.options.confirmLabel ?? 'Potvrdi'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, ConfirmDialogComponent };
}
