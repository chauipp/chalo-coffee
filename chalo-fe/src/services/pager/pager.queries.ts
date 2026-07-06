"use client";
// src/services/pager/pager.queries.ts
import { QUERY_KEYS } from "@/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { assignPager, callPager, getPagers, releasePager } from "./pager.api";
import {
  AssignPagerPayload,
  CallPagerPayload,
  PagerDto,
  ReleasePagerPayload,
} from "./pager.types";

// The board shows every pager that has not been returned yet — both ASSIGNED
// (đang pha) and WAITING (chờ khách lên lấy). Only COMPLETED leaves the board.
export const useGetActivePagers = () =>
  useQuery({
    queryKey: QUERY_KEYS.PAGERS.LIST(),
    queryFn: () => getPagers(),
    select: (pagers: PagerDto[]) =>
      pagers.filter((p) => p.status !== "COMPLETED"),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

export const useAssignPager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignPagerPayload) => assignPager(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PAGERS.ALL });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useCallPager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CallPagerPayload) => callPager(data),
    onSuccess: (pager) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PAGERS.ALL });
      toast.success(`Đã gọi khách - thẻ #${pager.number}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useReleasePager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReleasePagerPayload) => releasePager(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PAGERS.ALL });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
      toast.success("Đã thu thẻ bàn");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
