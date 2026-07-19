"use client";
// src/app/(admin)/admin/settings/page.tsx
import { FormField } from "@/components/shared/ui/FormField";
import { Input } from "@/components/shared/ui/Input";
import { Select } from "@/components/shared/ui/Select";
import { Toggle } from "@/components/shared/ui/Toggle";
import { SettingsDto, useGetSettings, useUpdateSettings } from "@/services/settings";
import { useState } from "react";

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
  const [sepayKeyInput, setSepayKeyInput] = useState("");
  const current = draft ?? data;
  const waitTimeEnabled = current?.waitTimeEnabled ?? true;
  const baristaCount = current?.baristaCount ?? 3;
  const bankBin = current?.bankBin ?? "";
  const bankAccountNo = current?.bankAccountNo ?? "";
  const bankAccountName = current?.bankAccountName ?? "";
  const sepayWebhookKeySet = current?.sepayWebhookKeySet ?? false;

  const patch = (p: Partial<SettingsDto>) =>
    setDraft({
      waitTimeEnabled,
      baristaCount,
      bankBin: bankBin || null,
      bankAccountNo: bankAccountNo || null,
      bankAccountName: bankAccountName || null,
      sepayWebhookKeySet,
      ...p,
    });

  const setBaristaCount = (n: number) => {
    // ponytail: clamp 1-20 thay vì schema riêng cho 1 field số
    const clamped = Number.isFinite(n) ? Math.min(20, Math.max(1, Math.round(n))) : 1;
    patch({ baristaCount: clamped });
  };

  const dirty =
    (!!data &&
      !!draft &&
      (draft.waitTimeEnabled !== data.waitTimeEnabled ||
        draft.baristaCount !== data.baristaCount ||
        (draft.bankBin ?? null) !== (data.bankBin ?? null) ||
        (draft.bankAccountNo ?? null) !== (data.bankAccountNo ?? null) ||
        (draft.bankAccountName ?? null) !== (data.bankAccountName ?? null))) ||
    sepayKeyInput !== "";

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
        ...(sepayKeyInput.trim() ? { sepayWebhookKey: sepayKeyInput.trim() } : {}),
      },
      {
        onSuccess: () => {
          setDraft(null);
          setSepayKeyInput("");
        },
      },
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
          Cấu hình vận hành và thanh toán
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

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-5">
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

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-5">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Tự động xác nhận chuyển khoản (SePay)
          </p>
          <p className="text-xs text-gray-400">
            Dán API key webhook của SePay. Khi tiền về tài khoản, hệ thống tự
            đánh dấu đã thanh toán và trạm in tự in hoá đơn. Hướng dẫn đăng ký:
            deploy/PRINTING.md.
          </p>
        </div>

        <FormField
          label="SePay Webhook API Key"
          hint={
            data?.sepayWebhookKeySet
              ? "Đã cấu hình — nhập key mới để thay, hoặc bấm Gỡ key."
              : "Chưa cấu hình — webhook đang tắt, chỉ xác nhận tay."
          }
        >
          <Input
            type="password"
            value={sepayKeyInput}
            placeholder={data?.sepayWebhookKeySet ? "••••••••" : "Dán key từ SePay"}
            onChange={(e) => setSepayKeyInput(e.target.value)}
          />
        </FormField>

        {data?.sepayWebhookKeySet && (
          <button
            onClick={() =>
              updateM.mutate({ waitTimeEnabled, baristaCount, sepayWebhookKey: "" })
            }
            className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
          >
            Gỡ key (tắt tự động xác nhận)
          </button>
        )}
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
