// src/app/(admin)/_components/AdminSidebar.tsx

import { SidebarNav } from "./SidebarNav";
import { SidebarProfile } from "./SidebarProfile";

export const AdminSidebar = () => {
  return (
    <aside className="bg-white dark:bg-gray-900 flex w-60 flex-col border-r border-gray-200">
      {/* Logo + Name*/}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex size-9 items-center justify-center rounded-xl bg-brand-400 text-xl shadow shadow-brand-400">
          ☕
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Chalo Coffee
          </p>
          <p className="text-xs text-gray-400">Admin Panel</p>
        </div>
      </div>

      {/* navigation */}
      <SidebarNav />

      {/* user profile */}
      <SidebarProfile />
    </aside>
  );
};
