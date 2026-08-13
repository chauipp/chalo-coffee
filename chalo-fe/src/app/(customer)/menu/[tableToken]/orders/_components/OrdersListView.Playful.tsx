"use client";
// src/app/(customer)/menu/[tableToken]/orders/_components/OrdersListView.Playful.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { OrderDto } from "@/services/order/order.types";
import { OrderCard } from "./OrderCard";

interface OrdersListViewProps {
  orders: OrderDto[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  totalAllItems: number | undefined;
  unpaidOrders: OrderDto[];
  unpaidTotal: number;
  onOrderClick: (orderId: string) => void;
  onGoToMenu: () => void;
  onCheckout: () => void;
}

export const OrdersListViewPlayful = ({
  orders,
  isLoading,
  isError,
  onRetry,
  totalAllItems,
  unpaidOrders,
  unpaidTotal,
  onOrderClick,
  onGoToMenu,
  onCheckout,
}: OrdersListViewProps) => {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-carnival">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b-2 border-stone-900 bg-white px-4 py-3 dark:border-brand-50 dark:bg-carnival-raised">
        <button onClick={onGoToMenu} className="text-stone-500 dark:text-stone-400">
          ← Quay lại
        </button>
        <div className="flex-1">
          <h1 className="text-base font-black text-stone-900 dark:text-brand-50">
            Đơn hàng của bàn
          </h1>
          {orders && orders.length > 1 && (
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {orders.length} lần đặt · {totalAllItems} món
            </p>
          )}
        </div>
      </header>

      <main className="space-y-4 p-4 pb-32">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon className="size-8 animate-spin text-pop-500" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-stone-400 dark:text-stone-500">
            <p className="text-sm font-bold text-stone-600 dark:text-stone-400">
              Không tải được danh sách đơn
            </p>
            <button
              onClick={onRetry}
              className="rounded-full border-2 border-stone-900 bg-pop-500 px-6 py-2.5 text-sm font-bold text-white dark:border-brand-50"
            >
              Thử lại
            </button>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-stone-400 dark:text-stone-500">
            <div className="flex size-20 items-center justify-center rounded-full border-2 border-stone-900 bg-white dark:border-brand-50 dark:bg-carnival-raised">
              <span className="text-4xl">📋</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-stone-600 dark:text-stone-400">
                Chưa có đơn hàng nào
              </p>
              <p className="mt-1 text-xs text-stone-400 dark:text-stone-600">
                Hãy chọn món từ thực đơn để bắt đầu
              </p>
            </div>
            <button
              onClick={onGoToMenu}
              className="rounded-full border-2 border-stone-900 bg-pop-500 px-6 py-2.5 text-sm font-bold text-white dark:border-brand-50"
            >
              Xem thực đơn
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {orders.map((o) => (
                <OrderCard key={o.id} order={o} onClick={() => onOrderClick(o.id)} />
              ))}
            </div>

            {orders.length > 1 && (
              <div className="space-y-2 rounded-2xl border-2 border-stone-900 bg-white p-4 dark:border-brand-50 dark:bg-carnival-raised">
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                  Tổng kết
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500 dark:text-stone-400">
                    Tổng tất cả ({orders.length} đơn)
                  </span>
                  <span className="font-bold text-stone-900 dark:text-brand-50">
                    {orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString("vi-VN")}đ
                  </span>
                </div>
                {orders.some((o) => o.paidStatus) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400">
                      Đã thanh toán {orders.filter((o) => o.paidStatus).length} đơn
                    </span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      - {orders.filter((o) => o.paidStatus).reduce((s, o) => s + o.totalAmount, 0).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-stone-900 pt-2 dark:border-brand-50">
                  <span className="text-sm font-bold text-stone-900 dark:text-brand-50">
                    Còn cần thanh toán
                  </span>
                  <span className="text-base font-black text-pop-600 dark:text-pop-400">
                    {unpaidTotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 space-y-2.5 border-t-2 border-stone-900 bg-white px-4 py-4 dark:border-brand-50 dark:bg-carnival-raised">
        {unpaidOrders.length > 0 && (
          <button
            onClick={onCheckout}
            className="w-full rounded-2xl border-2 border-stone-900 bg-green-500 py-3.5 text-base font-bold text-white shadow-[3px_3px_0_var(--color-stone-900)] dark:border-brand-50"
          >
            Thanh toán tất cả · {unpaidTotal.toLocaleString("vi-VN")}đ
          </button>
        )}
        <button
          onClick={onGoToMenu}
          className="w-full rounded-2xl border-2 border-stone-900 bg-pop-500 py-3 text-sm font-bold text-white dark:border-brand-50"
        >
          ☕ Đặt thêm món
        </button>
      </div>
    </div>
  );
};
