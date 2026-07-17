// src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutSessionPanel.tsx
"use client";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { buildVietQR } from "@/lib/vietqr";
import { useGetSettings } from "@/services/settings";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

export const CheckoutSessionPanel = ({
  totalAmount,
  expiresAt,
  sessionId,
  tableName,
  onConfirm,
  onRestart,
  isPending,
}: {
  totalAmount: number;
  expiresAt: string;
  sessionId: string;
  tableName?: string | null;
  onConfirm: () => void;
  onRestart: () => void;
  isPending: boolean;
}) => {
  const [remainingMs, setRemainingMs] = useState<number>(
    () => new Date(expiresAt).getTime() - Date.now(),
  );
  const { data: settings } = useGetSettings();

  useEffect(() => {
    const id = setInterval(() => {
      setRemainingMs(new Date(expiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const expired = remainingMs <= 0;
  const mm = Math.max(0, Math.floor(remainingMs / 60000));
  const ss = Math.max(0, Math.floor((remainingMs % 60000) / 1000));

  const bankConfigured =
    !!settings?.bankBin && !!settings?.bankAccountNo && !!settings?.bankAccountName;

  // QR động: đúng số tiền của bàn + nội dung "CHALO <bàn> <mã phiên>"
  // để thu ngân đối chiếu (số tiền đã khoá trong QR, không cần lặp lại)
  const qrPayload = bankConfigured
    ? buildVietQR({
        bankBin: settings!.bankBin!,
        accountNo: settings!.bankAccountNo!,
        amount: totalAmount,
        addInfo: `CHALO ${tableName ?? ""} ${sessionId.slice(-6)}`,
      })
    : null;

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

      {qrPayload && !expired && (
        <div className="flex flex-col items-center gap-3">
          {/* QR luôn nền trắng để app ngân hàng quét được ở cả dark mode */}
          <div
            data-testid="vietqr-code"
            className="rounded-2xl border-2 border-gray-100 bg-white p-3 dark:border-gray-800"
          >
            <QRCodeSVG value={qrPayload} size={208} marginSize={1} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {settings!.bankAccountName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {settings!.bankAccountNo}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Mở app ngân hàng bất kỳ, quét mã — số tiền và nội dung đã điền
              sẵn. Chuyển xong hãy bấm nút bên dưới.
            </p>
          </div>
        </div>
      )}

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
