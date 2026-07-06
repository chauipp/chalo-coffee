// src/app/(auth)/register/_components/RegisterForm.tsx
"use client";
import { EyeIcon } from "@/components/shared/icons/EyeIcon";
import { EyeOffIcon } from "@/components/shared/icons/EyeOffIcon";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { useRegister } from "@/hooks/useRegister";
import { useState } from "react";

const inputClass = (hasError: boolean) =>
  `w-full rounded-xl border px-4 py-2.5 text-sm
   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
   placeholder:text-gray-400 dark:placeholder:text-gray-500
   outline-none transition-colors
   focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20
   disabled:cursor-not-allowed disabled:opacity-50
   ${hasError ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : "border-gray-200 dark:border-gray-700"}`;

export default function RegisterForm() {
  const { form, handleRegister, isLoading } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(handleRegister)} noValidate className="space-y-4">
      {errors.root && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </div>
      )}

      {/* fullName */}
      <div className="space-y-1.5">
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Họ và tên
        </label>
        <input
          id="fullName"
          type="text"
          autoComplete="name"
          autoFocus
          placeholder="Nhập họ và tên"
          disabled={isLoading}
          {...register("fullName")}
          className={inputClass(!!errors.fullName)}
        />
        {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
      </div>

      {/* username */}
      <div className="space-y-1.5">
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tên đăng nhập
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          placeholder="Nhập tên đăng nhập"
          disabled={isLoading}
          {...register("username")}
          className={inputClass(!!errors.username)}
        />
        {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
      </div>

      {/* password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Mật khẩu
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Nhập mật khẩu"
            disabled={isLoading}
            {...register("password")}
            className={inputClass(!!errors.password)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      {/* confirmPassword */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nhập lại mật khẩu
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu"
          disabled={isLoading}
          {...register("confirmPassword")}
          className={inputClass(!!errors.confirmPassword)}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-medium text-white
          hover:bg-brand-500 active:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-60
          transition-colors flex items-center justify-center gap-2"
      >
        {isLoading && <SpinnerIcon className="size-4 animate-spin" />}
        {isLoading ? "Đang đăng ký" : "Đăng ký"}
      </button>
    </form>
  );
}
