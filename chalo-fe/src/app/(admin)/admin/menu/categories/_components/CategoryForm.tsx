import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { FormField } from "@/components/shared/ui/FormField";
import { Input } from "@/components/shared/ui/Input";
import { Toggle } from "@/components/shared/ui/Toggle";
import { type CategoryFormType, CategorySchema } from "@/schemas/menu.schema";
import { CategoryDto } from "@/services/menu/menu.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, useForm } from "react-hook-form";

interface CategoryFormProps {
  defaultValues?: CategoryDto;
  onSubmit: (data: CategoryFormType) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CategoryForm = ({
  onCancel,
  onSubmit,
  defaultValues,
  isLoading,
}: CategoryFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormType>({
    resolver: zodResolver(CategorySchema) as any,
    defaultValues: defaultValues
      ? {
          name: defaultValues.name,
          description: defaultValues.description ?? undefined,
          imageUrl: defaultValues.imageUrl ?? undefined,
          isActive: defaultValues.isActive,
          sortOrder: defaultValues.sortOrder,
        }
      : { isActive: true },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Tên danh mục" required error={errors.name?.message}>
        <Input
          {...register("name")}
          error={!!errors.name}
          placeholder="VD: Cà phê, Trà, Sinh tố..."
        />
      </FormField>

      <FormField label="Mô tả" error={errors.description?.message}>
        <textarea
          {...register("description")}
          rows={3}
          placeholder="Mô tả về danh mục ..."
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
          placeholder:text-gray-400 outline-none transition-colors
          focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 resize-none
          "
        />
      </FormField>

      <FormField label="URL Ảnh" error={errors.imageUrl?.message}>
        <Input
          {...register("imageUrl")}
          error={!!errors.imageUrl}
          placeholder="https://..."
        />
      </FormField>

      <FormField label="Thứ tự" error={errors.sortOrder?.message}>
        <Input
          {...register("sortOrder")}
          type="number"
          min={0}
          error={!!errors.sortOrder}
          placeholder="0"
          className="w-32"
        />
      </FormField>

      <FormField label="Trạng thái">
        <Toggle
          checked={watch("isActive") ?? true}
          onChange={(v) => setValue("isActive", v)}
          label={watch("isActive") ? "Đang hoạt động" : "Dừng hoạt động"}
        />
      </FormField>

      <div className="flex justify-end py-1.5 gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-brand-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-500 active:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading && <SpinnerIcon className="size-4 animate-spin" />}
          {defaultValues ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </form>
  );
};
