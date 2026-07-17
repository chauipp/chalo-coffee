"use client";
// src/components/shared/ThemeToggle.tsx
// Fixed icon button (top-right) cycling Sáng → Tối → Hệ thống.
import { useTheme } from "@/providers/ThemeProvider";
import { SunIcon } from "./icons/SunIcon";
import { MoonIcon } from "./icons/MoonIcon";
import { MonitorIcon } from "./icons/MonitorIcon";

const order = ["light", "dark", "system"] as const;
const meta = {
  light: { Icon: SunIcon, label: "Sáng" },
  dark: { Icon: MoonIcon, label: "Tối" },
  system: { Icon: MonitorIcon, label: "Hệ thống" },
};

export const ThemeToggle = () => {
  const { theme, changeTheme } = useTheme();
  const { Icon, label } = meta[theme];
  const next = order[(order.indexOf(theme) + 1) % order.length];

  return (
    <button
      onClick={() => changeTheme(next)}
      title={`Giao diện: ${label} → ${meta[next].label}`}
      aria-label={`Đổi giao diện (đang: ${label})`}
      className="fixed right-3 top-3 z-50 flex size-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
    >
      <Icon className="size-4" />
    </button>
  );
};
