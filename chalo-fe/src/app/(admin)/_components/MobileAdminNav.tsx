"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getActiveAdminNavHref } from "./admin-navigation";
import { ADMIN_NAV_ITEMS } from "./sidebar.config";

export function MobileAdminNav() {
  const pathname = usePathname();
  const activeHref = getActiveAdminNavHref(pathname, ADMIN_NAV_ITEMS);

  return (
    <nav
      aria-label="Điều hướng admin trên điện thoại"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-1 pt-1 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-6 gap-1">
        {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon, activePrefixes }) => {
          const isActive =
            activeHref === href ||
            (activeHref !== null &&
              (activePrefixes ?? []).some((prefix) => prefix === activeHref));

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium transition-colors ${
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
      </div>
    </nav>
  );
}
