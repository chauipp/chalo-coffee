"use client";

import { OrderOperationsBoard } from "@/components/orders/operations/OrderOperationsBoard";
import { API, QUERY_KEYS } from "@/constants";
import { SSEPayload, useSSE } from "@/hooks/useSSE";
import { useGetActiveOrder, useUpdateOrderStatus } from "@/services/order/order.queries";
import { OrderStatus } from "@/services/order/order.types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

const playBeep = (frequency = 880) => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.3, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.5);
  } catch {}
};

export default function StaffOrdersPage() {
  const queryClient = useQueryClient();
  const previousPendingCount = useRef(0);
  const [isLive, setIsLive] = useState(false);
  const { data: orders, isLoading, refetch } = useGetActiveOrder();
  const updateStatus = useUpdateOrderStatus();

  useSSE({
    url: `${API_BASE}${API.SSE.ORDER_EVENTS}`,
    onConnectionChange: setIsLive,
    onEvent: (type, data) => {
      switch (type) {
        case "new_order":
        case "order_status_changed":
        case "order_prep_progress":
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
          break;
        case "payment_completed": {
          const payment = data as SSEPayload["payment_completed"];
          if (payment.source === "sepay") {
            playBeep(880);
            toast.success(`Đã nhận chuyển khoản ${payment.totalAmount.toLocaleString("vi-VN")}đ — trạm in đang xử lý`, { duration: 8_000 });
          }
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
          break;
        }
        case "payment_review_needed": {
          const review = data as SSEPayload["payment_review_needed"];
          playBeep(440);
          toast.error(`Chuyển khoản cần đối soát: ${review.reason} — ${review.transferAmount.toLocaleString("vi-VN")}đ`, { duration: 15_000 });
          break;
        }
        case "payment_request": {
          const payment = data as SSEPayload["payment_request"];
          playBeep(660);
          toast.info(`Bàn ${payment.tableName ?? ""} yêu cầu thanh toán`, { duration: 8_000 });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
          break;
        }
        case "payment_request_batch": {
          const payment = data as SSEPayload["payment_request_batch"];
          playBeep(660);
          toast.info(`Bàn ${payment.tableName ?? ""} yêu cầu thanh toán gộp (${payment.totalAmount.toLocaleString("vi-VN")}đ)`, { duration: 8_000 });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
          break;
        }
        case "staff_call": {
          const call = data as SSEPayload["staff_call"];
          playBeep(520);
          toast.warning(`Bàn ${call.tableName ?? ""} đang gọi nhân viên${call.reason ? `: ${call.reason}` : ""}`, { duration: 10_000 });
          break;
        }
      }
    },
  });

  const pendingCount = (orders ?? []).filter((order) => order.status === "PENDING" || order.status === "CONFIRMED").length;
  useEffect(() => {
    if (pendingCount > previousPendingCount.current && previousPendingCount.current > 0) {
      playBeep();
      toast.info("Có đơn hàng mới!", { duration: 4_000 });
    }
    previousPendingCount.current = pendingCount;
  }, [pendingCount]);

  return (
    <OrderOperationsBoard
      orders={orders}
      isLoading={isLoading}
      isLive={isLive}
      onRefresh={() => { void refetch(); }}
      onStatusChange={(orderId: string, status: OrderStatus) => updateStatus.mutateAsync({ orderId, status })}
      detailHref={(id) => `/staff/orders/orders/${id}`}
    />
  );
}
