"use client";
// src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/OrderDetailView.Cinematic.tsx
import { OrderDto, OrderStatus } from "@/services/order/order.types";
import { ServiceStepperCinematic } from "./ServiceStepper.Cinematic";

interface OrderDetailViewProps {
  order: OrderDto;
  isCancelled: boolean;
  isServed: boolean;
  isPaid: boolean;
  canPay: boolean;
  currentStepIndex: number;
  steps: { statuses: OrderStatus[]; label: string; emoji: string }[];
  onPayClick: () => void;
  onBackToOrders: () => void;
  onBackToMenu: () => void;
}

export const OrderDetailViewCinematic = ({
  order,
  isCancelled,
  isServed,
  isPaid,
  canPay,
  currentStepIndex,
  steps,
  onPayClick,
  onBackToOrders,
  onBackToMenu,
}: OrderDetailViewProps) => {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-stone-200 bg-stone-50/90 px-4 py-3 backdrop-blur-xl dark:border-stone-700 dark:bg-stone-950/90">
        <button onClick={onBackToOrders} className="shrink-0 text-stone-600 dark:text-stone-300">
          ← Quay lại
        </button>
        <div className="flex-1 overflow-hidden">
          <h1 className="truncate font-semibold text-base text-stone-900 dark:text-stone-50">
            Chi tiết đơn
          </h1>
          <p className="font-mono text-xs text-brand-500 dark:text-brand-300/50">
            #{order.id.slice(-6).toUpperCase()} · {order.tableName}
          </p>
        </div>
        <div className="shrink-0">
          {isPaid ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400 sm:text-xs">
              ✓ Đã thanh toán
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400 sm:text-xs">
              Chưa thanh toán
            </span>
          )}
        </div>
      </header>

      <main className="space-y-5 p-4 pb-52">
        {isCancelled && (
          <div className="flex flex-col items-center rounded-2xl bg-red-50 p-5 text-center dark:bg-red-900/10">
            <span className="mb-2 text-3xl">❌</span>
            <p className="text-base font-bold text-red-700 dark:text-red-400">
              Đơn hàng đã bị huỷ
            </p>
            <p className="mt-1 text-sm text-red-600/80 dark:text-red-400/80">
              Vui lòng liên hệ nhân viên nếu có thắc mắc.
            </p>
          </div>
        )}

        {isPaid && isServed && !isCancelled && (
          <div className="flex items-center gap-4 rounded-2xl bg-green-50 p-5 dark:bg-green-900/10">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-2xl dark:bg-green-800/50">
              🎉
            </div>
            <div>
              <p className="text-base font-semibold text-green-800 dark:text-green-400">
                Hoàn tất tuyệt vời!
              </p>
              <p className="mt-0.5 text-sm text-green-600 dark:text-green-500/80">
                Cảm ơn bạn đã thưởng thức tại quán.
              </p>
            </div>
          </div>
        )}

        {order.estimateWaitMinutes !== null && order.estimateWaitMinutes > 0 && !isServed && !isCancelled && (
          <div className="flex items-center gap-3 rounded-2xl bg-brand-100/60 p-4 dark:bg-stone-900">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-lg dark:bg-brand-900/50">
              ⏱️
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-brand-600 dark:text-brand-300/60">
                Thời gian chờ dự kiến
              </p>
              <p className="text-lg font-semibold text-brand-800 dark:text-brand-300">
                Khoảng {order.estimateWaitMinutes} phút
              </p>
            </div>
          </div>
        )}

        {!isCancelled && (
          <ServiceStepperCinematic steps={steps} currentStepIndex={currentStepIndex} isServed={isServed} />
        )}

        <div className="rounded-3xl bg-white p-5 dark:bg-stone-900">
          <h2 className="mb-4 font-semibold text-sm text-stone-900 dark:text-stone-50">
            Chi tiết món ({order.items.reduce((s, i) => s + i.quantity, 0)} món)
          </h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl dark:bg-stone-900">
                  {item.productImageUrl ? (
                    <img src={item.productImageUrl} alt={item.productName} className="size-full object-cover" />
                  ) : (
                    "☕"
                  )}
                </div>
                <div className="flex min-w-0 flex-1 justify-between">
                  <div className="pr-2">
                    <p className="truncate text-sm text-stone-900 dark:text-brand-100">
                      {item.productName}
                    </p>
                    {(item.selectedModifiers?.length ?? 0) > 0 && (
                      <p className="mt-1 text-xs text-brand-600 dark:text-brand-300">
                        {item.selectedModifiers!.map((m) => `${m.groupName}: ${m.optionName}`).join(" · ")}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-brand-600 dark:text-brand-300/60">
                      {item.price.toLocaleString("vi-VN")}đ <span className="mx-1">×</span> {item.quantity}
                    </p>
                    {item.note && (
                      <p className="mt-1 inline-block max-w-full truncate rounded bg-brand-100/60 px-2 py-0.5 text-xs text-brand-700 dark:bg-stone-800 dark:text-brand-300">
                        📝 {item.note}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm text-stone-900 dark:text-stone-50">
                    {item.subtotal.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-dashed border-brand-200 pt-4 dark:border-stone-700">
            <span className="text-sm text-brand-600 dark:text-brand-300/60">Tổng cộng</span>
            <span className="font-semibold text-xl text-brand-700 dark:text-brand-300">
              {order.totalAmount.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>

        {order.note && (
          <div className="rounded-2xl bg-sky-50/50 p-4 dark:bg-sky-900/10">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-base">📌</span>
              <p className="text-xs uppercase tracking-wider text-sky-800 dark:text-sky-500">
                Ghi chú cho quán
              </p>
            </div>
            <p className="pl-6 text-sm text-brand-800 dark:text-brand-200">{order.note}</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 space-y-3 border-t border-stone-200 bg-stone-50/95 px-4 py-4 backdrop-blur-xl dark:border-stone-700 dark:bg-stone-950/95">
        {canPay && (
          <button
            onClick={onPayClick}
            className="w-full rounded-full bg-green-700 py-4 text-base font-semibold text-brand-50 dark:bg-green-700"
          >
            Thanh toán · {order.totalAmount.toLocaleString("vi-VN")}đ
          </button>
        )}
        <div className="flex gap-3">
          <button
            onClick={onBackToOrders}
            className="flex-1 rounded-2xl border border-brand-200 bg-stone-50/60 py-3.5 text-sm text-brand-700 dark:border-stone-700 dark:bg-stone-900 dark:text-brand-300"
          >
            Tất cả đơn
          </button>
          <button
            onClick={onBackToMenu}
            className="flex-1 rounded-2xl bg-brand-700 py-3.5 text-sm font-semibold text-brand-50 dark:bg-brand-300 dark:text-stone-900"
          >
            ☕ Đặt thêm
          </button>
        </div>
      </div>
    </div>
  );
};
