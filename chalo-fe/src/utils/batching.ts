// src/utils/batching.ts
// Thuật toán gợi ý gộp đơn thông minh (Smart Batching Suggestion).
// Pure function — test tại e2e/batching.unit.spec.ts (chạy node-side, không browser).
import { OrderDto } from "@/services/order/order.types";

export interface CommonProduct {
  productId: string;
  productName: string;
  /** Tổng số ly/phần của món này trên toàn nhóm gợi ý */
  totalQuantity: number;
}

export interface BatchSuggestion {
  orderIds: string[];
  commonProducts: CommonProduct[];
  /** Định danh ổn định của gợi ý — dùng để nhớ "đã bỏ qua" */
  signature: string;
}

/** Số đơn đầu hàng chờ được quét mỗi lần */
export const SCAN_WINDOW = 3;

export const suggestionSignature = (orderIds: string[]): string =>
  [...orderIds].sort().join("+");

const productIdSet = (o: OrderDto): Set<string> =>
  new Set(o.items.map((i) => i.productId));

/**
 * Quét tối đa SCAN_WINDOW đơn đầu `queue` (caller sort cũ → mới), xét bộ 3 và
 * từng cặp; điểm = số món (productId) mà MỌI đơn trong nhóm đều có. Trả về nhóm
 * điểm cao nhất (≥1 món chung); điểm bằng nhau thì ưu tiên nhóm nhiều đơn hơn.
 */
export const computeBatchSuggestion = (
  queue: OrderDto[],
): BatchSuggestion | null => {
  const top = queue.slice(0, SCAN_WINDOW);
  if (top.length < 2) return null;

  const groups: OrderDto[][] = [];
  if (top.length === 3) groups.push([top[0], top[1], top[2]]);
  for (let i = 0; i < top.length; i++)
    for (let j = i + 1; j < top.length; j++) groups.push([top[i], top[j]]);

  let best: { orders: OrderDto[]; common: string[] } | null = null;
  for (const orders of groups) {
    const rest = orders.slice(1).map(productIdSet);
    const common = [...productIdSet(orders[0])].filter((pid) =>
      rest.every((set) => set.has(pid)),
    );
    if (common.length === 0) continue;
    const better =
      !best ||
      common.length > best.common.length ||
      (common.length === best.common.length &&
        orders.length > best.orders.length);
    if (better) best = { orders, common };
  }
  if (!best) return null;

  const { orders, common } = best;
  const commonProducts: CommonProduct[] = common.map((pid) => ({
    productId: pid,
    productName:
      orders[0].items.find((i) => i.productId === pid)?.productName ?? pid,
    totalQuantity: orders.reduce(
      (sum, o) =>
        sum +
        o.items
          .filter((i) => i.productId === pid)
          .reduce((s, i) => s + i.quantity, 0),
      0,
    ),
  }));

  const orderIds = orders.map((o) => o.id);
  return { orderIds, commonProducts, signature: suggestionSignature(orderIds) };
};
