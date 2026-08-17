import Link from "next/link";
import type { IngredientDto } from "@/services/inventory/inventory.types";
import type { OrderDto } from "@/services/order/order.types";
import type { CashShift } from "@/services/shift/shift.types";
import { getActiveOrderSummary, getShiftSummary } from "./actionHub.utils";

interface ResourceState<T> {
  data?: T;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

interface ActionHubProps {
  activeOrders: ResourceState<OrderDto[]>;
  shift: ResourceState<CashShift | null>;
  lowStock: ResourceState<IngredientDto[]>;
}

function ActionCard({
  title,
  href,
  icon,
  summary,
  state,
}: {
  title: string;
  href: string;
  icon: string;
  summary: { label: string; detail: string };
  state: Pick<ResourceState<unknown>, "isLoading" | "isError" | "onRetry">;
}) {
  return (
    <article className="min-h-28 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">{title}</p>
        <span aria-hidden="true" className="text-lg">{icon}</span>
      </div>
      {state.isLoading ? (
        <div className="mt-3 h-5 w-36 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
      ) : state.isError ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-sm text-rose-700 dark:text-rose-300">Chưa tải được dữ liệu.</p>
          <button
            type="button"
            onClick={state.onRetry}
            className="min-h-11 rounded-lg px-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/30"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <Link
          href={href}
          className="mt-2 block rounded-lg py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <p className="text-xl font-bold text-stone-900 dark:text-white">{summary.label}</p>
          <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">{summary.detail} <span className="font-semibold text-brand-700 dark:text-brand-300">Xem →</span></p>
        </Link>
      )}
    </article>
  );
}

export function ActionHub({ activeOrders, shift, lowStock }: ActionHubProps) {
  const orderSummary = getActiveOrderSummary(activeOrders.data);
  const shiftSummary = getShiftSummary(shift.data);
  const lowStockSummary = {
    label: lowStock.data?.length === 1 ? "1 nguyên liệu cần nhập" : `${lowStock.data?.length ?? 0} nguyên liệu cần nhập`,
    detail: lowStock.data?.length ? "Kiểm tra tồn và các món tự ngừng bán" : "Tồn kho đang ở mức an toàn",
  };

  return (
    <section aria-labelledby="action-hub-heading">
      <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
        <div>
          <h2 id="action-hub-heading" className="font-bold text-stone-900 dark:text-white">Cần xử lý</h2>
          <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">Theo dõi nhanh vận hành trong ca</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <ActionCard title="Đơn hàng" href="/admin/orders" icon="🧾" summary={orderSummary} state={activeOrders} />
        <ActionCard title="Ca làm việc" href="/admin/shift" icon="💵" summary={shiftSummary} state={shift} />
        <ActionCard title="Tồn kho" href="/admin/inventory" icon="📦" summary={lowStockSummary} state={lowStock} />
      </div>
    </section>
  );
}
