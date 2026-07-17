"use client";
// src/app/(staff)/_components/PrepStation.tsx
// Khu vực Pha chế (vùng phải màn split): gom các đơn PREPARING thành ticket,
// mỗi đơn một ticket riêng.
import { CollapseIcon } from "@/components/shared/icons/CollapseIcon";
import { ExpandIcon } from "@/components/shared/icons/ExpandIcon";
import { OrderDto, OrderStatus } from "@/services/order/order.types";
import { useMemo } from "react";
import { PrepTicket } from "./PrepTicket";

export const PrepStation = ({
  orders,
  onStatusChange,
  updatingId,
  expanded,
  onToggleExpand,
}: {
  /** Các đơn PREPARING, sort cũ → mới */
  orders: OrderDto[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  updatingId: string | null;
  expanded: boolean;
  onToggleExpand: () => void;
}) => {
  const tickets = useMemo(
    () => orders.map((o) => ({ key: o.id, orders: [o] })),
    [orders],
  );

  return (
    <div className="flex h-full flex-col rounded-xl border border-orange-200 dark:border-orange-800/50 bg-orange-50/40 dark:bg-orange-950/10">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-orange-200 dark:border-orange-800/50 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleExpand}
            data-testid="prep-expand-toggle"
            aria-pressed={expanded}
            aria-label={
              expanded
                ? "Thu khu pha chế về chế độ chia đôi (Esc)"
                : "Mở rộng khu pha chế chiếm hết vùng bên phải menu"
            }
            title={
              expanded
                ? "Thu lại · Esc"
                : "Mở rộng khu pha chế · chuyển menu khác sẽ tự thu lại"
            }
            className="rounded-lg p-1.5 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          >
            {expanded ? (
              <CollapseIcon className="size-4" />
            ) : (
              <ExpandIcon className="size-4" />
            )}
          </button>
          <span className="text-base">☕</span>
          <h2 className="text-sm font-bold text-orange-700 dark:text-orange-400">
            Đang pha chế
          </h2>
        </div>
        {orders.length > 0 && (
          <span className="size-5 rounded-full text-xs font-bold flex items-center justify-center bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50">
            {orders.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {tickets.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-10">
            Chưa có món nào đang pha — chọn đơn &quot;Đã xác nhận&quot; và bấm
            &quot;Bắt đầu pha&quot;.
          </p>
        ) : (
          <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
            {tickets.map((t) => (
              <PrepTicket
                key={t.key}
                orders={t.orders}
                onStatusChange={onStatusChange}
                updatingId={updatingId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
