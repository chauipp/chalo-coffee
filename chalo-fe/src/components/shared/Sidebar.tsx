"use client";
// src/components/shared/Sidebar.tsx — collapsible sidebar shared by admin & staff
// Desktop (md+): thanh bên cố định, thu gọn w-60 ↔ w-16.
// Mobile (<md): thanh bên trở thành drawer trượt từ trái + top bar có nút ☰.

import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeftIcon } from "./icons/ChevronLeftIcon";
import { MenuIcon } from "./icons/MenuIcon";
import { XIcon } from "./icons/XIcon";
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
  // collapsed chỉ có ý nghĩa ở desktop (md+); mobile luôn hiển thị drawer đầy đủ.
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((c) => !c);

  // Trạng thái mở drawer trên mobile — đóng lại mỗi khi điều hướng sang trang khác.
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);
  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <>
      {/* ── Top bar mobile (chỉ < md) — chứa nút mở drawer ── */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 md:hidden dark:border-gray-800 dark:bg-gray-900">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Mở menu"
          className="-ml-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <MenuIcon className="size-5" />
        </button>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-400 text-lg shadow shadow-brand-400">
          ☕
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
            Chalo Coffee
          </p>
          <p className="-mt-0.5 truncate text-xs text-gray-400">{subtitle}</p>
        </div>
      </header>

      {/* ── Lớp phủ nền khi mở drawer (chỉ < md) ── */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ── Thanh bên / Drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-200 md:static md:z-auto md:w-auto md:translate-x-0 md:transition-[width] dark:border-gray-800 dark:bg-gray-900 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-16" : "md:w-60"}`}
      >
        {/* Brand + nút thu gọn (desktop) / đóng (mobile) */}
        <div className="flex items-center border-b border-gray-100 px-3 py-5 dark:border-gray-800">
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
                <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
                  Chalo Coffee
                </p>
                <p className="text-xs text-gray-400">{subtitle}</p>
              </div>
              {/* Thu gọn — chỉ desktop */}
              <button
                onClick={toggle}
                title="Thu gọn menu"
                className="hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 md:inline-flex dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              {/* Đóng drawer — chỉ mobile */}
              <button
                onClick={closeMobile}
                aria-label="Đóng menu"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 md:hidden dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <XIcon className="size-5" />
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
                  collapsed ? "md:justify-center" : ""
                } ${
                  isActive
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className={collapsed ? "md:hidden" : ""}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="border-t border-gray-100 p-3 dark:border-gray-700">
          <UserMenu collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
};
