"use client";
// src/app/(staff)/layout.tsx

import { Sidebar } from "@/components/shared/Sidebar";
import { PrepDock } from "./_components/PrepDock";
import { SplitPane } from "./_components/SplitPane";
import { STAFF_HEADER_ITEMS } from "./staff/_components/header.config";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar subtitle="Nhân viên" items={STAFF_HEADER_ITEMS} />
      {/* Khu pha chế nằm ở layout → luôn hiển thị ở mọi màn staff */}
      <SplitPane
        storageKey="staff-prep-split"
        className="flex-1"
        left={<main className="h-full overflow-auto">{children}</main>}
        right={(ctl) => <PrepDock {...ctl} />}
      />
    </div>
  );
}
