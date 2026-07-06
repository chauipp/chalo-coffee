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
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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

  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductFormType>({
    resolver: zodResolver(ProductSchema) as any,
    defaultValues: defaultValue
      ? {
          name: defaultValue?.name,
          categoryId: defaultValue?.categoryId,
          description: defaultValue?.description ?? undefined,
          imageUrl: defaultValue?.imageUrl ?? undefined,
          isActive: defaultValue?.isActive,
          prepTime: defaultValue?.prepTime,
          price: defaultValue?.price,
          sortOrder: defaultValue?.sortOrder,
          status: defaultValue?.status,
        }
      : {
          isActive: true,
          status: "AVAILABLE",
        },
  });

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* name */}
        <div className="col-span-2">
          <FormField label="Tên sản phẩm" error={errors.name?.message} required>
            <Input
              {...register("name")}
              error={!!errors.name}
              placeholder="VD: Cà phê đen, Trà đào..."
            />
          </FormField>
        </div>

        {/* category */}
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

        {/* status */}
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

        {/* price */}
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

        {/* prep time */}
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

        {/* description */}
        <div className="col-span-2">
          <FormField
            label="Mô tả"
            error={errors.description?.message}
            hint="Dùng để tính thời gian chờ"
          >
            <textarea
              {...register("description")}
              rows={2}
              placeholder="Mô tả ngắn về món..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              placeholder:text-gray-400 outline-none transition-colors
              focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 resize-none"
            />
          </FormField>
        </div>

        {/* image upload */}
        <div className="col-span-2">
          <FormField
            label="Ảnh sản phẩm"
            error={errors.imageUrl?.message}
            hint="Upload ảnh hoặc nhập URL trực tiếp"
          >
            <div className="flex gap-3">
              <Input
                {...register("imageUrl")}
                error={!!errors.imageUrl}
                placeholder="https://... hoặc upload ảnh →"
                className="flex-1"
              />
              <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {isUploading ? (
                  <SpinnerIcon className="size-4 animate-spin" />
                ) : (
                  "📷"
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                ></input>
              </label>
            </div>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                className="mt-2 h-24 w-24 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
          </FormField>
        </div>

        {/* active */}
        <FormField label="Kích hoạt">
          <Toggle
            checked={watch("isActive") ?? true}
            onChange={(v) => setValue("isActive", v)}
            label={watch("isActive") ? "Hiển thị" : "Ẩn"}
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          Hủy
        </button>
        <button type="submit" disabled={isLoading}>
          {isLoading && <SpinnerIcon className="size-4 animate-spin" />}
          {defaultValue ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </form>
  );
};
