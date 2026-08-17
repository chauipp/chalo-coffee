"use client";
// src/app/(admin)/admin/settings/page.tsx
import { FormField } from "@/components/shared/ui/FormField";
import { Input } from "@/components/shared/ui/Input";
import { Select } from "@/components/shared/ui/Select";
import { Toggle } from "@/components/shared/ui/Toggle";
import { SettingsDto, useGetSettings, useUpdateSettings } from "@/services/settings";
import { useState } from "react";
import { AdminMobilePageHeader } from "../../_components/AdminMobilePageHeader";

/** Các ngân hàng VN phổ biến — value là mã BIN Napas dùng cho VietQR. */
const VN_BANKS = [
  { value: "", label: "- Chưa cấu hình -" },
  { value: "970422", label: "MB Bank" },
  { value: "970436", label: "Vietcombank" },
  { value: "970415", label: "VietinBank" },
  { value: "970418", label: "BIDV" },
  { value: "970405", label: "Agribank" },
  { value: "970407", label: "Techcombank" },
  { value: "970416", label: "ACB" },
  { value: "970432", label: "VPBank" },
  { value: "970423", label: "TPBank" },
  { value: "970403", label: "Sacombank" },
];

export default function SettingsPage() {
  const { data, isLoading } = useGetSettings();
  const updateM = useUpdateSettings();

  // Local edits overlay the server value; null means "in sync with server".
  const [draft, setDraft] = useState<SettingsDto | null>(null);
  const current = draft ?? data;
  const waitTimeEnabled = current?.waitTimeEnabled ?? true;
  const baristaCount = current?.baristaCount ?? 3;
  const bankBin = current?.bankBin ?? "";
  const bankAccountNo = current?.bankAccountNo ?? "";
  const bankAccountName = current?.bankAccountName ?? "";

  const patch = (p: Partial<SettingsDto>) =>
    setDraft({
      waitTimeEnabled,
      baristaCount,
      bankBin: bankBin || null,
      bankAccountNo: bankAccountNo || null,
      bankAccountName: bankAccountName || null,
      ...p,
    });

  const setBaristaCount = (n: number) => {
    // ponytail: clamp 1-20 thay vì schema riêng cho 1 field số
    const clamped = Number.isFinite(n) ? Math.min(20, Math.max(1, Math.round(n))) : 1;
    patch({ baristaCount: clamped });
  };

  const dirty =
    !!data &&
    !!draft &&
    (draft.waitTimeEnabled !== data.waitTimeEnabled ||
      draft.baristaCount !== data.baristaCount ||
      (draft.bankBin ?? null) !== (data.bankBin ?? null) ||
      (draft.bankAccountNo ?? null) !== (data.bankAccountNo ?? null) ||
      (draft.bankAccountName ?? null) !== (data.bankAccountName ?? null));

  // Cấu hình bank hợp lệ khi đủ cả 3 hoặc trống cả 3
  const bankPartial =
    [bankBin, bankAccountNo, bankAccountName].some(Boolean) &&
    ![bankBin, bankAccountNo, bankAccountName].every(Boolean);

  const save = () =>
    updateM.mutate(
      {
        waitTimeEnabled,
        baristaCount,
        bankBin: bankBin || "",
        bankAccountNo: bankAccountNo || "",
        bankAccountName: bankAccountName || "",
      },
      { onSuccess: () => setDraft(null) },
    );

  if (isLoading)
    return (
      <div className="p-4 text-sm text-gray-400 sm:p-6">Đang tải cài đặt...</div>
    );

  return (
    <div className="max-w-xl space-y-6 p-4 sm:p-6">
      <AdminMobilePageHeader
        title="Cài đặt"
        description="Cấu hình vận hành và thanh toán"
      />

      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Hiển thị thời gian chờ ước tính
            </p>
            <p className="text-xs text-gray-400">
              Hiện thời gian chờ dự kiến cho khách khi đặt món
            </p>
          </div>
          <Toggle
            checked={waitTimeEnabled}
            onChange={(v) => patch({ waitTimeEnabled: v })}
          />
        </div>

        <FormField
          label="Số barista phục vụ song song"
          hint="Dùng để ước lượng thời gian chờ"
        >
          <Input
            type="number"
            min={1}
            max={20}
            value={baristaCount}
            disabled={!waitTimeEnabled}
            onChange={(e) => setBaristaCount(Number(e.target.value))}
            className="w-40"
          />
        </FormField>
      </div>

      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Thanh toán chuyển khoản (VietQR)
          </p>
          <p className="text-xs text-gray-400">
            Cấu hình đủ 3 mục thì màn thanh toán của khách sẽ hiện mã QR
            chuyển khoản đúng số tiền của bàn. Mọi app ngân hàng đều quét được.
          </p>
        </div>

        <FormField label="Ngân hàng nhận tiền">
          <Select
            value={bankBin}
            onChange={(e) => patch({ bankBin: e.target.value || null })}
            options={VN_BANKS}
          />
        </FormField>

        <FormField label="Số tài khoản">
          <Input
            value={bankAccountNo}
            inputMode="numeric"
            maxLength={30}
            placeholder="VD: 0123456789"
            onChange={(e) =>
              patch({ bankAccountNo: e.target.value.replace(/\D/g, "") || null })
            }
          />
        </FormField>

        <FormField
          label="Tên chủ tài khoản"
          hint="Hiện cho khách đối chiếu khi chuyển khoản"
        >
          <Input
            value={bankAccountName}
            maxLength={100}
            placeholder="VD: NGUYEN VAN A"
            onChange={(e) =>
              patch({ bankAccountName: e.target.value.toUpperCase() || null })
            }
          />
        </FormField>

        {bankPartial && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Cần điền đủ cả ngân hàng, số tài khoản và tên chủ tài khoản thì QR
            mới hiển thị cho khách.
          </p>
        )}
      </div>

      <div
        data-testid="admin-mobile-settings-save"
        className="-mx-4 border-t border-gray-200 bg-gray-50/95 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/95 sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0"
      >
        <button
          onClick={save}
          disabled={!dirty || updateM.isPending}
          className="w-full rounded-xl bg-brand-400 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:opacity-50 sm:w-auto"
        >
          {updateM.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
}
