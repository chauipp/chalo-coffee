"use client";
import {
  useCheckoutPreview,
  useCheckoutStart,
  useCheckoutComplete,
} from "@/services/order/order.queries";
import { CheckoutSessionResult } from "@/services/order/order.types";
import { useCustomerOrderEvents } from "@/hooks/useCustomerOrderEvents";
import { useOrderThemeStore } from "@/stores/orderTheme.store";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CheckoutViewCinematic } from "./_components/CheckoutView.Cinematic";
import { CheckoutViewPlayful } from "./_components/CheckoutView.Playful";

export default function CheckoutPage() {
  const { tableToken } = useParams<{ tableToken: string }>();
  const router = useRouter();

  const { data: preview, isLoading, isError } = useCheckoutPreview(tableToken);
  useCustomerOrderEvents(tableToken);
  const startMutation = useCheckoutStart();
  const completeMutation = useCheckoutComplete(tableToken);
  const storeOrderTheme = useOrderThemeStore((s) => s.theme);
  const isOrderThemeHydrated = useOrderThemeStore((s) => s.isHydrated);
  const orderTheme = isOrderThemeHydrated ? storeOrderTheme : "playful";

  const [session, setSession] = useState<CheckoutSessionResult | null>(null);
  const [done, setDone] = useState<boolean>(false);

  const handleStart = async () => {
    const s = await startMutation.mutateAsync({ tableToken });
    setSession(s);
  };

  const handleComplete = async () => {
    if (!session) return;
    await completeMutation.mutateAsync({
      sessionId: session.sessionId,
      tableToken: session.tableToken,
      clientSecret: session.clientSecret,
    });
    setSession(null);
    setDone(true);
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
    onConfirmPaid: handleComplete,
    isConfirming: completeMutation.isPending,
    onRestartSession: () => setSession(null),
    tableName: preview?.tableName,
    onGoToOrders: () => router.push(`/menu/${tableToken}/orders`),
    onGoToMenu: () => router.push(`/menu/${tableToken}`),
  };

  return orderTheme === "cinematic" ? (
    <CheckoutViewCinematic {...viewProps} />
  ) : (
    <CheckoutViewPlayful {...viewProps} />
  );
}
