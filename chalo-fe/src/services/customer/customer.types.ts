import type { OrderItemDto, OrderStatus } from "@/services/order/order.types";

export interface CustomerProfile {
  id: number;
  username: string;
  fullName: string;
  avatar: string | null;
  email: string | null;
  role: "CUSTOMER";
}

export interface CustomerTableSummary {
  id: string;
  name: string;
  area: string | null;
  status: string;
  qrToken: string;
}

export interface CustomerShortcut {
  id: string;
  customerId: number;
  tableId: string;
  tableToken: string;
  status: "ACTIVE" | "CLOSED" | "EXPIRED";
  startedAt: string;
  lastActivityAt: string;
  paidAt: string | null;
  endedAt: string | null;
  businessDate: string;
  endedReason: string | null;
  updatedAt: string;
  table: CustomerTableSummary;
}

export interface CustomerLoyalty {
  balance: number;
}

export interface CustomerLoyaltyHistoryEntry {
  id: string;
  orderId: string;
  points: number;
  type: "EARN";
  createdAt: string;
  orderTotalAmount: number | null;
}

export interface CustomerLoyaltyHistoryPage {
  list: CustomerLoyaltyHistoryEntry[];
  total: number;
  pageNo: number;
  pageSize: number;
}

export interface CustomerOrder {
  id: string;
  tableId: string;
  tableToken: string;
  table?: Pick<CustomerTableSummary, "id" | "name" | "area">;
  items: OrderItemDto[];
  status: OrderStatus;
  paidStatus: boolean;
  totalAmount: number;
  estimatedWaitMinutes: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrderPage {
  list: CustomerOrder[];
  total: number;
  pageNo: number;
  pageSize: number;
}

export interface CustomerOrderParams {
  pageNo?: number;
  pageSize?: number;
}

export interface ScanTablePayload {
  tableToken: string;
}
