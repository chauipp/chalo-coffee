// src/app/(auth)/login/page.tsx
import Link from "next/link";
import { ROUTES } from "@/constants";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import LoginForm from "./_components/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 dark:bg-stone-950 px-4">
      {/* background decorator */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-brand-100 opacity-60 dark:opacity-10" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-brand-200 opacity-40 dark:opacity-10" />
      </div>
      {/* content */}
      <div className="relative w-full max-w-sm">
        {/* card */}
        <div className="rounded-2xl bg-white dark:bg-stone-900 shadow-xl shadow-brand-100/50 dark:shadow-none border border-stone-100 dark:border-stone-800 p-8">
          {/* logo-title */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-brand-400 shadow-brand-400/30 text-3xl select-none">
              ☕
            </div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              Chalo Coffee
            </h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Khách hàng và nhân viên
            </p>
          </div>
          <Suspense
            fallback={
              <div className="min-h-11 w-full animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800" />
            }
          >
            <GoogleSignInButton />
          </Suspense>
          <div className="my-6 flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
            <span className="text-xs font-medium text-stone-400">Tài khoản nội bộ</span>
            <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
          </div>
          {/* form */}
          <LoginForm />
          <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
            <Link href="/" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
              Về trang chủ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
