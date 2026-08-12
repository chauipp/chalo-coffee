// src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.tsx
import { OrderDto } from "@/services/order/order.types";
import { STATUS_META } from "./status-meta";

export const OrderCard = ({
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
      className="w-full text-left rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
    >
      {/* header */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div>
          <p className="text-xs text-stone-400 dark:text-stone-500 font-mono">
            Đơn #{order.id.slice(-6).toUpperCase()}
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
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
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              ✓ Đã thanh toán
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
              Chưa thanh toán
            </span>
          )}
        </div>
      </div>

      {/* items summary */}
      <div className="space-y-1 mb-3">
        {order.items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <span className="text-sm text-stone-700 dark:text-stone-300 truncate pr-4">
              {item.productName}
              <span className="text-stone-400">x{item.quantity}</span>
              {(item.selectedModifiers?.length ?? 0) > 0 && <span className="block text-xs text-brand-600 dark:text-brand-300">{item.selectedModifiers!.map((modifier) => `${modifier.groupName}: ${modifier.optionName}`).join(" · ")}</span>}
            </span>
            <span className="text-sm font-medium text-stone-900 dark:text-stone-100 shrink-0">
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

      {/* footer */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
        <span className="text-sm text-stone-500 dark:text-stone-400">
          Tổng: {order.items.reduce((sum, i) => sum + i.quantity, 0)} món
        </span>
        <span className="text-base font-bold text-brand-600 dark:text-brand-400">
          {order.totalAmount.toLocaleString("vi-VN")}đ
        </span>
      </div>

      {/* arrow indicator */}
      <div className="flex justify-end mt-2">
        <span className="text-xs text-stone-400 dark:text-stone-600">
          Xem chi tiết →
        </span>
      </div>
    </button>
  );
};
