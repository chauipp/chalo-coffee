// src/hooks/useSSE.ts
"use client";
import { OrderStatus } from "@/services/order/order.types";
import { useEffect, useRef } from "react";

export const ALL_SSE_EVENTS = [
  "new_order",
  "order_status_changed",
  "order_prep_progress",
  "payment_request",
  "payment_request_batch",
  "payment_completed",
  "staff_call",
] as const;

export type SSEEventType = (typeof ALL_SSE_EVENTS)[number];

export interface SSEPayload {
  new_order: {
    orderId: string;
    tableId: string;
    tableName: string;
    tableToken: string;
  };
  order_status_changed: {
    orderId: string;
    status: OrderStatus;
    tableId: string;
    tableName: string;
    tableToken: string;
  };
  order_prep_progress: {
    orderId: string;
    tableId: string;
    tableName: string;
  };
  payment_request: {
    orderId: string;
    tableId: string;
    tableName: string;
    tableToken: string;
  };
  payment_request_batch: {
    orderIds: string[];
    tableId: string;
    tableName: string;
    totalAmount: number;
  };
  payment_completed: {
    sessionId?: string;
    tableId: string;
    tableToken: string;
    orderIds: string[];
    totalAmount: number;
  };
  staff_call: {
    tableId: string;
    tableName: string;
    tableToken: string;
    reason: string | null;
  };
}

interface UseSSEOptions {
  url: string; // Đường dẫn API của Server để nối ống
  /** token gắn vào query param `?token=` — bỏ qua (null) với stream public */
  token?: string | null;
  onEvent: <T extends SSEEventType>(type: T, data: SSEPayload[T]) => void;
  /** Báo trạng thái kết nối (true khi ống mở, false khi đứt) */
  onConnectionChange?: (connected: boolean) => void;
  reconnectDelay?: number; // Thời gian chờ để nối lại ống nếu mạng bị đứt (mặc định 3s)
  enabled?: boolean; // Công tắc: true thì mở ống, false thì khóa ống
}

export function useSSE({
  url,
  onEvent,
  token = null,
  onConnectionChange,
  enabled = true,
  reconnectDelay = 3000,
}: UseSSEOptions) {
  const onEventRef = useRef(onEvent);
  const onConnectionChangeRef = useRef(onConnectionChange);

  useEffect(() => {
    onEventRef.current = onEvent;
    onConnectionChangeRef.current = onConnectionChange;
  }, [onEvent, onConnectionChange]);

  useEffect(() => {
    if (!enabled) return;

    let es: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;

      const sseUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
      es = new EventSource(sseUrl);

      es.onopen = () => onConnectionChangeRef.current?.(true);

      ALL_SSE_EVENTS.forEach((type) => {
        es!.addEventListener(type, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            onEventRef.current(type, data);
          } catch {}
        });
      });

      es.onerror = () => {
        onConnectionChangeRef.current?.(false);
        es?.close();
        es = null;
        timer = setTimeout(connect, reconnectDelay);
      };
    };

    connect();

    return () => {
      disposed = true;
      es?.close();
      if (timer) clearTimeout(timer);
      onConnectionChangeRef.current?.(false);
    };
  }, [url, enabled, reconnectDelay, token]);
}
