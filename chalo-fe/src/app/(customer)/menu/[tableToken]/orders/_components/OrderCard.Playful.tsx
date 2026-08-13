// src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.Playful.tsx
import { OrderDto } from "@/services/order/order.types";
import { STATUS_META } from "./status-meta";

export const OrderCardPlayful = ({
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
      className="w-full rounded-2xl border-2 border-stone-900 bg-white p-4 text-left shadow-[3px_3px_0_var(--color-stone-900)] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-brand-50 dark:bg-carnival-raised dark:shadow-[3px_3px_0_var(--color-pop-600)]"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-stone-400 dark:text-stone-500">
            Đơn #{order.id.slice(-6).toUpperCase()}
          </p>
          <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
            {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full border-2 border-stone-900 px-2.5 py-0.5 text-xs font-bold dark:border-brand-50 ${meta.bgColor} ${meta.textColor}`}
          >
            <span>{meta.emoji}</span>
            {meta.label}
          </span>
          {order.paidStatus ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
              ✓ Đã thanh toán
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400">
              Chưa thanh toán
            </span>
          )}
        </div>
      </div>

      <div className="mb-3 space-y-1">
        {order.items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <span className="truncate pr-4 text-sm text-stone-700 dark:text-stone-300">
              {item.productName}
              <span className="text-stone-400">x{item.quantity}</span>
              {(item.selectedModifiers?.length ?? 0) > 0 && (
                <span className="block text-xs text-pop-700 dark:text-pop-400">
                  {item.selectedModifiers!
                    .map((m) => `${m.groupName}: ${m.optionName}`)
                    .join(" · ")}
                </span>
              )}
            </span>
            <span className="shrink-0 text-sm font-bold text-stone-900 dark:text-brand-50">
              {item.subtotal.toLocaleString("vi-VN")}đ
            </span>
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="text-xs text-stone-400 dark:text-stone-500">
            +{order.items.length - 3} món khác ...
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t-2 border-stone-900 pt-3 dark:border-brand-50">
        <span className="text-sm text-stone-500 dark:text-stone-400">
          Tổng: {order.items.reduce((sum, i) => sum + i.quantity, 0)} món
        </span>
        <span className="text-base font-black text-pop-700 dark:text-pop-400">
          {order.totalAmount.toLocaleString("vi-VN")}đ
        </span>
      </div>

      <div className="mt-2 flex justify-end">
        <span className="text-xs font-bold text-stone-400 dark:text-stone-600">
          Xem chi tiết →
        </span>
      </div>
    </button>
  );
};
