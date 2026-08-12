"use client";

import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { buildVietQR } from "@/lib/vietqr";
import { usePayAllOrders, usePayOrder } from "@/services/order/order.queries";
import { OrderDto } from "@/services/order/order.types";
import { useGetSettings } from "@/services/settings";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { calculateCashChange } from "./payment.utils";

type PaymentScope = "order" | "table";
type PaymentMethod = "qr" | "cash";

export function OrderPaymentPanel({
  onCancel,
  onSuccess,
  order,
  tableOrders,
}: {
  order: OrderDto;
  tableOrders: OrderDto[];
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [scope, setScope] = useState<PaymentScope>("order");
  const [method, setMethod] = useState<PaymentMethod>("qr");
  const [received, setReceived] = useState("");
  const { data: settings } = useGetSettings();
  const payOrderMutation = usePayOrder(order.tableToken);
  const payAllMutation = usePayAllOrders(order.tableToken);

  const unpaidTableOrders = tableOrders.filter((tableOrder) => !tableOrder.paidStatus);
  const total =
    scope === "order"
      ? order.totalAmount
      : unpaidTableOrders.reduce((sum, tableOrder) => sum + tableOrder.totalAmount, 0);
  const bankConfigured = Boolean(
    settings?.bankBin && settings.bankAccountNo && settings.bankAccountName,
  );
  const qrPayload = useMemo(() => {
    if (!bankConfigured) return null;
    return buildVietQR({
      bankBin: settings!.bankBin!,
      accountNo: settings!.bankAccountNo!,
      amount: total,
      addInfo: `CHALO ${order.tableName} ${scope === "order" ? order.id.slice(-6) : "CA BAN"}`,
    });
  }, [bankConfigured, order.id, order.tableName, scope, settings, total]);
  const cash = calculateCashChange(total, received);
  const isPending = payOrderMutation.isPending || payAllMutation.isPending;
  const canConfirm = method === "qr" ? bankConfigured : cash.valid;

  const confirmPayment = async () => {
    if (!canConfirm || isPending) return;
    if (scope === "order") {
      await payOrderMutation.mutateAsync({ orderId: order.id, tableToken: order.tableToken });
    } else {
      await payAllMutation.mutateAsync({ tableToken: order.tableToken });
    }
    onSuccess();
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onCancel}
        className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        ← Quay lại chi tiết đơn
      </button>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Phạm vi thanh toán">
        {([
          ["order", "Đơn này"],
          ["table", "Cả bàn"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={scope === value}
            onClick={() => setScope(value)}
            className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${
              scope === value
                ? "border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
                : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="rounded-xl bg-brand-50 px-4 py-3 text-center dark:bg-brand-900/20">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {scope === "order" ? "Tổng đơn này" : `${unpaidTableOrders.length} đơn chưa thanh toán`}
        </p>
        <p className="mt-1 text-2xl font-extrabold text-brand-600 dark:text-brand-400">
          {total.toLocaleString("vi-VN")}đ
        </p>
      </div>
      {scope === "order" && order.customerDisplayName ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-800/60 dark:bg-sky-900/20">
          <p className="text-sm font-semibold text-sky-800 dark:text-sky-200">
            {order.customerDisplayName}
          </p>
          <p className="mt-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
            Cộng {Math.floor(order.totalAmount / 1_000)} điểm
          </p>
        </div>
      ) : null}
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
            className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${
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
        qrPayload ? (
          <div className="space-y-3 text-center">
            <div data-testid="vietqr-code" className="mx-auto w-fit rounded-2xl border-2 border-gray-100 bg-white p-3 dark:border-gray-800">
              <QRCodeSVG value={qrPayload} size={208} marginSize={1} />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{settings!.bankAccountName}</p>
            <p className="-mt-2 font-mono text-xs text-gray-500 dark:text-gray-400">{settings!.bankAccountNo}</p>
          </div>
        ) : (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
            Chưa cấu hình tài khoản nhận tiền. Vào Cài đặt để nhập thông tin VietQR.
          </p>
        )
      ) : (
        <div className="space-y-3">
          <label htmlFor="cash-received" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tiền khách đưa</label>
          <input
            id="cash-received"
            value={received}
            inputMode="numeric"
            onChange={(event) => setReceived(event.target.value.replace(/\D/g, ""))}
            placeholder="Nhập số tiền"
            className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-base text-gray-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">Tiền thừa</span>
            <span className={`text-lg font-bold ${cash.valid ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
              {cash.valid ? `${cash.change.toLocaleString("vi-VN")}đ` : "—"}
            </span>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={confirmPayment}
        disabled={!canConfirm || isPending}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-bold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? <SpinnerIcon className="size-4 animate-spin" /> : null}
        Xác nhận đã thanh toán
      </button>
    </div>
  );
}
