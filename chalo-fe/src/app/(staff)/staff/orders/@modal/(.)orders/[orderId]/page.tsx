// src/app/(staff)/staff/orders/@modal/(.)orders/[orderId]/page.tsx
"use client";
import { Receipt, ReceiptVariant } from "@/components/shared/Receipt";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import {
  useGetOrderById,
  useUpdateOrderStatus,
} from "@/services/order/order.queries";
import { OrderStatus } from "@/services/order/order.types";
import { useGetActivePagers } from "@/services/pager";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Khách đặt",
  CONFIRMED: "Khách đặt", // trạng thái di sản, hiển thị như PENDING
  PREPARING: "Đang pha chế",
  READY: "Sẵn sàng phục vụ",
  COMPLETED: "Đã phục vụ",
  CANCELLED: "Đã huỷ",
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
};

export default function OrderDetailModal() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();

  const { data: order, isLoading } = useGetOrderById(orderId);
  const updateStatusMutation = useUpdateOrderStatus();

  // Prefer order.pagerNumber (from 04); fall back to matching the active-pager
  // list by orderId so a released pager shows no badge.
  const { data: activePagers } = useGetActivePagers();
  const pagerNumber =
    order?.pagerNumber ??
    activePagers?.find((p) => p.orderId === order?.id)?.number ??
    null;

  // Only one #receipt-print may exist in the DOM at a time, so a single Receipt
  // is mounted and its variant is swapped just before printing.
  const [printVariant, setPrintVariant] = useState<ReceiptVariant>("final");
  const printAs = (v: ReceiptVariant) => {
    setPrintVariant(v);
    // let the DOM swap before the print dialog captures it
    requestAnimationFrame(() => window.print());
  };

  const handleClose = () => router.back();

  const handleStatusChange = async (status: OrderStatus) => {
    if (!order) return;
    await updateStatusMutation.mutateAsync({ orderId: order.id, status });
    handleClose();
  };

  return (
    <>
      {/* backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />

      {/* modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl pointer-events-auto">
          {/* header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Chi tiết đơn hàng
            </h2>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* body */}
          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
            {isLoading || !order ? (
              <div className="flex justify-center py-10">
                <SpinnerIcon className="size-8 animate-spin text-brand-400" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* meta */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {order.tableName}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      #{order.id.slice(-6).toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pagerNumber != null && (
                      <span className="text-sm font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-3 py-1 rounded-full">
                        🔔 Thẻ {pagerNumber}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-3 py-1 rounded-full">
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                </div>

                {/* items */}
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.productName}
                        </p>
                        {item.note && (
                          <p className="text-xs text-brand-600 dark:text-brand-400 mt-0.5">
                            📝{item.note}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm text-gray-500">
                          ×{item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {item.subtotal.toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* notes */}
                {order.note && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                      📌 Ghi chú
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {order.note}
                    </p>
                  </div>
                )}

                {/* total */}
                <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500">Tổng cộng</span>
                  <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                    {order.totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* footer */}
          {order && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-3">
              {!order.paidStatus && (
                <button
                  onClick={() => printAs("draft")}
                  className="flex-1 min-w-[8rem] rounded-xl border border-dashed border-gray-300 dark:border-gray-600 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  🧾 In tạm tính
                </button>
              )}
              <button
                onClick={() => printAs("final")}
                className="flex-1 min-w-[8rem] rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                🖨️ In hoá đơn
              </button>
              {NEXT_STATUS[order.status] && (
                <button
                  onClick={() => handleStatusChange(NEXT_STATUS[order.status]!)}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 min-w-[8rem] flex items-center justify-center gap-2 rounded-xl bg-brand-400 hover:bg-brand-500 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
                >
                  {updateStatusMutation.isPending && (
                    <SpinnerIcon className="size-4 animate-spin" />
                  )}
                  Chuyển trạng thái →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden receipt — only revealed by @media print (globals.css). */}
      {order && (
        <Receipt order={order} variant={printVariant} pagerNumber={pagerNumber} />
      )}
    </>
  );
}
