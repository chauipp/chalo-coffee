// src/app/(auth)/login/page.tsx
import Link from "next/link";
import { ROUTES } from "@/constants";
import LoginForm from "./_components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 dark:bg-gray-950 px-4">
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
        <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-xl shadow-brand-100/50 dark:shadow-none border border-gray-100 dark:border-gray-800 p-8">
          {/* logo-title */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-brand-400 shadow-brand-400/30 text-3xl select-none">
              ☕
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Chalo Coffee
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Đăng nhập
            </p>
          </div>
          {/* form */}
          <LoginForm />
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Chưa có tài khoản?{" "}
            <Link href={ROUTES.REGISTER} className="font-medium text-brand-500 hover:text-brand-600">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
