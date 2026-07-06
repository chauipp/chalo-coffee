"use client";
// src/app/(admin)/admin/tables/_components/TableForm.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { FormField } from "@/components/shared/ui/FormField";
import { Input } from "@/components/shared/ui/Input";
import { TableFormType, TableSchema } from "@/schemas/table.schema";
import { TableDto } from "@/services/table/table.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface TableFormProps {
  defaultValue?: TableDto;
  onSubmit: (data: TableFormType) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const TableForm = ({
  defaultValue,
  isLoading,
  onCancel,
  onSubmit,
}: TableFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TableFormType>({
    resolver: zodResolver(TableSchema),
    defaultValues: defaultValue
      ? {
          area: defaultValue.area,
          name: defaultValue.name,
        }
      : undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Tên bàn" required error={errors.name?.message}>
        <Input
          {...register("name")}
          error={!!errors.name}
          placeholder="VD: Bàn 01, Bàn VIP..."
        />
      </FormField>

      <FormField
        label="Vị trí"
        error={errors.area?.message}
        hint="VD: Tầng 1, Sân vườn, Tầng 2..."
      >
        <Input
          {...register("area")}
          error={!!errors.area}
          placeholder="Tầng 1"
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-brand-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors disabled:opacity-60"
        >
          {isLoading && <SpinnerIcon className="animate-spin" />}
          {defaultValue ? "Cập nhật" : "Tạo mới"}
        </button>
      </div>
    </form>
  );
};
