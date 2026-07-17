"use client";
// src/app/(admin)/admin/staff/_components/ChangePasswordForm.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { FormField } from "@/components/shared/ui/FormField";
import { Input } from "@/components/shared/ui/Input";
import { ChangePasswordSchema, ChangePasswordType } from "@/schemas/user.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface Props {
  onSubmit: (data: ChangePasswordType) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ChangePasswordForm = ({ onSubmit, onCancel, isLoading }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordType>({
    resolver: zodResolver(ChangePasswordSchema),
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label="Mật khẩu mới"
        required
        error={errors.newPassword?.message}
      >
        <Input
          type="password"
          {...register("newPassword")}
          error={!!errors.newPassword}
          placeholder="Tối thiểu 6 ký tự"
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
          {isLoading && <SpinnerIcon className="size-4 animate-spin" />} Đổi mật khẩu
        </button>
      </div>
    </form>
  );
};
