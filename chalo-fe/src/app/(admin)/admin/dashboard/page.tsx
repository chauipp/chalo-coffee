"use client";
// src/app/(admin)/admin/dashboard/page.tsx
import { useState } from "react";
import { Period } from "@/services/types";
import { useGetActiveOrder, useGetRevenueStats, useGetTopProducts } from "@/services/order/order.queries";
import { formatVnd } from "@/utils/format";
import { StatCard } from "./_components/StatCard";
import { DashboardControls, DashboardFilter } from "./_components/DashboardControls";
import { RevenueChart } from "./_components/RevenueChart";
import { TopProductsChart } from "./_components/TopProductsChart";
import { AdminMobilePageHeader } from "../../_components/AdminMobilePageHeader";
import { useLowStockIngredients } from "@/services/inventory";
import { useCurrentShift } from "@/services/shift/shift.queries";
import { ActionHub } from "./_components/ActionHub";

export default function AdminDashboardPage() {
  const [filter, setFilter] = useState<DashboardFilter>({ period: Period.DAY });

  const revenueQuery = useGetRevenueStats(filter);
  const topProductsQuery = useGetTopProducts({ limit: 5, from: filter.from, to: filter.to });

  const revenue = revenueQuery.data;
  const topProducts = topProductsQuery.data ?? [];
  const bestSeller = topProducts[0];
  const lowStockQuery = useLowStockIngredients();
  const activeOrdersQuery = useGetActiveOrder();
  const currentShiftQuery = useCurrentShift();

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <AdminMobilePageHeader
        title="Tổng quan"
        description="Doanh thu & sản phẩm bán chạy"
        action={<DashboardControls value={filter} onChange={setFilter} />}
      />

      <ActionHub
        activeOrders={{
          data: activeOrdersQuery.data,
          isLoading: activeOrdersQuery.isLoading,
          isError: activeOrdersQuery.isError,
          onRetry: () => void activeOrdersQuery.refetch(),
        }}
        shift={{
          data: currentShiftQuery.data,
          isLoading: currentShiftQuery.isLoading,
          isError: currentShiftQuery.isError,
          onRetry: () => void currentShiftQuery.refetch(),
        }}
        lowStock={{
          data: lowStockQuery.data,
          isLoading: lowStockQuery.isLoading,
          isError: lowStockQuery.isError,
          onRetry: () => void lowStockQuery.refetch(),
        }}
      />

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
