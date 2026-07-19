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

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleId = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allIds = tables.map((t) => t.id);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const openPrintSheet = () => {
    const ordered = allIds.filter((id) => selectedIds.has(id));
    if (ordered.length === 0) return;
    window.open(`/admin/tables/print-sheet?ids=${ordered.join(",")}`, "_blank");
  };

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
      key: "select",
      header: "Chọn",
      width: "56px",
      render: (row: TableDto) => (
        <input
          type="checkbox"
          aria-label={`Chọn ${row.name}`}
          checked={selectedIds.has(row.id)}
          onChange={() => toggleId(row.id)}
          className="size-4 accent-brand-500"
        />
      ),
    },
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
        <div className="flex items-center gap-2">
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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Bàn & QR
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Quản lý bàn và mã QR đặt tại bàn
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors"
        >
          + Thêm bàn
        </button>
      </div>
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
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 sm:p-4"
            key={stat.label}
          >
            <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
            <p className={`text-xl sm:text-2xl font-bold mt-1 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Thanh thao tác khi chọn bàn để in hàng loạt */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-800 dark:bg-brand-900/20">
          <p className="text-sm font-medium text-brand-800 dark:text-brand-200">
            Đã chọn {selectedIds.size} bàn
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setSelectedIds(allSelected ? new Set() : new Set(allIds))
              }
              className="rounded-lg border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/40"
            >
              {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
            <button
              onClick={openPrintSheet}
              className="rounded-lg bg-brand-400 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-500"
            >
              🖨️ In QR (4 bàn/tờ)
            </button>
          </div>
        </div>
      )}

      {/* table */}
      <DataTable
        columns={columns}
        data={tables}
        keyExtractor={(row) => row.id}
        isLoading={isLoadingTables}
        total={tables.length}
        emptyText="Chưa có bàn nào. Hãy thêm bàn đầu tiên!"
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
