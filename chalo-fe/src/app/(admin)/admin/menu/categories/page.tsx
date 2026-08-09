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
import { AdminMobilePageHeader } from "../../../_components/AdminMobilePageHeader";

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
        <div className="flex items-center gap-2 [&>button]:min-h-11">
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
    <div className="space-y-6 p-4 sm:p-6">
      {/* header */}
      <AdminMobilePageHeader
        title="Danh mục"
        description="Quản lý danh mục thực đơn"
        summary={`${categories?.length ?? 0} danh mục`}
        action={
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full rounded-xl bg-brand-400 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500 sm:w-auto"
          >
            + Thêm danh mục
          </button>
        }
      />

      {/* table */}
      <div>
        <DataTable
          columns={columns}
          data={categories ?? []}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          mobileCard={(cate) => (
            <article
              data-testid="admin-mobile-category-card"
              className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`${ROUTES.ADMIN.MENU_PRODUCTS}?categoryId=${cate.id}`}
                    className="block truncate text-sm font-semibold text-gray-900 dark:text-gray-100"
                  >
                    {cate.name}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-400">
                    {cate.description ?? "Không có mô tả"}
                  </p>
                </div>
                <Badge label={`${cate.productCount} món`} variant="blue" />
              </div>
              <div className="mt-3 flex min-h-11 items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
                <Toggle
                  checked={cate.isActive}
                  onChange={() =>
                    updateCateMutation.mutate({
                      ...cate,
                      isActive: !cate.isActive,
                    })
                  }
                  disabled={
                    updateCateMutation.isPending &&
                    updateCateMutation.variables.id === cate.id
                  }
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTarget(cate)}
                    className="min-h-11 px-3 text-xs font-semibold text-brand-600"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(cate)}
                    className="min-h-11 px-3 text-xs font-semibold text-red-600"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </article>
          )}
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
