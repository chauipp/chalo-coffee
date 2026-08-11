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
import { AdminMobilePageHeader } from "../../_components/AdminMobilePageHeader";
import { MobileFilterSheet } from "../../_components/MobileFilterSheet";

const INITIAL_FILTER: UserPageParams = { pageNo: 1, pageSize: 10 };

export default function StaffPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserDto | null>(null);
  const [pwTarget, setPwTarget] = useState<UserDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

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
        <div className="flex items-center gap-2 [&>button]:min-h-11">
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
    <div className="space-y-5 p-4 sm:p-6">
      <AdminMobilePageHeader
        title="Nhân viên"
        description="Quản lý tài khoản nhân viên & quản trị"
        summary={`${table.pagination.total} tài khoản`}
        action={
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full rounded-xl bg-brand-400 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500 sm:w-auto"
          >
            + Thêm nhân viên
          </button>
        }
      />

      <div className="hidden flex-wrap items-center gap-3 md:flex">
        <Input
          placeholder="Tìm tên / tài khoản..."
          className="w-full sm:w-56"
          onChange={(e) =>
            table.updateFilter({ keyword: e.target.value || undefined })
          }
        />
        <Select
          className="w-full sm:w-44"
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
          className="w-full sm:w-44"
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

      <div className="flex gap-2 md:hidden">
        <Input
          aria-label="Tìm nhân viên"
          placeholder="Tìm tên / tài khoản..."
          value={table.filter.keyword ?? ""}
          className="min-w-0 flex-1"
          onChange={(event) =>
            table.updateFilter({ keyword: event.target.value || undefined })
          }
        />
        <button
          type="button"
          aria-label="Bộ lọc nhân viên"
          onClick={() => setFilterSheetOpen(true)}
          className="min-h-11 shrink-0 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          Lọc
        </button>
      </div>
      <MobileFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Lọc nhân viên"
      >
        <Select
          aria-label="Vai trò nhân viên"
          className="w-full"
          placeholder="Tất cả vai trò"
          options={[
            { label: "Quản trị", value: "ADMIN" },
            { label: "Nhân viên", value: "MODERATOR" },
          ]}
          value={table.filter.role ?? ""}
          onChange={(event) =>
            table.updateFilter({
              role: (event.target.value as UserDto["role"]) || undefined,
            })
          }
        />
        <Select
          aria-label="Trạng thái nhân viên"
          className="w-full"
          placeholder="Tất cả trạng thái"
          options={[
            { label: "Đang hoạt động", value: "true" },
            { label: "Ngừng", value: "false" },
          ]}
          value={
            table.filter.isActive === undefined
              ? ""
              : String(table.filter.isActive)
          }
          onChange={(event) =>
            table.updateFilter({
              isActive:
                event.target.value === ""
                  ? undefined
                  : event.target.value === "true",
            })
          }
        />
        <div className="flex justify-end">
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
        emptyText="Chưa có nhân viên nào."
        mobileCard={(row) => (
          <article
            data-testid="admin-mobile-staff-card"
            className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {row.fullName}
                </p>
                <p className="mt-1 truncate text-xs text-gray-400">
                  @{row.username}
                </p>
              </div>
              <Badge
                label={row.role === "ADMIN" ? "Quản trị" : "Nhân viên"}
                variant={row.role === "ADMIN" ? "blue" : "gray"}
              />
            </div>
            <div className="mt-3 flex min-h-11 items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
              <Toggle
                checked={row.isActive}
                onChange={(isActive) => handleToggleActive(row, isActive)}
                disabled={updateM.isPending}
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setEditTarget(row)}
                  className="min-h-11 px-2 text-xs font-semibold text-brand-600"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => setPwTarget(row)}
                  className="min-h-11 px-2 text-xs font-semibold text-gray-600 dark:text-gray-300"
                >
                  Đổi MK
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(row)}
                  className="min-h-11 px-2 text-xs font-semibold text-red-600"
                >
                  Xóa
                </button>
              </div>
            </div>
          </article>
        )}
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
