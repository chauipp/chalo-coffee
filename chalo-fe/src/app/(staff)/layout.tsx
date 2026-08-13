"use client";
// src/app/(staff)/layout.tsx

import { Sidebar } from "@/components/shared/Sidebar";
import { PrepDock } from "./_components/PrepDock";
import { SplitPane } from "./_components/SplitPane";
import { MobileStaffNav } from "./_components/MobileStaffNav";
import { STAFF_HEADER_ITEMS } from "./staff/_components/header.config";
import { BrandLogo } from "@/components/shared/BrandLogo";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-950 md:flex-row">
      <div className="hidden md:flex">
        <Sidebar subtitle="Nhân viên" items={STAFF_HEADER_ITEMS} />
      </div>
      <header className="flex h-14 shrink-0 items-center border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 md:hidden">
        <BrandLogo className="size-8 rounded-lg border border-brand-200 bg-white object-contain p-0.5 shadow dark:border-gray-700 dark:bg-gray-800" />
        <div className="ml-2 min-w-0">
          <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
            Chalo Coffee
          </p>
          <p className="text-[11px] text-gray-400">Nhân viên</p>
        </div>
      </header>
      {/* Khu pha chế nằm ở layout → luôn hiển thị ở mọi màn staff */}
      <SplitPane
        storageKey="staff-prep-split"
        className="min-h-0 min-w-0 flex-1"
        left={
          <main className="h-full overflow-auto pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </main>
        }
        right={(ctl) => <PrepDock {...ctl} />}
      />
      <MobileStaffNav />
    </div>
  );
}
