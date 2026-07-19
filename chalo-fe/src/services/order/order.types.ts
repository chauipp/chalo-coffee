// src/services/order/order.types.ts

import { PageParam, Period } from "../types";

// ============================================================================
// 1. CORE ENUMS & CONSTANTS (Trạng thái và hằng số cốt lõi)
// ============================================================================
export const ORDER_STATUS = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

// ============================================================================
// 2. DTO - DATA TRANSFER OBJECTS 
// ============================================================================
export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  price: number;
  quantity: number;
  /** Số ly đã pha xong — barista tick ở khu pha chế */
  preparedQuantity: number;
  subtotal: number;
  note: string | null;
}

export interface OrderDto {
  id: string;
  tableId: string;
  tableName: string;
  tableToken: string;
  items: OrderItemDto[];
  status: OrderStatus;
  paidStatus: boolean;
  totalAmount: number;
  estimateWaitMinutes: number | null;
  note: string | null;
  pagerId?: string | null; // from 04-be-pager-token
  pagerNumber?: number | null; // from 04-be-pager-token
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 3. PAYLOADS & PARAMS (Dữ liệu từ Client gửi lên Server qua API)
// ============================================================================
export interface CreateOrderPayload {
  tableToken: string;
  items: { productId: string; quantity: number; note?: string }[];
  note?: string;
  pagerNumber?: number; // optional thẻ bàn — BE assigns an ASSIGNED pager on create
}

export interface OrderPageParams extends PageParam {
  status?: OrderStatus;
  tableId?: string;
  date?: string;
  paidStatus?: boolean;
}

export interface PayOrderPayload {
  orderId: string;
  tableToken: string;
}

export interface CallStaffPayload {
  tableToken: string;
  reason?: string;
}

// ============================================================================
// 4. STATS & ANALYTICS (Dữ liệu trả về chuyên biệt cho phần Thống kê)
// ============================================================================
export interface RevenueDataPoint {
  date: string; // BE field. day: "2026-05-05" | week: "2026-19" | month: "2026-05"
  revenue: number;
  orderCount: number;
}

export interface RevenueStatsResult {
  totalRevenue: number;
  totalOrders: number;
  data: RevenueDataPoint[];
}

export interface RevenueStatsParams {
  period?: Period;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

export interface TopProductsParams {
  limit?: number;
  from?: string;
  to?: string;
}

export interface TopProductItem {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

// ============================================================================
// 5. UI & LOCAL STATE (Dữ liệu dùng nội bộ để render Component/State Frontend)
// ============================================================================
export interface CartItem {
  productId: string;
  productName: string;
  productImageUrl: string | null;
  price: number;
  quantity: number;
  note?: string;
}

// ============================================================================
// 6. CHECKOUT (Batch "scan once, pay all")
// ============================================================================
export interface CheckoutPreviewPayload {
  tableToken: string;
  orderIds?: string[]; // optional: limit to these; else all open orders of the table
}

export interface CheckoutStartPayload extends CheckoutPreviewPayload {
  ttlMinutes?: number; // 5–120, default 15
}

export interface CheckoutPreviewResult {
  tableId: string;
  tableName: string;
  tableToken: string;
  orderIds: string[];
  totalAmount: number;
  orders: OrderDto[];
}

export interface CheckoutSessionResult {
  sessionId: string;
  clientSecret: string;
  /** Nội dung chuyển khoản BE sinh sẵn — nhúng nguyên văn vào VietQR */
  payCode: string;
  tableToken: string;
  tableId: string;
  orderIds: string[];
  totalAmount: number;
  expiresAt: string; // ISO
  orders: OrderDto[];
}
