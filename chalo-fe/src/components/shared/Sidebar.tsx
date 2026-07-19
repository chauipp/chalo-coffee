"use client";
// src/components/shared/Sidebar.tsx — collapsible sidebar shared by admin & staff

import { useState, type ComponentType, type SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeftIcon } from "./icons/ChevronLeftIcon";
import { UserMenu } from "./UserMenu";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const Sidebar = ({
  subtitle,
  items,
}: {
  subtitle: string;
  items: NavItem[];
}) => {
  const pathname = usePathname();

  // ponytail: in-memory — persists across navigation (layout stays mounted), resets on hard reload
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((c) => !c);

  return (
    <aside
      className={`flex flex-col border-r border-stone-200 bg-white transition-[width] duration-200 dark:border-stone-800 dark:bg-stone-900 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Brand + collapse toggle */}
      <div className="flex items-center border-b border-stone-100 px-3 py-5 dark:border-stone-800">
        {collapsed ? (
          <button
            onClick={toggle}
            title="Mở rộng menu"
            className="mx-auto flex size-9 items-center justify-center rounded-xl bg-brand-400 text-xl shadow shadow-brand-400"
          >
            ☕
          </button>
        ) : (
          <>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-400 text-xl shadow shadow-brand-400">
              ☕
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">
                Chalo Coffee
              </p>
              <p className="text-xs text-stone-400">{subtitle}</p>
            </div>
            <button
              onClick={toggle}
              title="Thu gọn menu"
              className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="border-t border-stone-100 p-3 dark:border-stone-700">
        <UserMenu collapsed={collapsed} />
      </div>
    </aside>
  );
};
