"use client";
// src/app/(admin)/admin/menu/products/page.tsx
import { Badge, BadgeVariant } from "@/components/shared/ui/Badge";
import { Column, DataTable } from "@/components/shared/ui/DataTable";
import { Input } from "@/components/shared/ui/Input";
import { Modal } from "@/components/shared/ui/Modal";
import { Select } from "@/components/shared/ui/Select";
import { Toggle } from "@/components/shared/ui/Toggle";
import { useInfinitePagination } from "@/hooks/useInfinitePagination";
import { ProductFormType } from "@/schemas/menu.schema";
import { useGetCategorySimpleList } from "@/services/lookup/lookup.queries";
import { getProductPage } from "@/services/menu/menu.api";
import {
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
  useUpdateProductStatus,
} from "@/services/menu/menu.queries";
import {
  ProductDto,
  ProductPageParam,
  ProductStatus,
} from "@/services/menu/menu.types";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ProductForm } from "./_components/ProductForm";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { QUERY_KEYS, ROUTES } from "@/constants";
import { useAuthStore } from "@/stores/auth.store";
import {
  clearProductDraft,
  readProductListState,
  saveProductListState,
} from "@/utils/admin-persistence";
import { useRouter, useSearchParams } from "next/navigation";

const STATUS_BADGE: Record<
  ProductStatus,
  {
    label: string;
    variant: Extract<BadgeVariant, "green" | "red" | "gray">;
  }
> = {
  AVAILABLE: { label: "Còn hàng", variant: "green" },
  OUT_OF_STOCK: { label: "Hết hàng", variant: "red" },
  UNAVAILABLE: { label: "Tạm ẩn", variant: "gray" },
};

interface ProductListState {
  filter?: Pick<ProductPageParam, "name" | "status" | "categoryId">;
  editTarget?: ProductDto | null;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryIdParam = searchParams.get("categoryId") || undefined;
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const isAuthHydrated = useAuthStore((state) => state.isHydrated);
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState<ProductDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductDto | null>(null);
  const [, startTransition] = useTransition();
  const restoreStartedRef = useRef(false);
  const restoredStateRef = useRef(false);

  const initialFilter = useMemo<ProductPageParam>(
    () => ({ pageNo: 1, pageSize: 20, categoryId: categoryIdParam }),
    [categoryIdParam],
  );
  const { data: categories } = useGetCategorySimpleList();
  const table = useInfinitePagination<ProductDto, ProductPageParam>({
    initialFilter,
    queryFn: getProductPage,
    queryKey: QUERY_KEYS.MENU.PRODUCTS,
  });

  useEffect(() => {
    if (!isAuthHydrated || !userId || restoreStartedRef.current) return;
    restoreStartedRef.current = true;

    const storage = getStorage();
    const saved = storage
      ? readProductListState<ProductListState>(storage, userId)
      : null;
    if (saved) {
      const savedFilter =
        saved.filter && typeof saved.filter === "object" ? saved.filter : null;
      if (savedFilter) {
        table.updateFilter({
          ...savedFilter,
          categoryId: categoryIdParam ?? savedFilter.categoryId,
        });
      }
      if (
        saved.editTarget &&
        typeof saved.editTarget === "object" &&
        saved.editTarget.id
      ) {
        startTransition(() => setEditTarget(saved.editTarget!));
      }
    }
    queueMicrotask(() => {
      restoredStateRef.current = true;
    });
  }, [categoryIdParam, isAuthHydrated, startTransition, table, userId]);

  useEffect(() => {
    if (!isAuthHydrated || !userId) return;
    if (!restoredStateRef.current) return;

    const storage = getStorage();
    if (!storage) return;
    saveProductListState<ProductListState>(storage, userId, {
      filter: {
        name: table.filter.name,
        status: table.filter.status,
        categoryId: table.filter.categoryId,
      },
      editTarget,
    });
  }, [editTarget, isAuthHydrated, table.filter, userId]);

  const createProdMutation = useCreateProduct();
  const updateProdMutation = useUpdateProduct();
  const deleteProdMutation = useDeleteProduct();
  const updateProdStatusMutation = useUpdateProductStatus();

  const handleResetFilter = () => {
    router.replace(ROUTES.ADMIN.MENU_PRODUCTS);
    table.updateFilter({
      name: undefined,
      status: undefined,
      categoryId: undefined,
    });
  };

  const handleCreateProd = async (data: ProductFormType) => {
    try {
      await createProdMutation.mutateAsync(data);
      setCreateOpen(false);
      table.refresh();
    } catch {}
  };

  const handleUpdateProd = async (data: ProductFormType) => {
    if (!editTarget) return;
    try {
      await updateProdMutation.mutateAsync({ ...data, id: editTarget.id });
      const storage = getStorage();
      if (storage && userId) clearProductDraft(storage, userId, editTarget.id);
      setEditTarget(null);
      table.refresh();
    } catch {}
  };

  const handleCancelEdit = () => {
    if (editTarget) {
      const storage = getStorage();
      if (storage && userId) clearProductDraft(storage, userId, editTarget.id);
    }
    setEditTarget(null);
  };

  const handleDeleteProd = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProdMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      table.refresh();
    } catch {}
  };

  const columns: Array<Column<ProductDto>> = [
    {
      key: "image",
      header: "Ảnh",
      width: "72px",
      render: (row: ProductDto) =>
        row.imageUrl ? (
          <img
            src={row.imageUrl}
            alt={row.name}
            className="size-10 rounded-lg object-cover"
          />
        ) : (
          <div className="size-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg">
            ☕
          </div>
        ),
    },
    {
      key: "name",
      header: "Tên sản phẩm",
      render: (row: ProductDto) => (
        <div>
          <button
            type="button"
            onClick={() => setEditTarget(row)}
            className="text-left font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
          >
            {row.name}
          </button>
          <p className="text-xs text-gray-400">{row.categoryName}</p>
        </div>
      ),
    },
    {
      key: "price",
      header: "Giá",
      render: (row: ProductDto) => (
        <span className="font-medium">
          {row.price.toLocaleString("vi-VN")}đ
        </span>
      ),
    },
    {
      key: "prepTime",
      header: "Thời gian pha chế",
      render: (row: ProductDto) => (
        <span className="text-gray-500">{row.prepTime} phút</span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row: ProductDto) => {
        const s = STATUS_BADGE[row.status] ?? STATUS_BADGE["UNAVAILABLE"];
        return <Badge label={s.label} variant={s.variant} />;
      },
    },
    {
      key: "toggle",
      header: "Đổi trạng thái",
      render: (row: ProductDto) => (
        <Toggle
          checked={row.status === "AVAILABLE"}
          onChange={(v) =>
            updateProdStatusMutation.mutate({
              id: row.id,
              status: v ? "AVAILABLE" : "OUT_OF_STOCK",
            })
          }
          disabled={
            updateProdStatusMutation.isPending &&
            row.id === updateProdMutation.variables?.id
          }
        />
      ),
    },
    {
      key: "actions",
      header: "Hành động",
      render: (row: ProductDto) => (
        <div className="flex items-center gap-2 [&>button]:min-h-11">
          <button
            onClick={() => setEditTarget(row)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20 transition-colors"
          >
            Sửa
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 dark:text-brand-400 transition-colors"
          >
            Xoá
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Sản phẩm
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Quản lý sản phẩm trong thực đơn
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors"
        >
          Thêm sản phẩm
        </button>
      </div>

      {/* filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Tìm tên sản phẩm ..."
          value={table.filter.name ?? ""}
          onChange={(v) =>
            table.updateFilter({ name: v.target.value || undefined })
          }
          className="w-56"
        />
        <Select
          options={(categories ?? []).map((c) => ({
            label: c.name,
            value: c.id,
          }))}
          placeholder="Tất cả danh mục"
          className="w-48"
          value={table.filter.categoryId ?? ""}
          onChange={(v) =>
            table.updateFilter({ categoryId: v.target.value || undefined })
          }
        />
        <Select
          options={[
            { label: "Còn hàng", value: "AVAILABLE" },
            { label: "Hết hàng", value: "OUT_OF_STOCK" },
            { label: "Tạm ẩn", value: "UNAVAILABLE" },
          ]}
          placeholder="Tất cả trạng thái"
          className="w-44"
          value={table.filter.status ?? ""}
          onChange={(v) =>
            table.updateFilter({
              status: (v.target.value as ProductDto["status"]) || undefined,
            })
          }
        />
        {(table.filter.name ||
          table.filter.status ||
          table.filter.categoryId) && (
          <button
            onClick={handleResetFilter}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Xoá bộ lọc
          </button>
        )}
      </div>

      {/* table */}
      <DataTable
        columns={columns}
        data={table.data}
        keyExtractor={(row) => row.id}
        isLoading={table.isLoading}
        total={table.total}
        loadMoreRef={table.loadMoreRef}
        isLoadingMore={table.isFetchingNextPage}
        hasMore={table.hasNextPage}
      />

      <Modal
        onClose={() => setCreateOpen(false)}
        open={createOpen}
        title="Thêm sản phẩm mới"
        size="lg"
      >
        <ProductForm
          onSubmit={handleCreateProd}
          onCancel={() => setCreateOpen(false)}
          isLoading={createProdMutation.isPending}
        />
      </Modal>

      <Modal
        onClose={handleCancelEdit}
        open={!!editTarget}
        title="Chỉnh sửa sản phẩm"
        size="lg"
      >
        {editTarget && (
          <ProductForm
            defaultValue={editTarget}
            onSubmit={handleUpdateProd}
            onCancel={handleCancelEdit}
            isLoading={updateProdMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Xác nhận xoá sản phẩm ${deleteTarget?.name} ? `}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteProd}
        confirmLabel="Xoá sản phầm"
        isLoading={deleteProdMutation.isPending}
        title="Xoá sản phẩm"
      />
    </div>
  );
}
