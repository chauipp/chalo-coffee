"use client";

import { useCallback, useState } from "react";
import { PrepDock } from "@/app/(staff)/_components/PrepDock";
import { SplitPane } from "@/app/(staff)/_components/SplitPane";
import { AdminPrepDockDrawer } from "./AdminPrepDockDrawer";
import { ADMIN_PREP_VISIBLE_STORAGE_KEY, readAdminPrepVisible } from "./adminPrepState";

export function AdminOrdersOperationsLayout({ board }: { board: React.ReactNode }) {
  const [dockVisible, setDockVisible] = useState(() =>
    typeof window !== "undefined" && readAdminPrepVisible(localStorage),
  );
  const toggle = useCallback(() => {
    setDockVisible((previous) => {
      const next = !previous;
      localStorage.setItem(ADMIN_PREP_VISIBLE_STORAGE_KEY, String(next));
      return next;
    });
  }, []);
  return (
    <div className="relative h-full min-h-[calc(100vh-10rem)]">
      {!dockVisible && (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={false}
          aria-controls="admin-prep-desktop"
          className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-l-xl border border-r-0 border-brand-300 bg-brand-500 px-2 py-3 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 [writing-mode:vertical-rl]"
        >
          Pha chế
        </button>
      )}
      <div className="hidden h-full md:block">
        {dockVisible ? (
          <div id="admin-prep-desktop" className="h-full"><SplitPane storageKey="admin-orders-prep-split:v1" visible onToggleVisible={toggle} right={(controls) => <PrepDock {...controls} />} left={board} /></div>
        ) : (
          <div className="h-full">{board}</div>
        )}
      </div>
      <div className="h-full md:hidden">{board}</div>
      <AdminPrepDockDrawer open={dockVisible} onClose={toggle} />
    </div>
  );
}
