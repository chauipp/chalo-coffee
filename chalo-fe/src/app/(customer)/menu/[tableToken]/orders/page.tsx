// src/app/(customer)/menu/[tableToken]/orders/page.tsx
"use client";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { useCustomerOrderEvents } from "@/hooks/useCustomerOrderEvents";
import { useGetOrderByToken } from "@/services/order/order.queries";
import { useParams, useRouter } from "next/navigation";
import { OrderCard } from "./_components/OrderCard";

export default function OrdersPage() {
  const { tableToken } = useParams<{ tableToken: string }>();
  const router = useRouter();

  const {
    data: orders,
    isLoading,
    isError,
    refetch,
  } = useGetOrderByToken(tableToken);
  useCustomerOrderEvents(tableToken);

  const unpaidOrders = orders?.filter((o) => !o.paidStatus) ?? [];
  const unpaidTotal = unpaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalAllItems = orders
    ?.flatMap((o) => o.items)
    .reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button
            onClick={() => router.push(`/menu/${tableToken}`)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            ← Quay lại
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900 dark:text-white">
              Đơn hàng của bàn
            </h1>
            {orders && orders.length > 1 && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {orders.length} lần đặt · {totalAllItems} món
              </p>
            )}
          </div>
        </header>

        {/* content */}
        <main className="p-4 space-y-4 pb-32">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <SpinnerIcon className="size-8 animate-spin text-brand-400" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400 dark:text-gray-500">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Không tải được danh sách đơn
              </p>
              <button
                onClick={() => refetch()}
                className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400 dark:text-gray-500">
              <div className="size-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <span className="text-4xl">📋</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Chưa có đơn hàng nào
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                  Hãy chọn món từ thực đơn để bắt đầu
                </p>
              </div>
              <button
                onClick={() => router.push(`/menu/${tableToken}`)}
                className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
              >
                Xem thực đơn
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {orders.map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    onClick={() =>
                      router.push(`/menu/${tableToken}/orders/${o.id}`)
                    }
                  />
                ))}
              </div>

              {orders.length > 1 && (
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 shadow-sm space-y-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Tổng kết
                  </p>
                  {/* Tổng tất cả */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Tổng tất cả ({orders.length} đơn)
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {orders
                        .reduce((s, o) => s + o.totalAmount, 0)
                        .toLocaleString("vi-VN")}
                      đ
                    </span>
                  </div>

                  {/* Đã thanh toán */}
                  {orders.some((o) => o.paidStatus) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 dark:text-green-400">
                        Đã thanh toán{" "}
                        {orders.filter((o) => o.paidStatus).length} đơn
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        -{" "}
                        {orders
                          .filter((o) => o.paidStatus)
                          .reduce((s, o) => s + o.totalAmount, 0)
                          .toLocaleString("vi-VN")}
                        đ
                      </span>
                    </div>
                  )}

                  {/* Còn lại cần trả */}
                  <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Còn cần thanh toán
                    </span>
                    <span className="text-base font-bold text-brand-600 dark:text-brand-400">
                      {" "}
                      {unpaidTotal.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* bottom CTA */}
        <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 space-y-2.5 border-t border-gray-100 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
          {unpaidOrders.length > 0 && (
            <button
              onClick={() => router.push(`/menu/${tableToken}/checkout`)}
              className="w-full rounded-2xl bg-green-500 py-3.5 text-base font-semibold text-white hover:bg-green-600 active:scale-[0.98] transition-all shadow-sm"
            >
              Thanh toán tất cả · {unpaidTotal.toLocaleString("vi-VN")}đ
            </button>
          )}
          <button
            onClick={() => router.push(`/menu/${tableToken}`)}
            className="w-full rounded-2xl bg-brand-500 dark:bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-600 dark:hover:bg-brand-500 active:scale-[0.98] transition-all"
          >
            ☕ Đặt thêm món
          </button>
        </div>
      </div>
    </>
  );
}
