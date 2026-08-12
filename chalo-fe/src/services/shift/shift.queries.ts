import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/constants";
import { closeShift, getCurrentShift, getShiftReport, openShift } from "./shift.api";
export const useCurrentShift = () => useQuery({ queryKey: QUERY_KEYS.SHIFT.CURRENT, queryFn: getCurrentShift, staleTime: 10_000 });
export const useShiftReport = (params: { from?: string; to?: string } = {}) => useQuery({ queryKey: QUERY_KEYS.SHIFT.REPORT(params), queryFn: () => getShiftReport(params), staleTime: 10_000 });
export const useOpenShift = () => { const qc = useQueryClient(); return useMutation({ mutationFn: openShift, onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.SHIFT.CURRENT }); toast.success("Đã mở ca"); }, onError: (e: Error) => toast.error(e.message) }); };
export const useCloseShift = () => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ countedCash, note }: { countedCash: number; note?: string }) => closeShift(countedCash, note), onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.SHIFT.CURRENT }); qc.invalidateQueries({ queryKey: QUERY_KEYS.SHIFT.REPORT() }); toast.success("Đã chốt ca"); }, onError: (e: Error) => toast.error(e.message) }); };
