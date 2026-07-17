// src/app/(customer)/menu/[tableToken]/orders/_components/status-meta.ts
import { OrderStatus } from "@/services/order/order.types";

export const STATUS_META: Record<
  OrderStatus,
  { label: string; emoji: string; bgColor: string; textColor: string }
> = {
  PENDING: {
    label: "Chờ xác nhận",
    emoji: "📋",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    textColor: "text-yellow-700 dark:text-yellow-400",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    emoji: "✅",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-400",
  },
  PREPARING: {
    label: "Đang pha chế",
    emoji: "☕",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-700 dark:text-orange-400",
  },
  READY: {
    label: "Sẵn sàng",
    emoji: "🔔",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-700 dark:text-green-400",
  },
  COMPLETED: {
    label: "Đã phục vụ",
    emoji: "🎁",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-600 dark:text-gray-400",
  },
  CANCELLED: {
    label: "Đã huỷ",
    emoji: "❌",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-400",
  },
};
