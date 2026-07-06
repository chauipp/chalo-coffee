"use client";
// src/services/settings/settings.queries.ts
import { QUERY_KEYS } from "@/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSettings, updateSettings } from "./settings.api";
import { UpdateSettingsPayload } from "./settings.types";

export const useGetSettings = () =>
  useQuery({
    queryKey: QUERY_KEYS.SETTINGS.ALL,
    queryFn: getSettings,
    staleTime: 60_000,
  });

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSettingsPayload) => updateSettings(data),
    onSuccess: (res) => {
      qc.setQueryData(QUERY_KEYS.SETTINGS.ALL, res);
      toast.success("Đã lưu cài đặt");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
