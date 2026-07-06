"use client";
// src/app/(staff)/staff/pos/_components/PagerBoard.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { useGetActiveOrder } from "@/services/order/order.queries";
import {
  useCallPager,
  useGetActivePagers,
  useReleasePager,
} from "@/services/pager";

interface PagerBoardProps {
  open: boolean;
  onClose: () => void;
}

export const PagerBoard = ({ open, onClose }: PagerBoardProps) => {
  const { data: pagers, isLoading } = useGetActivePagers();
  // PagerObject only carries { id, number, status, orderId }; the table name and
  // total live on the order, so we join by orderId against the active orders.
  const { data: orders } = useGetActiveOrder();
  const callMutation = useCallPager();
  const releaseMutation = useReleasePager();

  if (!open) return null;

  const active = pagers ?? [];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              Thẻ bàn
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {active.length} thẻ đang hoạt động
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <SpinnerIcon className="size-8 animate-spin text-brand-400" />
            </div>
          ) : active.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-gray-400">
              <span className="text-3xl mb-2">🔔</span>
              <p className="text-sm">Chưa có thẻ nào đang dùng</p>
            </div>
          ) : (
            active.map((p) => {
              const order = orders?.find((o) => o.id === p.orderId);
              const isWaiting = p.status === "WAITING";
              return (
                <div
                  key={p.id}
                  data-testid={`pager-${p.number}`}
                  data-status={p.status}
                  className={`rounded-xl border px-3 py-2.5 space-y-2 ${
                    isWaiting
                      ? "border-brand-300 dark:border-brand-500/50 bg-brand-50 dark:bg-brand-900/20"
                      : "border-gray-100 dark:border-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20 text-base font-bold text-brand-600 dark:text-brand-400">
                      {p.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {order?.tableName ?? "—"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {order
                          ? `${order.totalAmount.toLocaleString("vi-VN")}đ · `
                          : ""}
                        {p.orderId
                          ? `#${p.orderId.slice(-6).toUpperCase()}`
                          : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isWaiting
                          ? "bg-brand-400 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {isWaiting ? "Sẵn sàng" : "Đang pha"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {!isWaiting && (
                      <button
                        onClick={() => callMutation.mutate({ id: p.id })}
                        disabled={callMutation.isPending}
                        className="flex-1 rounded-lg bg-brand-400 hover:bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                      >
                        🔔 Gọi / Sẵn sàng
                      </button>
                    )}
                    <button
                      onClick={() => releaseMutation.mutate({ id: p.id })}
                      disabled={releaseMutation.isPending}
                      className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      Thu thẻ
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
