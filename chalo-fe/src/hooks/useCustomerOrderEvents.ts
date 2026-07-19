// src/hooks/useCustomerOrderEvents.ts
"use client";
import { API, QUERY_KEYS } from "@/constants";
import { API_BASE } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { SSEPayload, useSSE } from "./useSSE";

/**
 * Khách theo dõi realtime đơn của bàn mình qua stream SSE public
 * `/order/events/by-table/:token` — mọi sự kiện đều invalidate các query
 * liên quan để UI cập nhật ngay thay vì chờ polling.
 * `onPaymentCompleted`: gọi khi bàn này có thanh toán hoàn tất (webhook SePay
 * hoặc nhân viên xác nhận) — dùng để tự chuyển màn "đã thanh toán".
 */
export function useCustomerOrderEvents(
  tableToken: string,
  opts?: {
    onPaymentCompleted?: (data: SSEPayload["payment_completed"]) => void;
  },
) {
  const qc = useQueryClient();

  useSSE({
    url: `${API_BASE}${API.SSE.ORDER_EVENTS_BY_TABLE}/${tableToken}`,
    enabled: !!tableToken,
    onEvent: (type, data) => {
      if (type === "payment_completed") {
        opts?.onPaymentCompleted?.(data as SSEPayload["payment_completed"]);
      }
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
