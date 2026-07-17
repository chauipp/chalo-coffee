"use client";
// src/components/shared/ui/DataTable.tsx
import { PaginationState } from "@/hooks/useTablePagination";
import type { RefObject } from "react";
import { Select } from "./Select";

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  isLoading?: boolean;
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  total?: number;
  loadMoreRef?: RefObject<HTMLDivElement | null>;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  emptyText?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading,
  pagination,
  onPageSizeChange,
  onPageChange,
  total,
  loadMoreRef,
  isLoadingMore,
  hasMore,
  emptyText = "Không có dữ liệu",
}: DataTableProps<T>) {
  const pageSizeOptions = [
    { label: "10 dòng/trang", value: 10 },
    { label: "20 dòng/trang", value: 20 },
    { label: "50 dòng/trang", value: 50 },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-gray-400"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-gray-700 dark:text-gray-300"
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* pagination */}
      {pagination && onPageChange && onPageSizeChange && (
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500">
              Tổng:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {pagination.total} bản ghi
              </span>
            </p>
            <div>
              <Select
                options={pageSizeOptions}
                value={pagination.pageSize}
                onChange={(val) => onPageSizeChange(Number(val.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.pageNo - 1)}
              disabled={!pagination.hasPrevPage}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Trước
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {pagination.pageNo} / {pagination.totalPage}
            </span>
            <button
              onClick={() => onPageChange(pagination.pageNo + 1)}
              disabled={!pagination.hasNextPage}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Sau →
            </button>
          </div>
        </div>
      )}
      {!pagination && typeof total === "number" && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-gray-500">
            Tổng:{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {total} bản ghi
            </span>
          </p>
          <p className="text-xs text-gray-400">
            Đã hiển thị {data.length}/{total}
          </p>
        </div>
      )}
      {loadMoreRef && (
        <div ref={loadMoreRef} className="flex justify-center py-2">
          {isLoadingMore ? (
            <span className="text-sm text-gray-400">Đang tải thêm...</span>
          ) : hasMore ? (
            <span className="text-xs text-gray-400">Cuộn để tải thêm</span>
          ) : data.length > 0 ? (
            <span className="text-xs text-gray-400">
              Đã hiển thị tất cả
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
