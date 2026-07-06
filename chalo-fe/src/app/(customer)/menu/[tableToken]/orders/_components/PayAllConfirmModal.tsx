// src/app/(customer)/menu/[tableToken]/orders/_components/PayAllConfirmModal.tsx

import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";

export const PayAllConfirmModal = ({
  unpaidTotal,
  unpaidCount,
  onConfirm,
  onCancel,
  isPending,
}: {
  unpaidTotal: number;
  unpaidCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4">
      <div className="w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pb-8 sm:pb-6">
        <div className="flex justify-center mb-4">
          <div className="size-16 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-3xl">
            💳
          </div>
        </div>

        <h2 className="text-center text-base font-bold text-gray-900 dark:text-white mb-1">
          Xác nhận thanh toán tất cả
        </h2>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-2">
          {unpaidCount} đơn chưa thanh toán
        </p>
        <p className="text-center text-2xl font-bold text-brand-600 dark:text-brand-400 mb-6">
          {unpaidTotal.toLocaleString("vi-VN")}đ
        </p>

        <div className="space-y-2.5">
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="w-full rounded-2xl bg-green-500 py-3.5 text-sm font-semibold text-white hover:bg-green-600 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <SpinnerIcon className="size-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "✓ Xác nhận thanh toán"
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 py-3.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-60"
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>
  );
};
