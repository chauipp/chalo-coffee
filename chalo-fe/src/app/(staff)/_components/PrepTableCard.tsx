"use client";
// src/app/(staff)/_components/PrepTableCard.tsx
// Card một BÀN — chế độ "theo bàn" của khu pha chế. Mỗi card là một đơn đang
// pha, liệt kê từng món với các ô tick ly, dùng chung onToggleUnit với card món.
import { PrepUnit, TableProgress } from "@/utils/prep-grouping";
import { OrderSourceBadge } from "@/components/orders/OrderSourceBadge";

export const PrepTableCard = ({
  table,
  onToggleUnit,
}: {
  table: TableProgress;
  onToggleUnit: (unit: PrepUnit) => void;
}) => {
  const allDone = table.total > 0 && table.done === table.total;

  return (
    <div
      data-testid={`prep-table-${table.orderId}`}
      className={`rounded-xl border bg-white dark:bg-stone-900 shadow-sm p-3.5 space-y-3
        ${allDone ? "border-green-300 dark:border-green-700" : "border-brand-200 dark:border-brand-800/50"}`}
    >
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
              {table.tableName}
            </p>
            <OrderSourceBadge source={table.orderSource} />
          </div>
          <span
            className={`text-xs shrink-0 ${allDone ? "text-green-600 dark:text-green-400 font-semibold" : "text-stone-400"}`}
          >
            {table.done}/{table.total} ly
          </span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${allDone ? "bg-green-500" : "bg-brand-400"}`}
            style={{
              width: table.total ? `${(table.done / table.total) * 100}%` : "0%",
            }}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        {table.items.map((it) => (
          <div key={it.itemId}>
            <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              {it.productName}{" "}
              <span className="text-stone-400">×{it.quantity}</span>
              {it.note ? (
                <span className="text-stone-500 dark:text-stone-400 font-normal">
                  {" "}
                  · 📝 {it.note}
                </span>
              ) : null}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: it.quantity }, (_, u) => {
                const unit: PrepUnit = {
                  orderId: table.orderId,
                  itemId: it.itemId,
                  unitIndex: u,
                  quantity: it.quantity,
                  tableName: table.tableName,
                  orderSource: table.orderSource,
                  note: it.note,
                  ticked: u < it.preparedQuantity,
                };
                return (
                  <button
                    key={u}
                    onClick={() => onToggleUnit(unit)}
                    aria-pressed={unit.ticked}
                    aria-label={`${table.tableName} — ly ${u + 1}/${it.quantity} ${it.productName}`}
                    title={`Ly ${u + 1}/${it.quantity}`}
                    className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors select-none
                      ${
                        unit.ticked
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-white dark:bg-stone-950 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-brand-400"
                      }`}
                  >
                    <span
                      className={`flex size-3.5 items-center justify-center rounded-sm border text-[9px] leading-none
                        ${unit.ticked ? "border-white/70 bg-white/20" : "border-stone-400 dark:border-stone-600"}`}
                    >
                      {unit.ticked ? "✓" : ""}
                    </span>
                    Ly {u + 1}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
