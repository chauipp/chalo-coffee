"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutIcon } from "@/components/shared/icons/LogoutIcon";
import { useLogout } from "@/hooks/useLogout";
import { STAFF_HEADER_ITEMS } from "../staff/_components/header.config";

export function MobileStaffNav() {
  const pathname = usePathname();
  const logout = useLogout();

  return (
    <nav
      data-testid="staff-mobile-nav"
      aria-label="Điều hướng staff trên điện thoại"
      className="fixed inset-x-2 bottom-2 z-40 overflow-hidden rounded-2xl border border-gray-200 bg-white/95 px-1.5 pt-1.5 shadow-[0_-6px_24px_rgba(15,23,42,0.12)] backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.25rem)" }}
    >
      <div className="grid w-full grid-cols-5 gap-0.5">
        {STAFF_HEADER_ITEMS.map(({ href, label, icon: Icon }) => {
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
          onClick={() => void logout()}
          className="flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-[10px] font-medium leading-3 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          <LogoutIcon className="size-5 shrink-0" aria-hidden="true" />
          <span className="max-w-full truncate">Đăng xuất</span>
        </button>
      </div>
    </nav>
  );
}
