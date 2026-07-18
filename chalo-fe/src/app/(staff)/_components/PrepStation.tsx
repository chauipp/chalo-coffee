"use client";
// src/app/(staff)/_components/PrepStation.tsx
// Khu vực Pha chế: gom các đơn PREPARING theo MÓN (không theo bàn). Không có
// nút "Sẵn sàng" — tick đủ mọi ly của một bàn thì BE tự đẩy đơn sang READY.
import { CollapseIcon } from "@/components/shared/icons/CollapseIcon";
import { ExpandIcon } from "@/components/shared/icons/ExpandIcon";
import { OrderDto } from "@/services/order/order.types";
import { orderDragType } from "@/app/(staff)/staff/orders/orders.config";
import { PrepUnit, groupByProduct, tableProgress } from "@/utils/prep-grouping";
import { useMemo, useState } from "react";
import { PrepProductCard } from "./PrepProductCard";
import { PrepTableCard } from "./PrepTableCard";
import { TableProgressBar } from "./TableProgressBar";

export const PrepStation = ({
  orders,
  onToggleUnit,
  expanded,
  onToggleExpand,
  onDropOrder,
}: {
  /** Các đơn PREPARING, sort cũ → mới */
  orders: OrderDto[];
  onToggleUnit: (unit: PrepUnit) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  /** Thả card "Khách đặt" vào đây = Bắt đầu pha (→ PREPARING) */
  onDropOrder?: (orderId: string) => void;
}) => {
  const groups = useMemo(() => groupByProduct(orders), [orders]);
  const tables = useMemo(() => tableProgress(orders), [orders]);
  const [mode, setMode] = useState<"product" | "table">("product");
  const [isDropTarget, setIsDropTarget] = useState(false);
  const accepts = (e: React.DragEvent) =>
    !!onDropOrder && e.dataTransfer.types.includes(orderDragType("PREPARING"));

  return (
    <div
      className={`flex h-full flex-col rounded-xl border border-orange-200 dark:border-orange-800/50 bg-orange-50/40 dark:bg-orange-950/25 ${
        isDropTarget ? "ring-2 ring-inset ring-brand-400" : ""
      }`}
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
        if (orderId) onDropOrder?.(orderId);
      }}
    >
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
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Chế độ hiển thị khu pha chế"
            className="flex rounded-lg border border-orange-200 dark:border-orange-800/50 overflow-hidden text-xs font-medium"
          >
            {(
              [
                ["product", "Theo món"],
                ["table", "Theo bàn"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                aria-pressed={mode === value}
                data-testid={`prep-mode-${value}`}
                className={`px-2.5 py-1 transition-colors ${
                  mode === value
                    ? "bg-orange-500 text-white"
                    : "bg-white dark:bg-gray-900 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {orders.length > 0 && (
            <span className="size-5 rounded-full text-xs font-bold flex items-center justify-center bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50">
              {orders.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {groups.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-10">
            Chưa có món nào đang pha — chọn đơn ở cột &quot;Khách đặt&quot; và
            bấm &quot;Bắt đầu pha&quot;.
          </p>
        ) : (
          <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {mode === "product"
              ? groups.map((g) => (
                  <PrepProductCard
                    key={g.productId}
                    group={g}
                    onToggleUnit={onToggleUnit}
                  />
                ))
              : tables.map((t) => (
                  <PrepTableCard
                    key={t.orderId}
                    table={t}
                    onToggleUnit={onToggleUnit}
                  />
                ))}
          </div>
        )}
      </div>

      {/* Dải tiến độ bàn ở đáy trùng thông tin với chế độ "theo bàn" — chỉ hiện ở chế độ theo món */}
      {mode === "product" && (
        <TableProgressBar orders={orders} onToggleUnit={onToggleUnit} />
      )}
    </div>
  );
};
