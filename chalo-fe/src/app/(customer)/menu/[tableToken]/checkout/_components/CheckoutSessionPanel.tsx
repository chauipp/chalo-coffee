// src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutSessionPanel.tsx
"use client";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { useEffect, useState } from "react";

export const CheckoutSessionPanel = ({
  totalAmount,
  expiresAt,
  onConfirm,
  onRestart,
  isPending,
}: {
  totalAmount: number;
  expiresAt: string;
  onConfirm: () => void;
  onRestart: () => void;
  isPending: boolean;
}) => {
  const [remainingMs, setRemainingMs] = useState<number>(
    () => new Date(expiresAt).getTime() - Date.now(),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemainingMs(new Date(expiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const expired = remainingMs <= 0;
  const mm = Math.max(0, Math.floor(remainingMs / 60000));
  const ss = Math.max(0, Math.floor((remainingMs % 60000) / 1000));

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Phiên thanh toán gộp
        </p>
        <p className="mt-2 text-3xl font-extrabold text-brand-600 dark:text-brand-400">
          {totalAmount.toLocaleString("vi-VN")}đ
        </p>
        <p
          className={`mt-2 text-sm font-medium ${
            expired
              ? "text-red-600 dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {expired
            ? "Phiên đã hết hạn"
            : `Hết hạn sau ${mm}:${ss.toString().padStart(2, "0")}`}
        </p>
      </div>

      {expired ? (
        <button
          onClick={onRestart}
          className="w-full rounded-2xl bg-brand-500 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 active:scale-[0.98] transition-all"
        >
          Tạo lại phiên thanh toán
        </button>
      ) : (
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="w-full rounded-2xl bg-green-500 py-3.5 text-base font-semibold text-white hover:bg-green-600 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <SpinnerIcon className="size-5 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            "✓ Tôi đã thanh toán"
          )}
        </button>
      )}
    </div>
  );
};
