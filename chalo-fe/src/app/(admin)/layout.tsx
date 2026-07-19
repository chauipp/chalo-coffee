"use client";
// src/app/(admin)/layout.tsx

import { Sidebar } from "@/components/shared/Sidebar";
import { ADMIN_NAV_ITEMS } from "./_components/sidebar.config";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-gray-50 md:flex-row dark:bg-gray-950">
      <Sidebar subtitle="Admin Panel" items={ADMIN_NAV_ITEMS} />
      <main className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
