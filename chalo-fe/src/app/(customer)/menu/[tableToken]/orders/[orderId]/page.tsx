// src/app/(customer)/menu/[tableToken]/orders/[orderId]/page.tsx
"use client";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { useCustomerOrderEvents } from "@/hooks/useCustomerOrderEvents";
import {
  useCheckoutStart,
  useGetOrderByToken,
} from "@/services/order/order.queries";
import { CheckoutSessionResult, OrderStatus } from "@/services/order/order.types";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { OrderDetailViewCinematic } from "./_components/OrderDetailView.Cinematic";
import { PaySessionModal } from "./_components/PaySessionModal";

// CONFIRMED là trạng thái di sản (BE không còn chuyển PENDING → CONFIRMED),
// nên gộp chung một bước với PENDING — tránh 2 bước trùng nhãn trong stepper.
const SERVICE_STEPS: {
  statuses: OrderStatus[];
  activeLabel: string;
  completedLabel: string;
  pendingLabel: string;
  emoji: string;
}[] = [
  {
    statuses: ["PENDING", "CONFIRMED"],
    activeLabel: "Đang tiếp nhận",
    completedLabel: "Đã tiếp nhận",
    pendingLabel: "Tiếp nhận",
    emoji: "📋",
  },
  {
    statuses: ["PREPARING"],
    activeLabel: "Đang pha chế",
    completedLabel: "Đã pha chế",
    pendingLabel: "Pha chế",
    emoji: "☕",
  },
  {
    statuses: ["READY"],
    activeLabel: "Sẵn sàng phục vụ",
    completedLabel: "Đã sẵn sàng phục vụ",
    pendingLabel: "Phục vụ",
    emoji: "🔔",
  },
  {
    statuses: ["COMPLETED"],
    activeLabel: "Đã phục vụ",
    completedLabel: "Đã phục vụ",
    pendingLabel: "Đã phục vụ",
    emoji: "🎁",
  },
];

const CURRENT_STEP_INDEX: Partial<Record<OrderStatus, number>> = {
  PENDING: 0,
  CONFIRMED: -1,
  PREPARING: 1,
  READY: 2,
  COMPLETED: 4,
};

export default function OrderTrackingPage() {
  const { tableToken, orderId } = useParams<{
    tableToken: string;
    orderId: string;
  }>();
  const router = useRouter();
  const [paySession, setPaySession] = useState<CheckoutSessionResult | null>(null);

  const { data: orders, isLoading } = useGetOrderByToken(tableToken);
  const order = orders?.find((o) => o.id === orderId);
  useCustomerOrderEvents(tableToken, {
    onPaymentCompleted: (data) => {
      if (
        paySession &&
        (data.sessionId === paySession.sessionId || data.orderIds.includes(orderId))
      ) {
        setPaySession(null);
      }
    },
  });

  const startMutation = useCheckoutStart();

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

  const currentStepIndex = CURRENT_STEP_INDEX[order.status] ?? -1;

  const canPay = !isPaid && !isCancelled;

  const handleOpenPay = async () => {
    const session = await startMutation.mutateAsync({
      tableToken,
      orderIds: [order.id],
    });
    setPaySession(session);
  };

  const viewProps = {
    order,
    isCancelled,
    isServed,
    isPaid,
    canPay,
    isStartingPayment: startMutation.isPending,
    currentStepIndex,
    steps: SERVICE_STEPS,
    onPayClick: handleOpenPay,
    onBackToOrders: () => router.push(`/menu/${tableToken}/orders`),
    onBackToMenu: () => router.push(`/menu/${tableToken}`),
  };

  return (
    <>
      {paySession && (
        <PaySessionModal
          session={paySession}
          onClose={() => setPaySession(null)}
          onRestart={handleOpenPay}
        />
      )}
      <OrderDetailViewCinematic {...viewProps} />
    </>
  );
}
