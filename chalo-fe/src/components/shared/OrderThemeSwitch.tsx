"use client";
// src/components/shared/OrderThemeSwitch.tsx — giữ lựa chọn giao diện cũ tương thích localStorage
import { useOrderThemeStore } from "@/stores/orderTheme.store";

export const OrderThemeSwitch = () => {
  const storeTheme = useOrderThemeStore((s) => s.theme);
  const isHydrated = useOrderThemeStore((s) => s.isHydrated);
  const setTheme = useOrderThemeStore((s) => s.setTheme);
  const theme = isHydrated ? storeTheme : "playful";
  const isPlayful = theme === "playful";

  const pillClass = (active: boolean) =>
    `rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
      active
        ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
        : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
    }`;

  return (
    <div
      role="group"
      aria-label="Chọn giao diện đặt món"
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-stone-200 bg-stone-100/80 p-0.5 dark:border-stone-800 dark:bg-stone-900/80"
    >
      <button
        type="button"
        role="switch"
        aria-checked={isPlayful}
        aria-label="Giao diện tiêu chuẩn"
        data-testid="order-theme-playful"
        onClick={() => setTheme("playful")}
        className={pillClass(isPlayful)}
      >
        Tiêu chuẩn
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={!isPlayful}
        aria-label="Giao diện tập trung"
        data-testid="order-theme-cinematic"
        onClick={() => setTheme("cinematic")}
        className={pillClass(!isPlayful)}
      >
        Tập trung
      </button>
    </div>
  );
};
