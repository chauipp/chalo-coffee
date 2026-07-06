"use client";
import { LogoutIcon } from "@/components/shared/icons/LogoutIcon";
import { useLogout } from "@/hooks/useLogout";
import { useAuthStore } from "@/stores/auth.store";

export const SidebarProfile = () => {
  const { user } = useAuthStore();

  const handleLogout = useLogout();
  
  return (
    <div className="border-t border-gray-100 dark:border-gray-700 p-3">
      <div className="flex items-center gap-3 rounded-xl px-3 pt-2.5 mb-1">
        <div className="flex size-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-bold shrink-0">
          {user?.fullName?.[0] ?? "A"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {user?.fullName ?? "ADMIN auwdyuiawhiudhawiudhaiwudhiuawhdiuahwid"}
          </p>
          <p className="text-sm text-gray-400">{user?.role}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
      >
        <LogoutIcon className="size-4" />
        Đăng xuất
      </button>
    </div>
  );
};
