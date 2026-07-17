"use client";
// src/app/(staff)/staff/orders/_components/OrderCard.tsx
import { OrderDto, OrderStatus } from "@/services/order/order.types";
import { NEXT_STATUS, NEXT_STATUS_LABEL } from "../page";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { ROUTES } from "@/constants";
import { useRouter } from "next/navigation";

const formatAge = (ms: number): string => {
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "vừa xong";
  if (min < 60) return `${min} phút trước`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
};

export const OrderCard = ({
  order,
  onStatusChange,
  isUpdating,
}: {
  order: OrderDto;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  isUpdating: boolean;
}) => {
  const router = useRouter();
  const nextStatus = NEXT_STATUS[order.status];
  const nextLabel = NEXT_STATUS_LABEL[order.status];
  const ageMs = Date.now() - new Date(order.createdAt).getTime();

  // Soft-navigate to the intercepted detail route so the modal opens as an
  // overlay (@modal/(.)orders/[orderId]).
  const openDetail = () =>
    router.push(`${ROUTES.STAFF.ORDERS}/orders/${order.id}`);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetail();
        }
      }}
      className={`cursor-pointer rounded-xl border bg-white dark:bg-gray-900 shadow-sm p-3.5 space-y-3 hover:shadow-md transition-shadow
        ${order.status === "PENDING" ? "border-l-4 border-l-yellow-400 dark:border-l-yellow-500" : "border-gray-100 dark:border-gray-800"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {order.tableName}
          </p>
          <p className="text-xs text-gray-400 font-mono">
            #{order.id.slice(-6).toUpperCase()}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-400">{formatAge(ageMs)}</p>
          {order.paidStatus && (
            <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">
              Đã thanh toán
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-xs">
            <span className="text-gray-700 dark:text-gray-300 truncate pr-2">
              {item.productName}{" "}
              <span className="text-gray-400 font-semibold">
                ×{item.quantity}
              </span>
            </span>
            {item.note && (
              <span className="text-brand-500 dark:text-brand-400 text-[10px] shrink-0">
                📝 {item.note}
              </span>
            )}
          </div>
        ))}
      </div>

      {order.note && (
        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
          📌 {order.note}
        </p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
        <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
          {order.totalAmount.toLocaleString("vi-VN")}đ
        </span>

        {nextStatus && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(order.id, nextStatus);
            }}
            disabled={isUpdating}
            className="flex items-center gap-1.5 rounded-lg bg-brand-400 hover:bg-brand-500 active:bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
          >
            {isUpdating ? (
              <SpinnerIcon className="size-3 animate-spin" />
            ) : null}
            {nextLabel} →
          </button>
        )}
      </div>
    </div>
  );
};
