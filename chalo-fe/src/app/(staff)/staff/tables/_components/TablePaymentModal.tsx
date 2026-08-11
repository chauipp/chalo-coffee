"use client";

import { Modal } from "@/components/shared/ui/Modal";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { buildVietQR } from "@/lib/vietqr";
import { usePayAllOrders } from "@/services/order/order.queries";
import { useGetSettings } from "@/services/settings";
import { TableDto } from "@/services/table";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { calculateCashChange } from "./payment.utils";

type PaymentMethod = "qr" | "cash";

interface TablePaymentModalProps {
  table: TableDto;
  totalUnpaid: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const TablePaymentModal = ({
  onClose,
  onSuccess,
  table,
  totalUnpaid,
}: TablePaymentModalProps) => {
  const [method, setMethod] = useState<PaymentMethod>("qr");
  const [received, setReceived] = useState("");
  const { data: settings } = useGetSettings();
  const payAllMutation = usePayAllOrders(table.qrToken);

  const bankConfigured = Boolean(
    settings?.bankBin && settings.bankAccountNo && settings.bankAccountName,
  );
  const qrPayload = useMemo(() => {
    if (!bankConfigured) return null;
    return buildVietQR({
      bankBin: settings!.bankBin!,
      accountNo: settings!.bankAccountNo!,
      amount: totalUnpaid,
      addInfo: `CHALO ${table.name} THANH TOAN`,
    });
  }, [bankConfigured, settings, table.name, totalUnpaid]);

  const cash = calculateCashChange(totalUnpaid, received);
  const canConfirm = method === "qr" ? bankConfigured : cash.valid;

  const confirmPayment = async () => {
    if (!canConfirm || payAllMutation.isPending) return;
    await payAllMutation.mutateAsync({ tableToken: table.qrToken });
    onSuccess();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Thanh toán ${table.name}`}
      size="sm"
      presentation="bottom-sheet"
      panelTestId="table-payment-modal"
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-brand-50 px-4 py-3 text-center dark:bg-brand-900/20">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tổng chưa thanh toán
          </p>
          <p className="mt-1 text-2xl font-extrabold text-brand-600 dark:text-brand-400">
            {totalUnpaid.toLocaleString("vi-VN")}đ
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Phương thức thanh toán">
          {([
            ["qr", "▣ QR chuyển khoản"],
            ["cash", "▤ Tiền mặt"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={method === value}
              onClick={() => setMethod(value)}
              className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                method === value
                  ? "border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {method === "qr" ? (
          bankConfigured && qrPayload ? (
            <div className="space-y-3 text-center">
              <div
                data-testid="vietqr-code"
                className="mx-auto w-fit rounded-2xl border-2 border-gray-100 bg-white p-3 dark:border-gray-800"
              >
                <QRCodeSVG value={qrPayload} size={208} marginSize={1} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {settings!.bankAccountName}
                </p>
                <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
                  {settings!.bankAccountNo}
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Khách quét mã và chuyển đúng số tiền, sau đó xác nhận bên dưới.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
              Chưa cấu hình tài khoản nhận tiền. Vào Cài đặt để nhập thông tin VietQR.
            </div>
          )
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="cash-received">
              Tiền khách đưa
            </label>
            <input
              id="cash-received"
              inputMode="numeric"
              min={0}
              value={received}
              onChange={(event) => setReceived(event.target.value.replace(/\D/g, ""))}
              placeholder="Nhập số tiền"
              className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-base text-gray-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <span className="text-sm text-gray-500 dark:text-gray-400">Tiền thừa</span>
              <span className={`text-lg font-bold ${cash.valid ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
                {cash.valid ? `${cash.change.toLocaleString("vi-VN")}đ` : "—"}
              </span>
            </div>
            {received && !cash.valid && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Số tiền khách đưa chưa đủ.
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={confirmPayment}
          disabled={!canConfirm || payAllMutation.isPending}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {payAllMutation.isPending ? <SpinnerIcon className="size-4 animate-spin" /> : null}
          Xác nhận đã thanh toán
        </button>
      </div>
    </Modal>
  );
};
