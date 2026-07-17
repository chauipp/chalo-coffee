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
    label: "Chờ xác nhận",
    emoji: "📋",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    textColor: "text-yellow-700 dark:text-yellow-400",
    borderColor: "border-yellow-200 dark:border-yellow-800/50",
  },
  {
    status: "CONFIRMED",
    label: "Đã xác nhận",
    emoji: "✅",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    textColor: "text-blue-700 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800/50",
  },
  {
    status: "PREPARING",
    label: "Đang pha chế",
    emoji: "☕",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    textColor: "text-orange-700 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-800/50",
  },
  {
    status: "READY",
    label: "Sẵn sàng",
    emoji: "🔔",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    textColor: "text-green-700 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800/50",
  },
];

/** 3 cột hiển thị ở vùng trái màn split — PREPARING nằm riêng ở khu pha chế phải */
export const LEFT_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "READY"];

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
};

export const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: "Xác nhận",
  CONFIRMED: "Bắt đầu pha",
  PREPARING: "Sẵn sàng",
  READY: "Hoàn thành",
};
