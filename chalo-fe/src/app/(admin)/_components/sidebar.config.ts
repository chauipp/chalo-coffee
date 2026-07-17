import { ROUTES } from "@/constants";
import { ChartBarIcon } from "@/components/shared/icons/ChartBarIcon";
import { ClipboardListIcon } from "@/components/shared/icons/ClipboardListIcon";
import { CoffeeIcon } from "@/components/shared/icons/CoffeeIcon";
import { SettingsIcon } from "@/components/shared/icons/SettingsIcon";
import { TableIcon } from "@/components/shared/icons/TableIcon";
import { UsersIcon } from "@/components/shared/icons/UsersIcon";

export const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, icon: ChartBarIcon },
  { label: "Thực đơn", href: ROUTES.ADMIN.MENU_CATEGORIES, icon: CoffeeIcon },
  { label: "Đơn hàng", href: ROUTES.ADMIN.ORDERS, icon: ClipboardListIcon },
  { label: "Bàn & QR", href: ROUTES.ADMIN.TABLES, icon: TableIcon },
  { label: "Nhân viên", href: ROUTES.ADMIN.STAFF, icon: UsersIcon },
  { label: "Cài đặt", href: ROUTES.ADMIN.SETTINGS, icon: SettingsIcon },
];
