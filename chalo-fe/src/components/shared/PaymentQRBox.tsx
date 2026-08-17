"use client";
// src/components/shared/PaymentQRBox.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { buildVietQR } from "@/lib/vietqr";
import { useGetSettings } from "@/services/settings";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

/**
 * Khối VietQR + đếm ngược hết hạn + trạng thái "chờ ngân hàng xác nhận".
 * Không còn nút tự khai "Tôi đã thanh toán" — thanh toán được xác nhận tự động
 * qua webhook SePay (hoặc nhân viên xác nhận tay), màn khách nhận SSE là xong.
 */
export const PaymentQRBox = ({
  totalAmount,
  expiresAt,
  payCode,
  onRestart,
}: {
  totalAmount: number;
  expiresAt: string;
  /** Nội dung chuyển khoản BE sinh sẵn (VD "CK7F3K2M") — dùng NGUYÊN VĂN */
  payCode: string;
  onRestart: () => void;
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

  // QR động: số tiền khoá sẵn + nội dung = payCode để webhook khớp chính xác
  const qrPayload =
    bankConfigured && !expired
      ? buildVietQR({
          bankBin: settings!.bankBin!,
          accountNo: settings!.bankAccountNo!,
          amount: totalAmount,
          addInfo: payCode,
        })
      : null;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">
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

      {qrPayload && (
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
              Nội dung CK:{" "}
              <span className="font-mono font-semibold">{payCode}</span> (đã
              điền sẵn trong QR — đừng sửa khi chuyển).
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
        <>
          <div
            data-testid="awaiting-bank"
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-50 dark:bg-blue-900/20 py-3.5 text-sm font-medium text-blue-700 dark:text-blue-300"
          >
            <SpinnerIcon className="size-4 animate-spin" />
            Đang chờ ngân hàng xác nhận — thường vài giây sau khi chuyển
          </div>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Trả tiền mặt? Ra quầy để nhân viên xác nhận — màn hình sẽ tự cập
            nhật.
          </p>
        </>
      )}
    </div>
  );
};
