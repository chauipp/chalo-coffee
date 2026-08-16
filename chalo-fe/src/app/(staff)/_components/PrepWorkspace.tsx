"use client";

import {
  useGetActiveOrder,
  useSetItemPrepared,
  useUpdateOrderStatus,
} from "@/services/order/order.queries";
import { OrderDto } from "@/services/order/order.types";
import { PrepUnit, nextPreparedQuantity } from "@/utils/prep-grouping";
import { useMemo } from "react";
import { PrepStation } from "./PrepStation";

/** Nhịp làm mới cho workspace không nhận SSE trực tiếp. */
const PREP_POLL_MS = 10_000;

const byCreatedAsc = (a: OrderDto, b: OrderDto) =>
  +new Date(a.createdAt) - +new Date(b.createdAt);

/** Workspace pha chế dùng chung cho dock desktop và trang pha chế độc lập. */
export function PrepWorkspace({ enabled }: { enabled: boolean }) {
  const { data: activeOrders } = useGetActiveOrder({
    enabled,
    refetchInterval: PREP_POLL_MS,
  });
  const setPrepared = useSetItemPrepared();
  const updateStatus = useUpdateOrderStatus();

  /** Đơn đang pha chế, cũ nhất trước (thứ tự nên pha). */
  const preparingOrders = useMemo(
    () =>
      (activeOrders ?? [])
        .filter((order) => order.status === "PREPARING")
        .sort(byCreatedAsc),
    [activeOrders],
  );

  const handleToggleUnit = (unit: PrepUnit) =>
    setPrepared.mutate({
      itemId: unit.itemId,
      preparedQuantity: nextPreparedQuantity(unit),
    });

  return (
    <PrepStation
      orders={preparingOrders}
      onToggleUnit={handleToggleUnit}
      onDropOrder={(orderId) =>
        updateStatus.mutate({ orderId, status: "PREPARING" })
      }
    />
  );
}
