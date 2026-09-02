"use client";

import { ConfirmModal } from "@/components/ui/confirm-modal";
import type { CheckoutIssueData } from "@/lib/core/checkout-types";

type CheckoutIssueModalProps = {
  issue: CheckoutIssueData;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function CheckoutIssueModal({
  issue,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: CheckoutIssueModalProps) {
  if (issue.requiresAgeVerification) {
    return (
      <ConfirmModal
        title={issue.title}
        message={issue.message}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-foreground text-lg font-bold">{issue.title}</h2>
        <p className="mt-2 text-sm text-gray-500">{issue.message}</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="bg-picnic-orange rounded-md px-4 py-2 text-sm font-medium text-white"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
