"use client";
// src/app/(staff)/staff/orders/_components/KanbanColumn.tsx
import { OrderDto, OrderStatus } from "@/services/order/order.types";
import { useState } from "react";
import { KANBAN_COLUMNS, orderDragType } from "../orders.config";
import { OrderCard } from "./OrderCard";

export const KanbanColumn = ({
  config,
  orders,
  onStatusChange,
  updatingId,
}: {
  config: (typeof KANBAN_COLUMNS)[number];
  orders: OrderDto[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  updatingId: string | null;
}) => {
  const [isDropTarget, setIsDropTarget] = useState(false);
  // Chỉ nhận card mà trạng thái ĐÍCH đúng bằng cột này (BE chặn bước sai)
  const accepts = (e: React.DragEvent) =>
    e.dataTransfer.types.includes(orderDragType(config.status));

  return (
    <div
      className="flex min-w-[220px] flex-1 flex-col"
      onDragOver={(e) => {
        if (!accepts(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDropTarget(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDropTarget(false);
      }}
      onDrop={(e) => {
        setIsDropTarget(false);
        if (!accepts(e)) return;
        e.preventDefault();
        const orderId = e.dataTransfer.getData("text/plain");
        if (orderId) onStatusChange(orderId, config.status);
      }}
    >
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
        className={`flex-1 min-h-[120px] border-x border-b ${config.borderColor} dark:bg-gray-900 rounded-b-xl p-2 space-y-2 overflow-y-auto ${
          isDropTarget ? "ring-2 ring-inset ring-brand-400" : ""
        }`}
      >
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
              key={order.id}
            />
          ))
        )}
      </div>
    </div>
  );
};
