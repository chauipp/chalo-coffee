"use client";

import { useEffect, useRef } from "react";
import { PrepDock } from "@/app/(staff)/_components/PrepDock";

export function AdminPrepDockDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Khu pha chế">
      <button className="absolute inset-0 bg-black/40" aria-label="Đóng khu pha chế" onClick={onClose} />
      <div id="admin-prep-drawer" ref={panelRef} tabIndex={-1} className="absolute inset-x-2 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] top-16 rounded-xl bg-white p-2 shadow-2xl outline-none dark:bg-gray-900">
        <PrepDock expanded={false} toggleExpand={onClose} />
      </div>
    </div>
  );
}
