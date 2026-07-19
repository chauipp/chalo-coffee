// src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutSessionPanel.tsx
"use client";
import { PaymentQRBox } from "@/components/shared/PaymentQRBox";

export const CheckoutSessionPanel = ({
  totalAmount,
  expiresAt,
  payCode,
  onRestart,
}: {
  totalAmount: number;
  expiresAt: string;
  payCode: string;
  onRestart: () => void;
}) => (
  <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-4">
    <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
      Phiên thanh toán gộp
    </p>
    <PaymentQRBox
      totalAmount={totalAmount}
      expiresAt={expiresAt}
      payCode={payCode}
      onRestart={onRestart}
    />
  </div>
);
