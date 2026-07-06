"use client";
// src/app/(admin)/admin/dashboard/_components/DashboardControls.tsx
import { Select } from "@/components/shared/ui/Select";
import { Input } from "@/components/shared/ui/Input";
import { Period } from "@/services/types";

export interface DashboardFilter {
  period: Period;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

interface Props {
  value: DashboardFilter;
  onChange: (next: DashboardFilter) => void;
}

const PERIOD_OPTIONS = [
  { value: Period.DAY, label: "Theo ngày" },
  { value: Period.WEEK, label: "Theo tuần" },
  { value: Period.MONTH, label: "Theo tháng" },
];

export function DashboardControls({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        options={PERIOD_OPTIONS}
        value={value.period}
        onChange={(e) => onChange({ ...value, period: e.target.value as Period })}
        className="w-40"
      />
      <Input
        type="date"
        value={value.from ?? ""}
        onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
        className="w-44"
      />
      <span className="text-gray-400">→</span>
      <Input
        type="date"
        value={value.to ?? ""}
        onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
        className="w-44"
      />
      {(value.from || value.to) && (
        <button
          onClick={() => onChange({ ...value, from: undefined, to: undefined })}
          className="text-sm text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
        >
          Xoá khoảng ngày
        </button>
      )}
    </div>
  );
}
