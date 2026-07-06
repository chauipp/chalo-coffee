// src/services/table/table.types.ts
import { OrderStatus } from "../order/order.types";
import { PageParam } from "../types";

export const TABLE_STATUS = ["AVAILABLE", "OCCUPIED"] as const;
export type TableStatus = (typeof TABLE_STATUS)[number];

export interface TableOrderSummary {
  id: string;
  status: OrderStatus;
  paidStatus: boolean;
  totalAmount: number;
  createdAt: string;
}

export interface TableDto {
  id: string;
  name: string;
  area?: string;
  status: TableStatus;
  qrToken: string;
  qrCodeUrl: string;
  activeOrders: TableOrderSummary[];
  createdAt: string;
}

export interface CreateTablePayload {
  name: string;
  area?: string;
}

export interface UpdateTablePayload extends CreateTablePayload {
  id: string;
}

export interface TablePageParams extends PageParam {
  status?: TableStatus;
  area?: string;
}

export interface TablePublicDto {
  id: string;
  name: string;
  area?: string;
  status: TableStatus;
}
