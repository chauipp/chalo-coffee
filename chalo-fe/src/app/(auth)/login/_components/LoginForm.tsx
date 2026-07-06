// src/app/(auth)/login/_components/LoginForm.tsx
"use client";
import { EyeIcon } from "@/components/shared/icons/EyeIcon";
import { EyeOffIcon } from "@/components/shared/icons/EyeOffIcon";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";

import { useLogin } from "@/hooks/useLogin";
import { useState } from "react";

export default function LoginForm() {
  const { form, handleLogin, isLoading } = useLogin();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;
  return (
    <form onSubmit={handleSubmit(handleLogin)} noValidate className="space-y-4">
      {/* root form error */}
      {errors.root && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </div>
      )}

      {/* username  */}
      <div className="space-y-1.5">
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Tên đăng nhập
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          autoFocus
          placeholder="Nhập tên đăng nhập"
          disabled={isLoading}
          {...register("username")}
          className={`w-full rounded-xl border px-4 py-2.5 text-sm
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            outline-none transition-colors
            focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20
            disabled:cursor-not-allowed disabled:opacity-50
            ${errors.username ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : "border-gray-200 dark:border-gray-700"}`}
        />
        {errors.username && (
          <p className="text-xs text-red-500">{errors.username.message}</p>
        )}
      </div>

      {/* password */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Mật khẩu
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            disabled={isLoading}
            {...register("password")}
            className={`
            w-full rounded-xl border px-4 py-2.5 text-sm
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          outline-none transition-colors
          focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20
          disabled:cursor-not-allowed disabled:opacity-50
          ${errors.password ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : "border-gray-200 dark:border-gray-700"}
          `}
          />
          {/* toggle show/hide password */}
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full rounded-xl bg-brand-400 px-4 py-2.5
        text-sm font-medium text-white
        hover:bg-brand-500 active:bg-brand-600
        focus-visible:outline-2
        focus-visible:outline-offset-2 focus-visible:outline-brand-400
        disabled:cursor-not-allowed disabled:opacity-60
        transition-colors
        flex items-center justify-center gap-2
        "
      >
        {isLoading && <SpinnerIcon className="size-4 animate-spin" />}
        {isLoading ? "Đang đăng nhập" : "Đăng nhập"}
      </button>
    </form>
  );
}
