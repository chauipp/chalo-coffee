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
    <div className="h-dvh overflow-hidden bg-gray-50 dark:bg-gray-950 md:h-auto md:min-h-screen md:overflow-visible">
      <AdminStateRestorer />
      <div className="flex h-full min-h-0 md:h-auto md:min-h-screen">
        <div className="hidden md:flex">
          <Sidebar subtitle="Admin Panel" items={ADMIN_NAV_ITEMS} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-center border-b border-gray-200 bg-white px-4 pt-[env(safe-area-inset-top)] dark:border-gray-800 dark:bg-gray-900 md:hidden">
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
          <main className="mobile-scroll-clearance min-h-0 min-w-0 flex-1 overflow-auto md:min-h-screen md:overflow-visible">
            <AdminPrepSidebarLayout>{children}</AdminPrepSidebarLayout>
          </main>
        </div>
      </div>
      <MobileAdminNav />
    </div>
  );
}
