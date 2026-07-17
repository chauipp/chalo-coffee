"use client";
// src/app/(staff)/_components/PrepTicket.tsx
// Ticket khu pha chế: 1 đơn lẻ hoặc 1 nhóm gộp (batch). Món hiển thị kèm
// checkbox từng ly — pha đến đâu tick đến đó, tránh làm trùng/sót món.
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { OrderDto, OrderStatus } from "@/services/order/order.types";
import { tickKey, usePrepStore } from "@/stores/prep.store";
import { useMemo } from "react";

interface PrepUnit {
  orderId: string;
  itemId: string;
  unitIndex: number;
  quantity: number;
  tableName: string;
  note: string | null;
}

interface ProductGroup {
  productId: string;
  productName: string;
  units: PrepUnit[];
}

/** Gom món theo productId trên toàn ticket, bung quantity thành từng ly */
const groupByProduct = (orders: OrderDto[]): ProductGroup[] => {
  const map = new Map<string, ProductGroup>();
  for (const o of orders) {
    for (const item of o.items) {
      let g = map.get(item.productId);
      if (!g) {
        g = { productId: item.productId, productName: item.productName, units: [] };
        map.set(item.productId, g);
      }
      for (let u = 0; u < item.quantity; u++) {
        g.units.push({
          orderId: o.id,
          itemId: item.id,
          unitIndex: u,
          quantity: item.quantity,
          tableName: o.tableName,
          note: item.note,
        });
      }
    }
  }
  return [...map.values()];
};

export const PrepTicket = ({
  orders,
  onStatusChange,
  updatingId,
}: {
  /** 1 phần tử = đơn lẻ; nhiều phần tử = nhóm gộp */
  orders: OrderDto[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  updatingId: string | null;
}) => {
  const ticks = usePrepStore((s) => s.ticks);
  const toggleTick = usePrepStore((s) => s.toggleTick);

  const groups = useMemo(() => groupByProduct(orders), [orders]);
  const isBatch = orders.length > 1;

  const isTicked = (u: PrepUnit) =>
    ticks[tickKey(u.orderId, u.itemId)]?.[u.unitIndex] ?? false;

  const total = groups.reduce((s, g) => s + g.units.length, 0);
  const done = groups.reduce(
    (s, g) => s + g.units.filter((u) => isTicked(u)).length,
    0,
  );
  const allDone = total > 0 && done === total;

  /** Đơn này đã tick đủ mọi ly chưa → nhấn mạnh nút Sẵn sàng */
  const orderDone = (o: OrderDto) =>
    o.items.every((item) => {
      const arr = ticks[tickKey(o.id, item.id)];
      if (!arr) return false;
      for (let i = 0; i < item.quantity; i++) if (!arr[i]) return false;
      return true;
    });

  return (
    <div
      data-testid={`prep-ticket-${orders[0].id}`}
      className={`rounded-xl border bg-white dark:bg-gray-900 shadow-sm p-3.5 space-y-3
        ${allDone ? "border-green-300 dark:border-green-700" : "border-orange-200 dark:border-orange-800/50"}`}
    >
      {/* Header: bàn + mã đơn + badge gộp */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
            {[...new Set(orders.map((o) => o.tableName))].join(" · ")}
          </p>
          <p className="text-xs text-gray-400 font-mono truncate">
            {orders.map((o) => `#${o.id.slice(-6).toUpperCase()}`).join("  ")}
          </p>
        </div>
      </div>

      {/* Ticklist theo món */}
      <div className="space-y-2.5">
        {groups.map((g) => (
          <div key={g.productId}>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {g.productName}{" "}
              <span className="text-gray-400">×{g.units.length}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {g.units.map((u) => {
                const ticked = isTicked(u);
                return (
                  <button
                    key={`${u.orderId}-${u.itemId}-${u.unitIndex}`}
                    onClick={() =>
                      toggleTick(u.orderId, u.itemId, u.unitIndex, u.quantity)
                    }
                    aria-pressed={ticked}
                    title={
                      (isBatch ? `${u.tableName}` : `Ly ${u.unitIndex + 1}`) +
                      (u.note ? ` · 📝 ${u.note}` : "")
                    }
                    className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors select-none
                      ${
                        ticked
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400"
                      }`}
                  >
                    <span
                      className={`flex size-3.5 items-center justify-center rounded-sm border text-[9px] leading-none
                        ${ticked ? "border-white/70 bg-white/20" : "border-gray-400 dark:border-gray-600"}`}
                    >
                      {ticked ? "✓" : ""}
                    </span>
                    {isBatch ? u.tableName : u.unitIndex + 1}
                    {u.note && <span aria-hidden>📝</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Ghi chú đơn */}
      {orders.some((o) => o.note) && (
        <div className="space-y-1">
          {orders
            .filter((o) => o.note)
            .map((o) => (
              <p
                key={o.id}
                className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg"
              >
                📌 {isBatch ? `${o.tableName}: ` : ""}
                {o.note}
              </p>
            ))}
        </div>
      )}

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>Tiến độ</span>
          <span className={allDone ? "text-green-600 dark:text-green-400 font-semibold" : ""}>
            {done}/{total} ly
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${allDone ? "bg-green-500" : "bg-orange-400"}`}
            style={{ width: total ? `${(done / total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* Actions: mỗi đơn 1 nút Sẵn sàng (batch thì nhiều nút) */}
      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-800">
        {orders.map((o) => {
          const ready = orderDone(o);
          const isUpdating = updatingId === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onStatusChange(o.id, "READY")}
              disabled={isUpdating}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50
                ${
                  ready
                    ? "bg-green-500 hover:bg-green-600 animate-pulse"
                    : "bg-brand-400 hover:bg-brand-500 active:bg-brand-600"
                }`}
              title={ready ? "Đã tick đủ món — báo sẵn sàng" : "Chưa tick đủ món"}
            >
              {isUpdating ? <SpinnerIcon className="size-3 animate-spin" /> : null}
              {isBatch ? `${o.tableName} · Sẵn sàng →` : "Sẵn sàng →"}
            </button>
          );
        })}
      </div>
    </div>
  );
};
