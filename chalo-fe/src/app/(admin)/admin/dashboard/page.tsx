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

export default function AdminDashboardPage() {
  const [filter, setFilter] = useState<DashboardFilter>({ period: Period.DAY });

  const revenueQuery = useGetRevenueStats(filter);
  const topProductsQuery = useGetTopProducts({ limit: 5, from: filter.from, to: filter.to });

  const revenue = revenueQuery.data;
  const topProducts = topProductsQuery.data ?? [];
  const bestSeller = topProducts[0];

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tổng quan</h1>
          <p className="mt-0.5 text-sm text-gray-500">Doanh thu &amp; sản phẩm bán chạy</p>
        </div>
        <DashboardControls value={filter} onChange={setFilter} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        <StatCard
          label="Bán chạy nhất"
          value={bestSeller?.productName ?? "—"}
          hint={bestSeller ? `${bestSeller.totalQuantity} ly đã bán` : undefined}
          icon="⭐"
          isLoading={topProductsQuery.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart data={revenue?.data ?? []} isLoading={revenueQuery.isLoading} />
        <TopProductsChart data={topProducts} isLoading={topProductsQuery.isLoading} />
      </div>
    </div>
  );
}
