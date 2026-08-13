"use client";
// src/app/(admin)/admin/users/page.tsx
import { AdminMobilePageHeader } from "../../_components/AdminMobilePageHeader";
import { StaffTab } from "./_components/StaffTab";

export default function UsersPage() {
  return (
    <div className="space-y-5 p-4 sm:p-6">
      <AdminMobilePageHeader
        title="Người dùng"
        description="Quản lý tài khoản nhân viên & khách hàng"
      />

      <StaffTab />
    </div>
  );
}
