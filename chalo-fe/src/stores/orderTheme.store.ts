// src/stores/orderTheme.store.ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type OrderTheme = "cinematic" | "playful";

interface OrderThemeState {
  theme: OrderTheme;
  setTheme: (theme: OrderTheme) => void;
  toggle: () => void;
}

export const useOrderThemeStore = create<OrderThemeState>()(
  persist(
    (set, get) => ({
      theme: "playful",
      setTheme: (theme) => set({ theme }),
      toggle: () =>
        set({ theme: get().theme === "playful" ? "cinematic" : "playful" }),
    }),
    {
      name: "chalo-order-theme",
      version: 1,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
    },
  ),
);
