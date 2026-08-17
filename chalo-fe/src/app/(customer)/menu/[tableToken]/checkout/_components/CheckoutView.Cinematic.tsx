"use client";
// src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutView.Cinematic.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { CheckoutSessionResult, OrderDto } from "@/services/order/order.types";
import { PaymentQRBox } from "@/components/shared/PaymentQRBox";

interface CheckoutViewProps {
  step: "review" | "session" | "done" | "loading" | "empty";
  orders: OrderDto[];
  totalAmount: number;
  session: CheckoutSessionResult | null;
  onStart: () => void;
  isStarting: boolean;
  onRestartSession: () => void;
  tableName?: string | null;
  onGoToOrders: () => void;
  onGoToMenu: () => void;
}

const SessionPanel = ({
  session,
  onRestartSession,
}: Pick<
  CheckoutViewProps,
  "session" | "onRestartSession"
>) => {
  return (
    <div className="space-y-4 rounded-2xl bg-white p-5 dark:bg-stone-900">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider text-brand-600 dark:text-brand-300/60">
          Phiên thanh toán gộp
        </p>
        <p className="mt-2 font-semibold text-3xl text-brand-800 dark:text-brand-300">
          {session!.totalAmount.toLocaleString("vi-VN")}đ
        </p>
      </div>
      <PaymentQRBox
        totalAmount={session!.totalAmount}
        expiresAt={session!.expiresAt}
        payCode={session!.payCode}
        onRestart={onRestartSession}
      />
    </div>
  );
};

export const CheckoutViewCinematic = (props: CheckoutViewProps) => {
  const { step, orders, totalAmount, onStart, isStarting, onGoToOrders, onGoToMenu } = props;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <header className="flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 dark:border-stone-700 dark:bg-stone-900">
        <button onClick={onGoToOrders} className="text-stone-600 dark:text-stone-300">
          ← Quay lại
        </button>
        <h1 className="font-semibold text-base text-stone-900 dark:text-stone-50">
          Thanh toán một lần
        </h1>
      </header>

      <main className="space-y-4 p-4 pb-36">
        {step === "done" ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-green-50 text-4xl dark:bg-green-900/20">
              🎉
            </div>
            <p className="font-semibold text-lg text-stone-900 dark:text-stone-50">
              Đã thanh toán tất cả đơn của bàn
            </p>
            <button
              onClick={onGoToOrders}
              className="rounded-full bg-brand-700 px-8 py-3 text-sm font-semibold text-brand-50 dark:bg-brand-300 dark:text-stone-900"
            >
              Xem đơn hàng
            </button>
          </div>
        ) : step === "loading" ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon className="size-8 animate-spin text-brand-400" />
          </div>
        ) : step === "empty" ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center text-brand-700 dark:text-brand-200/50">
            <div className="flex size-20 items-center justify-center rounded-full bg-brand-100 text-4xl dark:bg-stone-900">
              ✅
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300">
              Không có đơn nào cần thanh toán
            </p>
            <button
              onClick={onGoToMenu}
              className="rounded-full bg-brand-700 px-6 py-2.5 text-sm font-medium text-brand-50 dark:bg-brand-300 dark:text-stone-900"
            >
              Xem thực đơn
            </button>
          </div>
        ) : step === "session" ? (
          <SessionPanel {...props} />
        ) : (
          <div className="space-y-3 rounded-2xl bg-white p-4 dark:bg-stone-900">
            <p className="text-sm text-brand-800 dark:text-brand-200">
              {orders.length} đơn sẽ được thanh toán
            </p>
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-brand-500 dark:text-brand-300/50">
                      Đơn #{o.id.slice(-6).toUpperCase()}
                    </p>
                    <p className="truncate text-xs text-brand-600 dark:text-brand-300/60">
                      {o.items.reduce((s, i) => s + i.quantity, 0)} món
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-stone-900 dark:text-stone-50">
                    {o.totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-stone-200 pt-3 dark:border-stone-700">
              <span className="text-sm text-stone-900 dark:text-stone-50">
                Tổng cần thanh toán
              </span>
              <span className="font-semibold text-lg text-brand-700 dark:text-brand-300">
                {totalAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>
        )}
      </main>

      {step === "review" && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-stone-50/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl dark:border-stone-700 dark:bg-stone-950/95">
          <button
            onClick={onStart}
            disabled={isStarting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-green-700 py-3.5 text-base font-semibold text-brand-50 disabled:opacity-60 dark:bg-green-700"
          >
            {isStarting && <SpinnerIcon className="size-5 animate-spin" />}
            Thanh toán {totalAmount.toLocaleString("vi-VN")}đ
          </button>
        </div>
      )}
    </div>
  );
};
