"use client";
// src/app/(staff)/_components/PrepDock.tsx
// Vùng phải cố định của layout staff — luôn hiển thị ở mọi màn staff để theo dõi
// các đơn đang pha. Tự lấy dữ liệu (không phụ thuộc trang nào đang mở): trang
// Đơn hàng có SSE đẩy realtime, các màn khác dựa vào refetchInterval bên dưới.
import {
  useGetActiveOrder,
  useUpdateOrderStatus,
} from "@/services/order/order.queries";
import { OrderDto, OrderStatus } from "@/services/order/order.types";
import { usePrepStore } from "@/stores/prep.store";
import { useEffect, useMemo, useState } from "react";
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
  const updateStatusMutation = useUpdateOrderStatus();
  const prune = usePrepStore((s) => s.prune);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  /** Đơn đang pha chế, cũ nhất trước (thứ tự nên pha) */
  const preparingOrders = useMemo(
    () =>
      (activeOrders ?? [])
        .filter((o) => o.status === "PREPARING")
        .sort(byCreatedAsc),
    [activeOrders],
  );

  // Dọn tick/batch của các đơn đã rời PREPARING (READY/COMPLETED/CANCELLED)
  useEffect(() => {
    if (activeOrders) prune(preparingOrders.map((o) => o.id));
  }, [activeOrders, preparingOrders, prune]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateStatusMutation.mutateAsync({ orderId, status });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <PrepStation
      orders={preparingOrders}
      onStatusChange={handleStatusChange}
      updatingId={updatingId}
      expanded={expanded}
      onToggleExpand={toggleExpand}
    />
  );
};
