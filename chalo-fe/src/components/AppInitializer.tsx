"use client";
// src/components/AppInitializer.tsx

import { PUBLIC_ROUTES } from "@/constants";
import { getCurrentUser } from "@/services/auth/auth.api";
import { useAuthStore } from "@/stores/auth.store";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

const InitializingScreen = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-400 shadow-lg text-2xl">
          ☕
        </div>
        <div className="flex items-center gap-2">
          <div className="size-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent"></div>
          <span className="text-sm font-medium text-gray-500">
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
