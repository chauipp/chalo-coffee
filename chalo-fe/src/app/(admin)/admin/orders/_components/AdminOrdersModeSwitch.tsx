"use client";

import { usePathname, useSearchParams } from "next/navigation";

export function AdminOrdersModeSwitch() {
  const pathname = usePathname();
  const params = useSearchParams();
  const view = params.get("view") === "history" ? "history" : "operations";
  const setView = (next: "operations" | "history") => {
    const nextParams = new URLSearchParams(params.toString());
    nextParams.set("view", next);
    window.history.pushState(null, "", `${pathname}?${nextParams.toString()}`);
  };
  return (
    <div role="tablist" aria-label="Chế độ đơn hàng" className="inline-flex rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
      <button role="tab" aria-selected={view === "operations"} onClick={() => setView("operations")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === "operations" ? "bg-brand-400 text-white" : "text-gray-500"}`}>Vận hành</button>
      <button role="tab" aria-selected={view === "history"} onClick={() => setView("history")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === "history" ? "bg-brand-400 text-white" : "text-gray-500"}`}>Lịch sử</button>
    </div>
  );
}
