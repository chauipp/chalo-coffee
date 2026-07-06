"use client";
// src/app/(admin)/admin/menu/layout.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Danh mục", href: "/admin/menu/categories" },
  { label: "Sản phẩm", href: "/admin/menu/products" },
];

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-colors
                    ${
                      isActive
                        ? "border-brand-400 text-brand-600 dark:text-brand-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}
