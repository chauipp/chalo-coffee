"use client";

import { useCallback, useState } from "react";
import { PrepDock } from "@/app/(staff)/_components/PrepDock";
import { SplitPane } from "@/app/(staff)/_components/SplitPane";
import { AdminPrepDockDrawer } from "./AdminPrepDockDrawer";

const VISIBLE_KEY = "admin-orders-prep-visible:v1";

export function AdminOrdersOperationsLayout({ board }: { board: React.ReactNode }) {
  const [dockVisible, setDockVisible] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem(VISIBLE_KEY) === "true",
  );
  const toggle = useCallback(() => {
    setDockVisible((previous) => {
      const next = !previous;
      localStorage.setItem(VISIBLE_KEY, String(next));
      return next;
    });
  }, []);
  return (
    <div className="relative h-full min-h-[calc(100vh-10rem)]">
      <div className="absolute right-4 top-2 z-20 md:hidden">
        <button type="button" onClick={toggle} aria-expanded={dockVisible} aria-controls="admin-prep-drawer" className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow">
          {dockVisible ? "Thu gọn khu pha chế" : "Mở khu pha chế"}
        </button>
      </div>
      <div className="hidden h-full md:block">
        {dockVisible ? (
          <SplitPane storageKey="admin-orders-prep-split:v1" visible onToggleVisible={toggle} right={(controls) => <PrepDock {...controls} />} left={board} />
        ) : (
          <div className="h-full">{board}</div>
        )}
      </div>
      <div className="h-full md:hidden">{board}</div>
      <AdminPrepDockDrawer open={dockVisible} onClose={toggle} />
    </div>
  );
}
