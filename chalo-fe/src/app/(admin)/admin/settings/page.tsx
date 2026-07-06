"use client";
// src/app/(admin)/admin/settings/page.tsx
import { FormField } from "@/components/shared/ui/FormField";
import { Input } from "@/components/shared/ui/Input";
import { Toggle } from "@/components/shared/ui/Toggle";
import { SettingsDto, useGetSettings, useUpdateSettings } from "@/services/settings";
import { useState } from "react";

export default function SettingsPage() {
  const { data, isLoading } = useGetSettings();
  const updateM = useUpdateSettings();

  // Local edits overlay the server value; null means "in sync with server".
  const [draft, setDraft] = useState<SettingsDto | null>(null);
  const current = draft ?? data;
  const waitTimeEnabled = current?.waitTimeEnabled ?? true;
  const baristaCount = current?.baristaCount ?? 3;

  const setWaitTimeEnabled = (v: boolean) =>
    setDraft({ waitTimeEnabled: v, baristaCount });
  const setBaristaCount = (n: number) =>
    setDraft({ waitTimeEnabled, baristaCount: n });

  const dirty =
    !!data &&
    !!draft &&
    (draft.waitTimeEnabled !== data.waitTimeEnabled ||
      draft.baristaCount !== data.baristaCount);

  const save = () =>
    updateM.mutate(
      { waitTimeEnabled, baristaCount },
      { onSuccess: () => setDraft(null) },
    );

  if (isLoading)
    return (
      <div className="p-6 text-sm text-gray-400">Đang tải cài đặt...</div>
    );

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Cài đặt
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Cấu hình ước lượng thời gian chờ
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Hiển thị thời gian chờ ước tính
            </p>
            <p className="text-xs text-gray-400">
              Hiện thời gian chờ dự kiến cho khách khi đặt món
            </p>
          </div>
          <Toggle checked={waitTimeEnabled} onChange={setWaitTimeEnabled} />
        </div>

        <FormField
          label="Số barista phục vụ song song"
          hint="Dùng để ước lượng thời gian chờ"
        >
          <Input
            type="number"
            min={1}
            value={baristaCount}
            disabled={!waitTimeEnabled}
            onChange={(e) => setBaristaCount(Number(e.target.value))}
            className="w-40"
          />
        </FormField>
      </div>

      <button
        onClick={save}
        disabled={!dirty || updateM.isPending}
        className="rounded-xl bg-brand-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors disabled:opacity-50"
      >
        {updateM.isPending ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </div>
  );
}
