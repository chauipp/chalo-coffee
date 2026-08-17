import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import type { CustomerLoyaltyHistoryPage } from "@/services/customer/customer.types";
import { formatVnd } from "@/utils/format";
import { HistoryIcon, RefreshIcon } from "./icons";

interface Props {
  data?: CustomerLoyaltyHistoryPage;
  isOpen: boolean;
  isLoading: boolean;
  isError: boolean;
  onToggle: () => void;
  onRetry: () => void;
}

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function LoyaltyHistoryCard({
  data,
  isOpen,
  isLoading,
  isError,
  onToggle,
  onRetry,
}: Props) {
  const entries = data?.list ?? [];

  return (
    <section
      aria-labelledby="loyalty-history-heading"
      className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="loyalty-history-content"
        onClick={onToggle}
        className="flex min-h-16 w-full items-center gap-3 px-4 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-500"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          <HistoryIcon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span id="loyalty-history-heading" className="block text-sm font-bold text-stone-900 dark:text-white">
            Lịch sử tích điểm
          </span>
          <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">
            Đối chiếu điểm đã cộng theo từng đơn
          </span>
        </span>
        <span className="text-lg leading-none text-stone-400" aria-hidden="true">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen && (
        <div id="loyalty-history-content" className="border-t border-stone-100 p-4 dark:border-stone-800">
          {isLoading ? (
            <div className="flex min-h-20 items-center justify-center text-sm text-stone-500 dark:text-stone-400">
              <SpinnerIcon className="mr-2 size-4 animate-spin" />
              Đang tải lịch sử điểm...
            </div>
          ) : isError ? (
            <div className="py-2 text-center">
              <p className="text-sm text-stone-500 dark:text-stone-400">Chưa tải được lịch sử điểm.</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-stone-100 px-4 text-sm font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-200"
              >
                <RefreshIcon className="size-4" />
                Thử lại
              </button>
            </div>
          ) : entries.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 px-4 py-5 text-center text-sm leading-6 text-stone-500 dark:border-stone-700 dark:text-stone-400">
              Chưa có lần tích điểm nào. Điểm sẽ được cộng sau khi đơn được thanh toán.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 dark:text-white">
                      Đơn #{entry.orderId.slice(-6).toUpperCase()}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-stone-500 dark:text-stone-400">
                      {formatDateTime(entry.createdAt)}
                      {entry.orderTotalAmount !== null ? ` · ${formatVnd(entry.orderTotalAmount)}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    +{entry.points.toLocaleString("vi-VN")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
