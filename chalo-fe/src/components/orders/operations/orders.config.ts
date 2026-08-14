import type { OrderStatus } from "@/services/order/order.types";

export const KANBAN_COLUMNS: {
  status: OrderStatus;
  label: string;
  emoji: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}[] = [
  { status: "PENDING", label: "Khách đặt", emoji: "📋", bgColor: "bg-yellow-50 dark:bg-yellow-950/40", textColor: "text-yellow-700 dark:text-yellow-400", borderColor: "border-yellow-200 dark:border-yellow-800/50" },
  { status: "READY", label: "Sẵn sàng phục vụ", emoji: "🔔", bgColor: "bg-green-50 dark:bg-green-950/40", textColor: "text-green-700 dark:text-green-400", borderColor: "border-green-200 dark:border-green-800/50" },
  { status: "COMPLETED", label: "Đã phục vụ", emoji: "🍽️", bgColor: "bg-sky-50 dark:bg-sky-950/40", textColor: "text-sky-700 dark:text-sky-400", borderColor: "border-sky-200 dark:border-sky-800/50" },
];

export const KHACH_DAT_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED"];
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PREPARING", CONFIRMED: "PREPARING", READY: "COMPLETED",
};
export const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: "Bắt đầu pha", CONFIRMED: "Bắt đầu pha", READY: "Đã bê ra",
};
export const orderDragType = (status: OrderStatus) => `chalo/${status.toLowerCase()}`;
