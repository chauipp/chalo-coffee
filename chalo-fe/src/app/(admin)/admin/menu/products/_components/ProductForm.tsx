// src/app/(admin)/admin/menu/products/_components/ProductForm.tsx

import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { FormField } from "@/components/shared/ui/FormField";
import { Input } from "@/components/shared/ui/Input";
import { Select } from "@/components/shared/ui/Select";
import { Toggle } from "@/components/shared/ui/Toggle";
import { ProductFormType, ProductSchema } from "@/schemas/menu.schema";
import { useGetCategorySimpleList } from "@/services/lookup/lookup.queries";
import { ProductDto } from "@/services/menu/menu.types";
import { uploadImage } from "@/services/upload/upload.api";
import { useAuthStore } from "@/stores/auth.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { type Resolver, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useProductDraft } from "@/hooks/useProductDraft";

interface ProductFormProps {
  defaultValue?: ProductDto;
  onSubmit: (data: ProductFormType) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ProductForm = ({
  onCancel,
  onSubmit,
  defaultValue,
  isLoading,
}: ProductFormProps) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const { data: categories } = useGetCategorySimpleList();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const productId = defaultValue?.id ?? null;

  const serverDefaults = useMemo<Partial<ProductFormType>>(
    () =>
      defaultValue
        ? {
            name: defaultValue.name,
            categoryId: defaultValue.categoryId,
            description: defaultValue.description ?? undefined,
            imageUrl: defaultValue.imageUrl ?? undefined,
            isActive: defaultValue.isActive,
            prepTime: defaultValue.prepTime,
            price: defaultValue.price,
            sortOrder: defaultValue.sortOrder,
            status: defaultValue.status,
          }
        : {
            isActive: true,
            status: "AVAILABLE",
          },
    [defaultValue],
  );
  const { defaultValues, saveDraft } = useProductDraft<Partial<ProductFormType>>(
    userId,
    productId,
    serverDefaults,
  );

  const {
    control,
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductFormType>({
    resolver: zodResolver(ProductSchema) as Resolver<ProductFormType>,
    defaultValues,
  });

  const formValues = useWatch({ control });
  useEffect(() => {
    if (productId) saveDraft(formValues);
  }, [formValues, productId, saveDraft]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ảnh quá nặng. Vui lòng chọn ảnh dưới 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn đúng định dạng ảnh");
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadImage(file);
      setValue("imageUrl", res.url);
    } catch (error) {
      console.error("Lỗi upload:", error);
      toast.error("Không thể tải ảnh lên. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
    }
  };

  const imageUrl = watch("imageUrl");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
      <section
        data-testid="product-edit-section-info"
        className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-950/40 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
      >
        <div className="mb-3 flex items-center gap-2">
          <span aria-hidden="true" className="size-2 rounded-full bg-brand-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Thông tin món
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Tên sản phẩm" error={errors.name?.message} required>
              <Input
                {...register("name")}
                error={!!errors.name}
                placeholder="VD: Cà phê đen, Trà đào..."
              />
            </FormField>
          </div>

          <FormField label="Danh mục" error={errors.categoryId?.message} required>
            <Select
              {...register("categoryId")}
              options={(categories ?? []).map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              error={!!errors.categoryId}
            />
          </FormField>

          <FormField label="Trạng thái" error={errors.status?.message} required>
            <Select
              {...register("status")}
              error={!!errors.status}
              options={[
                { value: "AVAILABLE", label: "✅ Còn hàng" },
                { value: "OUT_OF_STOCK", label: "❌ Hết hàng" },
                { value: "UNAVAILABLE", label: "🚫 Tạm ẩn" },
              ]}
            />
          </FormField>
        </div>
      </section>

      <section
        data-testid="product-edit-section-operations"
        className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-950/40 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
      >
        <div className="mb-3 flex items-center gap-2">
          <span aria-hidden="true" className="size-2 rounded-full bg-brand-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Giá &amp; vận hành
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Giá (VNĐ)" required error={errors.price?.message}>
            <Input
              {...register("price")}
              type="number"
              error={!!errors.price}
              step={1000}
              min={0}
              placeholder="25000"
            />
          </FormField>

          <FormField
            required
            label="Thời gian pha chế (phút)"
            error={errors.prepTime?.message}
          >
            <Input
              {...register("prepTime")}
              type="number"
              min={1}
              max={60}
              error={!!errors.prepTime}
              placeholder="5"
            />
          </FormField>
        </div>
      </section>

      <section
        data-testid="product-edit-section-description"
        className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-950/40 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
      >
        <div className="mb-3 flex items-center gap-2">
          <span aria-hidden="true" className="size-2 rounded-full bg-brand-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Mô tả
          </h3>
        </div>
        <FormField
          label="Mô tả"
          error={errors.description?.message}
          hint="Dùng để tính thời gian chờ"
        >
          <textarea
            {...register("description")}
            rows={3}
            placeholder="Mô tả ngắn về món..."
            className="min-h-24 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </FormField>
      </section>

      <section
        data-testid="product-edit-section-image"
        className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-950/40 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
      >
        <div className="mb-3 flex items-center gap-2">
          <span aria-hidden="true" className="size-2 rounded-full bg-brand-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Hình ảnh
          </h3>
        </div>
        <FormField
          label="Ảnh sản phẩm"
          error={errors.imageUrl?.message}
          hint="Upload ảnh hoặc nhập URL trực tiếp"
        >
          <div className="grid gap-3 sm:grid-cols-[6rem_minmax(0,1fr)] sm:items-start">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white text-center text-xs text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Xem trước ảnh sản phẩm"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="px-2">Chưa có ảnh</span>
              )}
            </div>
            <div className="min-w-0 space-y-3">
              <Input
                {...register("imageUrl")}
                error={!!errors.imageUrl}
                placeholder="https://... hoặc nhập URL"
              />
              <label className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 text-sm font-medium text-gray-600 transition-colors hover:border-brand-400 hover:bg-brand-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                {isUploading ? (
                  <SpinnerIcon className="size-4 animate-spin" />
                ) : (
                  "Tải ảnh từ thiết bị"
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
        </FormField>
      </section>

      <section
        data-testid="product-edit-section-visibility"
        className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-950/40 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
      >
        <div className="mb-3 flex items-center gap-2">
          <span aria-hidden="true" className="size-2 rounded-full bg-brand-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Hiển thị
          </h3>
        </div>
        <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Hiển thị món này
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Cho phép khách nhìn thấy món trong thực đơn
            </p>
          </div>
          <Toggle
            checked={watch("isActive") ?? true}
            onChange={(v) => setValue("isActive", v)}
            label={watch("isActive") ? "Hiển thị" : "Ẩn"}
          />
        </div>
      </section>

      <div
        data-testid="product-edit-actions"
        className="sticky bottom-0 -mx-4 border-t border-gray-200 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0"
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="min-h-11 w-full rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 sm:w-auto"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50 sm:w-auto"
          >
            {isLoading && <SpinnerIcon className="size-4 animate-spin" />}
            {defaultValue ? "Cập nhật" : "Thêm mới"}
          </button>
        </div>
      </div>
    </form>
  );
};
