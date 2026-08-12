import { request } from "@/lib/api-client";
import { API } from "@/constants";
import { CashShift, ShiftReport } from "./shift.types";
export const getCurrentShift = (): Promise<CashShift | null> => request.get(API.SHIFT.CURRENT);
export const openShift = (openingCash: number): Promise<CashShift> => request.post(API.SHIFT.OPEN, { openingCash });
export const closeShift = (countedCash: number, note?: string): Promise<CashShift> => request.post(API.SHIFT.CLOSE, { countedCash, ...(note ? { note } : {}) });
export const getShiftReport = (params: { from?: string; to?: string; shiftId?: string } = {}): Promise<ShiftReport> => request.get(API.SHIFT.REPORT, { params });
