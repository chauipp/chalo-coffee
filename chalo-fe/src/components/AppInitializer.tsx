"use client";
// src/components/AppInitializer.tsx

import { PUBLIC_ROUTES } from "@/constants";
import { getCurrentUser } from "@/services/auth/auth.api";
import { useAuthStore } from "@/stores/auth.store";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { BrandLogo } from "./shared/BrandLogo";

const InitializingScreen = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-stone-950">
      <div className="flex flex-col items-center gap-4">
        <BrandLogo className="size-14 rounded-2xl border border-brand-200 bg-white object-contain p-1 shadow-lg dark:border-stone-700 dark:bg-stone-800" />
        <div className="flex items-center gap-2">
          <div className="size-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent"></div>
          <span className="text-sm font-medium text-stone-500">
            Đang tải ...
          </span>
        </div>
      </div>
    </div>
  );
};

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isFetching = useRef(false);

  const {
    isHydrated,
    isInitialized,
    accessToken,
    setUser,
    logout,
    setInitialized,
  } = useAuthStore();

  const isPublicRoute =
    PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) || pathname === "/";

  const initialize = useCallback(async () => {
    if (!isHydrated || isInitialized || isFetching.current) return;

    try {
      if (!accessToken) {
        return;
      }
      isFetching.current = true;
      const user = await getCurrentUser();
      setUser(user);
    } catch (error) {
      logout();
    } finally {
      setInitialized();
      isFetching.current = false;
    }
  }, [isInitialized, isHydrated, accessToken, setInitialized, setUser, logout]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isPublicRoute) return <>{children}</>;

  if (!isHydrated || !isInitialized) return <InitializingScreen />;

  return <>{children}</>;
}
