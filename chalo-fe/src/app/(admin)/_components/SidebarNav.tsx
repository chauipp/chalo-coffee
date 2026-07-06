"use client";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "./sidebar.config";
import Link from "next/link";

export const SidebarNav = () => {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
      {ADMIN_NAV_ITEMS.map(({ label, href, icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors
              ${
                isActive
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              }`}
          >
            {icon}
            {label}
          </Link>
        );
      })}
    </nav>
  );
};
