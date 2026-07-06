// src/services/pager/pager.api.ts
import { API } from "@/constants";
import { request } from "@/lib/api-client";
import {
  AssignPagerPayload,
  CallPagerPayload,
  PagerDto,
  PagerStatus,
  ReleasePagerPayload,
} from "./pager.types";

export const getPagers = (status?: PagerStatus): Promise<PagerDto[]> =>
  request.get(API.PAGER.LIST, { params: status ? { status } : undefined });

export const assignPager = (data: AssignPagerPayload): Promise<PagerDto> =>
  request.post(API.PAGER.ASSIGN, data);

export const callPager = (data: CallPagerPayload): Promise<PagerDto> =>
  request.post(API.PAGER.CALL, data);

export const releasePager = (data: ReleasePagerPayload): Promise<PagerDto> =>
  request.post(API.PAGER.RELEASE, data);
