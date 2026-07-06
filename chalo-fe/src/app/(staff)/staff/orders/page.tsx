// src/app/(staff)/staff/orders/page.tsx
"use client";
import { API, QUERY_KEYS } from "@/constants";
import { SSEPayload, useSSE } from "@/hooks/useSSE";
import {
  useGetActiveOrder,
  useUpdateOrderStatus,
} from "@/services/order/order.queries";
import { OrderDto, OrderStatus } from "@/services/order/order.types";
import { useAuthStore } from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { KanbanColumn } from "./_components/KanbanColumn";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";

// ─── Config ────────────────────────────────────────────────────────
export const KANBAN_COLUMNS: {
  status: OrderStatus;
  label: string;
  emoji: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}[] = [
  {
    status: "PENDING",
    label: "Chờ xác nhận",
    emoji: "📋",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    textColor: "text-yellow-700 dark:text-yellow-400",
    borderColor: "border-yellow-200 dark:border-yellow-800/50",
  },
  {
    status: "CONFIRMED",
    label: "Đã xác nhận",
    emoji: "✅",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    textColor: "text-blue-700 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800/50",
  },
  {
    status: "PREPARING",
    label: "Đang pha chế",
    emoji: "☕",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    textColor: "text-orange-700 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-800/50",
  },
  {
    status: "READY",
    label: "Sẵn sàng",
    emoji: "🔔",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    textColor: "text-green-700 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800/50",
  },
  // {
  //   status: "COMPLETED",
  //   label: "Hoàn thành",
  //   emoji: "🎁",
  //   bgColor: "bg-gray-50 dark:bg-gray-800/50",
  //   textColor: "text-gray-600 dark:text-gray-400",
  //   borderColor: "border-gray-200 dark:border-gray-700",
  // },
];

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
};

export const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: "Xác nhận",
  CONFIRMED: "Bắt đầu pha",
  PREPARING: "Sẵn sàng",
  READY: "Hoàn thành",
};

export default function StaffOrdersPage() {
  const qc = useQueryClient();
  const prevPendingCountRef = useRef<number>(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isSSEConnected, setIsSSEConnected] = useState<boolean>(false);

  const accessToken = useAuthStore((s) => s.accessToken);

  // const { data, isLoading, refetch } = useGetOrderPage({
  //   pageNo: 1,
  //   pageSize: 100,
  // });

  const { data: activeOrders, isLoading, refetch } = useGetActiveOrder();

  const updateStatusMutation = useUpdateOrderStatus();

  // const handleSSEEvent = useCallback(
  //   <T extends SSEEventType>(type: T, data: SSEPayload[T]) => {
  //     switch (type) {
  //       case "new_order":
  //       case "order_status_changed":
  //       case "payment_request":
  //       case "payment_completed":
  //         qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
  //         break;
  //     }
  //   },
  //   [qc],
  // );

  // const handleSSEEventTyped = useCallback(
  //   (
  //     type: Parameters<typeof handleSSEEvent>[0],
  //     payload: Parameters<typeof handleSSEEvent>[1],
  //   ) => {
  //     handleSSEEvent(type, payload);
  //     if (type === "new_order") {
  //       setIsSSEConnected(true);
  //     }
  //   },
  //   [handleSSEEvent],
  // );

  useSSE({
    url: `${API_BASE}/${API.SSE.ORDER_EVENTS}`,
    token: accessToken,
    onEvent: (type, data) => {
      switch (type) {
        case "new_order":
        case "payment_completed":
        case "order_status_changed":
          qc.invalidateQueries({
            queryKey: QUERY_KEYS.ORDERS.ACTIVE,
          });
          qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
          break;
        // case "payment_request":
        //   toast.info(
        //     `🙋 Bàn ${(data as SSEPayload["payment_request"]).tableName} yêu cầu thanh toán`,
        //     {
        //       duration: 6000,
        //     },
        //   );
        //   qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
        //   break;
      }
    },
    enabled: !!accessToken,
    reconnectDelay: 3_000,
  });

  // ─── Sound for new PENDING orders ────────────────────────────────────────────────────────
  // const activeOrders = data?.list ?? [];
  const pendingCount = (activeOrders || []).filter(
    (o) => o.status === "PENDING",
  ).length;

  useEffect(() => {
    if (
      pendingCount > prevPendingCountRef.current &&
      prevPendingCountRef.current > 0
    ) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } catch {}
      toast.info("🔔 Có đơn hàng mới!", { duration: 4000 });
    }
    prevPendingCountRef.current = pendingCount;
  }, [pendingCount]);

  // ─── Handle status change ────────────────────────────────────────────────────────
  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateStatusMutation.mutateAsync({ orderId, status });
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── Group orders by status ────────────────────────────────────────────────────────
  const ordersByStatus = KANBAN_COLUMNS.reduce<Record<OrderStatus, OrderDto[]>>(
    (acc, col) => {
      acc[col.status] = (activeOrders ?? []).filter(
        (o) => o.status === col.status,
      );
      return acc;
    },
    {} as Record<OrderStatus, OrderDto[]>,
  );

  const totalActive = activeOrders?.length ?? 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Đơn hàng
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time · {totalActive} đơn đang xử lý
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <span
              className={`size-2 rounded-full ${
                isSSEConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            {isSSEConnected ? "Live" : "Connecting..."}
          </div>
          <button
            onClick={() => refetch()}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <SpinnerIcon className="size-8 animate-spin text-brand-400" />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-3 h-full pb-4">
            {KANBAN_COLUMNS.map((col) => (
              <KanbanColumn
                config={col}
                onStatusChange={handleStatusChange}
                updatingId={updatingId}
                orders={ordersByStatus[col.status]}
                key={col.status}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
