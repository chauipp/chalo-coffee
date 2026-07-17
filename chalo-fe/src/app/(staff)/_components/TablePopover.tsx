"use client";
// src/app/(staff)/_components/TablePopover.tsx
// Popup món của một bàn, bung ra ngay tại chip vừa bấm ở dải tiến độ.
// Dùng Popover API native: light-dismiss + Esc + top-layer có sẵn, không phải
// bắt sự kiện tay. Định vị bằng JS (CSS anchor positioning mới chỉ Chrome hỗ trợ).
import { PrepUnit, TableProgress } from "@/utils/prep-grouping";
import { useEffect, useRef } from "react";

export const TablePopover = ({
  table,
  anchorRect,
  onClose,
  onToggleUnit,
}: {
  table: TableProgress;
  anchorRect: DOMRect;
  onClose: () => void;
  onToggleUnit: (unit: PrepUnit) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Guard: effect có thể chạy lại khi cha re-render lúc popover đang mở.
    // showPopover() trên popover đã mở sẽ ném InvalidStateError.
    if (!el.matches(":popover-open")) el.showPopover();
    // Bung lên phía trên chip, canh giữa theo chiều ngang, không tràn mép màn
    const { width, height } = el.getBoundingClientRect();
    const left = Math.min(
      Math.max(8, anchorRect.left + anchorRect.width / 2 - width / 2),
      window.innerWidth - width - 8,
    );
    el.style.left = `${left}px`;
    el.style.top = `${Math.max(8, anchorRect.top - height - 8)}px`;

    const onToggleEvent = (e: Event) => {
      if ((e as ToggleEvent).newState === "closed") onClose();
    };
    el.addEventListener("toggle", onToggleEvent);
    return () => el.removeEventListener("toggle", onToggleEvent);
  }, [anchorRect, onClose]);

  return (
    <div
      ref={ref}
      popover="auto"
      data-testid="table-popover"
      className="fixed m-0 rounded-xl border border-orange-200 dark:border-orange-800/50 bg-white dark:bg-gray-900 shadow-xl p-3 space-y-2 w-60"
    >
      <div className="flex items-baseline justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-1.5">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
          {table.tableName}
        </p>
        <span className="text-xs text-gray-400 shrink-0">
          {table.done}/{table.total} ly
        </span>
      </div>

      <div className="space-y-1.5">
        {table.items.map((it) =>
          Array.from({ length: it.quantity }, (_, u) => {
            const ticked = u < it.preparedQuantity;
            return (
              <button
                key={`${it.itemId}-${u}`}
                onClick={() =>
                  onToggleUnit({
                    orderId: table.orderId,
                    itemId: it.itemId,
                    unitIndex: u,
                    quantity: it.quantity,
                    tableName: table.tableName,
                    note: it.note,
                    ticked,
                  })
                }
                aria-pressed={ticked}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span
                  className={`flex size-3.5 shrink-0 items-center justify-center rounded-sm border text-[9px] leading-none
                    ${ticked ? "border-green-500 bg-green-500 text-white" : "border-gray-400 dark:border-gray-600"}`}
                >
                  {ticked ? "✓" : ""}
                </span>
                <span className="truncate text-gray-700 dark:text-gray-300">
                  {it.productName}
                  {it.quantity > 1 && (
                    <span className="text-gray-400"> ({u + 1})</span>
                  )}
                </span>
                {it.note && (
                  <span className="ml-auto shrink-0 text-brand-500 dark:text-brand-400 text-[10px]">
                    📝 {it.note}
                  </span>
                )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
};
