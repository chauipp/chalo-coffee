// src/services/order/order.api.ts
import { request } from "@/lib/api-client";
import {
  CallStaffPayload,
  CheckoutCompletePayload,
  CheckoutCompleteResult,
  CheckoutPreviewPayload,
  CheckoutPreviewResult,
  CheckoutSessionResult,
  CheckoutStartPayload,
  CreateOrderPayload,
  OrderDto,
  OrderPageParams,
  OrderStatus,
  PayAllOrdersPayload,
  PayOrderPayload,
  RevenueStatsParams,
  RevenueStatsResult,
  TopProductItem,
  TopProductsParams,
} from "./order.types";
import { API } from "@/constants";
import { PageResult, Period } from "../types";

export const getOrderPage = (
  params: OrderPageParams,
): Promise<PageResult<OrderDto>> => request.get(API.ORDER.PAGE, { params });

export const getOrderById = (id: string): Promise<OrderDto> =>
  request.get(API.ORDER.DETAIL, { params: { id } });

export const getOrdersByTableToken = (
  tableToken: string,
): Promise<OrderDto[]> => request.get(`${API.ORDER.BY_TOKEN}/${tableToken}`);

export const getActiveOrders = (): Promise<OrderDto[]> =>
  request.get(`${API.ORDER.ACTIVE}`);

export const getEstimatedWait = (
  orderId?: string,
): Promise<{ estimatedMinutes: number }> =>
  request.get(API.ORDER.ESTIMATED_WAIT, {
    params: orderId ? { orderId } : undefined,
  });

export const createOrder = (data: CreateOrderPayload): Promise<OrderDto> =>
  request.post(API.ORDER.CREATE, data);

export const updateOrderStatus = (
  orderId: string,
  status: OrderStatus,
): Promise<OrderDto> =>
  request.put(API.ORDER.UPDATE_STATUS, { id: orderId, status });

export const requestPayment = (orderId: string): Promise<void> =>
  request.post(API.ORDER.REQUEST_PAYMENT, { orderId });

export const callStaff = (data: CallStaffPayload): Promise<{ message: string }> =>
  request.post(API.ORDER.CALL_STAFF, data);

export const payOrder = (data: PayOrderPayload): Promise<OrderDto> =>
  request.post(API.ORDER.PAY, data);

export const payAllOrders = (data: PayAllOrdersPayload): Promise<OrderDto[]> =>
  request.post(API.ORDER.PAY_ALL, data);

export const checkoutPreview = (
  data: CheckoutPreviewPayload,
): Promise<CheckoutPreviewResult> =>
  request.post(API.ORDER.CHECKOUT_PREVIEW, data);

export const checkoutStart = (
  data: CheckoutStartPayload,
): Promise<CheckoutSessionResult> =>
  request.post(API.ORDER.CHECKOUT_START, data);

export const checkoutComplete = (
  data: CheckoutCompletePayload,
): Promise<CheckoutCompleteResult> =>
  request.post(API.ORDER.CHECKOUT_COMPLETE, data);

export const getRevenueStats = (
  params: RevenueStatsParams = {},
): Promise<RevenueStatsResult> =>
  request.get(API.ORDER.STATS_REVENUE, {
    params: {
      period: params.period ?? Period.DAY,
      ...(params.from ? { from: params.from } : {}),
      ...(params.to ? { to: params.to } : {}),
    },
  });

export const getTopProducts = (
  params: TopProductsParams = {},
): Promise<TopProductItem[]> =>
  request.get(API.ORDER.STATS_TOP_PRODUCTS, {
    params: {
      limit: params.limit ?? 5,
      ...(params.from ? { from: params.from } : {}),
      ...(params.to ? { to: params.to } : {}),
    },
  });

/** Gửi GIÁ TRỊ TUYỆT ĐỐI số ly đã pha (không phải +1) — hai máy cùng tick không đếm đôi */
export const setItemPrepared = (
  itemId: string,
  preparedQuantity: number,
): Promise<OrderDto> =>
  request.put(API.ORDER.ITEM_PREPARED(itemId), { preparedQuantity });
