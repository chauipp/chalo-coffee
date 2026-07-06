"use client";
// src/app/(admin)/admin/dashboard/_components/TopProductsChart.tsx
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { TopProductItem } from "@/services/order/order.types";
import { formatVnd } from "@/utils/format";

export function TopProductsChart({
  data,
  isLoading,
}: {
  data: TopProductItem[];
  isLoading?: boolean;
}) {
  if (isLoading) return <div className="h-72 w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />;
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-gray-200 text-sm text-gray-400 dark:border-gray-700">
        Chưa có sản phẩm bán chạy
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Sản phẩm bán chạy</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
          <YAxis type="category" dataKey="productName" width={120} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(val, name) =>
              name === "Doanh thu" ? formatVnd(Number(val)) : `${val} ly`
            }
          />
          <Bar dataKey="totalQuantity" name="Số lượng" fill="#f59e0b" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
