"use client";

import { Modal } from "./Modal";

// src/components/shared/ui/ConfirmDialog.tsx

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning";
}

export const ConfirmDialog = ({
  message,
  onClose,
  onConfirm,
  open,
  confirmLabel = "Xác nhận",
  isLoading,
  title = "Xác nhận",
  variant = "danger",
}: ConfirmDialogProps) => (
  <Modal open={open} onClose={onClose} size="sm" title={title}>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</p>
    <div className="flex justify-end gap-3">
      <button
        onClick={onClose}
        disabled={isLoading}
        className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        Huỷ
      </button>
      <button
        onClick={onConfirm}
        disabled={isLoading}
        className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50
          ${
            variant === "danger"
              ? "bg-red-500 hover:bg-red-600 active:bg-red-700"
              : "bg-yellow-500 hover:bg-yellow-600"
          }`}
      >
        {isLoading ? "Đang xử lý" : confirmLabel}
      </button>
    </div>
  </Modal>
);
