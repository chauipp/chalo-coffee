// src/services/settings/settings.types.ts
export interface SettingsDto {
  waitTimeEnabled: boolean;
  baristaCount: number;
}

export interface UpdateSettingsPayload {
  waitTimeEnabled: boolean;
  baristaCount: number;
}
