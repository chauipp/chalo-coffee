// src/services/customer-admin/customer-admin.api.ts
import { API } from "@/constants";
import { request } from "@/lib/api-client";
import { PageParam, PageResult } from "../types";
import {
  CustomerDto,
  CustomerLoyaltyDto,
  CustomerOrderDto,
  CustomerPageParams,
} from "./customer-admin.types";

export const getCustomerPage = (
  params: CustomerPageParams,
): Promise<PageResult<CustomerDto>> =>
  request.get(API.USER.PAGE, { params: { ...params, role: "CUSTOMER" } });

export const getCustomerOrders = (
  id: number,
  params: PageParam,
): Promise<PageResult<CustomerOrderDto>> =>
  request.get(API.USER.CUSTOMER_ORDERS(id), { params });

export const getCustomerLoyalty = (id: number): Promise<CustomerLoyaltyDto> =>
  request.get(API.USER.CUSTOMER_LOYALTY(id));

export const setCustomerActive = (
  id: number,
  isActive: boolean,
): Promise<CustomerDto> => request.put(API.USER.SET_ACTIVE(id), { isActive });
