"use client";
// src/components/shared/UserMenu.tsx — avatar trigger + personal options dropdown

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LogoutIcon } from "./icons/LogoutIcon";
import { ThemeSwitch } from "./ThemeSwitch";
import { useLogout } from "@/hooks/useLogout";
import { useAuthStore } from "@/stores/auth.store";

export const UserMenu = ({ collapsed }: { collapsed: boolean }) => {
  const { user } = useAuthStore();
  const handleLogout = useLogout();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Route change is the only reliable signal for "a keyboard-activated Link
  // just navigated us away" — the layout stays mounted across navigation, so
  // nothing else tears the panel down.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
    // mousedown alone misses keyboard-driven outside interaction: Enter/Space
    // on a button or link fires `click`, never `mousedown`. focusout catches
    // focus moving to any element outside the root, however it got there.
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null;
      // relatedTarget is null when focus leaves the document entirely (e.g.
      // switching browser tabs) — that is not an "outside" interaction.
      if (next === null) return;
      if (rootRef.current?.contains(next)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    rootRef.current?.addEventListener("focusout", onFocusOut);
    const root = rootRef.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
      root?.removeEventListener("focusout", onFocusOut);
    };
  }, [open]);

  const name = user?.fullName ?? "Người dùng";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="user-menu-panel"
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

      {open && (
        <div
          id="user-menu-panel"
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

          <div className="flex justify-center py-2">
            <ThemeSwitch />
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
    </div>
  );
};
