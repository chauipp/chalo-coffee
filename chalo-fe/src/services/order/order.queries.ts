"use client";
// src/services/order/order.queries.ts
import { QUERY_KEYS } from "@/constants";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  callStaff,
  checkoutPreview,
  checkoutStart,
  createOrder,
  getActiveOrders,
  getEstimatedWait,
  getOrderById,
  getOrderPage,
  getOrdersByTableToken,
  getRevenueStats,
  getTopProducts,
  payOrder,
  updateOrderStatus,
  setItemPrepared,
} from "./order.api";
import {
  CallStaffPayload,
  CheckoutStartPayload,
  CreateOrderPayload,
  OrderDto,
  OrderPageParams,
  OrderStatus,
  PayOrderPayload,
  RevenueStatsParams,
  TopProductsParams,
} from "./order.types";
import { toast } from "sonner";

// ─── Queries ──────────────────────────────────────────────────────────────────
// ===ADMIN===
export const useGetOrderPage = (params: OrderPageParams) => {
  return useQuery({
    queryKey: QUERY_KEYS.ORDERS.PAGE(params),
    queryFn: () => getOrderPage(params),
    staleTime: 30_000,
  });
};

export const useGetOrderByToken = (tableToken: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.ORDERS.BY_TABLE_TOKEN(tableToken),
    queryFn: () => getOrdersByTableToken(tableToken),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
};

export const useGetOrderById = (orderId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.ORDERS.DETAIL(orderId),
    queryFn: () => getOrderById(orderId),
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
};

export const useGetEstimatedWait = (orderId?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.ORDERS.ESTIMATED_WAIT(orderId),
    queryFn: () => getEstimatedWait(orderId),
  });
};

// ===STAFF===
/** `refetchInterval` cho nơi không có SSE (vd khu pha chế ở layout, mở trên mọi màn staff) */
export const useGetActiveOrder = (options?: { refetchInterval?: number }) =>
  useQuery({
    queryKey: QUERY_KEYS.ORDERS.ACTIVE,
    queryFn: () => getActiveOrders(),
    staleTime: 10_000,
    ...options,
  });

// ===Revenue===
export const useGetRevenueStats = (params: RevenueStatsParams) =>
  useQuery({
    queryKey: QUERY_KEYS.REVENUE.STATS(params),
    queryFn: () => getRevenueStats(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

export const useGetTopProducts = (params: TopProductsParams = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.REVENUE.TOP_PRODUCTS(params),
    queryFn: () => getTopProducts(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderPayload) => {
      return createOrder(data);
    },
    onSuccess: (createdOrder, variables) => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.ORDERS.BY_TABLE_TOKEN(variables.tableToken),
      });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ESTIMATED_WAIT() });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PAGERS.ALL });

      qc.invalidateQueries({
        queryKey: QUERY_KEYS.ORDERS.ESTIMATED_WAIT(createdOrder.id),
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: string;
      status: OrderStatus;
    }) => updateOrderStatus(orderId, status),
    onSuccess: (updatedOrder) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.ORDERS.DETAIL(updatedOrder.id),
      });
      toast.success("Cập nhật trạng thái đơn hàng thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useCallStaff = () => {
  return useMutation({
    mutationFn: (data: CallStaffPayload) => callStaff(data),
    onSuccess: () =>
      toast.success("Đã gọi nhân viên, vui lòng chờ trong giây lát"),
    onError: (e: Error) => toast.error(e.message),
  });
};

export const usePayOrder = (tableToken: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PayOrderPayload) => payOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.ORDERS.BY_TABLE_TOKEN(tableToken),
      });
      toast.success("Thanh toán thành công!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ─── Checkout (batch) ───────────────────────────────────────────────────────
export const useCheckoutPreview = (tableToken: string) =>
  useQuery({
    queryKey: QUERY_KEYS.ORDERS.CHECKOUT_PREVIEW(tableToken),
    queryFn: () => checkoutPreview({ tableToken }),
    enabled: !!tableToken,
    staleTime: 10_000,
    retry: false, // BE throws if the table has no open orders — show empty state instead of retrying
  });

export const useCheckoutStart = () =>
  useMutation({
    mutationFn: (data: CheckoutStartPayload) => checkoutStart(data),
    onError: (e: Error) => toast.error(e.message),
  });

/**
 * Tick số ly đã pha. Cập nhật optimistic để barista thấy phản hồi tức thì;
 * BE có thể tự đẩy đơn sang READY nên luôn invalidate lại ở onSettled.
 */
export const useSetItemPrepared = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      preparedQuantity,
    }: {
      itemId: string;
      preparedQuantity: number;
    }) => setItemPrepared(itemId, preparedQuantity),
    onMutate: async ({ itemId, preparedQuantity }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
      const prev = qc.getQueryData<OrderDto[]>(QUERY_KEYS.ORDERS.ACTIVE);
      qc.setQueryData<OrderDto[]>(QUERY_KEYS.ORDERS.ACTIVE, (old) =>
        (old ?? []).map((o) => ({
          ...o,
          items: o.items.map((i) =>
            i.id === itemId ? { ...i, preparedQuantity } : i,
          ),
        })),
      );
      return { prev };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEYS.ORDERS.ACTIVE, ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
    },
  });
};
