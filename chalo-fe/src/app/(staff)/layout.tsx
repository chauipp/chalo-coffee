"use client";
// src/app/(staff)/layout.tsx

import { Sidebar } from "@/components/shared/Sidebar";
import { STAFF_HEADER_ITEMS } from "./staff/_components/header.config";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar subtitle="Nhân viên" items={STAFF_HEADER_ITEMS} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
