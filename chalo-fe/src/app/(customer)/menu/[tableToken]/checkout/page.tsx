"use client";
import {
  useCheckoutPreview,
  useCheckoutStart,
} from "@/services/order/order.queries";
import { CheckoutSessionResult } from "@/services/order/order.types";
import { useCustomerOrderEvents } from "@/hooks/useCustomerOrderEvents";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CheckoutViewCinematic } from "./_components/CheckoutView.Cinematic";

export default function CheckoutPage() {
  const { tableToken } = useParams<{ tableToken: string }>();
  const router = useRouter();

  const { data: preview, isLoading, isError } = useCheckoutPreview(tableToken);
  const startMutation = useCheckoutStart();

  const [session, setSession] = useState<CheckoutSessionResult | null>(null);
  const [done, setDone] = useState<boolean>(false);

  useCustomerOrderEvents(tableToken, {
    onPaymentCompleted: (data) => {
      // Chỉ chuyển màn khi đúng phiên đang mở (tránh nhầm khi bàn có nguồn thanh toán khác)
      if (session && data.sessionId === session.sessionId) {
        setSession(null);
        setDone(true);
      }
    },
  });

  const handleStart = async () => {
    const s = await startMutation.mutateAsync({ tableToken });
    setSession(s);
  };

  const step = done
    ? "done"
    : isLoading
      ? "loading"
      : isError || !preview || preview.orders.length === 0
        ? "empty"
        : session
          ? "session"
          : "review";

  const viewProps = {
    step: step as "review" | "session" | "done" | "loading" | "empty",
    orders: preview?.orders ?? [],
    totalAmount: preview?.totalAmount ?? 0,
    session,
    onStart: handleStart,
    isStarting: startMutation.isPending,
    onRestartSession: () => setSession(null),
    tableName: preview?.tableName,
    onGoToOrders: () => router.push(`/menu/${tableToken}/orders`),
    onGoToMenu: () => router.push(`/menu/${tableToken}`),
  };

  return <CheckoutViewCinematic {...viewProps} />;
}
