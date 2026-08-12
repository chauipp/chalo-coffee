"use client";
// src/app/(admin)/admin/orders/page.tsx
import { Badge, BadgeVariant } from "@/components/shared/ui/Badge";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
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
import { useDeleteOrder } from "@/services/order/order.queries";
import { useState } from "react";
import { AdminMobilePageHeader } from "../../_components/AdminMobilePageHeader";
import { MobileFilterSheet } from "../../_components/MobileFilterSheet";

const STATUS_BADGE: Record<OrderStatus, { label: string; variant: BadgeVariant }> =
  {
    PENDING: { label: "Khách đặt", variant: "yellow" },
    CONFIRMED: { label: "Khách đặt", variant: "blue" },
    PREPARING: { label: "Đang pha chế", variant: "blue" },
    READY: { label: "Sẵn sàng phục vụ", variant: "green" },
    COMPLETED: { label: "Đã phục vụ", variant: "gray" },
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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OrderDto | null>(null);
  const deleteOrderMutation = useDeleteOrder();

  const handleDeleteOrder = () => {
    if (!deleteTarget) return;
    deleteOrderMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

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
          {r.customerDisplayName && (
            <p className="mt-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
              {r.customerDisplayName} · +
              {r.paidStatus
                ? (r.loyaltyPointsEarned ?? 0)
                : Math.floor(r.totalAmount / 1_000)}{" "}
              điểm
            </p>
          )}
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
    {
      key: "actions",
      header: "Thao tác",
      render: (r) => (
        <button
          type="button"
          onClick={() => setDeleteTarget(r)}
          className="min-h-10 rounded-lg px-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          Xóa
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <AdminMobilePageHeader
        title="Đơn hàng"
        description="Toàn bộ đơn hàng của quán"
        summary={`${table.pagination.total} đơn`}
      />

      <div className="hidden flex-wrap items-center gap-3 md:flex">
        <Select
          className="w-full sm:w-48"
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
          className="w-full sm:w-48"
          placeholder="Tất cả bàn"
          options={(tables ?? []).map((t) => ({ value: t.id, label: t.name }))}
          onChange={(e) =>
            table.updateFilter({ tableId: e.target.value || undefined })
          }
        />
        <Input
          type="date"
          className="w-full sm:w-44"
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

      <div className="md:hidden">
        <button
          type="button"
          aria-label="Bộ lọc đơn hàng"
          onClick={() => setFilterSheetOpen(true)}
          className="flex min-h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          Lọc đơn hàng
        </button>
      </div>
      <MobileFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Lọc đơn hàng"
      >
        <Select
          aria-label="Trạng thái đơn hàng"
          className="w-full"
          placeholder="Tất cả trạng thái"
          options={ORDER_STATUS.map((status) => ({
            value: status,
            label: STATUS_BADGE[status].label,
          }))}
          value={table.filter.status ?? ""}
          onChange={(event) =>
            table.updateFilter({
              status: (event.target.value as OrderStatus) || undefined,
            })
          }
        />
        <Select
          aria-label="Bàn"
          className="w-full"
          placeholder="Tất cả bàn"
          options={(tables ?? []).map((tableItem) => ({
            value: tableItem.id,
            label: tableItem.name,
          }))}
          value={table.filter.tableId ?? ""}
          onChange={(event) =>
            table.updateFilter({ tableId: event.target.value || undefined })
          }
        />
        <Input
          aria-label="Ngày đặt hàng"
          type="date"
          className="w-full"
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            table.updateFilter({ date: event.target.value || undefined });
          }}
        />
        <div className="flex items-center justify-between gap-3">
          {(table.filter.status || table.filter.tableId || table.filter.date) ? (
            <button
              type="button"
              onClick={() => {
                table.resetFilter();
                setDate("");
              }}
              className="min-h-11 px-2 text-sm font-semibold text-gray-500"
            >
              Xóa bộ lọc
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => setFilterSheetOpen(false)}
            className="min-h-11 rounded-xl bg-brand-400 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
          >
            Áp dụng bộ lọc
          </button>
        </div>
      </MobileFilterSheet>

      <DataTable
        columns={columns}
        data={table.data}
        keyExtractor={(r) => r.id}
        isLoading={table.isLoading}
        pagination={table.pagination}
        onPageChange={table.changePage}
        onPageSizeChange={table.changePageSize}
        emptyText="Không có đơn hàng nào."
        mobileCard={(row) => {
          const status = STATUS_BADGE[row.status];
          return (
            <article
              data-testid="admin-mobile-order-card"
              className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    #{row.id.slice(0, 8)}
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-400">
                    {row.tableName} · {row.items?.length ?? 0} món
                  </p>
                  {row.customerDisplayName && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="max-w-[12rem] truncate font-medium text-sky-700 dark:text-sky-300">
                        {row.customerDisplayName}
                      </span>
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">
                        +
                        {row.paidStatus
                          ? (row.loyaltyPointsEarned ?? 0)
                          : Math.floor(row.totalAmount / 1_000)}{" "}
                        điểm
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge label={status.label} variant={status.variant} />
                  <Badge
                    label={row.paidStatus ? "Đã trả" : "Chưa trả"}
                    variant={row.paidStatus ? "green" : "gray"}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3 border-t border-gray-100 pt-2 dark:border-gray-800">
                <p className="text-xs text-gray-400">
                  {new Date(row.createdAt).toLocaleString("vi-VN")}
                </p>
                <p className="shrink-0 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {row.totalAmount.toLocaleString("vi-VN")}đ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(row)}
                className="mt-3 min-h-11 w-full rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/70 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                Xóa đơn
              </button>
            </article>
          );
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteOrder}
        title="Xóa vĩnh viễn đơn hàng"
        message={`Xóa đơn #${deleteTarget?.id.slice(0, 8) ?? ""}? Món, điểm tích lũy và khoản thanh toán của đơn sẽ bị xóa. Không thể khôi phục.`}
        confirmLabel="Xóa đơn"
        isLoading={deleteOrderMutation.isPending}
      />
    </div>
  );
}
