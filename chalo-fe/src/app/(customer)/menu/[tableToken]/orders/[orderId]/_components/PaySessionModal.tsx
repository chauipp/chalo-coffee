// src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/PaySessionModal.tsx
"use client";
import { PaymentQRBox } from "@/components/shared/PaymentQRBox";
import { CheckoutSessionResult } from "@/services/order/order.types";

/** Modal thanh toán 1 đơn: QR chuyển khoản + chờ webhook xác nhận (không tự khai) */
export const PaySessionModal = ({
  session,
  onClose,
  onRestart,
}: {
  session: CheckoutSessionResult;
  onClose: () => void;
  onRestart: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4 transition-opacity">
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thanh toán chuyển khoản"
      className="w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-[2rem] sm:rounded-3xl shadow-2xl p-6 pb-8 sm:pb-6 motion-safe:animate-[modal-pop_0.18s_cubic-bezier(0.16,1,0.3,1)]"
    >
      <h2 className="mb-4 text-center text-lg font-bold text-gray-900 dark:text-white">
        Thanh toán đơn này
      </h2>
      <PaymentQRBox
        totalAmount={session.totalAmount}
        expiresAt={session.expiresAt}
        payCode={session.payCode}
        onRestart={onRestart}
      />
      <button
        onClick={onClose}
        className="mt-4 w-full rounded-2xl bg-gray-50 dark:bg-gray-800 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-[0.98] transition-all"
      >
        Đóng
      </button>
    </div>
  </div>
);
