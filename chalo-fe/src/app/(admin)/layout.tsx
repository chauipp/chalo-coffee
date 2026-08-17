"use client";
// src/app/(admin)/layout.tsx

import { Sidebar } from "@/components/shared/Sidebar";
import { ADMIN_NAV_ITEMS } from "./_components/sidebar.config";
import { AdminStateRestorer } from "./_components/AdminStateRestorer";
import { MobileAdminNav } from "./_components/MobileAdminNav";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { AdminPrepSidebarLayout } from "./_components/AdminPrepSidebarLayout";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminStateRestorer />
      <div className="flex min-h-screen">
        <div className="hidden md:flex">
          <Sidebar subtitle="Admin Panel" items={ADMIN_NAV_ITEMS} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 md:hidden">
            <Link href="/?landing=1" aria-label="Chalo Coffee về trang chủ">
              <BrandLogo className="size-8 rounded-lg border border-brand-200 bg-white object-contain p-0.5 shadow dark:border-gray-700 dark:bg-gray-800" />
            </Link>
            <div className="ml-2 min-w-0">
              <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
                Chalo Coffee
              </p>
              <p className="text-[11px] text-gray-400">Admin Panel</p>
            </div>
          </header>
          <main className="min-w-0 flex-1 overflow-auto pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
            <AdminPrepSidebarLayout>{children}</AdminPrepSidebarLayout>
          </main>
        </div>
      </div>
      <MobileAdminNav />
    </div>
  );
}
