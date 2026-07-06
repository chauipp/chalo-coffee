"use client";
// src/app/(admin)/admin/staff/page.tsx
import { Badge } from "@/components/shared/ui/Badge";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { Column, DataTable } from "@/components/shared/ui/DataTable";
import { Input } from "@/components/shared/ui/Input";
import { Modal } from "@/components/shared/ui/Modal";
import { Select } from "@/components/shared/ui/Select";
import { Toggle } from "@/components/shared/ui/Toggle";
import { QUERY_KEYS } from "@/constants";
import { useTablePagination } from "@/hooks/useTablePagination";
import {
  ChangePasswordType,
  StaffCreateType,
  StaffUpdateType,
} from "@/schemas/user.schema";
import {
  getUserPage,
  UserDto,
  UserPageParams,
  useChangePassword,
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
} from "@/services/user";
import { useState } from "react";
import { ChangePasswordForm } from "./_components/ChangePasswordForm";
import { StaffForm } from "./_components/StaffForm";

const INITIAL_FILTER: UserPageParams = { pageNo: 1, pageSize: 10 };

export default function StaffPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserDto | null>(null);
  const [pwTarget, setPwTarget] = useState<UserDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null);

  const createM = useCreateUser();
  const updateM = useUpdateUser();
  const pwM = useChangePassword();
  const deleteM = useDeleteUser();

  const table = useTablePagination<UserDto, UserPageParams>({
    initialFilter: INITIAL_FILTER,
    queryFn: getUserPage,
    queryKey: QUERY_KEYS.USERS.ALL,
  });

  const handleCreate = (data: StaffCreateType) =>
    createM.mutate(data, { onSuccess: () => setCreateOpen(false) });

  const handleUpdate = (data: StaffUpdateType) => {
    if (!editTarget) return;
    updateM.mutate(
      { id: editTarget.id, avatar: editTarget.avatar, ...data },
      { onSuccess: () => setEditTarget(null) },
    );
  };

  const handleToggleActive = (row: UserDto, isActive: boolean) =>
    updateM.mutate({
      id: row.id,
      fullName: row.fullName,
      avatar: row.avatar,
      role: row.role,
      isActive,
    });

  const handleChangePw = (data: ChangePasswordType) => {
    if (!pwTarget) return;
    pwM.mutate(
      { id: pwTarget.id, newPassword: data.newPassword },
      { onSuccess: () => setPwTarget(null) },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteM.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  const columns: Array<Column<UserDto>> = [
    {
      key: "user",
      header: "Nhân viên",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {r.fullName}
          </p>
          <p className="text-xs text-gray-400">@{r.username}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Vai trò",
      render: (r) => (
        <Badge
          label={r.role === "ADMIN" ? "Quản trị" : "Nhân viên"}
          variant={r.role === "ADMIN" ? "blue" : "gray"}
        />
      ),
    },
    {
      key: "active",
      header: "Hoạt động",
      render: (r) => (
        <Toggle
          checked={r.isActive}
          onChange={(v) => handleToggleActive(r, v)}
          disabled={updateM.isPending}
        />
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditTarget(r)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20 transition-colors"
          >
            Sửa
          </button>
          <button
            onClick={() => setPwTarget(r)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Đổi MK
          </button>
          <button
            onClick={() => setDeleteTarget(r)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            Xoá
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Nhân viên
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Quản lý tài khoản nhân viên & quản trị
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors"
        >
          + Thêm nhân viên
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Tìm tên / tài khoản..."
          className="w-56"
          onChange={(e) =>
            table.updateFilter({ keyword: e.target.value || undefined })
          }
        />
        <Select
          className="w-44"
          placeholder="Tất cả vai trò"
          options={[
            { label: "Quản trị", value: "ADMIN" },
            { label: "Nhân viên", value: "MODERATOR" },
          ]}
          onChange={(e) =>
            table.updateFilter({
              role: (e.target.value as UserDto["role"]) || undefined,
            })
          }
        />
        <Select
          className="w-44"
          placeholder="Tất cả trạng thái"
          options={[
            { label: "Đang hoạt động", value: "true" },
            { label: "Ngừng", value: "false" },
          ]}
          onChange={(e) =>
            table.updateFilter({
              isActive:
                e.target.value === "" ? undefined : e.target.value === "true",
            })
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
        emptyText="Chưa có nhân viên nào."
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Thêm nhân viên"
      >
        <StaffForm
          onSubmitCreate={handleCreate}
          onCancel={() => setCreateOpen(false)}
          isLoading={createM.isPending}
        />
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Chỉnh sửa nhân viên"
      >
        {editTarget && (
          <StaffForm
            defaultValue={editTarget}
            onSubmitUpdate={handleUpdate}
            onCancel={() => setEditTarget(null)}
            isLoading={updateM.isPending}
          />
        )}
      </Modal>

      <Modal
        open={!!pwTarget}
        onClose={() => setPwTarget(null)}
        title={`Đổi mật khẩu · ${pwTarget?.fullName ?? ""}`}
      >
        {pwTarget && (
          <ChangePasswordForm
            onSubmit={handleChangePw}
            onCancel={() => setPwTarget(null)}
            isLoading={pwM.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xoá nhân viên"
        message={`Xác nhận xoá tài khoản "${deleteTarget?.fullName}"?`}
        confirmLabel="Xoá"
        isLoading={deleteM.isPending}
      />
    </div>
  );
}
