// src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/PayConfirmModal.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";

export const PayConfirmModal = ({
  total,
  onConfirm,
  onCancel,
  isPending,
}: {
  total: number;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4 transition-opacity">
      
      {/* Modal Surface */}
      <div className="w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-[2rem] sm:rounded-3xl shadow-2xl p-6 pb-8 sm:pb-6 transform transition-all duration-300">
        
        {/* 1. Icon Section (Đã sửa lỗi nằm chèn) */}
        <div className="flex justify-center mb-5">
          <div className="size-20 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-4xl shadow-inner border border-green-100 dark:border-green-800/30">
            💳
          </div>
        </div>

        {/* 2. Content Section */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Xác nhận thanh toán
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Số tiền cần thanh toán cho đơn này
          </p>
          
          {/* Highlighted Amount Badge */}
          <div className="inline-block bg-brand-50 dark:bg-brand-900/20 px-6 py-3 rounded-2xl border border-brand-100 dark:border-brand-800/30">
            <p className="text-3xl font-extrabold text-brand-600 dark:text-brand-400 tracking-tight">
              {total.toLocaleString("vi-VN")}đ
            </p>
          </div>
        </div>

        {/* 3. Actions Section */}
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="w-full rounded-2xl bg-green-500 py-4 text-base font-bold text-white hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/30 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <SpinnerIcon className="size-5 animate-spin" /> Đang xử lý...
              </>
            ) : (
              "✓ Xác nhận thanh toán"
            )}
          </button>
          
          <button
            onClick={onCancel}
            disabled={isPending}
            className="w-full rounded-2xl bg-gray-50 dark:bg-gray-800 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            Huỷ bỏ
          </button>
        </div>

      </div>
    </div>
  );
};