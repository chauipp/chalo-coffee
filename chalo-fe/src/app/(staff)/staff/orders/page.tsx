"use client";
import { API, QUERY_KEYS } from "@/constants";
import { SSEPayload, useSSE } from "@/hooks/useSSE";
import { useGetActiveOrder, useUpdateOrderStatus } from "@/services/order/order.queries";
import { OrderStatus } from "@/services/order/order.types";
import { useAuthStore } from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { OrderOperationsBoard } from "@/components/orders/operations/OrderOperationsBoard";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";
const playBeep = (frequency = 880) => { try { const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; const c = new C(); const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = frequency; g.gain.setValueAtTime(.3, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .5); o.start(); o.stop(c.currentTime + .5); } catch {} };
export default function StaffOrdersPage() {
  const qc = useQueryClient(); const token = useAuthStore((s) => s.accessToken); const prev = useRef(0); const [live, setLive] = useState(false); const { data: orders, isLoading, refetch } = useGetActiveOrder(); const mutation = useUpdateOrderStatus();
  useSSE({ url: `${API_BASE}${API.SSE.ORDER_EVENTS}`, token, onConnectionChange: setLive, onEvent: (type, data) => { if (["new_order", "payment_completed", "order_status_changed", "order_prep_progress"].includes(type)) { qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE }); qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL }); } else if (type === "payment_request" || type === "payment_request_batch") { playBeep(660); const p = data as SSEPayload["payment_request"]; toast.info(`Bàn ${p.tableName ?? ""} yêu cầu thanh toán`, { duration: 8000 }); } else if (type === "staff_call") { playBeep(520); const p = data as SSEPayload["staff_call"]; toast.warning(`Bàn ${p.tableName ?? ""} đang gọi nhân viên${p.reason ? `: ${p.reason}` : ""}`, { duration: 10000 }); } }, enabled: !!token, reconnectDelay: 3000 });
  const pending = (orders ?? []).filter((o) => o.status === "PENDING" || o.status === "CONFIRMED").length; if (pending > prev.current && prev.current > 0) { playBeep(); toast.info("🔔 Có đơn hàng mới!", { duration: 4000 }); } prev.current = pending;
  const update = (id: string, status: OrderStatus) => mutation.mutateAsync({ orderId: id, status });
  return <OrderOperationsBoard orders={orders} isLoading={isLoading} isLive={live} onRefresh={() => { void refetch(); }} onStatusChange={update} detailHref={(id) => `/staff/orders/orders/${id}`} />;
}
