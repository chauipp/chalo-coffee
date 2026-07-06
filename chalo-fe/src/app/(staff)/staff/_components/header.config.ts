// src/app/(staff)/staff/_components/header.config.ts
import { ClipboardListIcon } from "@/components/shared/icons/ClipboardListIcon";
import { MonitorIcon } from "@/components/shared/icons/MonitorIcon";
import { TableIcon } from "@/components/shared/icons/TableIcon";
import { ROUTES } from "@/constants";

export const STAFF_HEADER_ITEMS = [
  { label: 'Đơn hàng', href: ROUTES.STAFF.ORDERS, icon: ClipboardListIcon },
  { label: 'POS', href: ROUTES.STAFF.POS, icon: MonitorIcon },
  { label: 'Bàn', href: ROUTES.STAFF.TABLES, icon: TableIcon }
]