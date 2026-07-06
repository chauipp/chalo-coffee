"use client";
//src/app/(staff)/staff/_components/StaffHeader.tsx

import Link from "next/link";
import { STAFF_HEADER_ITEMS } from "./header.config";
import { useAuthStore } from "@/stores/auth.store";
import { usePathname, useRouter } from "next/navigation";
import { LogoutIcon } from "@/components/shared/icons/LogoutIcon";
import { useLogout } from "@/hooks/useLogout";

export const StaffHeader = () => {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const handleLogout = useLogout()

  return (
    <header className="flex items-center gap-4 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 px-4 py-3">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <span className="text-xl">☕</span>
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Chalo
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex items-center gap-1 flex-1">
        {STAFF_HEADER_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActice = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors 
                ${
                  isActice
                    ? "bg-brand-400 text-white shadow shadow-brand-400/50"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-100"
                }
          `}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {user?.fullName}
        </span>
        <button
          onClick={handleLogout}
          className="flex text-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
        >
          <LogoutIcon className="size-4" />
          Đăng xuất
        </button>
      </div>
    </header>
  );
};
