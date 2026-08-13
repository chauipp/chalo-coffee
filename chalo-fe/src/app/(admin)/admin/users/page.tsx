"use client";
// src/app/(admin)/admin/users/page.tsx
import { useState } from "react";
import { AdminMobilePageHeader } from "../../_components/AdminMobilePageHeader";
import { CustomerTab } from "./_components/CustomerTab";
import { StaffTab } from "./_components/StaffTab";

type UserTab = "STAFF" | "CUSTOMER";

const TABS: Array<{ key: UserTab; label: string }> = [
  { key: "STAFF", label: "Nhân viên" },
  { key: "CUSTOMER", label: "Khách hàng" },
];

export default function UsersPage() {
  const [tab, setTab] = useState<UserTab>("STAFF");

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <AdminMobilePageHeader
        title="Người dùng"
        description="Quản lý tài khoản nhân viên & khách hàng"
      />

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800 sm:inline-flex">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "STAFF" ? <StaffTab /> : <CustomerTab />}
    </div>
  );
}
