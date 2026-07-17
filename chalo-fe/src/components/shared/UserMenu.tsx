"use client";
// src/components/shared/UserMenu.tsx — avatar trigger + personal options dropdown

import { useEffect, useRef, useState } from "react";
import { LogoutIcon } from "./icons/LogoutIcon";
import { useLogout } from "@/hooks/useLogout";
import { useAuthStore } from "@/stores/auth.store";

export const UserMenu = ({ collapsed }: { collapsed: boolean }) => {
  const { user } = useAuthStore();
  const handleLogout = useLogout();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  const name = user?.fullName ?? "Người dùng";

  return (
    <div ref={rootRef} className="relative">
      {open && (
        <div
          data-testid="user-menu-panel"
          className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {name}
            </p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>

          <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            <LogoutIcon className="size-4" />
            Đăng xuất
          </button>
        </div>
      )}

      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        data-testid="user-menu-trigger"
        title={collapsed ? name : undefined}
        className={`flex w-full items-center gap-3 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
          collapsed ? "justify-center p-1.5" : "px-3 py-2.5"
        }`}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
          {user?.fullName?.[0] ?? "?"}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {name}
            </p>
            <p className="text-sm text-gray-400">{user?.role}</p>
          </div>
        )}
      </button>
    </div>
  );
};
