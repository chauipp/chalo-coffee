// src/services/settings/settings.api.ts
import { API } from "@/constants";
import { request } from "@/lib/api-client";
import { SettingsDto, UpdateSettingsPayload } from "./settings.types";

export const getSettings = (): Promise<SettingsDto> =>
  request.get(API.SETTINGS.GET);

export const updateSettings = (
  data: UpdateSettingsPayload,
): Promise<SettingsDto> => request.put(API.SETTINGS.UPDATE, data);
