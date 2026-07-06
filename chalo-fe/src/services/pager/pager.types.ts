// src/services/pager/pager.types.ts

// 3-state lifecycle from 04-be-pager-token:
//   assign → ASSIGNED (khách cầm thẻ, đang pha)
//   call   → WAITING  (đồ xong, thẻ rung, chờ khách lên lấy)
//   release→ COMPLETED (thu thẻ)
export const PAGER_STATUS = ["WAITING", "ASSIGNED", "COMPLETED"] as const;
export type PagerStatus = (typeof PAGER_STATUS)[number];

export interface PagerDto {
  id: string;
  number: number;
  status: PagerStatus;
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssignPagerPayload {
  number: number;
  orderId: string;
}

export interface CallPagerPayload {
  id: string;
}

export interface ReleasePagerPayload {
  id: string;
}
