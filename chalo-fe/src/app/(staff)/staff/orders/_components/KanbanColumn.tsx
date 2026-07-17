// src/app/(staff)/staff/orders/_components/KanbanColumn.tsx
import { OrderDto, OrderStatus } from "@/services/order/order.types";
import { ReactNode } from "react";
import { KANBAN_COLUMNS } from "../orders.config";
import { OrderCard } from "./OrderCard";

export const KanbanColumn = ({
  config,
  orders,
  onStatusChange,
  updatingId,
  selectable = false,
  selectedIds,
  onToggleSelect,
  banner,
}: {
  config: (typeof KANBAN_COLUMNS)[number];
  orders: OrderDto[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  updatingId: string | null;
  /** Bật chế độ chọn đơn để gộp pha chung (dùng cho cột Đã xác nhận) */
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (orderId: string) => void;
  /** Nội dung ghim đầu cột (vd: gợi ý gộp đơn thông minh) */
  banner?: ReactNode;
}) => {
  return (
    <div className="flex min-w-[220px] flex-1 flex-col">
      <div
        className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border ${config.bgColor} ${config.borderColor}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{config.emoji}</span>
          <span className={`text-sm font-bold ${config.textColor}`}>
            {config.label}
          </span>
        </div>
        {orders.length > 0 && (
          <span
            className={`size-5 rounded-full text-xs font-bold flex items-center justify-center ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
          >
            {orders.length}
          </span>
        )}
      </div>

      <div
        className={`flex-1 min-h-[120px] border-x border-b ${config.borderColor} rounded-b-xl p-2 space-y-2 overflow-y-auto`}
      >
        {banner}
        {orders.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-6">
            Không có đơn
          </p>
        ) : (
          orders.map((order) => (
            <OrderCard
              order={order}
              isUpdating={updatingId === order.id}
              onStatusChange={onStatusChange}
              selectable={selectable}
              selected={selectedIds?.has(order.id) ?? false}
              onToggleSelect={onToggleSelect}
              key={order.id}
            />
          ))
        )}
      </div>
    </div>
  );
};
