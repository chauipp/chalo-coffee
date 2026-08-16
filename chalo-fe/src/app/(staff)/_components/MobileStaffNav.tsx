"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Modal } from "@/components/shared/ui/Modal";
import { ChartBarIcon } from "@/components/shared/icons/ChartBarIcon";
import { LogoutIcon } from "@/components/shared/icons/LogoutIcon";
import { useLogout } from "@/hooks/useLogout";
import { ROUTES } from "@/constants";
import { STAFF_MOBILE_PRIMARY_NAV_ITEMS } from "../staff/_components/header.config";

export function MobileStaffNav() {
  const pathname = usePathname();
  const logout = useLogout();
  const [overflowOpen, setOverflowOpen] = useState(false);

  return (
    <nav
      data-testid="staff-mobile-nav"
      aria-label="Điều hướng staff trên điện thoại"
      className="fixed inset-x-2 bottom-2 z-40 overflow-hidden rounded-2xl border border-gray-200 bg-white/95 px-1.5 pt-1.5 shadow-[0_-6px_24px_rgba(15,23,42,0.12)] backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.25rem)" }}
    >
      <div className="grid w-full grid-cols-5 gap-0.5">
        {STAFF_MOBILE_PRIMARY_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-[10px] font-medium leading-3 transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300"
                  : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-label="Khác"
          aria-haspopup="dialog"
          aria-current={pathname === ROUTES.STAFF.SHIFT ? "page" : undefined}
          onClick={() => setOverflowOpen(true)}
          className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-[10px] font-medium leading-3 transition-colors ${
            pathname === ROUTES.STAFF.SHIFT
              ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300"
              : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
          }`}
        >
          <span aria-hidden="true" className="text-lg leading-none">•••</span>
          <span className="max-w-full truncate">Khác</span>
        </button>
      </div>
      <Modal
        open={overflowOpen}
        onClose={() => setOverflowOpen(false)}
        title="Mục staff khác"
        presentation="bottom-sheet"
      >
        <div className="space-y-2">
          <Link
            href={ROUTES.STAFF.SHIFT}
            onClick={() => setOverflowOpen(false)}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ChartBarIcon className="size-5" aria-hidden="true" />
            Chốt ca
          </Link>
          <div className="border-t border-gray-100 pt-2 dark:border-gray-800">
            <button
              type="button"
              onClick={() => void logout()}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <LogoutIcon className="size-5" aria-hidden="true" />
              Đăng xuất
            </button>
          </div>
        </div>
      </Modal>
    </nav>
  );
}
