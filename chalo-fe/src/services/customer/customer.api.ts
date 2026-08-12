import { API } from "@/constants";
import { request } from "@/lib/api-client";
import type {
  CustomerLoyalty,
  CustomerOrderPage,
  CustomerOrderParams,
  CustomerProfile,
  CustomerShortcut,
  ScanTablePayload,
} from "./customer.types";

export const getCustomerProfile = (): Promise<CustomerProfile> =>
  request.get(API.CUSTOMER.ME);

export const getCustomerShortcut = (): Promise<CustomerShortcut | null> =>
  request.get(API.CUSTOMER.TABLE_SESSION);

export const scanCustomerTable = (
  data: ScanTablePayload,
): Promise<CustomerShortcut> => request.post(API.CUSTOMER.SCAN_TABLE, data);

export const leaveCustomerTable = (): Promise<null> =>
  request.post(API.CUSTOMER.LEAVE_TABLE);

export const getCustomerLoyalty = (): Promise<CustomerLoyalty> =>
  request.get(API.CUSTOMER.LOYALTY);

export const getCustomerOrders = (
  params: CustomerOrderParams = {},
): Promise<CustomerOrderPage> =>
  request.get(API.CUSTOMER.ORDERS, {
    params: {
      pageNo: params.pageNo ?? 1,
      pageSize: params.pageSize ?? 10,
    },
  });
