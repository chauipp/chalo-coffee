"use client";
// src/app/(admin)/admin/dashboard/page.tsx
import { useState } from "react";
import { Period } from "@/services/types";
import { useGetRevenueStats, useGetTopProducts } from "@/services/order/order.queries";
import { formatVnd } from "@/utils/format";
import { StatCard } from "./_components/StatCard";
import { DashboardControls, DashboardFilter } from "./_components/DashboardControls";
import { RevenueChart } from "./_components/RevenueChart";
import { TopProductsChart } from "./_components/TopProductsChart";
import { AdminMobilePageHeader } from "../../_components/AdminMobilePageHeader";
import { useLowStockIngredients } from "@/services/inventory";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [filter, setFilter] = useState<DashboardFilter>({ period: Period.DAY });

  const revenueQuery = useGetRevenueStats(filter);
  const topProductsQuery = useGetTopProducts({ limit: 5, from: filter.from, to: filter.to });

  const revenue = revenueQuery.data;
  const topProducts = topProductsQuery.data ?? [];
  const bestSeller = topProducts[0];
  const lowStockQuery = useLowStockIngredients();

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <AdminMobilePageHeader
        title="Tổng quan"
        description="Doanh thu & sản phẩm bán chạy"
        action={<DashboardControls value={filter} onChange={setFilter} />}
      />

      {lowStockQuery.data?.length ? (
        <Link
          href="/admin/inventory"
          className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 transition hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100 dark:hover:bg-amber-950/50"
        >
          <span><strong>{lowStockQuery.data.length} nguyên liệu</strong> đang cần nhập hoặc đã hết — một số món có thể tự ngừng bán.</span>
          <span className="shrink-0 font-semibold">Xem tồn kho →</span>
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="Tổng doanh thu"
          value={formatVnd(revenue?.totalRevenue ?? 0)}
          icon="💰"
          isLoading={revenueQuery.isLoading}
        />
        <StatCard
          label="Tổng số đơn"
          value={String(revenue?.totalOrders ?? 0)}
          icon="🧾"
          isLoading={revenueQuery.isLoading}
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label="Bán chạy nhất"
            value={bestSeller?.productName ?? "—"}
            hint={
              bestSeller ? `${bestSeller.totalQuantity} ly đã bán` : undefined
            }
            icon="⭐"
            isLoading={topProductsQuery.isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart data={revenue?.data ?? []} isLoading={revenueQuery.isLoading} />
        <TopProductsChart data={topProducts} isLoading={topProductsQuery.isLoading} />
      </div>
    </div>
  );
}
