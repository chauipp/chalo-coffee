import type { OrderSource } from "@/services/order/order.types";

const ORDER_SOURCE_META: Record<OrderSource, { label: string; ariaLabel: string; className: string }> = {
  QR: {
    label: "QR",
    ariaLabel: "Nguồn đơn: QR",
    className: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  },
  POS: {
    label: "Quầy",
    ariaLabel: "Nguồn đơn: Quầy",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  N_A: {
    label: "N/A",
    ariaLabel: "Nguồn đơn: N/A",
    className: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
  },
};

export const getOrderSourceLabel = (source: OrderSource) =>
  ORDER_SOURCE_META[source].label;

export const OrderSourceBadge = ({ source }: { source: OrderSource }) => {
  const { label, ariaLabel, className } = ORDER_SOURCE_META[source];

  return (
    <span
      aria-label={ariaLabel}
      className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${className}`}
    >
      {label}
    </span>
  );
};
