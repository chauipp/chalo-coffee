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
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { KanbanColumn } from "./_components/KanbanColumn";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { KANBAN_COLUMNS, KHACH_DAT_STATUSES } from "./orders.config";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

/** So khớp không phân biệt hoa thường và dấu — gõ "ban 5" vẫn ra "Bàn 05" */
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase();

/** Tiếng "ting" báo hiệu — pitch tuỳ loại sự kiện */
const playBeep = (frequency = 880) => {
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
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
};

export default function StaffOrdersPage() {
  const qc = useQueryClient();
  const prevPendingCountRef = useRef<number>(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isSSEConnected, setIsSSEConnected] = useState<boolean>(false);
  const [tableSearch, setTableSearch] = useState("");

  const accessToken = useAuthStore((s) => s.accessToken);

  const { data: activeOrders, isLoading, refetch } = useGetActiveOrder();

  const updateStatusMutation = useUpdateOrderStatus();

  useSSE({
    url: `${API_BASE}${API.SSE.ORDER_EVENTS}`,
    token: accessToken,
    onConnectionChange: setIsSSEConnected,
    onEvent: (type, data) => {
      switch (type) {
        case "new_order":
        case "order_status_changed":
        case "order_prep_progress":
          qc.invalidateQueries({
            queryKey: QUERY_KEYS.ORDERS.ACTIVE,
          });
          qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
          break;
        case "payment_completed": {
          const p = data as SSEPayload["payment_completed"];
          if (p.source === "sepay") {
            playBeep(880);
            toast.success(
              `💰 Đã nhận chuyển khoản ${p.totalAmount.toLocaleString("vi-VN")}đ — hoá đơn đang in`,
              { duration: 8000 },
            );
          }
          qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
          qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
          break;
        }
        case "payment_review_needed": {
          const p = data as SSEPayload["payment_review_needed"];
          playBeep(440);
          toast.error(
            `⚠️ Chuyển khoản cần đối soát tay: ${p.reason} — ${p.transferAmount.toLocaleString("vi-VN")}đ${p.content ? ` ("${p.content}")` : ""}`,
            { duration: 15000 },
          );
          break;
        }
        case "payment_request": {
          const p = data as SSEPayload["payment_request"];
          playBeep(660);
          toast.info(`Bàn ${p.tableName ?? ""} yêu cầu thanh toán`, {
            duration: 8000,
          });
          qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
          break;
        }
        case "payment_request_batch": {
          const p = data as SSEPayload["payment_request_batch"];
          playBeep(660);
          toast.info(
            `Bàn ${p.tableName ?? ""} yêu cầu thanh toán gộp (${p.totalAmount.toLocaleString("vi-VN")}đ)`,
            { duration: 8000 },
          );
          qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
          break;
        }
        case "staff_call": {
          const p = data as SSEPayload["staff_call"];
          playBeep(520);
          toast.warning(
            `Bàn ${p.tableName ?? ""} đang gọi nhân viên${p.reason ? `: ${p.reason}` : ""}`,
            { duration: 10000 },
          );
          break;
        }
      }
    },
    enabled: !!accessToken,
    reconnectDelay: 3_000,
  });

  // ─── Sound for new PENDING orders ────────────────────────────────────────────────────────
  const pendingCount = (activeOrders || []).filter(
    (o) => o.status === "PENDING" || o.status === "CONFIRMED",
  ).length;

  useEffect(() => {
    if (
      pendingCount > prevPendingCountRef.current &&
      prevPendingCountRef.current > 0
    ) {
      playBeep(880);
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

  /** Đơn của từng cột: "Khách đặt" gom cả CONFIRMED cũ; "Đã phục vụ" chỉ đơn chưa trả tiền */
  const ordersForColumn = useMemo(() => {
    const q = normalize(tableSearch.trim());
    const all = (activeOrders ?? []).filter(
      (o) => !q || normalize(o.tableName ?? "").includes(q),
    );
    return (status: OrderStatus): OrderDto[] => {
      if (status === "PENDING")
        return all.filter((o) => KHACH_DAT_STATUSES.includes(o.status));
      if (status === "COMPLETED")
        return all.filter((o) => o.status === "COMPLETED" && !o.paidStatus);
      return all.filter((o) => o.status === status);
    };
  }, [activeOrders, tableSearch]);

  const totalActive = activeOrders?.length ?? 0;
  const leftColumns = KANBAN_COLUMNS;

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
          <input
            type="search"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            placeholder="🔍 Tìm bàn..."
            className="w-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
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
        // Khu pha chế (cột "Đang pha chế") nằm ở layout staff — luôn hiển thị
        <div className="relative flex-1 min-h-0 overflow-x-auto p-4">
          <div className="flex gap-3 h-full min-w-[680px]">
            {leftColumns.map((col) => (
              <KanbanColumn
                config={col}
                onStatusChange={handleStatusChange}
                updatingId={updatingId}
                orders={ordersForColumn(col.status)}
                key={col.status}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
