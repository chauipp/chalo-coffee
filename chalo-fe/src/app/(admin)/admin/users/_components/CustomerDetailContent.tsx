"use client";
// src/app/(admin)/admin/users/_components/CustomerDetailContent.tsx
import { Badge, BadgeVariant } from "@/components/shared/ui/Badge";
import { QUERY_KEYS } from "@/constants";
import { useTablePagination } from "@/hooks/useTablePagination";
import {
  CustomerDto,
  CustomerOrderDto,
  getCustomerOrders,
  useGetCustomerLoyalty,
  useGetCustomerLoyaltyHistory,
} from "@/services/customer-admin";
import { OrderStatus } from "@/services/order/order.types";
import { PageParam } from "@/services/types";

const STATUS_BADGE: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Khách đặt", variant: "yellow" },
  CONFIRMED: { label: "Khách đặt", variant: "blue" },
  PREPARING: { label: "Đang pha chế", variant: "blue" },
  READY: { label: "Sẵn sàng phục vụ", variant: "green" },
  COMPLETED: { label: "Đã phục vụ", variant: "gray" },
  CANCELLED: { label: "Đã huỷ", variant: "red" },
};

interface Props {
  customer: CustomerDto;
}

const INITIAL_ORDER_FILTER: PageParam = { pageNo: 1, pageSize: 5 };

export function CustomerDetailContent({ customer }: Props) {
  const loyaltyQuery = useGetCustomerLoyalty(customer.id);
  const loyaltyHistoryQuery = useGetCustomerLoyaltyHistory(customer.id);
  const orders = useTablePagination<CustomerOrderDto, PageParam>({
    initialFilter: INITIAL_ORDER_FILTER,
    queryFn: (params) => getCustomerOrders(customer.id, params),
    queryKey: QUERY_KEYS.CUSTOMERS.ORDERS(customer.id, {}),
  });

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400">Tài khoản</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            @{customer.username}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Email</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {customer.email ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Ngày tạo</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {new Date(customer.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Điểm tích luỹ</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {loyaltyQuery.isLoading
              ? "…"
              : `${loyaltyQuery.data?.balance ?? 0} điểm`}
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Lần tích điểm gần nhất
        </h3>
        {loyaltyHistoryQuery.isLoading ? (
          <p className="text-sm text-gray-400">Đang tải...</p>
        ) : loyaltyHistoryQuery.isError ? (
          <button
            type="button"
            onClick={() => void loyaltyHistoryQuery.refetch()}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400"
          >
            Tải lại lịch sử điểm
          </button>
        ) : loyaltyHistoryQuery.data?.list.length ? (
          <ul className="space-y-2">
            {loyaltyHistoryQuery.data.list.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2 text-sm dark:border-gray-800"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Đơn #{entry.orderId.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(entry.createdAt).toLocaleString("vi-VN")}
                    {entry.orderTotalAmount !== null
                      ? ` · ${entry.orderTotalAmount.toLocaleString("vi-VN")}đ`
                      : ""}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-emerald-600 dark:text-emerald-400">
                  +{entry.points} điểm
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-gray-200 px-4 py-4 text-center text-sm text-gray-400 dark:border-gray-800">
            Khách chưa có lần tích điểm nào.
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Lịch sử đơn hàng
        </h3>
        {orders.isLoading ? (
          <p className="text-sm text-gray-400">Đang tải...</p>
        ) : orders.data.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-800">
            Khách chưa có đơn hàng nào.
          </p>
        ) : (
          <ul className="space-y-2">
            {orders.data.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-sm dark:border-gray-800"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Bàn {order.tableName} · {order.itemsCount} món
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    label={STATUS_BADGE[order.status].label}
                    variant={STATUS_BADGE[order.status].variant}
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {order.totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {orders.pagination.totalPage > 1 && (
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              onClick={() => orders.changePage(orders.pagination.pageNo - 1)}
              disabled={!orders.pagination.hasPrevPage}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400"
            >
              ← Trước
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {orders.pagination.pageNo} / {orders.pagination.totalPage}
            </span>
            <button
              onClick={() => orders.changePage(orders.pagination.pageNo + 1)}
              disabled={!orders.pagination.hasNextPage}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400"
            >
              Sau →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
