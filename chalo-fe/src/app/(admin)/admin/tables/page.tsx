"use client";
// src/app/(admin)/admin/tables/page.tsx
import { Badge, BadgeVariant } from "@/components/shared/ui/Badge";
import { Column, DataTable } from "@/components/shared/ui/DataTable";
import { Modal } from "@/components/shared/ui/Modal";
import { TableFormType } from "@/schemas/table.schema";
import {
  TableDto,
  TableStatus,
  useCreateTable,
  useDeleteTable,
  useGetTableList,
  useUpdateTable,
} from "@/services/table";
import { useState } from "react";
import { TableForm } from "./_components/TableForm";
import { QRModal } from "./_components/QRModal";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { AdminMobilePageHeader } from "../../_components/AdminMobilePageHeader";

const TABLE_BADGE: Record<
  TableStatus,
  { label: string; variant: BadgeVariant }
> = {
  AVAILABLE: { label: "Trống", variant: "green" },
  OCCUPIED: { label: "Đang được sử dụng", variant: "red" },
};

export default function TablesPage() {
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState<TableDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TableDto | null>(null);
  const [qrTarget, setQrTarget] = useState<TableDto | null>(null);

  const createTableMutation = useCreateTable();
  const updateTableMutation = useUpdateTable();
  const deleteTableMutation = useDeleteTable();

  const { data: tables = [], isLoading: isLoadingTables } = useGetTableList();

  const handleCreateTable = (data: TableFormType) => {
    createTableMutation.mutate(data, {
      onSuccess: () => setCreateOpen(false),
    });
  };

  const handleUpdateTable = (data: TableFormType) => {
    if (!editTarget) return;
    updateTableMutation.mutate(
      {
        ...data,
        id: editTarget.id,
      },
      { onSuccess: () => setEditTarget(null) },
    );
  };

  const handleDeleteTable = () => {
    if (!deleteTarget) return;
    deleteTableMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const columns: Array<Column<TableDto>> = [
    {
      key: "name",
      header: "Bàn",
      render: (row: TableDto) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {row.name}
          </p>
          <p className="text-xs text-gray-400">
            {row.area || "Không phân khu"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row: TableDto) => {
        const s = TABLE_BADGE[row.status];
        return <Badge label={`${s.label}`} variant={`${s.variant}`} />;
      },
    },
    {
      key: "qr",
      header: "QR",
      render: (row: TableDto) => {
        return (
          <button
            onClick={() => setQrTarget(row)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20 transition-colors"
          >
            📱 Xem QR
          </button>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (row: TableDto) => (
        <div className="flex items-center gap-2 [&>button]:min-h-11">
          <button
            onClick={() => setEditTarget(row)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20 transition-colors"
          >
            Sửa
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            disabled={row.status === "OCCUPIED"}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* header */}
      <AdminMobilePageHeader
        title="Bàn & QR"
        description="Quản lý bàn và mã QR đặt tại bàn"
        summary={`${tables.length} bàn`}
        action={
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full rounded-xl bg-brand-400 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500 sm:w-auto"
          >
            + Thêm bàn
          </button>
        }
      />
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          {
            label: "Tổng số bàn",
            value: tables.length,
            color: "text-gray-900 dark:text-gray-100",
          },
          {
            label: "Đang có khách",
            value: tables.filter((t) => t.status === "OCCUPIED").length,
            color: "text-red-600",
          },
          {
            label: "Bàn trống",
            value: tables.filter((t) => t.status === "AVAILABLE").length,
            color: "text-green-600",
          },
        ].map((stat) => (
          <div
            className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 sm:p-4"
            key={stat.label}
          >
            <p className="text-xs text-gray-500 sm:text-sm">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* table */}
      <DataTable
        columns={columns}
        data={tables}
        keyExtractor={(row) => row.id}
        isLoading={isLoadingTables}
        total={tables.length}
        emptyText="Chưa có bàn nào. Hãy thêm bàn đầu tiên!"
        mobileCard={(row) => {
          const status = TABLE_BADGE[row.status];
          return (
            <article
              data-testid="admin-mobile-table-card"
              className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {row.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {row.area || "Không phân khu"}
                  </p>
                </div>
                <Badge label={status.label} variant={status.variant} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setQrTarget(row)}
                  className="min-h-11 rounded-lg px-3 text-xs font-semibold text-brand-600"
                >
                  Xem QR
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTarget(row)}
                    className="min-h-11 rounded-lg px-3 text-xs font-semibold text-brand-600"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    disabled={row.status === "OCCUPIED"}
                    className="min-h-11 rounded-lg px-3 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </article>
          );
        }}
      />

      {/* create */}
      <Modal
        open={!!createOpen}
        onClose={() => setCreateOpen(false)}
        title="Thêm bàn mới"
      >
        <TableForm
          isLoading={createTableMutation.isPending}
          onSubmit={handleCreateTable}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      {/* Edit */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Chỉnh sửa bàn"
      >
        {editTarget && (
          <TableForm
            defaultValue={editTarget}
            onSubmit={handleUpdateTable}
            onCancel={() => setEditTarget(null)}
            isLoading={updateTableMutation.isPending}
          />
        )}
      </Modal>

      {/* QR Modal */}
      <QRModal table={qrTarget} onClose={() => setQrTarget(null)} />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTable}
        title="Xóa bàn"
        message={`Xác nhận xóa "${deleteTarget?.name}"? Mã QR của bàn này sẽ mất hiệu lực.`}
        confirmLabel="Xóa bàn"
        isLoading={deleteTableMutation.isPending}
      />
    </div>
  );
}
