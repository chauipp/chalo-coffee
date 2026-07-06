// src/hooks/useSSE.ts
"use client";
import { OrderStatus } from "@/services/order/order.types";
import { useCallback, useEffect, useRef } from "react";

export const ALL_SSE_EVENTS = [
  "new_order",
  "order_status_changed",
  "payment_request",
  "payment_request_batch",
  "payment_completed",
] as const;

export type SSEEventType = (typeof ALL_SSE_EVENTS)[number];

export interface SSEPayload {
  new_order: { orderId: string; tableId: string; tableName: string };
  order_status_changed: {
    orderId: string;
    status: OrderStatus;
    tableId: string;
    tableName: string;
  }; // status: string  ????
  payment_request: { orderId: string; tableId: string; tableName: string };
  payment_request_batch: {
    orderIds: string[];
    tableId: string;
    tableName: string;
    totalAmount: number;
  };
  payment_completed: {
    sessionId: string;
    tableId: string;
    tableToken: string;
    orderIds: string[];
    totalAmount: number;
  };
}

interface UseSSEOptions {
  url: string; // Đường dẫn API của Server để nối ống
  /** token để gắn vào query param — BE yêu cầu ?token=<accessToken> */
  token: string | null;
  onEvent: <T extends SSEEventType>(type: T, data: SSEPayload[T]) => void;
  reconnectDelay?: number; // Thời gian chờ để nối lại ống nếu mạng bị đứt (mặc định 3s)
  enabled?: boolean; // Công tắc: true thì mở ống, false thì khóa ống
}

export function useSSE({
  url,
  onEvent,
  token,
  enabled = true,
  reconnectDelay = 3000,
}: UseSSEOptions) {
  const esRef = useRef<EventSource | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(() => {
    if (!enabled || !token) return;

    const sseUrl = `${url}?token=${encodeURIComponent(token)}`;
    const es = new EventSource(sseUrl);
    esRef.current = es;

    ALL_SSE_EVENTS.forEach((type) => {
      es.addEventListener(type, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          onEventRef.current(type, data);
        } catch {}
      });
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      timerRef.current = setTimeout(connect, reconnectDelay);
    };
  }, [url, enabled, reconnectDelay, token]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [connect]);
}
