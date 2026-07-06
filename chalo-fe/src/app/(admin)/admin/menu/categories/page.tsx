"use client";
// src/app/(admin)/admin/menu/categories/page.tsx
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { Modal } from "@/components/shared/ui/Modal";
import { CategoryFormType } from "@/schemas/menu.schema";
import {
  useCreateCategory,
  useDeleteCategory,
  useGetCategoryList,
  useUpdateCategory,
} from "@/services/menu/menu.queries";
import { CategoryDto } from "@/services/menu/menu.types";
import { useState } from "react";
import { CategoryForm } from "./_components/CategoryForm";
import { DataTable } from "@/components/shared/ui/DataTable";
import { Badge } from "@/components/shared/ui/Badge";
import { Toggle } from "@/components/shared/ui/Toggle";
import { ROUTES } from "@/constants";
import Link from "next/link";

export default function CategoriesPage() {
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState<CategoryDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null);

  const { data: categories, isLoading } = useGetCategoryList();
  const createCateMutation = useCreateCategory();
  const updateCateMutation = useUpdateCategory();
  const deleteCateMutation = useDeleteCategory();

  const handleCreateCate = async (data: CategoryFormType) => {
    await createCateMutation.mutateAsync(data);
    setCreateOpen(false);
  };

  const handleUpdateCate = async (data: CategoryFormType) => {
    if (!editTarget) return;
    await updateCateMutation.mutateAsync({ ...data, id: editTarget.id });
    setEditTarget(null);
  };

  const handleDeleteCate = async () => {
    if (!deleteTarget) return;
    await deleteCateMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns = [
    {
      key: "name",
      header: "Tên danh mục",
      render: (cate: CategoryDto) => (
        <Link
          href={`${ROUTES.ADMIN.MENU_PRODUCTS}?categoryId=${cate.id}`}
          className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
        >
          {cate.name}
        </Link>
      ),
    },
    {
      key: "description",
      header: "Mô tả",
      render: (cate: CategoryDto) => (
        <span className="max-w-xs truncate text-gray-500 block">
          {cate.description ?? "-"}
        </span>
      ),
    },
    {
      key: "productCount",
      header: "Số món",
      render: (cate: CategoryDto) => (
        <Badge label={`${cate.productCount}`} variant="blue" />
      ),
    },
    {
      key: "isActive",
      header: "Trạng thái",
      render: (cate: CategoryDto) => (
        <Toggle
          checked={cate.isActive}
          onChange={() =>
            updateCateMutation.mutate({ ...cate, isActive: !cate.isActive })
          }
          disabled={
            updateCateMutation.isPending &&
            updateCateMutation.variables.id === cate.id
          }
        />
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (cate: CategoryDto) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditTarget(cate)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20 transition-colors"
          >
            Sửa
          </button>
          <button
            onClick={() => setDeleteTarget(cate)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            Xoá
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Danh mục
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Quản lý danh mục thực đơn
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors"
        >
          + Thêm danh mục
        </button>
      </div>

      {/* table */}
      <div>
        <DataTable
          columns={columns}
          data={categories ?? []}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
        />
      </div>

      {/* create modal */}
      <Modal
        open={createOpen}
        title="Thêm danh mục mới"
        onClose={() => setCreateOpen(false)}
      >
        <CategoryForm
          onSubmit={handleCreateCate}
          onCancel={() => setCreateOpen(false)}
          isLoading={createCateMutation.isPending}
        />
      </Modal>

      {/* edit modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Sửa danh mục"
      >
        {editTarget && (
          <CategoryForm
            defaultValues={editTarget}
            onSubmit={handleUpdateCate}
            onCancel={() => setEditTarget(null)}
            isLoading={updateCateMutation.isPending}
          />
        )}
      </Modal>

      {/* delete confirm  */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Xác nhận xoá danh mục ${deleteTarget?.name}`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteCate}
          open={!!deleteTarget}
          isLoading={deleteCateMutation.isPending}
          confirmLabel="Xoá danh mục"
          title="Xóa danh mục"
        />
      )}
    </div>
  );
}
