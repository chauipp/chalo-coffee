"use client";
// src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutView.Playful.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { CheckoutSessionResult, OrderDto } from "@/services/order/order.types";
import { QRCodeSVG } from "qrcode.react";
import { useCheckoutSession } from "./useCheckoutSession";

interface CheckoutViewProps {
  step: "review" | "session" | "done" | "loading" | "empty";
  orders: OrderDto[];
  totalAmount: number;
  session: CheckoutSessionResult | null;
  onStart: () => void;
  isStarting: boolean;
  onConfirmPaid: () => void;
  isConfirming: boolean;
  onRestartSession: () => void;
  tableName?: string | null;
  onGoToOrders: () => void;
  onGoToMenu: () => void;
}

const SessionPanel = ({
  session,
  tableName,
  onConfirmPaid,
  isConfirming,
  onRestartSession,
}: Pick<
  CheckoutViewProps,
  "session" | "tableName" | "onConfirmPaid" | "isConfirming" | "onRestartSession"
>) => {
  const { settings, expired, mm, ss, qrPayload } = useCheckoutSession(session, tableName);

  return (
    <div className="space-y-4 rounded-2xl border-2 border-stone-900 bg-white p-5 shadow-[4px_4px_0_var(--color-stone-900)] dark:border-brand-50 dark:bg-carnival-raised dark:shadow-[4px_4px_0_var(--color-pop-600)]">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
          Phiên thanh toán gộp
        </p>
        <p className="mt-2 text-3xl font-black text-pop-700 dark:text-pop-400">
          {session!.totalAmount.toLocaleString("vi-VN")}đ
        </p>
        <p
          className={`mt-2 text-sm font-bold ${
            expired ? "text-red-600 dark:text-red-400" : "text-stone-500 dark:text-stone-400"
          }`}
        >
          {expired ? "Phiên đã hết hạn" : `Hết hạn sau ${mm}:${ss.toString().padStart(2, "0")}`}
        </p>
      </div>

      {qrPayload && !expired && (
        <div className="flex flex-col items-center gap-3">
          <div
            data-testid="vietqr-code"
            className="rounded-2xl border-2 border-stone-900 bg-white p-3 dark:border-brand-50"
          >
            <QRCodeSVG value={qrPayload} size={208} marginSize={1} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-stone-900 dark:text-brand-50">
              {settings!.bankAccountName}
            </p>
            <p className="font-mono text-xs text-stone-500 dark:text-stone-400">
              {settings!.bankAccountNo}
            </p>
            <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
              Mở app ngân hàng bất kỳ, quét mã — số tiền và nội dung đã điền
              sẵn. Chuyển xong hãy bấm nút bên dưới.
            </p>
          </div>
        </div>
      )}

      {expired ? (
        <button
          onClick={onRestartSession}
          className="w-full rounded-2xl border-2 border-stone-900 bg-pop-500 py-3.5 text-sm font-bold text-stone-950 dark:border-brand-50"
        >
          Tạo lại phiên thanh toán
        </button>
      ) : (
        <button
          onClick={onConfirmPaid}
          disabled={isConfirming}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-stone-900 bg-green-500 py-3.5 text-base font-bold text-stone-950 disabled:opacity-60 dark:border-brand-50"
        >
          {isConfirming ? (
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

export const CheckoutViewPlayful = (props: CheckoutViewProps) => {
  const { step, orders, totalAmount, onStart, isStarting, onGoToOrders, onGoToMenu } = props;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-carnival">
      <header className="flex items-center gap-3 border-b-2 border-stone-900 bg-white px-4 py-3 dark:border-brand-50 dark:bg-carnival-raised">
        <button onClick={onGoToOrders} className="text-stone-500 dark:text-stone-400">
          ← Quay lại
        </button>
        <h1 className="text-base font-black text-stone-900 dark:text-brand-50">
          Thanh toán một lần
        </h1>
      </header>

      <main className="space-y-4 p-4 pb-32">
        {step === "done" ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex size-20 items-center justify-center rounded-full border-2 border-stone-900 bg-green-100 text-4xl dark:border-brand-50">
              🎉
            </div>
            <p className="text-lg font-black text-stone-900 dark:text-brand-50">
              Đã thanh toán tất cả đơn của bàn
            </p>
            <button
              onClick={onGoToOrders}
              className="rounded-2xl border-2 border-stone-900 bg-pop-500 px-8 py-3 text-sm font-bold text-stone-950 dark:border-brand-50"
            >
              Xem đơn hàng
            </button>
          </div>
        ) : step === "loading" ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon className="size-8 animate-spin text-pop-700" />
          </div>
        ) : step === "empty" ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center text-stone-400 dark:text-stone-500">
            <div className="flex size-20 items-center justify-center rounded-full border-2 border-stone-900 bg-white text-4xl dark:border-brand-50 dark:bg-carnival-raised">
              ✅
            </div>
            <p className="text-sm font-bold text-stone-600 dark:text-stone-400">
              Không có đơn nào cần thanh toán
            </p>
            <button
              onClick={onGoToMenu}
              className="rounded-full border-2 border-stone-900 bg-pop-500 px-6 py-2.5 text-sm font-bold text-stone-950 dark:border-brand-50"
            >
              Xem thực đơn
            </button>
          </div>
        ) : step === "session" ? (
          <SessionPanel {...props} />
        ) : (
          <div className="space-y-3 rounded-2xl border-2 border-stone-900 bg-white p-4 shadow-[4px_4px_0_var(--color-stone-900)] dark:border-brand-50 dark:bg-carnival-raised dark:shadow-[4px_4px_0_var(--color-pop-600)]">
            <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
              {orders.length} đơn sẽ được thanh toán
            </p>
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-stone-400 dark:text-stone-500">
                      Đơn #{o.id.slice(-6).toUpperCase()}
                    </p>
                    <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                      {o.items.reduce((s, i) => s + i.quantity, 0)} món
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-stone-900 dark:text-brand-50">
                    {o.totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t-2 border-stone-900 pt-3 dark:border-brand-50">
              <span className="text-sm font-bold text-stone-900 dark:text-brand-50">
                Tổng cần thanh toán
              </span>
              <span className="text-lg font-black text-pop-700 dark:text-pop-400">
                {totalAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>
        )}
      </main>

      {step === "review" && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t-2 border-stone-900 bg-white px-4 py-4 dark:border-brand-50 dark:bg-carnival-raised">
          <button
            onClick={onStart}
            disabled={isStarting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-stone-900 bg-green-500 py-3.5 text-base font-bold text-stone-950 shadow-[3px_3px_0_var(--color-stone-900)] disabled:opacity-60 dark:border-brand-50"
          >
            {isStarting && <SpinnerIcon className="size-5 animate-spin" />}
            Thanh toán {totalAmount.toLocaleString("vi-VN")}đ
          </button>
        </div>
      )}
    </div>
  );
};
