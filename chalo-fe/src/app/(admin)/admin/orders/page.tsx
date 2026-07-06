"use client";
// src/app/(admin)/admin/orders/page.tsx
import { Badge, BadgeVariant } from "@/components/shared/ui/Badge";
import { Column, DataTable } from "@/components/shared/ui/DataTable";
import { Input } from "@/components/shared/ui/Input";
import { Select } from "@/components/shared/ui/Select";
import { QUERY_KEYS } from "@/constants";
import { useTablePagination } from "@/hooks/useTablePagination";
import { getOrderPage } from "@/services/order/order.api";
import {
  OrderDto,
  OrderPageParams,
  OrderStatus,
  ORDER_STATUS,
} from "@/services/order/order.types";
import { useGetTableList } from "@/services/table";
import { useState } from "react";

const STATUS_BADGE: Record<OrderStatus, { label: string; variant: BadgeVariant }> =
  {
    PENDING: { label: "Chờ xác nhận", variant: "yellow" },
    CONFIRMED: { label: "Đã xác nhận", variant: "blue" },
    PREPARING: { label: "Đang pha chế", variant: "blue" },
    READY: { label: "Sẵn sàng", variant: "green" },
    COMPLETED: { label: "Hoàn tất", variant: "gray" },
    CANCELLED: { label: "Đã huỷ", variant: "red" },
  };

const INITIAL_FILTER: OrderPageParams = { pageNo: 1, pageSize: 20 };

export default function AdminOrdersPage() {
  const { data: tables } = useGetTableList();
  const table = useTablePagination<OrderDto, OrderPageParams>({
    initialFilter: INITIAL_FILTER,
    queryFn: getOrderPage,
    queryKey: QUERY_KEYS.ORDERS.PAGE({}),
  });
  const [date, setDate] = useState("");

  const columns: Array<Column<OrderDto>> = [
    {
      key: "order",
      header: "Đơn",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            #{r.id.slice(0, 8)}
          </p>
          <p className="text-xs text-gray-400">{r.tableName}</p>
        </div>
      ),
    },
    {
      key: "items",
      header: "Số món",
      render: (r) => <span>{r.items?.length ?? 0}</span>,
    },
    {
      key: "total",
      header: "Tổng tiền",
      render: (r) => (
        <span className="font-medium">
          {r.totalAmount.toLocaleString("vi-VN")}đ
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (r) => {
        const s = STATUS_BADGE[r.status];
        return <Badge label={s.label} variant={s.variant} />;
      },
    },
    {
      key: "paid",
      header: "Thanh toán",
      render: (r) => (
        <Badge
          label={r.paidStatus ? "Đã trả" : "Chưa trả"}
          variant={r.paidStatus ? "green" : "gray"}
        />
      ),
    },
    {
      key: "createdAt",
      header: "Thời gian",
      render: (r) => (
        <span className="text-gray-500">
          {new Date(r.createdAt).toLocaleString("vi-VN")}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Đơn hàng
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">Toàn bộ đơn hàng của quán</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select
          className="w-48"
          placeholder="Tất cả trạng thái"
          options={ORDER_STATUS.map((s) => ({
            value: s,
            label: STATUS_BADGE[s].label,
          }))}
          onChange={(e) =>
            table.updateFilter({
              status: (e.target.value as OrderStatus) || undefined,
            })
          }
        />
        <Select
          className="w-48"
          placeholder="Tất cả bàn"
          options={(tables ?? []).map((t) => ({ value: t.id, label: t.name }))}
          onChange={(e) =>
            table.updateFilter({ tableId: e.target.value || undefined })
          }
        />
        <Input
          type="date"
          className="w-44"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            table.updateFilter({ date: e.target.value || undefined });
          }}
        />
        {(table.filter.status || table.filter.tableId || table.filter.date) && (
          <button
            onClick={() => {
              table.resetFilter();
              setDate("");
            }}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Xoá bộ lọc
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={table.data}
        keyExtractor={(r) => r.id}
        isLoading={table.isLoading}
        pagination={table.pagination}
        onPageChange={table.changePage}
        onPageSizeChange={table.changePageSize}
        emptyText="Không có đơn hàng nào."
      />
    </div>
  );
}
