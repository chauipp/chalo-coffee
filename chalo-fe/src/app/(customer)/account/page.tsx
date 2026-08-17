"use client";

import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { ROLE_DEFAULT_ROUTES, ROUTES, USER_ROLE } from "@/constants";
import { useLogout } from "@/hooks/useLogout";
import {
  useCustomerLoyalty,
  useCustomerOrders,
  useCustomerProfile,
  useCustomerShortcut,
  useLeaveTable,
} from "@/services/customer/customer.queries";
import type { CustomerOrder } from "@/services/customer/customer.types";
import { formatVnd } from "@/utils/format";
import { useAuthStore } from "@/stores/auth.store";
import Link from "next/link";
import { useEffect, useState } from "react";
import AccountShortcutCard from "./_components/AccountShortcutCard";
import {
  ArrowRightIcon,
  CoffeeIcon,
  HistoryIcon,
  LogoutIcon,
  QrIcon,
  RefreshIcon,
} from "./_components/icons";
import LoyaltyBalanceCard from "./_components/LoyaltyBalanceCard";
import TableQrScanner from "./_components/TableQrScanner";
import { BrandLogo } from "@/components/shared/BrandLogo";

const STATUS_LABEL: Record<CustomerOrder["status"], string> = {
  PENDING: "Đã tiếp nhận",
  CONFIRMED: "Đã tiếp nhận",
  PREPARING: "Đang pha chế",
  READY: "Sẵn sàng",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã huỷ",
};

const initials = (fullName: string) => {
  const names = fullName.trim().split(/\s+/).filter(Boolean);
  return names.slice(-2).map((name) => name[0]?.toUpperCase()).join("") || "CH";
};

function OrderHistoryCard({ order }: { order: CustomerOrder }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const itemSummary = order.items
    .slice(0, 2)
    .map((item) => `${item.productName} × ${item.quantity}`)
    .join(" · ");
  const extraCount = Math.max(0, order.items.length - 2);

  return (
    <article className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-stone-900 dark:text-white">
            {order.table?.name ?? "Đơn tại quán"} · {itemCount} món
          </p>
          <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
            {new Intl.DateTimeFormat("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(order.createdAt))}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            order.status === "CANCELLED"
              ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
              : order.paidStatus
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
          }`}
        >
          {order.status === "CANCELLED"
            ? STATUS_LABEL[order.status]
            : order.paidStatus
              ? "Đã thanh toán"
              : STATUS_LABEL[order.status]}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
        {itemSummary || "Không có chi tiết món"}
        {extraCount > 0 ? ` · +${extraCount} món khác` : ""}
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3 dark:border-stone-800">
        <span className="font-mono text-xs text-stone-400">
          #{order.id.slice(-6).toUpperCase()}
        </span>
        <span className="text-sm font-bold text-brand-700 dark:text-brand-300">
          {formatVnd(order.totalAmount)}
        </span>
      </div>
    </article>
  );
}

function CustomerAccountContent() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logout = useLogout();
  const profile = useCustomerProfile();
  const shortcut = useCustomerShortcut();
  const loyalty = useCustomerLoyalty();
  const orders = useCustomerOrders({ pageNo: 1, pageSize: 10 });
  const leaveTable = useLeaveTable();

  const displayName = profile.data?.fullName || "Khách Chalo";
  const displayEmail = profile.data?.email;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <main className="min-h-dvh bg-[#f8f5ef] text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="mx-auto min-h-dvh w-full max-w-md pb-[max(2rem,env(safe-area-inset-bottom))]">
        <header className="flex items-center justify-between gap-4 px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <Link
            href="/"
            aria-label="Chalo Coffee - Trang chủ"
            className="flex size-11 items-center justify-center overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-stone-700 dark:bg-stone-800"
          >
            <BrandLogo className="size-full object-contain p-1" />
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-stone-500 transition hover:bg-white hover:text-stone-800 disabled:opacity-60 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100"
          >
            {isLoggingOut ? (
              <SpinnerIcon className="size-4 animate-spin" />
            ) : (
              <LogoutIcon className="size-4" />
            )}
            Đăng xuất
          </button>
        </header>

        <section className="px-5 pb-5">
          <div className="flex items-center gap-3">
            {profile.data?.avatar ? (
              <img
                src={profile.data.avatar}
                alt=""
                className="size-14 shrink-0 rounded-2xl object-cover ring-2 ring-white dark:ring-stone-800"
              />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-base font-bold text-brand-800 ring-2 ring-white dark:bg-brand-950 dark:text-brand-200 dark:ring-stone-800">
                {initials(displayName)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm text-stone-500 dark:text-stone-400">Xin chào,</p>
              <h1 className="truncate text-2xl font-bold tracking-tight">
                Tài khoản của bạn
              </h1>
              <p className="mt-1 truncate text-sm font-semibold text-brand-700 dark:text-brand-300">
                {profile.isLoading ? "Đang tải hồ sơ..." : displayName}
              </p>
              {displayEmail && (
                <p className="mt-0.5 truncate text-xs text-stone-400 dark:text-stone-500">
                  {displayEmail}
                </p>
              )}
            </div>
          </div>
          {profile.isError && (
            <button
              type="button"
              onClick={() => void profile.refetch()}
              className="mt-3 flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-stone-700 shadow-sm dark:bg-stone-900 dark:text-stone-200"
            >
              <RefreshIcon className="size-4" />
              Tải lại hồ sơ
            </button>
          )}
        </section>

        <div className="space-y-4 px-4">
          <LoyaltyBalanceCard
            balance={loyalty.data?.balance}
            isLoading={loyalty.isLoading}
            isError={loyalty.isError}
            onRetry={() => void loyalty.refetch()}
          />

          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="group flex min-h-16 w-full items-center gap-4 rounded-[1.5rem] bg-stone-900 px-5 text-left text-white shadow-[0_14px_32px_-22px_rgba(28,25,23,0.8)] transition hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 active:scale-[0.99] dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <QrIcon className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold">Quét mã bàn</span>
              <span className="mt-0.5 block text-xs leading-5 text-stone-300 dark:text-brand-50">
                Vào thực đơn và gọi món tại bàn
              </span>
            </span>
            <ArrowRightIcon className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </button>

          <AccountShortcutCard
            shortcut={shortcut.data}
            isLoading={shortcut.isLoading}
            isError={shortcut.isError}
            isLeaving={leaveTable.isPending}
            onRetry={() => void shortcut.refetch()}
            onLeave={async () => {
              await leaveTable.mutateAsync();
            }}
          />

          <section aria-labelledby="recent-orders-heading" className="pt-2">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <HistoryIcon className="size-5 text-brand-700 dark:text-brand-300" />
                <h2 id="recent-orders-heading" className="font-bold">
                  Đơn gần đây
                </h2>
              </div>
              {orders.data && orders.data.total > orders.data.list.length && (
                <span className="text-xs text-stone-400">{orders.data.total} đơn</span>
              )}
            </div>

            {orders.isLoading ? (
              <div className="space-y-3">
                {[0, 1].map((item) => (
                  <div
                    key={item}
                    className="h-36 animate-pulse rounded-2xl bg-white dark:bg-stone-900"
                  />
                ))}
              </div>
            ) : orders.isError ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-5 text-center dark:border-stone-800 dark:bg-stone-900">
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Chưa tải được lịch sử đơn hàng.
                </p>
                <button
                  type="button"
                  onClick={() => void orders.refetch()}
                  className="mt-3 min-h-11 rounded-xl bg-stone-100 px-4 text-sm font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-200"
                >
                  Thử lại
                </button>
              </div>
            ) : orders.data?.list.length ? (
              <div className="space-y-3">
                {orders.data.list.map((order) => (
                  <OrderHistoryCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white/55 p-6 text-center dark:border-stone-700 dark:bg-stone-900/50">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  <CoffeeIcon className="size-6" />
                </div>
                <p className="mt-3 font-semibold">Chưa có đơn hàng</p>
                <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">
                  Quét mã bàn để gọi món và bắt đầu tích điểm.
                </p>
              </div>
            )}
          </section>

        </div>
      </div>

      <TableQrScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />
    </main>
  );
}

export default function CustomerAccountPage() {
  const { isHydrated, user } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      window.location.replace(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(ROUTES.ACCOUNT)}`);
      return;
    }
    if (user && user.role !== USER_ROLE.CUSTOMER) {
      window.location.replace(
        ROLE_DEFAULT_ROUTES[user.role] ?? ROUTES.LOGIN,
      );
    }
  }, [isHydrated, user]);

  if (
    !isHydrated ||
    !user ||
    (user && user.role !== USER_ROLE.CUSTOMER)
  ) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f8f5ef] dark:bg-stone-950">
        <div className="text-center">
          <SpinnerIcon className="mx-auto size-7 animate-spin text-brand-600 dark:text-brand-400" />
          <p className="mt-3 text-sm font-medium text-stone-500 dark:text-stone-400">
            Đang mở tài khoản...
          </p>
        </div>
      </main>
    );
  }

  return <CustomerAccountContent />;
}
