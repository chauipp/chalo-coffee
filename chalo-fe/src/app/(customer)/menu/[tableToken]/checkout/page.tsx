// src/app/(customer)/menu/[tableToken]/checkout/page.tsx
"use client";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import {
  useCheckoutPreview,
  useCheckoutStart,
  useCheckoutComplete,
} from "@/services/order/order.queries";
import { CheckoutSessionResult } from "@/services/order/order.types";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CheckoutSummary } from "./_components/CheckoutSummary";
import { CheckoutSessionPanel } from "./_components/CheckoutSessionPanel";

export default function CheckoutPage() {
  const { tableToken } = useParams<{ tableToken: string }>();
  const router = useRouter();

  const { data: preview, isLoading, isError } = useCheckoutPreview(tableToken);
  const startMutation = useCheckoutStart();
  const completeMutation = useCheckoutComplete(tableToken);

  const [session, setSession] = useState<CheckoutSessionResult | null>(null);
  const [done, setDone] = useState<boolean>(false);

  const handleStart = async () => {
    const s = await startMutation.mutateAsync({ tableToken });
    setSession(s);
  };

  const handleComplete = async () => {
    if (!session) return;
    await completeMutation.mutateAsync({
      sessionId: session.sessionId,
      tableToken: session.tableToken,
      clientSecret: session.clientSecret,
    });
    setSession(null);
    setDone(true);
  };

  const handleRestart = () => setSession(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button
          onClick={() => router.push(`/menu/${tableToken}/orders`)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          ← Quay lại
        </button>
        <h1 className="text-base font-bold text-gray-900 dark:text-white">
          Thanh toán một lần
        </h1>
      </header>

      <main className="p-4 space-y-4 pb-32">
        {done ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="size-20 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-4xl">
              🎉
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              Đã thanh toán tất cả đơn của bàn
            </p>
            <button
              onClick={() => router.push(`/menu/${tableToken}/orders`)}
              className="rounded-2xl bg-brand-500 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Xem đơn hàng
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon className="size-8 animate-spin text-brand-400" />
          </div>
        ) : isError || !preview || preview.orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400 dark:text-gray-500 text-center">
            <div className="size-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-4xl">
              ✅
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Không có đơn nào cần thanh toán
            </p>
            <button
              onClick={() => router.push(`/menu/${tableToken}`)}
              className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              Xem thực đơn
            </button>
          </div>
        ) : session ? (
          <CheckoutSessionPanel
            totalAmount={session.totalAmount}
            expiresAt={session.expiresAt}
            onConfirm={handleComplete}
            onRestart={handleRestart}
            isPending={completeMutation.isPending}
          />
        ) : (
          <CheckoutSummary
            orders={preview.orders}
            totalAmount={preview.totalAmount}
          />
        )}
      </main>

      {/* bottom CTA — only in review step */}
      {!done && !session && preview && preview.orders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-4 z-30">
          <button
            onClick={handleStart}
            disabled={startMutation.isPending}
            className="w-full rounded-2xl bg-green-500 py-3.5 text-base font-semibold text-white hover:bg-green-600 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
          >
            {startMutation.isPending && (
              <SpinnerIcon className="size-5 animate-spin" />
            )}
            💳 Thanh toán {preview.totalAmount.toLocaleString("vi-VN")}đ
          </button>
        </div>
      )}
    </div>
  );
}
