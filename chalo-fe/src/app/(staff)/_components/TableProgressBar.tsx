"use client";
// src/app/(staff)/_components/TableProgressBar.tsx
// Dải tiến độ theo bàn ghim đáy khu pha chế. Gom theo món làm mất tầm nhìn
// theo bàn — dải này lấy lại nó: bàn nào sắp đủ ly thì sáng lên, bấm vào xem
// đủ món của bàn đó.
import { OrderDto } from "@/services/order/order.types";
import { PrepUnit, TableProgress, tableProgress } from "@/utils/prep-grouping";
import { useMemo, useState } from "react";
import { TablePopover } from "./TablePopover";

export const TableProgressBar = ({
  orders,
  onToggleUnit,
}: {
  orders: OrderDto[];
  onToggleUnit: (unit: PrepUnit) => void;
}) => {
  const tables = useMemo(() => tableProgress(orders), [orders]);
  const [open, setOpen] = useState<{
    table: TableProgress;
    rect: DOMRect;
  } | null>(null);

  if (tables.length === 0) return null;

  return (
    <>
      <div
        data-testid="table-progress-bar"
        className="flex shrink-0 flex-wrap items-center gap-1.5 border-t border-orange-200 dark:border-orange-800/50 px-3 py-2"
      >
        {tables.map((t) => {
          const done = t.total > 0 && t.done === t.total;
          return (
            <button
              key={t.orderId}
              data-testid={`table-chip-${t.tableName}`}
              onClick={(e) =>
                setOpen({
                  table: t,
                  rect: e.currentTarget.getBoundingClientRect(),
                })
              }
              aria-label={`${t.tableName}: ${t.done}/${t.total} ly — xem các món của bàn`}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors
                ${
                  done
                    ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-brand-400"
                }`}
            >
              {t.tableName} {t.done}/{t.total}
              {done && " ✓"}
            </button>
          );
        })}
      </div>

      {open && (
        <TablePopover
          table={open.table}
          anchorRect={open.rect}
          onClose={() => setOpen(null)}
          onToggleUnit={(u) => {
            onToggleUnit(u);
            setOpen(null);
          }}
        />
      )}
    </>
  );
};
