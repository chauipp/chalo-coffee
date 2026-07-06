"use client";
// src/app/(admin)/admin/dashboard/_components/RevenueChart.tsx
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts";
import { RevenueDataPoint } from "@/services/order/order.types";
import { formatVnd, formatVndCompact } from "@/utils/format";

export function RevenueChart({
  data,
  isLoading,
}: {
  data: RevenueDataPoint[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return <div className="h-72 w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />;
  }
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-gray-200 text-sm text-gray-400 dark:border-gray-700">
        Chưa có dữ liệu doanh thu
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Doanh thu</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis
            yAxisId="left"
            tickFormatter={formatVndCompact}
            tick={{ fontSize: 12 }}
            width={56}
          />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            formatter={(val, name) =>
              name === "Doanh thu" ? formatVnd(Number(val)) : val
            }
          />
          <Legend />
          <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          <Line yAxisId="right" dataKey="orderCount" name="Số đơn" stroke="#2563eb" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
