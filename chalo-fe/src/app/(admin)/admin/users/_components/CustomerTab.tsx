"use client";
// src/app/(admin)/admin/users/_components/CustomerTab.tsx
import { Badge } from "@/components/shared/ui/Badge";
import { Column, DataTable } from "@/components/shared/ui/DataTable";
import { Input } from "@/components/shared/ui/Input";
import { Modal } from "@/components/shared/ui/Modal";
import { Toggle } from "@/components/shared/ui/Toggle";
import { QUERY_KEYS } from "@/constants";
import { useTablePagination } from "@/hooks/useTablePagination";
import {
  CustomerDto,
  CustomerPageParams,
  getCustomerPage,
  useSetCustomerActive,
} from "@/services/customer-admin";
import { useState } from "react";
import { CustomerDetailContent } from "./CustomerDetailContent";

const INITIAL_FILTER: CustomerPageParams = { pageNo: 1, pageSize: 10 };

export function CustomerTab() {
  const [detailTarget, setDetailTarget] = useState<CustomerDto | null>(null);
  const setActiveM = useSetCustomerActive();

  const table = useTablePagination<CustomerDto, CustomerPageParams>({
    initialFilter: INITIAL_FILTER,
    queryFn: getCustomerPage,
    queryKey: QUERY_KEYS.CUSTOMERS.ALL,
  });

  const handleToggleActive = (row: CustomerDto, isActive: boolean) =>
    setActiveM.mutate({ id: row.id, isActive });

  const columns: Array<Column<CustomerDto>> = [
    {
      key: "customer",
      header: "Khách hàng",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {r.fullName}
          </p>
          <p className="text-xs text-gray-400">
            @{r.username}
            {r.email ? ` · ${r.email}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (r) => (
        <Badge
          label={r.isActive ? "Hoạt động" : "Đã khoá"}
          variant={r.isActive ? "green" : "gray"}
        />
      ),
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      render: (r) => new Date(r.createdAt).toLocaleDateString("vi-VN"),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (r) => (
        <div className="flex items-center gap-3 [&>button]:min-h-11">
          <button
            onClick={() => setDetailTarget(r)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20 transition-colors"
          >
            Xem
          </button>
          <Toggle
            checked={r.isActive}
            onChange={(v) => handleToggleActive(r, v)}
            disabled={setActiveM.isPending}
            testId="customer-active-toggle"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          {table.pagination.total} khách hàng
        </p>
        <Input
          placeholder="Tìm tên / tài khoản..."
          className="w-full sm:w-64"
          onChange={(e) =>
            table.updateFilter({ keyword: e.target.value || undefined })
          }
        />
      </div>

      <DataTable
        columns={columns}
        data={table.data}
        keyExtractor={(r) => r.id}
        isLoading={table.isLoading}
        pagination={table.pagination}
        onPageChange={table.changePage}
        onPageSizeChange={table.changePageSize}
        emptyText="Chưa có khách hàng nào."
        mobileCard={(row) => (
          <article
            data-testid="admin-mobile-customer-card"
            className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {row.fullName}
                </p>
                <p className="mt-1 truncate text-xs text-gray-400">
                  @{row.username}
                  {row.email ? ` · ${row.email}` : ""}
                </p>
              </div>
              <Badge
                label={row.isActive ? "Hoạt động" : "Đã khoá"}
                variant={row.isActive ? "green" : "gray"}
              />
            </div>
            <div className="mt-3 flex min-h-11 items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
              <Toggle
                checked={row.isActive}
                onChange={(isActive) => handleToggleActive(row, isActive)}
                disabled={setActiveM.isPending}
                testId="customer-active-toggle"
              />
              <button
                type="button"
                onClick={() => setDetailTarget(row)}
                className="min-h-11 px-2 text-xs font-semibold text-brand-600"
              >
                Xem
              </button>
            </div>
          </article>
        )}
      />

      <Modal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={
          detailTarget ? `Khách hàng · ${detailTarget.fullName}` : "Khách hàng"
        }
        size="lg"
      >
        {detailTarget && <CustomerDetailContent customer={detailTarget} />}
      </Modal>
    </div>
  );
}
