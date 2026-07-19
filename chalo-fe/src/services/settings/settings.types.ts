// src/services/settings/settings.types.ts
export interface SettingsDto {
  waitTimeEnabled: boolean;
  baristaCount: number;
  /** VietQR: mã BIN ngân hàng nhận tiền (MB = 970422). Null = chưa cấu hình. */
  bankBin: string | null;
  bankAccountNo: string | null;
  bankAccountName: string | null;
  /** true nếu SePay webhook key đã cấu hình (BE không bao giờ trả key thật) */
  sepayWebhookKeySet: boolean;
}

export interface UpdateSettingsPayload {
  waitTimeEnabled: boolean;
  baristaCount: number;
  /** Chuỗi rỗng = xoá cấu hình */
  bankBin?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  /** Bỏ qua = giữ nguyên key; chuỗi rỗng = xoá key (tắt webhook) */
  sepayWebhookKey?: string;
}
