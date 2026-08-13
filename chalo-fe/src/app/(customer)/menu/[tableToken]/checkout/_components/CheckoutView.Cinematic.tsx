"use client";
// src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutView.Cinematic.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { buildVietQR } from "@/lib/vietqr";
import { useGetSettings } from "@/services/settings";
import { CheckoutSessionResult, OrderDto } from "@/services/order/order.types";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

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
  const { data: settings } = useGetSettings();
  const [remainingMs, setRemainingMs] = useState<number>(
    () => new Date(session!.expiresAt).getTime() - Date.now(),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemainingMs(new Date(session!.expiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [session]);

  const expired = remainingMs <= 0;
  const mm = Math.max(0, Math.floor(remainingMs / 60000));
  const ss = Math.max(0, Math.floor((remainingMs % 60000) / 1000));
  const bankConfigured =
    !!settings?.bankBin && !!settings?.bankAccountNo && !!settings?.bankAccountName;
  const qrPayload = bankConfigured
    ? buildVietQR({
        bankBin: settings!.bankBin!,
        accountNo: settings!.bankAccountNo!,
        amount: session!.totalAmount,
        addInfo: `CHALO ${tableName ?? ""} ${session!.sessionId.slice(-6)}`,
      })
    : null;

  return (
    <div className="space-y-4 rounded-2xl bg-white/70 p-5 dark:bg-stone-900/70">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider text-brand-600 dark:text-brand-300/60">
          Phiên thanh toán gộp
        </p>
        <p className="mt-2 font-serif text-3xl text-brand-800 dark:text-brand-300">
          {session!.totalAmount.toLocaleString("vi-VN")}đ
        </p>
        <p
          className={`mt-2 text-sm ${
            expired ? "text-red-600 dark:text-red-400" : "text-brand-700 dark:text-brand-200/60"
          }`}
        >
          {expired ? "Phiên đã hết hạn" : `Hết hạn sau ${mm}:${ss.toString().padStart(2, "0")}`}
        </p>
      </div>

      {qrPayload && !expired && (
        <div className="flex flex-col items-center gap-3">
          <div data-testid="vietqr-code" className="rounded-2xl border-2 border-brand-100 bg-white p-3">
            <QRCodeSVG value={qrPayload} size={208} marginSize={1} />
          </div>
          <div className="text-center">
            <p className="text-sm text-brand-900 dark:text-brand-100">
              {settings!.bankAccountName}
            </p>
            <p className="font-mono text-xs text-brand-600 dark:text-brand-300/60">
              {settings!.bankAccountNo}
            </p>
            <p className="mt-1 text-xs text-brand-500 dark:text-brand-300/50">
              Mở app ngân hàng bất kỳ, quét mã — số tiền và nội dung đã điền
              sẵn. Chuyển xong hãy bấm nút bên dưới.
            </p>
          </div>
        </div>
      )}

      {expired ? (
        <button
          onClick={onRestartSession}
          className="w-full rounded-full bg-brand-700 py-3.5 text-sm font-semibold text-brand-50 dark:bg-brand-300 dark:text-brand-950"
        >
          Tạo lại phiên thanh toán
        </button>
      ) : (
        <button
          onClick={onConfirmPaid}
          disabled={isConfirming}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 py-3.5 text-base font-semibold text-white disabled:opacity-60 dark:bg-green-500"
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

export const CheckoutViewCinematic = (props: CheckoutViewProps) => {
  const { step, orders, totalAmount, onStart, isStarting, onGoToOrders, onGoToMenu } = props;

  return (
    <div className="min-h-screen bg-brand-50 dark:bg-stone-950">
      <header className="flex items-center gap-3 border-b border-brand-200/60 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
        <button onClick={onGoToOrders} className="text-brand-700 dark:text-brand-200/70">
          ← Quay lại
        </button>
        <h1 className="font-serif text-base text-brand-950 dark:text-brand-50">
          Thanh toán một lần
        </h1>
      </header>

      <main className="space-y-4 p-4 pb-32">
        {step === "done" ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-green-50 text-4xl dark:bg-green-900/20">
              🎉
            </div>
            <p className="font-serif text-lg text-brand-950 dark:text-brand-50">
              Đã thanh toán tất cả đơn của bàn
            </p>
            <button
              onClick={onGoToOrders}
              className="rounded-full bg-brand-700 px-8 py-3 text-sm font-semibold text-brand-50 dark:bg-brand-300 dark:text-brand-950"
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
            <p className="text-sm text-brand-700 dark:text-brand-200/70">
              Không có đơn nào cần thanh toán
            </p>
            <button
              onClick={onGoToMenu}
              className="rounded-full bg-brand-700 px-6 py-2.5 text-sm font-medium text-brand-50 dark:bg-brand-300 dark:text-brand-950"
            >
              Xem thực đơn
            </button>
          </div>
        ) : step === "session" ? (
          <SessionPanel {...props} />
        ) : (
          <div className="space-y-3 rounded-2xl bg-white/60 p-4 dark:bg-stone-900/60">
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
                  <span className="shrink-0 text-sm text-brand-950 dark:text-brand-50">
                    {o.totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-brand-200/60 pt-3 dark:border-stone-800">
              <span className="text-sm text-brand-950 dark:text-brand-50">
                Tổng cần thanh toán
              </span>
              <span className="font-serif text-lg text-brand-700 dark:text-brand-300">
                {totalAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>
        )}
      </main>

      {step === "review" && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-brand-200/60 bg-brand-50/95 px-4 py-4 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/95">
          <button
            onClick={onStart}
            disabled={isStarting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-green-700 py-3.5 text-base font-semibold text-brand-50 disabled:opacity-60 dark:bg-green-500"
          >
            {isStarting && <SpinnerIcon className="size-5 animate-spin" />}
            Thanh toán {totalAmount.toLocaleString("vi-VN")}đ
          </button>
        </div>
      )}
    </div>
  );
};
