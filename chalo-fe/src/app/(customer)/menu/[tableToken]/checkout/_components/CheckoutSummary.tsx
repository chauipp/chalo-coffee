// src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutSummary.tsx
import { OrderDto } from "@/services/order/order.types";

export const CheckoutSummary = ({
  orders,
  totalAmount,
}: {
  orders: OrderDto[];
  totalAmount: number;
}) => {
  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-4 shadow-sm space-y-3">
      <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
        {orders.length} đơn sẽ được thanh toán
      </p>
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-mono text-stone-400 dark:text-stone-500">
                Đơn #{o.id.slice(-6).toUpperCase()}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {o.items.reduce((s, i) => s + i.quantity, 0)} món
              </p>
            </div>
            <span className="text-sm font-medium text-stone-900 dark:text-stone-100 shrink-0">
              {o.totalAmount.toLocaleString("vi-VN")}đ
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
        <span className="text-sm font-semibold text-stone-900 dark:text-white">
          Tổng cần thanh toán
        </span>
        <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
          {totalAmount.toLocaleString("vi-VN")}đ
        </span>
      </div>
    </div>
  );
};
