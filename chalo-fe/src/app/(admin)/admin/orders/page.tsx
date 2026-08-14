"use client";

import { API, QUERY_KEYS } from "@/constants";
import { useSSE } from "@/hooks/useSSE";
import { OrderOperationsBoard } from "@/components/orders/operations/OrderOperationsBoard";
import { useGetActiveOrder, useUpdateOrderStatus } from "@/services/order/order.queries";
import { OrderStatus } from "@/services/order/order.types";
import { useAuthStore } from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { AdminMobilePageHeader } from "../../_components/AdminMobilePageHeader";
import AdminOrdersHistory from "./_components/AdminOrdersHistory";
import { AdminOrdersModeSwitch } from "./_components/AdminOrdersModeSwitch";
import { AdminOrdersOperationsLayout } from "./_components/AdminOrdersOperationsLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

function AdminOrdersOperations() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);
  const { data: orders, isLoading, refetch } = useGetActiveOrder();
  const mutation = useUpdateOrderStatus();
  useSSE({
    url: `${API_BASE}${API.SSE.ORDER_EVENTS}`,
    token,
    enabled: !!token,
    onConnectionChange: () => undefined,
    onEvent: (type) => {
      if (["new_order", "payment_completed", "order_status_changed", "order_prep_progress"].includes(type)) {
        void qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
        void qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
      }
      if (type === "payment_request" || type === "payment_request_batch") {
        void qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
      }
    },
    reconnectDelay: 3000,
  });
  const update = (orderId: string, status: OrderStatus) => mutation.mutateAsync({ orderId, status }).then(() => undefined);
  return <OrderOperationsBoard orders={orders} isLoading={isLoading} isLive={!!token} onRefresh={() => { void refetch(); }} onStatusChange={update} detailHref={(id) => `/admin/orders/orders/${id}`} />;
}

export default function AdminOrdersPage() {
  const params = useSearchParams();
  const isHistory = params.get("view") === "history";
  return (
    <div className="space-y-4">
      <div className="px-4 pt-4 sm:px-6">
        <AdminMobilePageHeader title="Đơn hàng" description={isHistory ? "Lịch sử đơn hàng" : "Bảng vận hành realtime"} />
        <div className="mt-3"><AdminOrdersModeSwitch /></div>
      </div>
      {isHistory ? <AdminOrdersHistory /> : <AdminOrdersOperationsLayout board={<AdminOrdersOperations />} />}
    </div>
  );
}
