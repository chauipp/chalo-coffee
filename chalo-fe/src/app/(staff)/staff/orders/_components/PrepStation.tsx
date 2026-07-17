"use client";
// src/app/(staff)/staff/orders/_components/PrepStation.tsx
// Khu vực Pha chế (vùng phải màn split): gom các đơn PREPARING thành ticket —
// đơn cùng batch (gộp thủ công / gợi ý) chung 1 ticket, còn lại ticket lẻ.
import { OrderDto, OrderStatus } from "@/services/order/order.types";
import { usePrepStore } from "@/stores/prep.store";
import { useMemo } from "react";
import { PrepTicket } from "./PrepTicket";

export const PrepStation = ({
  orders,
  onStatusChange,
  updatingId,
}: {
  /** Các đơn PREPARING, sort cũ → mới */
  orders: OrderDto[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  updatingId: string | null;
}) => {
  const batches = usePrepStore((s) => s.batches);

  const tickets = useMemo(() => {
    const byId = new Map(orders.map((o) => [o.id, o] as const));
    const used = new Set<string>();
    const result: { key: string; batchId?: string; orders: OrderDto[] }[] = [];

    for (const [batchId, memberIds] of Object.entries(batches)) {
      const members = memberIds
        .filter((id) => byId.has(id))
        .map((id) => byId.get(id)!);
      if (members.length < 2) continue; // batch chỉ còn 1 đơn đang pha → hiển thị lẻ
      members.forEach((m) => used.add(m.id));
      result.push({ key: batchId, batchId, orders: members });
    }
    for (const o of orders) {
      if (!used.has(o.id)) result.push({ key: o.id, orders: [o] });
    }
    // đơn (cũ nhất trong ticket) vào trước đứng trước
    result.sort(
      (a, b) =>
        +new Date(a.orders[0].createdAt) - +new Date(b.orders[0].createdAt),
    );
    return result;
  }, [orders, batches]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-orange-200 dark:border-orange-800/50 bg-orange-50/40 dark:bg-orange-950/10">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-orange-200 dark:border-orange-800/50 shrink-0">
        <div className="flex items-center gap-2">
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
            &quot;Bắt đầu pha&quot;, hoặc chọn nhiều đơn để pha chung.
          </p>
        ) : (
          <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
            {tickets.map((t) => (
              <PrepTicket
                key={t.key}
                orders={t.orders}
                batchId={t.batchId}
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
