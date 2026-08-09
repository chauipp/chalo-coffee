"use client";

import { useAuthStore } from "@/stores/auth.store";
import {
  clearAdminRoute,
  readAdminRoute,
  saveAdminRoute,
} from "@/utils/admin-persistence";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { shouldRestoreAdminRoute } from "./admin-navigation";

export function AdminStateRestorer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const initializedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;

    if (!userId) {
      return;
    }

    let storage: Storage;
    try {
      storage = window.localStorage;
    } catch {
      return;
    }

    const searchValue = searchParams.toString();
    const search = searchValue ? `?${searchValue}` : "";

    if (initializedUserRef.current !== userId) {
      initializedUserRef.current = userId;
      if (pathname === "/admin") {
        const saved = shouldRestoreAdminRoute(
          pathname,
          readAdminRoute(storage, userId),
        );
        if (saved) {
          router.replace(`${saved.pathname}${saved.search}`);
          return;
        }
      }
    }

    saveAdminRoute(storage, userId, pathname, search);
  }, [isHydrated, pathname, router, searchParams, userId]);

  useEffect(() => {
    if (!isHydrated && typeof window === "undefined") return;
    if (!userId && typeof window !== "undefined") {
      // The key is user-scoped; clearing the previous user's route happens when
      // the auth store transitions to a logged-out state in the same tab.
      const previous = initializedUserRef.current;
      if (previous) {
        try {
          clearAdminRoute(window.localStorage, previous);
        } catch {
          // Ignore unavailable storage during logout.
        }
      }
      initializedUserRef.current = null;
    }
  }, [isHydrated, userId]);

  return null;
}
