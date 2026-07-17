"use client";
// src/app/(staff)/_components/PrepProductCard.tsx
// Card một MÓN — nhân vật chính của khu pha chế. Trong card chia mẻ theo ghi
// chú vì ghi chú là thứ duy nhất ngăn hai ly được pha chung một lượt.
import { PrepUnit, ProductGroup } from "@/utils/prep-grouping";

export const PrepProductCard = ({
  group,
  onToggleUnit,
}: {
  group: ProductGroup;
  onToggleUnit: (unit: PrepUnit) => void;
}) => {
  const allDone = group.total > 0 && group.done === group.total;

  return (
    <div
      data-testid={`prep-product-${group.productId}`}
      className={`rounded-xl border bg-white dark:bg-gray-900 shadow-sm p-3.5 space-y-3
        ${allDone ? "border-green-300 dark:border-green-700" : "border-orange-200 dark:border-orange-800/50"}`}
    >
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
            {group.productName}
          </p>
          <span
            className={`text-xs shrink-0 ${allDone ? "text-green-600 dark:text-green-400 font-semibold" : "text-gray-400"}`}
          >
            {group.done}/{group.total} ly
          </span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${allDone ? "bg-green-500" : "bg-orange-400"}`}
            style={{
              width: group.total ? `${(group.done / group.total) * 100}%` : "0%",
            }}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        {group.batches.map((batch) => (
          <div key={batch.key}>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {batch.note ? `📝 ${batch.note}` : "Mẻ thường"}{" "}
              <span className="text-gray-400">×{batch.units.length}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {batch.units.map((u) => (
                <button
                  key={`${u.itemId}-${u.unitIndex}`}
                  onClick={() => onToggleUnit(u)}
                  aria-pressed={u.ticked}
                  aria-label={`${u.tableName} — ly ${u.unitIndex + 1}/${u.quantity} ${group.productName}`}
                  title={
                    u.quantity > 1
                      ? `${u.tableName} · ly ${u.unitIndex + 1}/${u.quantity}`
                      : u.tableName
                  }
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors select-none
                    ${
                      u.ticked
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400"
                    }`}
                >
                  <span
                    className={`flex size-3.5 items-center justify-center rounded-sm border text-[9px] leading-none
                      ${u.ticked ? "border-white/70 bg-white/20" : "border-gray-400 dark:border-gray-600"}`}
                  >
                    {u.ticked ? "✓" : ""}
                  </span>
                  {u.tableName}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
