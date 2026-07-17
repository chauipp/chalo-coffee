// src/hooks/useCustomerOrderEvents.ts
"use client";
import { API, QUERY_KEYS } from "@/constants";
import { API_BASE } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useSSE } from "./useSSE";

/**
 * Khách theo dõi realtime đơn của bàn mình qua stream SSE public
 * `/order/events/by-table/:token` — mọi sự kiện đều invalidate các query
 * liên quan để UI cập nhật ngay thay vì chờ polling.
 */
export function useCustomerOrderEvents(tableToken: string) {
  const qc = useQueryClient();

  useSSE({
    url: `${API_BASE}${API.SSE.ORDER_EVENTS_BY_TABLE}/${tableToken}`,
    enabled: !!tableToken,
    onEvent: () => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.ORDERS.BY_TABLE_TOKEN(tableToken),
      });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ESTIMATED_WAIT() });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.ORDERS.CHECKOUT_PREVIEW(tableToken),
      });
    },
  });
}
