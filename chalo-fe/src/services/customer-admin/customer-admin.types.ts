// src/services/customer-admin/customer-admin.types.ts
import { PageParam } from "../types";
import { OrderStatus } from "../order/order.types";

export interface CustomerDto {
  id: number;
  username: string;
  fullName: string;
  avatar: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerOrderDto {
  id: string;
  tableName: string;
  status: OrderStatus;
  totalAmount: number;
  itemsCount: number;
  createdAt: string;
}

export interface CustomerLoyaltyDto {
  balance: number;
}

export interface CustomerLoyaltyHistoryEntryDto {
  id: string;
  orderId: string;
  points: number;
  type: "EARN";
  createdAt: string;
  orderTotalAmount: number | null;
}

export interface CustomerLoyaltyHistoryPageDto {
  list: CustomerLoyaltyHistoryEntryDto[];
  total: number;
  pageNo: number;
  pageSize: number;
}

export interface CustomerPageParams extends PageParam {
  keyword?: string;
}
