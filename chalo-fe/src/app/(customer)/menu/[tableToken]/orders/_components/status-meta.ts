// src/app/(customer)/menu/[tableToken]/orders/_components/status-meta.ts
import { OrderStatus } from "@/services/order/order.types";

export const STATUS_META: Record<
  OrderStatus,
  { label: string; emoji: string; bgColor: string; textColor: string }
> = {
  PENDING: {
    label: "Đã tiếp nhận",
    emoji: "📋",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    textColor: "text-yellow-700 dark:text-yellow-400",
  },
  CONFIRMED: {
    label: "Đã tiếp nhận",
    emoji: "✅",
    bgColor: "bg-sky-100 dark:bg-sky-900/30",
    textColor: "text-sky-700 dark:text-sky-400",
  },
  PREPARING: {
    label: "Đang pha chế",
    emoji: "☕",
    bgColor: "bg-brand-100 dark:bg-brand-900/30",
    textColor: "text-brand-700 dark:text-brand-400",
  },
  READY: {
    label: "Sẵn sàng phục vụ",
    emoji: "🔔",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-700 dark:text-green-400",
  },
  COMPLETED: {
    label: "Đã phục vụ",
    emoji: "🎁",
    bgColor: "bg-stone-100 dark:bg-stone-800",
    textColor: "text-stone-600 dark:text-stone-400",
  },
  CANCELLED: {
    label: "Đã huỷ",
    emoji: "❌",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-400",
  },
};
