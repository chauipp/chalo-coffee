// src/app/(staff)/staff/_components/header.config.ts
import { ClipboardListIcon } from "@/components/shared/icons/ClipboardListIcon";
import { MonitorIcon } from "@/components/shared/icons/MonitorIcon";
import { PrinterIcon } from "@/components/shared/icons/PrinterIcon";
import { TableIcon } from "@/components/shared/icons/TableIcon";
import { ROUTES } from "@/constants";
import { ChartBarIcon } from "@/components/shared/icons/ChartBarIcon";
import { CoffeeIcon } from "@/components/shared/icons/CoffeeIcon";

export const STAFF_HEADER_ITEMS = [
  { label: 'Đơn hàng', href: ROUTES.STAFF.ORDERS, icon: ClipboardListIcon },
  { label: 'POS', href: ROUTES.STAFF.POS, icon: MonitorIcon },
  { label: 'Bàn', href: ROUTES.STAFF.TABLES, icon: TableIcon },
  { label: 'Chốt ca', href: ROUTES.STAFF.SHIFT, icon: ChartBarIcon },
  { label: 'Trạm in', href: ROUTES.STAFF.PRINT_STATION, icon: PrinterIcon },
];

export const STAFF_MOBILE_PRIMARY_NAV_ITEMS = [
  { label: 'Đơn hàng', href: ROUTES.STAFF.ORDERS, icon: ClipboardListIcon },
  { label: 'POS', href: ROUTES.STAFF.POS, icon: MonitorIcon },
  { label: 'Pha chế', href: ROUTES.STAFF.PREP, icon: CoffeeIcon },
  { label: 'Bàn', href: ROUTES.STAFF.TABLES, icon: TableIcon },
] as const;
