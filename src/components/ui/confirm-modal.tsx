"use client";

type ConfirmModalProps = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-card-bg p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-foreground text-lg font-bold">{title}</h2>
        {message && <p className="mt-2 text-sm text-gray-500">{message}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-picnic-orange rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
