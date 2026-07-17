// src/app/(staff)/staff/orders/orders.config.ts
// Config màn đơn hàng staff — tách khỏi page.tsx để các component/khu pha chế
// cùng dùng mà không import ngược vào page.
import { OrderStatus } from "@/services/order/order.types";

export const KANBAN_COLUMNS: {
  status: OrderStatus;
  label: string;
  emoji: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}[] = [
  {
    status: "PENDING",
    label: "Khách đặt",
    emoji: "📋",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    textColor: "text-yellow-700 dark:text-yellow-400",
    borderColor: "border-yellow-200 dark:border-yellow-800/50",
  },
  {
    status: "READY",
    label: "Sẵn sàng phục vụ",
    emoji: "🔔",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    textColor: "text-green-700 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800/50",
  },
  {
    status: "COMPLETED",
    label: "Đã phục vụ",
    emoji: "🍽️",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    textColor: "text-blue-700 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800/50",
  },
];

/** Đơn CONFIRMED cũ trong DB gom chung cột "Khách đặt" — không tạo mới trạng thái này */
export const KHACH_DAT_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED"];

/** PREPARING → READY KHÔNG có ở đây: tick đủ ly thì BE tự đẩy */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PREPARING",
  CONFIRMED: "PREPARING",
  READY: "COMPLETED",
};

export const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: "Bắt đầu pha",
  CONFIRMED: "Bắt đầu pha",
  READY: "Đã bê ra",
};
