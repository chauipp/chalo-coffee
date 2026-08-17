import type { OrderDto } from "@/services/order/order.types";
import type { CashShift } from "@/services/shift/shift.types";

export const getActiveOrderSummary = (
  orders: readonly Pick<OrderDto, "paymentRequested">[] | undefined,
) => {
  const total = orders?.length ?? 0;
  const paymentRequested = orders?.filter((order) => order.paymentRequested).length ?? 0;

  return {
    value: total,
    label: total === 1 ? "1 đơn đang xử lý" : `${total} đơn đang xử lý`,
    detail:
      paymentRequested > 0
        ? `${paymentRequested} yêu cầu thanh toán`
        : "Chưa có yêu cầu thanh toán",
  };
};

export const getShiftSummary = (shift: Pick<CashShift, "status" | "openedAt"> | null | undefined) => {
  if (!shift || shift.status !== "OPEN") {
    return { label: "Chưa mở ca", detail: "Mở ca trước khi nhận tiền mặt" };
  }

  return {
    label: "Ca đang mở",
    detail: `Từ ${new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(shift.openedAt))}`,
  };
};
