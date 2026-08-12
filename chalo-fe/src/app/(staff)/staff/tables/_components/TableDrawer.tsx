"use client";

// src/app/(staff)/staff/tables/_components/TableDrawer.tsx

import { TableDto } from "@/services/table";
import { STATUS_CONFIG } from "../tables.config";
import { OrderRow } from "./OrderRow";
import { OrderPaymentPanel } from "../../orders/_components/OrderPaymentPanel";
import { useState } from "react";
import { useGetOrderByToken } from "@/services/order/order.queries";

interface TableDrawerProps {
  table: TableDto | null;
  onClose: () => void;
}

export const TableDrawer = ({ onClose, table }: TableDrawerProps) => {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const { data: tableOrders = [], isLoading: isLoadingTableOrders } = useGetOrderByToken(table?.qrToken ?? "");
  if (!table) return null;
  const cfg = STATUS_CONFIG[table.status];
  const totalUnpaid = table.activeOrders
    .filter((o) => !o.paidStatus)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* drawer */}
      <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex max-h-[calc(100dvh-5rem-env(safe-area-inset-bottom))] w-full flex-col rounded-t-3xl border-t border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 md:inset-y-0 md:left-auto md:right-0 md:top-0 md:max-h-none md:w-80 md:rounded-none md:rounded-l-2xl md:border-l md:border-t-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              {table.name}
            </h3>
            {table.area && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {table.area}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Status badge */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 ${cfg.bgColor} border ${cfg.borderColor}`}
          >
            <span className={`size-2.5 rounded-full ${cfg.dot}`} />
            <span className={`text-sm font-bold ${cfg.textColor}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Orders list — scrollable */}
        <div className="flex-1 overflow-y-auto px-5">
          {paymentOpen && isLoadingTableOrders ? (
            <div className="py-8 text-center text-sm text-gray-400">Đang tải đơn của bàn…</div>
          ) : paymentOpen && tableOrders.length ? (
            <div className="py-4">
              <OrderPaymentPanel
                order={tableOrders.find((order) => !order.paidStatus) ?? tableOrders[0]}
                tableOrders={tableOrders}
                initialScope="table"
                onCancel={() => setPaymentOpen(false)}
                onSuccess={() => { setPaymentOpen(false); onClose(); }}
              />
            </div>
          ) : paymentOpen ? (
            <div className="py-8 text-center text-sm text-gray-400">Không còn đơn chưa thanh toán.</div>
          ) : (
            <>
          {table.status === "AVAILABLE" || table.activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <p className="text-2xl mb-2">🪑</p>
              <p className="text-sm text-gray-400 dark:text-gray-600">
                Bàn đang trống
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pt-4 pb-2">
                {table.activeOrders.length} đơn đang xử lý
              </p>
              {table.activeOrders.map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </>
          )}
            </>
          )}
        </div>

          {!paymentOpen && table.status === "OCCUPIED" &&
          table.activeOrders.length > 0 &&
          totalUnpaid > 0 && (
            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tổng chưa thanh toán
                </p>
                <p className="text-base font-bold text-red-600 dark:text-red-400">
                  {totalUnpaid.toLocaleString("vi-VN")}đ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentOpen(true)}
                className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-600"
              >
                Thanh toán cả bàn
              </button>
            </div>
          )}

        {/* qr token */}
        <div className="px-5 pb-4 shrink-0">
          <p className="text-[10px] font-mono text-gray-400 dark:text-gray-600 break-all">
            {table.qrToken}
          </p>
        </div>
      </div>

    </>
  );
};
