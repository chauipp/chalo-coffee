// src/app/(staff)/staff/tables/_components/TableDrawer.tsx

import { TableDto } from "@/services/table";
import { STATUS_CONFIG } from "../page";
import { OrderRow } from "./OrderRow";

interface TableDrawerProps {
  table: TableDto | null;
  onClose: () => void;
}

export const TableDrawer = ({ onClose, table }: TableDrawerProps) => {
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
      <div className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col">
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
        </div>

        {table.status === "OCCUPIED" &&
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
