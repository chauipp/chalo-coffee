// src/app/(customer)/menu/[tableToken]/orders/[orderId]/page.tsx
"use client";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import {
  useGetOrderByToken,
  usePayOrder,
} from "@/services/order/order.queries";
import { OrderStatus } from "@/services/order/order.types";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PayConfirmModal } from "./_components/PayConfirmModal";

const SERVICE_STEPS: { status: OrderStatus; label: string; emoji: string }[] = [
  { status: "PENDING", label: "Chờ xác nhận", emoji: "📋" },
  { status: "CONFIRMED", label: "Đã xác nhận", emoji: "✅" },
  { status: "PREPARING", label: "Đang pha chế", emoji: "☕" },
  { status: "READY", label: "Sẵn sàng phục vụ", emoji: "🔔" },
  { status: "COMPLETED", label: "Đã phục vụ", emoji: "🎁" },
];

export default function OrderTrackingPage() {
  const { tableToken, orderId } = useParams<{
    tableToken: string;
    orderId: string;
  }>();
  const router = useRouter();
  const [showPayConfirm, setShowPayConfirm] = useState<boolean>(false);

  const { data: orders, isLoading } = useGetOrderByToken(tableToken);
  const order = orders?.find((o) => o.id === orderId);

  const payOrderMutation = usePayOrder(tableToken);

  if (isLoading)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <SpinnerIcon className="size-8 animate-spin text-brand-400" />
      </div>
    );

  if (!order)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 text-center">
        <div>
          <div className="size-20 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-4xl mx-auto mb-4">
            ✅
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Đơn hàng đã hoàn tất
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Đơn đã được phục vụ và thanh toán xong.
          </p>
          <button
            onClick={() => router.push(`/menu/${tableToken}/orders`)}
            className="rounded-2xl bg-brand-500 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-sm"
          >
            Xem tất cả đơn
          </button>
        </div>
      </div>
    );

  const isCancelled = order.status === "CANCELLED";
  const isServed = order.status === "COMPLETED";
  const isPaid = order.paidStatus;

  const currentStepIndex = SERVICE_STEPS.findIndex(
    (s) => s.status === order.status,
  );

  const canPay = !isPaid && !isCancelled;

  const handlePay = async () => {
    await payOrderMutation.mutateAsync({ orderId: order.id });
    setShowPayConfirm(false);
  };

  return (
    <>
      {showPayConfirm && (
        <PayConfirmModal
          isPending={payOrderMutation.isPending}
          onCancel={() => setShowPayConfirm(false)}
          onConfirm={handlePay}
          total={order.totalAmount}
        />
      )}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Header (Sticky) */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button
            onClick={() => router.push(`/menu/${tableToken}/orders`)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors shrink-0"
          >
            ← Quay lại
          </button>
          <div className="flex-1 overflow-hidden">
            <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
              Chi tiết đơn
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
              #{order.id.slice(-6).toUpperCase()} · {order.tableName}
            </p>
          </div>
          <div className="shrink-0">
            {isPaid ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-green-700 dark:text-green-400">
                ✓ Đã thanh toán
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/20 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-red-600 dark:text-red-400">
                Chưa thanh toán
              </span>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 space-y-5 pb-52">
          {" "}
          {/* pb-52 chừa chỗ cho Dock */}
          {/* Banner huỷ */}
          {isCancelled && (
            <div className="rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-5 flex flex-col items-center text-center">
              <span className="text-3xl mb-2">❌</span>
              <p className="text-base font-bold text-red-700 dark:text-red-400">
                Đơn hàng đã bị huỷ
              </p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                Vui lòng liên hệ nhân viên nếu có thắc mắc.
              </p>
            </div>
          )}
          {/* Banner Hoàn tất & Thanh toán */}
          {isPaid && isServed && !isCancelled && (
            <div className="rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 p-5 flex items-center gap-4 shadow-sm">
              <div className="size-12 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center text-2xl shrink-0">
                🎉
              </div>
              <div>
                <p className="text-base font-bold text-green-800 dark:text-green-400">
                  Hoàn tất tuyệt vời!
                </p>
                <p className="text-sm text-green-600 dark:text-green-500/80 mt-0.5">
                  Cảm ơn bạn đã thưởng thức tại quán.
                </p>
              </div>
            </div>
          )}
          {/* Banner Thời gian chờ (Nổi bật hơn) */}
          {order.estimateWaitMinutes !== null &&
            order.estimateWaitMinutes > 0 &&
            !isServed &&
            !isCancelled && (
              <div className="rounded-2xl bg-linear-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-100 dark:border-orange-900/30 p-4 flex items-center gap-3 shadow-sm">
                <div className="size-10 rounded-full bg-white dark:bg-orange-900/50 flex items-center justify-center text-lg shadow-sm shrink-0">
                  ⏱️
                </div>
                <div>
                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-500 uppercase tracking-wider">
                    Thời gian chờ dự kiến
                  </p>
                  <p className="text-lg font-bold text-orange-800 dark:text-orange-400">
                    Khoảng {order.estimateWaitMinutes} phút
                  </p>
                </div>
              </div>
            )}
          {/* Stepper Phục vụ */}
          {!isCancelled && (
            <div className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-5">
                Tiến trình phục vụ
              </h2>
              <div className="relative pl-2">
                <div className="absolute left-[1.35rem] top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800" />
                <div className="space-y-6">
                  {SERVICE_STEPS.map((step) => {
                    const stepIdx = SERVICE_STEPS.findIndex(
                      (s) => s.status === step.status,
                    );
                    const isDone = currentStepIndex > stepIdx;
                    const isCurrent = currentStepIndex === stepIdx;

                    return (
                      <div
                        key={step.status}
                        className="relative flex items-start gap-4"
                      >
                        <div
                          className={`relative z-10 flex size-8 mt-[-2px] shrink-0 items-center justify-center rounded-full text-sm transition-all duration-300
                            ${
                              isDone
                                ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                                : isCurrent
                                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/40 ring-4 ring-brand-100 dark:ring-brand-900/30"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                            }`}
                        >
                          {isDone ? "✓" : step.emoji}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-bold
                              ${
                                isCurrent
                                  ? "text-brand-600 dark:text-brand-400"
                                  : isDone
                                    ? "text-gray-900 dark:text-gray-200"
                                    : "text-gray-400 dark:text-gray-600"
                              }`}
                          >
                            {step.label}
                          </p>
                          {isCurrent && !isServed && (
                            <p className="text-xs font-medium text-brand-500/80 dark:text-brand-400/80 mt-1 animate-pulse">
                              Đang tiến hành...
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {/* Chi tiết đơn hàng */}
          <div className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
              Chi tiết món ({order.items.reduce((s, i) => s + i.quantity, 0)}{" "}
              món)
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="size-14 rounded-2xl bg-gray-50 dark:bg-gray-800 shrink-0 flex items-center justify-center text-2xl overflow-hidden border border-gray-100 dark:border-gray-700/50">
                    {item.productImageUrl ? (
                      <img
                        src={item.productImageUrl}
                        alt={item.productName}
                        className="size-full object-cover"
                      />
                    ) : (
                      "☕"
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex justify-between">
                    <div className="pr-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.price.toLocaleString("vi-VN")}đ{" "}
                        <span className="mx-1">×</span> {item.quantity}
                      </p>
                      {item.note && (
                        <p className="text-xs text-brand-600 dark:text-brand-400 mt-1 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded inline-block truncate max-w-full">
                          📝 {item.note}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 shrink-0">
                      {item.subtotal.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Tổng cộng
              </span>
              <span className="text-xl font-black text-brand-600 dark:text-brand-400">
                {order.totalAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>
          {/* Ghi chú chung */}
          {order.note && (
            <div className="rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/30 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">📌</span>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wider">
                  Ghi chú cho quán
                </p>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 pl-6">
                {order.note}
              </p>
            </div>
          )}
        </main>

        {/* Cụm Action Bottom (Sticky Dock) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 px-4 py-4 z-30 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] space-y-3">
          {/* Nút Thanh toán (Nổi bật nhất) */}
          {canPay && (
            <button
              onClick={() => setShowPayConfirm(true)}
              className="w-full rounded-2xl bg-green-500 py-4 text-base font-bold text-white hover:bg-green-600 active:scale-[0.98] transition-all shadow-lg shadow-green-500/20"
            >
              Thanh toán · {order.totalAmount.toLocaleString("vi-VN")}đ
            </button>
          )}

          {/* Nút Điều hướng */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/menu/${tableToken}/orders`)}
              className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-[0.98] transition-colors"
            >
              Tất cả đơn
            </button>
            <button
              onClick={() => router.push(`/menu/${tableToken}`)}
              className="flex-1 rounded-2xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/30 py-3.5 text-sm font-bold hover:bg-brand-100 dark:hover:bg-brand-900/40 active:scale-[0.98] transition-colors"
            >
              ☕ Đặt thêm
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
