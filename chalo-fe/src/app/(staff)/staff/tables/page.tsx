// src/app/(staff)/staff/tables/page.tsx
"use client";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { TableDto, useGetTableList } from "@/services/table";
import { useState } from "react";
import { TableCard } from "./_components/TableCard";
import { TableDrawer } from "./_components/TableDrawer";

export const STATUS_CONFIG = {
  AVAILABLE: {
    label: "Trống",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800/50",
    textColor: "text-green-700 dark:text-green-400",
    badgeBg: "bg-green-100 dark:bg-green-900/30",
    dot: "bg-green-500",
  },
  OCCUPIED: {
    label: "Có khách",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800/50",
    textColor: "text-red-700 dark:text-red-400",
    badgeBg: "bg-red-100 dark:bg-red-900/30",
    dot: "bg-red-500",
  },
};

export default function StaffTablesPage() {
  const { data: tables, isLoading: isLoadingTables } = useGetTableList();
  const [selectedTable, setSelectedTable] = useState<TableDto | null>(null);
  const [filterArea, setFilterArea] = useState<string>("");

  const areas = [
    ...new Set((tables ?? []).map((t) => t.area).filter((t) => Boolean(t))),
  ];

  const filteredTables = (tables ?? []).filter((t) =>
    filterArea ? t.area === filterArea : true,
  );

  const occupiedCount = (tables ?? []).filter(
    (t) => t.status === "OCCUPIED",
  ).length;
  const availableCount = (tables ?? []).filter(
    (t) => t.status === "AVAILABLE",
  ).length;

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        {/* header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Sơ đồ bàn
              </h1>
              <div className="flex items-center gap-4 mt-0.5">
                <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <span className="size-2 rounded-full bg-green-500" />
                  {availableCount} trống
                </span>
                <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                  <span className="size-2 rounded-full bg-red-500" />
                  {occupiedCount} có khách
                </span>
              </div>
            </div>
          </div>

          {/* area filter */}
          {areas.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setFilterArea("")}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
                  ${
                    filterArea === ""
                      ? "bg-brand-400 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
              >
                Tất cả
              </button>
              {areas.map((a) => (
                <button
                  key={a}
                  onClick={() => setFilterArea(a as string)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
                    ${
                      filterArea === a
                        ? "bg-brand-400 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* table grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingTables ? (
            <div className="flex items-center justify-center h-40">
              <SpinnerIcon className="size-8 animate-spin text-brand-400" />
            </div>
          ) : filteredTables.length === 0 ? (
            <p className="text-center text-gray-400 py-20">Không có bàn nào</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredTables.map((t) => (
                <TableCard key={t.id} table={t} onClick={setSelectedTable} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* detail drawer */}
      <TableDrawer
        table={selectedTable}
        onClose={() => setSelectedTable(null)}
      />
    </>
  );
}
