// src/app/(customer)/menu/[tableToken]/orders/[orderId]/page.tsx
"use client";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { useCustomerOrderEvents } from "@/hooks/useCustomerOrderEvents";
import {
  useGetOrderByToken,
  usePayOrder,
} from "@/services/order/order.queries";
import { OrderStatus } from "@/services/order/order.types";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { OrderDetailViewCinematic } from "./_components/OrderDetailView.Cinematic";
import { PayConfirmModal } from "./_components/PayConfirmModal";

// CONFIRMED là trạng thái di sản (BE không còn chuyển PENDING → CONFIRMED),
// nên gộp chung một bước với PENDING — tránh 2 bước trùng nhãn trong stepper.
const SERVICE_STEPS: { statuses: OrderStatus[]; label: string; emoji: string }[] = [
  { statuses: ["PENDING", "CONFIRMED"], label: "Đã tiếp nhận", emoji: "📋" },
  { statuses: ["PREPARING"], label: "Đang pha chế", emoji: "☕" },
  { statuses: ["READY"], label: "Sẵn sàng phục vụ", emoji: "🔔" },
  { statuses: ["COMPLETED"], label: "Đã phục vụ", emoji: "🎁" },
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
  useCustomerOrderEvents(tableToken);

  const payOrderMutation = usePayOrder(tableToken);

  if (isLoading)
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <SpinnerIcon className="size-8 animate-spin text-brand-400" />
      </div>
    );

  if (!order)
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4 text-center">
        <div>
          <div className="size-20 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-4xl mx-auto mb-4">
            ✅
          </div>
          <p className="text-lg font-bold text-stone-900 dark:text-white mb-2">
            Đơn không còn hoạt động
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-8">
            Đơn này có thể đã được phục vụ và thanh toán xong.
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

  const currentStepIndex = SERVICE_STEPS.findIndex((s) =>
    s.statuses.includes(order.status),
  );

  const canPay = !isPaid && !isCancelled;

  const handlePay = async () => {
    await payOrderMutation.mutateAsync({ orderId: order.id, tableToken });
    setShowPayConfirm(false);
  };

  const viewProps = {
    order,
    isCancelled,
    isServed,
    isPaid,
    canPay,
    currentStepIndex,
    steps: SERVICE_STEPS,
    onPayClick: () => setShowPayConfirm(true),
    onBackToOrders: () => router.push(`/menu/${tableToken}/orders`),
    onBackToMenu: () => router.push(`/menu/${tableToken}`),
  };

  return (
    <>
      {showPayConfirm && (
        <PayConfirmModal
          isPending={payOrderMutation.isPending}
          onCancel={() => setShowPayConfirm(false)}
          onConfirm={handlePay}
          total={order.totalAmount}
          addInfo={`CHALO ${order.tableName ?? ""} DON ${order.id.slice(-6)}`}
        />
      )}
      <OrderDetailViewCinematic {...viewProps} />
    </>
  );
}
