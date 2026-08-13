// src/app/(customer)/menu/[tableToken]/orders/page.tsx
"use client";
import { useCustomerOrderEvents } from "@/hooks/useCustomerOrderEvents";
import { useGetOrderByToken } from "@/services/order/order.queries";
import { useOrderThemeStore } from "@/stores/orderTheme.store";
import { useParams, useRouter } from "next/navigation";
import { OrdersListViewCinematic } from "./_components/OrdersListView.Cinematic";
import { OrdersListViewPlayful } from "./_components/OrdersListView.Playful";

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
  const storeOrderTheme = useOrderThemeStore((s) => s.theme);
  const isOrderThemeHydrated = useOrderThemeStore((s) => s.isHydrated);
  const orderTheme = isOrderThemeHydrated ? storeOrderTheme : "playful";

  const unpaidOrders = orders?.filter((o) => !o.paidStatus) ?? [];
  const unpaidTotal = unpaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalAllItems = orders
    ?.flatMap((o) => o.items)
    .reduce((sum, i) => sum + i.quantity, 0);

  const viewProps = {
    orders,
    isLoading,
    isError,
    onRetry: () => refetch(),
    totalAllItems,
    unpaidOrders,
    unpaidTotal,
    onOrderClick: (orderId: string) => router.push(`/menu/${tableToken}/orders/${orderId}`),
    onGoToMenu: () => router.push(`/menu/${tableToken}`),
    onCheckout: () => router.push(`/menu/${tableToken}/checkout`),
  };

  return orderTheme === "cinematic" ? (
    <OrdersListViewCinematic {...viewProps} />
  ) : (
    <OrdersListViewPlayful {...viewProps} />
  );
}
