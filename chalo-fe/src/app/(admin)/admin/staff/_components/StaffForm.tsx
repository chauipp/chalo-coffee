"use client";
// src/app/(admin)/admin/staff/_components/StaffForm.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { FormField } from "@/components/shared/ui/FormField";
import { Input } from "@/components/shared/ui/Input";
import { Select } from "@/components/shared/ui/Select";
import { Toggle } from "@/components/shared/ui/Toggle";
import {
  StaffCreateSchema,
  StaffCreateType,
  StaffUpdateSchema,
  StaffUpdateType,
} from "@/schemas/user.schema";
import { UserDto } from "@/services/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, Resolver, useForm } from "react-hook-form";

const ROLE_OPTIONS = [
  { label: "Quản trị (ADMIN)", value: "ADMIN" },
  { label: "Nhân viên (MODERATOR)", value: "MODERATOR" },
];

interface StaffFormProps {
  defaultValue?: UserDto;
  onSubmitCreate?: (data: StaffCreateType) => void;
  onSubmitUpdate?: (data: StaffUpdateType) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const StaffForm = ({
  defaultValue,
  onSubmitCreate,
  onSubmitUpdate,
  onCancel,
  isLoading,
}: StaffFormProps) => {
  const isEdit = !!defaultValue;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StaffCreateType>({
    // Edit mode uses the narrower StaffUpdateSchema (username/password hidden);
    // the fields are never rendered/read in edit, so this cast is runtime-safe.
    resolver: zodResolver(
      isEdit ? StaffUpdateSchema : StaffCreateSchema,
    ) as unknown as Resolver<StaffCreateType>,
    defaultValues: isEdit
      ? {
          fullName: defaultValue!.fullName,
          role: defaultValue!.role,
          isActive: defaultValue!.isActive,
        }
      : { role: "MODERATOR", isActive: true },
  });

  const submit = handleSubmit((data) => {
    if (isEdit) {
      onSubmitUpdate?.({
        fullName: data.fullName,
        role: data.role,
        isActive: data.isActive,
      });
    } else {
      onSubmitCreate?.(data);
    }
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      {!isEdit && (
        <>
          <FormField
            label="Tên đăng nhập"
            required
            error={errors.username?.message}
          >
            <Input
              {...register("username")}
              error={!!errors.username}
              placeholder="vd: staff02"
            />
          </FormField>
          <FormField label="Mật khẩu" required error={errors.password?.message}>
            <Input
              type="password"
              {...register("password")}
              error={!!errors.password}
              placeholder="Tối thiểu 6 ký tự"
            />
          </FormField>
        </>
      )}

      <FormField label="Họ tên" required error={errors.fullName?.message}>
        <Input
          {...register("fullName")}
          error={!!errors.fullName}
          placeholder="vd: Lê Văn Nhân Viên"
        />
      </FormField>

      <FormField label="Vai trò" required error={errors.role?.message}>
        <Select
          options={ROLE_OPTIONS}
          {...register("role")}
          error={!!errors.role}
        />
      </FormField>

      <Controller
        control={control}
        name="isActive"
        render={({ field }) => (
          <Toggle
            checked={field.value}
            onChange={field.onChange}
            label="Đang hoạt động"
          />
        )}
      />

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
          {isLoading && <SpinnerIcon className="size-4 animate-spin" />}
          {isEdit ? "Cập nhật" : "Tạo mới"}
        </button>
      </div>
    </form>
  );
};
