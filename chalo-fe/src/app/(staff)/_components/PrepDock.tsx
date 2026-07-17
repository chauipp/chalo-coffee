"use client";
// src/app/(staff)/_components/PrepDock.tsx
// Vùng phải cố định của layout staff — luôn hiển thị ở mọi màn staff để theo dõi
// các đơn đang pha. Tự lấy dữ liệu: trang Đơn hàng có SSE đẩy realtime, các màn
// khác dựa vào refetchInterval bên dưới.
import {
  useGetActiveOrder,
  useSetItemPrepared,
} from "@/services/order/order.queries";
import { OrderDto } from "@/services/order/order.types";
import { PrepUnit, nextPreparedQuantity } from "@/utils/prep-grouping";
import { useMemo } from "react";
import { PrepStation } from "./PrepStation";

/** Nhịp làm mới cho các màn staff không mở SSE (POS, Bàn…) */
const PREP_POLL_MS = 10_000;

const byCreatedAsc = (a: OrderDto, b: OrderDto) =>
  +new Date(a.createdAt) - +new Date(b.createdAt);

export const PrepDock = ({
  expanded,
  toggleExpand,
}: {
  expanded: boolean;
  toggleExpand: () => void;
}) => {
  const { data: activeOrders } = useGetActiveOrder({
    refetchInterval: PREP_POLL_MS,
  });
  const setPrepared = useSetItemPrepared();

  /** Đơn đang pha chế, cũ nhất trước (thứ tự nên pha) */
  const preparingOrders = useMemo(
    () =>
      (activeOrders ?? [])
        .filter((o) => o.status === "PREPARING")
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
      expanded={expanded}
      onToggleExpand={toggleExpand}
    />
  );
};
