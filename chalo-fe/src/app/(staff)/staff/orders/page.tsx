"use client";
import { API, QUERY_KEYS } from "@/constants";
import { SSEPayload, useSSE } from "@/hooks/useSSE";
import { useGetActiveOrder, useUpdateOrderStatus } from "@/services/order/order.queries";
import { OrderStatus } from "@/services/order/order.types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { OrderOperationsBoard } from "@/components/orders/operations/OrderOperationsBoard";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";
const playBeep = (frequency = 880) => { try { const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; const c = new C(); const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = frequency; g.gain.setValueAtTime(.3, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .5); o.start(); o.stop(c.currentTime + .5); } catch {} };
export default function StaffOrdersPage() {
  const qc = useQueryClient(); const prev = useRef(0); const [live, setLive] = useState(false); const { data: orders, isLoading, refetch } = useGetActiveOrder(); const mutation = useUpdateOrderStatus();
  useSSE({ url: `${API_BASE}${API.SSE.ORDER_EVENTS}`, onConnectionChange: setLive, onEvent: (type, data) => {
    switch (type) {
      case "new_order": case "payment_completed": case "order_status_changed": case "order_prep_progress":
        qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE }); qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL }); break;
      case "payment_request": { const p = data as SSEPayload["payment_request"]; playBeep(660); toast.info(`Bàn ${p.tableName ?? ""} yêu cầu thanh toán`, { duration: 8000 }); qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL }); break; }
      case "payment_request_batch": { const p = data as SSEPayload["payment_request_batch"]; playBeep(660); toast.info(`Bàn ${p.tableName ?? ""} yêu cầu thanh toán gộp (${p.totalAmount.toLocaleString("vi-VN")}đ)`, { duration: 8000 }); qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL }); break; }
      case "staff_call": { const p = data as SSEPayload["staff_call"]; playBeep(520); toast.warning(`Bàn ${p.tableName ?? ""} đang gọi nhân viên${p.reason ? `: ${p.reason}` : ""}`, { duration: 10000 }); break; }
    }
  }, enabled: true, reconnectDelay: 3000 });
  const pending = (orders ?? []).filter((o) => o.status === "PENDING" || o.status === "CONFIRMED").length;
  useEffect(() => { if (pending > prev.current && prev.current > 0) { playBeep(); toast.info("🔔 Có đơn hàng mới!", { duration: 4000 }); } prev.current = pending; }, [pending]);
  const update = (id: string, status: OrderStatus) => mutation.mutateAsync({ orderId: id, status });
  return <OrderOperationsBoard orders={orders} isLoading={isLoading} isLive={live} onRefresh={() => { void refetch(); }} onStatusChange={update} detailHref={(id) => `/staff/orders/orders/${id}`} />;
}
