// src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.Cinematic.tsx
import { OrderDto } from "@/services/order/order.types";
import { STATUS_META } from "./status-meta";

export const OrderCardCinematic = ({
  order,
  onClick,
}: {
  order: OrderDto;
  onClick: () => void;
}) => {
  const meta = STATUS_META[order.status];

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl bg-white/70 p-4 text-left transition-colors hover:bg-white dark:bg-stone-900/60 dark:hover:bg-stone-900"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-brand-500/70 dark:text-brand-300/50">
            Đơn #{order.id.slice(-6).toUpperCase()}
          </p>
          <p className="mt-0.5 text-xs text-brand-500/70 dark:text-brand-300/50">
            {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.bgColor} ${meta.textColor}`}
          >
            <span>{meta.emoji}</span>
            {meta.label}
          </span>
          {order.paidStatus ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              ✓ Đã thanh toán
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
              Chưa thanh toán
            </span>
          )}
        </div>
      </div>

      <div className="mb-3 space-y-1">
        {order.items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <span className="truncate pr-4 text-sm text-brand-900 dark:text-brand-100">
              {item.productName}
              <span className="text-brand-500/60">x{item.quantity}</span>
              {(item.selectedModifiers?.length ?? 0) > 0 && (
                <span className="block text-xs text-brand-600 dark:text-brand-300">
                  {item.selectedModifiers!
                    .map((m) => `${m.groupName}: ${m.optionName}`)
                    .join(" · ")}
                </span>
              )}
            </span>
            <span className="shrink-0 text-sm text-brand-950 dark:text-brand-50">
              {item.subtotal.toLocaleString("vi-VN")}đ
            </span>
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="text-xs text-brand-500/60 dark:text-brand-300/50">
            +{order.items.length - 3} món khác ...
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-brand-200/50 pt-3 dark:border-stone-800">
        <span className="text-sm text-brand-700/70 dark:text-brand-200/60">
          Tổng: {order.items.reduce((sum, i) => sum + i.quantity, 0)} món
        </span>
        <span className="font-serif text-base text-brand-700 dark:text-brand-300">
          {order.totalAmount.toLocaleString("vi-VN")}đ
        </span>
      </div>

      <div className="mt-2 flex justify-end">
        <span className="text-xs text-brand-400/70 dark:text-brand-300/40">
          Xem chi tiết →
        </span>
      </div>
    </button>
  );
};
