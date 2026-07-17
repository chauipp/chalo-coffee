// src/app/(staff)/staff/tables/_components/OrderRow.tsx

import { OrderStatus } from "@/services/order/order.types";
import { TableOrderSummary } from "@/services/table";

const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string }
> = {
  PENDING: {
    label: "Khách đặt",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
  },
  CONFIRMED: {
    label: "Khách đặt",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
  },
  PREPARING: {
    label: "Đang pha chế",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
  },
  READY: {
    label: "Sẵn sàng phục vụ",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
  },
  COMPLETED: {
    label: "Đã phục vụ",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
  },
  CANCELLED: {
    label: "Đã huỷ",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-600 dark:text-red-400",
  },
};

interface OrderRowProps {
  order: TableOrderSummary;
}

export const OrderRow = ({ order }: OrderRowProps) => {
  const statusCfg = ORDER_STATUS_CONFIG[order.status];
  const ageMs = Date.now() - new Date(order.createdAt).getTime();
  const ageMin = Math.floor(ageMs / 60_000);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      {/* id + time */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
          #{order.id.slice(-6).toUpperCase()}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{ageMin} phút trước</p>
      </div>

      {/* badge */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}
        >
          {statusCfg.label}
        </span>

        {order.paidStatus ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            ✓ Đã Thanh Toán
          </span>
        ) : (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            Chưa Thanh Toán
          </span>
        )}
      </div>

      {/* tổng tiền  */}
      <p className="text-sm font-bold text-brand-600 dark:text-brand-400 shrink-0 w-20 text-right">
        {order.totalAmount.toLocaleString("vi-VN")}đ
      </p>
    </div>
  );
};
