"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Modal } from "@/components/shared/ui/Modal";
import {
  getActiveAdminNavHref,
  isAdminOverflowActive,
} from "./admin-navigation";
import {
  ADMIN_MOBILE_OVERFLOW_NAV_ITEMS,
  ADMIN_MOBILE_PRIMARY_NAV_ITEMS,
} from "./sidebar.config";

export function MobileAdminNav() {
  const pathname = usePathname();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const activeHref = getActiveAdminNavHref(
    pathname,
    ADMIN_MOBILE_PRIMARY_NAV_ITEMS,
  );
  const overflowActive = isAdminOverflowActive(
    pathname,
    ADMIN_MOBILE_PRIMARY_NAV_ITEMS,
    ADMIN_MOBILE_OVERFLOW_NAV_ITEMS,
  );
  return (
    <nav
      data-testid="admin-mobile-nav"
      aria-label="Điều hướng admin trên điện thoại"
      className="fixed inset-x-2 bottom-2 z-40 overflow-hidden rounded-2xl border border-gray-200 bg-white/95 px-1.5 pt-1.5 shadow-[0_-6px_24px_rgba(15,23,42,0.12)] backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 md:hidden"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 0.25rem)",
      }}
    >
      <div
        data-testid="admin-mobile-nav-items"
        className="grid w-full grid-cols-5 gap-0.5"
      >
        {ADMIN_MOBILE_PRIMARY_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = activeHref === href;

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-[10px] leading-3 font-medium transition-colors ${
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
          aria-current={overflowActive ? "page" : undefined}
          aria-haspopup="dialog"
          onClick={() => setOverflowOpen(true)}
          className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-[10px] leading-3 font-medium transition-colors ${
            overflowActive
              ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300"
              : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
          }`}
        >
          <span aria-hidden="true" className="text-lg leading-none">
            •••
          </span>
          <span className="max-w-full truncate">Khác</span>
        </button>
      </div>
      <Modal
        open={overflowOpen}
        onClose={() => setOverflowOpen(false)}
        title="Mục quản trị khác"
        presentation="bottom-sheet"
      >
        <div className="space-y-2">
          {ADMIN_MOBILE_OVERFLOW_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOverflowOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
      </Modal>
    </nav>
  );
}
