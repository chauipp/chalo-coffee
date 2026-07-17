// src/services/settings/settings.types.ts
export interface SettingsDto {
  waitTimeEnabled: boolean;
  baristaCount: number;
  /** VietQR: mã BIN ngân hàng nhận tiền (MB = 970422). Null = chưa cấu hình. */
  bankBin: string | null;
  bankAccountNo: string | null;
  bankAccountName: string | null;
  /** Bật/tắt gợi ý gộp đơn thông minh ở màn pha chế của staff */
  smartBatchingEnabled: boolean;
}

export interface UpdateSettingsPayload {
  waitTimeEnabled: boolean;
  baristaCount: number;
  smartBatchingEnabled: boolean;
  /** Chuỗi rỗng = xoá cấu hình */
  bankBin?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
}
