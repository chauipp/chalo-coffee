// src/app/(auth)/register/page.tsx
import Link from "next/link";
import { ROUTES } from "@/constants";
import RegisterForm from "./_components/RegisterForm";
import { BrandLogo } from "@/components/shared/BrandLogo";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 dark:bg-stone-950 px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-brand-100 opacity-60 dark:opacity-10" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-brand-200 opacity-40 dark:opacity-10" />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl bg-white dark:bg-stone-900 shadow-xl shadow-brand-100/50 dark:shadow-none border border-stone-100 dark:border-stone-800 p-8">
          <div className="mb-8 text-center">
            <BrandLogo className="mx-auto mb-4 size-16 rounded-2xl border border-brand-200 bg-white object-contain p-1 shadow-lg shadow-brand-400/20 dark:border-stone-700 dark:bg-stone-800" />
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Chalo Coffee</h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Tạo tài khoản</p>
          </div>
          <RegisterForm />
          <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
            Đã có tài khoản?{" "}
            <Link href={ROUTES.LOGIN} className="font-medium text-brand-500 hover:text-brand-600">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
