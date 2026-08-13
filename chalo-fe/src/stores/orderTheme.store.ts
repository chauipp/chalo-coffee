// src/stores/orderTheme.store.ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type OrderTheme = "cinematic" | "playful";

interface OrderThemeState {
  theme: OrderTheme;
  isHydrated: boolean;
  setTheme: (theme: OrderTheme) => void;
  toggle: () => void;
  setHydrated: () => void;
}

export const useOrderThemeStore = create<OrderThemeState>()(
  persist(
    (set, get) => ({
      theme: "playful",
      isHydrated: false,
      setTheme: (theme) => set({ theme }),
      toggle: () =>
        set({ theme: get().theme === "playful" ? "cinematic" : "playful" }),
      setHydrated: () => set({ isHydrated: true }),
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
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => { state?.setHydrated() },
    },
  ),
);
