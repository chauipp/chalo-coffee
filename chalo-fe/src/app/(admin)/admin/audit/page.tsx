"use client";

import { AdminMobilePageHeader } from "../../_components/AdminMobilePageHeader";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { Select } from "@/components/shared/ui/Select";
import { useAuditLogs } from "@/services/audit";
import type { AuditLogDto } from "@/services/audit";
import { useMemo, useState } from "react";

const ACTION_LABELS: Record<string, string> = {
  REFUND_CREATED: "Ghi nhận hoàn tiền",
  INVENTORY_RECEIVED: "Nhập kho",
  INVENTORY_ADJUSTED: "Điều chỉnh tồn kho",
  PRODUCT_RECIPE_UPDATED: "Cập nhật công thức món",
  SETTINGS_UPDATED: "Cập nhật cài đặt",
};

const describeMetadata = (entry: AuditLogDto) => {
  const data = entry.metadata ?? {};
  if (entry.action === "REFUND_CREATED") return `${Number(data.amount ?? 0).toLocaleString("vi-VN")}đ · ${String(data.method ?? "")}`;
  if (entry.action === "INVENTORY_RECEIVED") return `Nhập ${String(data.quantity ?? "")} · ${String(data.reason ?? "Không có ghi chú")}`;
  if (entry.action === "INVENTORY_ADJUSTED") return `Điều chỉnh ${String(data.delta ?? "")} · ${String(data.reason ?? "Không có ghi chú")}`;
  if (entry.action === "PRODUCT_RECIPE_UPDATED") return `${String(data.lineCount ?? 0)} nguyên liệu trong công thức`;
  if (entry.action === "SETTINGS_UPDATED") return Array.isArray(data.changedFields) ? `Đã đổi: ${data.changedFields.join(", ")}` : "Đã thay đổi cấu hình";
  return entry.entityId ? `Đối tượng #${entry.entityId.slice(-6).toUpperCase()}` : "Không có chi tiết thêm";
};

export default function AdminAuditPage() {
  const [action, setAction] = useState("ALL");
  const audit = useAuditLogs({ limit: 50 });
  const entries = useMemo(
    () => (audit.data ?? []).filter((entry) => action === "ALL" || entry.action === action),
    [action, audit.data],
  );
  const actionOptions = [
    { value: "ALL", label: "Tất cả hoạt động" },
    ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label })),
  ];

  return (
    <div className="space-y-5 p-4 pb-28 sm:p-6">
      <AdminMobilePageHeader title="Nhật ký hoạt động" description="50 thao tác vận hành gần nhất" />
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <label className="block text-sm font-semibold text-stone-700 dark:text-stone-200" htmlFor="audit-action-filter">Lọc theo hoạt động</label>
        <Select id="audit-action-filter" className="mt-2 w-full sm:w-72" value={action} options={actionOptions} onChange={(event) => setAction(event.target.value)} />
      </section>
      <section aria-label="Danh sách nhật ký hoạt động" className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
        {audit.isLoading ? <div className="flex min-h-48 items-center justify-center text-sm text-stone-500"><SpinnerIcon className="mr-2 size-4 animate-spin" />Đang tải nhật ký...</div>
          : audit.isError ? <div className="p-6 text-center"><p className="text-sm text-stone-500 dark:text-stone-400">Chưa tải được nhật ký hoạt động.</p><button type="button" onClick={() => void audit.refetch()} className="mt-3 min-h-11 rounded-xl bg-stone-100 px-4 text-sm font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-100">Thử lại</button></div>
            : entries.length === 0 ? <p className="p-8 text-center text-sm text-stone-500 dark:text-stone-400">Chưa có hoạt động phù hợp.</p>
              : <ul className="divide-y divide-stone-100 dark:divide-stone-800">{entries.map((entry) => <li key={entry.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-stone-900 dark:text-white">{ACTION_LABELS[entry.action] ?? entry.action}</p><p className="mt-1 break-words text-sm text-stone-600 dark:text-stone-300">{describeMetadata(entry)}</p></div><time className="shrink-0 text-right text-xs leading-5 text-stone-400" dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString("vi-VN")}</time></div><p className="mt-2 text-xs text-stone-400">Người thực hiện: {entry.actorUserId ? `#${entry.actorUserId}` : "Hệ thống"}</p></li>)}</ul>}
      </section>
    </div>
  );
}
