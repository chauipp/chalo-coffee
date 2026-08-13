// src/utils/user-role-label.ts
import type { BadgeVariant } from "@/components/shared/ui/Badge";

// Màn quản lý nhân viên chỉ nên hiển thị ADMIN/MODERATOR, nhưng dữ liệu vẫn
// có thể mang role CUSTOMER (tài khoản đăng ký/Google) khi lọc tường minh.
// Map đủ 3 role để không bao giờ gọi khách hàng là "Nhân viên".
export type DisplayUserRole = "ADMIN" | "MODERATOR" | "CUSTOMER";

const ROLE_BADGE: Record<DisplayUserRole, { label: string; variant: BadgeVariant }> = {
  ADMIN: { label: "Quản trị", variant: "blue" },
  MODERATOR: { label: "Nhân viên", variant: "gray" },
  CUSTOMER: { label: "Khách hàng", variant: "yellow" },
};

export const getUserRoleBadge = (
  role: DisplayUserRole,
): { label: string; variant: BadgeVariant } => ROLE_BADGE[role];
