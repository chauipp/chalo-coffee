"use client";
// src/app/(customer)/menu/[tableToken]/orders/_components/OrdersListView.Cinematic.tsx
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

export const OrdersListViewCinematic = ({
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
    <div className="min-h-screen bg-brand-50 dark:bg-stone-950">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-brand-200/60 bg-brand-50/90 px-4 py-3 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/90">
        <button onClick={onGoToMenu} className="text-brand-700 dark:text-brand-200/70">
          ← Quay lại
        </button>
        <div className="flex-1">
          <h1 className="font-serif text-base text-brand-950 dark:text-brand-50">
            Đơn hàng của bàn
          </h1>
          {orders && orders.length > 1 && (
            <p className="text-xs text-brand-500 dark:text-brand-300/50">
              {orders.length} lần đặt · {totalAllItems} món
            </p>
          )}
        </div>
      </header>

      <main className="space-y-4 p-4 pb-32">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon className="size-8 animate-spin text-brand-400" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-brand-700 dark:text-brand-200/50">
            <p className="text-sm text-brand-700 dark:text-brand-200/70">
              Không tải được danh sách đơn
            </p>
            <button
              onClick={onRetry}
              className="rounded-full bg-brand-700 px-6 py-2.5 text-sm font-medium text-brand-50 dark:bg-brand-300 dark:text-brand-950"
            >
              Thử lại
            </button>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-brand-700 dark:text-brand-200/50">
            <div className="flex size-20 items-center justify-center rounded-full bg-brand-100 dark:bg-stone-900">
              <span className="text-4xl">📋</span>
            </div>
            <div className="text-center">
              <p className="text-sm text-brand-700 dark:text-brand-200/70">
                Chưa có đơn hàng nào
              </p>
              <p className="mt-1 text-xs text-brand-500 dark:text-brand-300/40">
                Hãy chọn món từ thực đơn để bắt đầu
              </p>
            </div>
            <button
              onClick={onGoToMenu}
              className="rounded-full bg-brand-700 px-6 py-2.5 text-sm font-medium text-brand-50 dark:bg-brand-300 dark:text-brand-950"
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
              <div className="space-y-2 rounded-2xl bg-white/60 p-4 dark:bg-stone-900/60">
                <p className="text-sm text-brand-800 dark:text-brand-200">Tổng kết</p>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-600 dark:text-brand-300/60">
                    Tổng tất cả ({orders.length} đơn)
                  </span>
                  <span className="text-brand-950 dark:text-brand-50">
                    {orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString("vi-VN")}đ
                  </span>
                </div>
                {orders.some((o) => o.paidStatus) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400">
                      Đã thanh toán {orders.filter((o) => o.paidStatus).length} đơn
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      - {orders.filter((o) => o.paidStatus).reduce((s, o) => s + o.totalAmount, 0).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-brand-200/60 pt-2 dark:border-stone-800">
                  <span className="text-sm text-brand-950 dark:text-brand-50">
                    Còn cần thanh toán
                  </span>
                  <span className="font-serif text-base text-brand-700 dark:text-brand-300">
                    {unpaidTotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 space-y-2.5 border-t border-brand-200/60 bg-brand-50/95 px-4 py-4 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/95">
        {unpaidOrders.length > 0 && (
          <button
            onClick={onCheckout}
            className="w-full rounded-2xl bg-green-700 py-3.5 text-base font-semibold text-brand-50 dark:bg-green-700"
          >
            Thanh toán tất cả · {unpaidTotal.toLocaleString("vi-VN")}đ
          </button>
        )}
        <button
          onClick={onGoToMenu}
          className="w-full rounded-2xl bg-brand-700 py-3 text-sm font-semibold text-brand-50 dark:bg-brand-300 dark:text-brand-950"
        >
          ☕ Đặt thêm món
        </button>
      </div>
    </div>
  );
};
