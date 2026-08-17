"use client";

import { PaymentQRBox } from "@/components/shared/PaymentQRBox";
import { CheckoutSessionResult } from "@/services/order/order.types";

/** Thanh toán một đơn: chỉ hiển thị QR và chờ webhook/nhân viên xác nhận. */
export const PaySessionModal = ({
  session,
  onClose,
  onRestart,
}: {
  session: CheckoutSessionResult;
  onClose: () => void;
  onRestart: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-0 backdrop-blur-sm transition-opacity sm:items-center sm:px-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thanh toán chuyển khoản"
      className="w-full rounded-t-[2rem] bg-white p-6 pb-8 shadow-2xl motion-safe:animate-[modal-pop_0.18s_cubic-bezier(0.16,1,0.3,1)] dark:bg-gray-900 sm:max-w-sm sm:rounded-3xl sm:pb-6"
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
        className="mt-4 w-full rounded-2xl bg-gray-50 py-4 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-100 active:scale-[0.98] dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        Đóng
      </button>
    </div>
  </div>
);
