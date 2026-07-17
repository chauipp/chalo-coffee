// src/app/(staff)/staff/orders/page.tsx
"use client";
import { API, QUERY_KEYS } from "@/constants";
import { SSEPayload, useSSE } from "@/hooks/useSSE";
import {
  useGetActiveOrder,
  useUpdateOrderStatus,
} from "@/services/order/order.queries";
import { OrderDto, OrderStatus } from "@/services/order/order.types";
import { useGetSettings } from "@/services/settings";
import { useAuthStore } from "@/stores/auth.store";
import { usePrepStore } from "@/stores/prep.store";
import { computeBatchSuggestion } from "@/utils/batching";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BatchSuggestion } from "./_components/BatchSuggestion";
import { KanbanColumn } from "./_components/KanbanColumn";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { KANBAN_COLUMNS, LEFT_STATUSES } from "./orders.config";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

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

const byCreatedAsc = (a: OrderDto, b: OrderDto) =>
  +new Date(a.createdAt) - +new Date(b.createdAt);

export default function StaffOrdersPage() {
  const qc = useQueryClient();
  const prevPendingCountRef = useRef<number>(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isSSEConnected, setIsSSEConnected] = useState<boolean>(false);

  const accessToken = useAuthStore((s) => s.accessToken);

  const { data: activeOrders, isLoading, refetch } = useGetActiveOrder();

  const updateStatusMutation = useUpdateOrderStatus();
  const createBatch = usePrepStore((s) => s.createBatch);

  // ─── Manual batching: chọn nhiều đơn CONFIRMED để pha chung ─────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatching, setIsBatching] = useState(false);

  const toggleSelect = (orderId: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });

  useSSE({
    url: `${API_BASE}${API.SSE.ORDER_EVENTS}`,
    token: accessToken,
    onConnectionChange: setIsSSEConnected,
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
    (o) => o.status === "PENDING",
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

  // ─── Group orders by status ────────────────────────────────────────────────────────
  const ordersByStatus = useMemo(
    () =>
      KANBAN_COLUMNS.reduce<Record<OrderStatus, OrderDto[]>>(
        (acc, col) => {
          acc[col.status] = (activeOrders ?? []).filter(
            (o) => o.status === col.status,
          );
          return acc;
        },
        {} as Record<OrderStatus, OrderDto[]>,
      ),
    [activeOrders],
  );

  /** Hàng chờ pha chế: CONFIRMED, cũ nhất trước */
  const confirmedQueue = useMemo(
    () => [...(ordersByStatus.CONFIRMED ?? [])].sort(byCreatedAsc),
    [ordersByStatus],
  );

  // Đơn được chọn phải còn trong cột CONFIRMED (đơn đã chuyển đi thì bỏ chọn)
  useEffect(() => {
    setSelectedIds((prev) => {
      const confirmed = new Set(confirmedQueue.map((o) => o.id));
      const kept = [...prev].filter((id) => confirmed.has(id));
      return kept.length === prev.size ? prev : new Set(kept);
    });
  }, [confirmedQueue]);

  // ─── Smart batching suggestion (bật/tắt trong Admin Settings) ───────────
  const { data: settings } = useGetSettings();
  const smartEnabled = settings?.smartBatchingEnabled ?? true;
  const dismissed = usePrepStore((s) => s.dismissed);
  const dismiss = usePrepStore((s) => s.dismiss);

  const suggestion = useMemo(() => {
    if (!smartEnabled) return null; // admin tắt → bỏ qua bước quét
    const s = computeBatchSuggestion(confirmedQueue);
    return s && !dismissed.includes(s.signature) ? s : null;
  }, [smartEnabled, confirmedQueue, dismissed]);

  /** Gộp N đơn: chuyển từng đơn sang PREPARING rồi ghép chung 1 ticket */
  const startBatch = async (orderIds: string[]) => {
    if (isBatching || orderIds.length < 2) return;
    setIsBatching(true);
    const moved: string[] = [];
    try {
      for (const id of orderIds) {
        setUpdatingId(id);
        try {
          await updateStatusMutation.mutateAsync({
            orderId: id,
            status: "PREPARING",
          });
          moved.push(id);
        } catch {
          // lỗi đã có toast từ mutation; các đơn còn lại vẫn thử tiếp
        } finally {
          setUpdatingId(null);
        }
      }
      if (moved.length >= 2) {
        createBatch(moved);
        toast.success(`Đã gộp ${moved.length} đơn vào khu pha chế`);
      }
    } finally {
      setIsBatching(false);
      setSelectedIds(new Set());
    }
  };

  const totalActive = activeOrders?.length ?? 0;
  const leftColumns = KANBAN_COLUMNS.filter((c) =>
    LEFT_STATUSES.includes(c.status),
  );

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
        // Khu pha chế (cột "Đang pha chế") nằm ở layout staff — luôn hiển thị
        <div className="relative flex-1 min-h-0 overflow-x-auto p-4">
          <div className="flex gap-3 h-full min-w-[680px]">
            {leftColumns.map((col) => (
              <KanbanColumn
                config={col}
                onStatusChange={handleStatusChange}
                updatingId={updatingId}
                orders={
                  col.status === "CONFIRMED"
                    ? confirmedQueue
                    : ordersByStatus[col.status]
                }
                selectable={col.status === "CONFIRMED"}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                banner={
                  col.status === "CONFIRMED" && suggestion ? (
                    <BatchSuggestion
                      suggestion={suggestion}
                      onAccept={startBatch}
                      onDismiss={dismiss}
                      isBatching={isBatching}
                    />
                  ) : null
                }
                key={col.status}
              />
            ))}
          </div>

          {/* Action bar gộp đơn thủ công */}
          {selectedIds.size > 0 && (
            <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2 rounded-full border border-brand-200 dark:border-brand-800 bg-white dark:bg-gray-900 px-4 py-2 shadow-lg">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Đã chọn {selectedIds.size} đơn
              </span>
              <button
                onClick={() => startBatch([...selectedIds])}
                disabled={selectedIds.size < 2 || isBatching}
                title={
                  selectedIds.size < 2
                    ? "Chọn ít nhất 2 đơn để pha chung"
                    : "Chuyển các đơn đã chọn vào khu pha chế, gộp 1 ticket"
                }
                className="flex items-center gap-1.5 rounded-full bg-brand-400 hover:bg-brand-500 active:bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {isBatching ? (
                  <SpinnerIcon className="size-3 animate-spin" />
                ) : null}
                Pha chung ▶
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors whitespace-nowrap"
              >
                Bỏ chọn
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
