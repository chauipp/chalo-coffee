import { test, expect } from "@playwright/test";
import {
  computeBatchSuggestion,
  suggestionSignature,
} from "../src/utils/batching";
import { OrderDto } from "../src/services/order/order.types";

// Unit test thuần (không browser/BE): Playwright transpile TS và chạy node-side.
// Chạy riêng: pnpm exec playwright test e2e/batching.unit.spec.ts

/** Order tối giản cho thuật toán: chỉ cần id + items(productId/name/quantity). */
const order = (
  id: string,
  items: [productId: string, quantity: number][],
): OrderDto =>
  ({
    id,
    items: items.map(([productId, quantity], i) => ({
      id: `${id}-item-${i}`,
      productId,
      productName: `Món ${productId}`,
      productImageUrl: null,
      price: 30000,
      quantity,
      subtotal: 30000 * quantity,
      note: null,
    })),
  }) as OrderDto;

test("queue dưới 2 đơn → không gợi ý", () => {
  expect(computeBatchSuggestion([])).toBeNull();
  expect(computeBatchSuggestion([order("a", [["cf-sua", 1]])])).toBeNull();
});

test("3 đơn cùng chung 1 món → gộp cả 3, tổng số lượng đúng", () => {
  const s = computeBatchSuggestion([
    order("a", [["cf-sua", 1], ["tra-dao", 1]]),
    order("b", [["cf-sua", 2]]),
    order("c", [["cf-sua", 1], ["banh-mi", 1]]),
  ]);
  expect(s).not.toBeNull();
  expect([...s!.orderIds].sort()).toEqual(["a", "b", "c"]);
  expect(s!.commonProducts).toHaveLength(1);
  expect(s!.commonProducts[0]).toMatchObject({
    productId: "cf-sua",
    totalQuantity: 4,
  });
});

test("chỉ 2/3 đơn trùng → gợi ý đúng cặp trùng nhiều món nhất", () => {
  const s = computeBatchSuggestion([
    order("a", [["cf-sua", 1], ["tra-dao", 1]]),
    order("b", [["banh-mi", 1]]),
    order("c", [["cf-sua", 1], ["tra-dao", 2]]),
  ]);
  expect(s).not.toBeNull();
  expect([...s!.orderIds].sort()).toEqual(["a", "c"]);
  // a & c chung 2 món
  expect(s!.commonProducts.map((p) => p.productId).sort()).toEqual([
    "cf-sua",
    "tra-dao",
  ]);
});

test("cặp trùng nhiều món hơn thắng bộ 3 trùng ít món", () => {
  const s = computeBatchSuggestion([
    order("a", [["cf-sua", 1], ["tra-dao", 1], ["banh-mi", 1]]),
    order("b", [["cf-sua", 1], ["tra-dao", 1]]),
    order("c", [["cf-sua", 1]]),
  ]);
  // bộ 3 chung 1 món (cf-sua) < cặp a+b chung 2 món
  expect(s).not.toBeNull();
  expect([...s!.orderIds].sort()).toEqual(["a", "b"]);
});

test("điểm bằng nhau → ưu tiên gộp nhiều đơn hơn", () => {
  const s = computeBatchSuggestion([
    order("a", [["cf-sua", 1]]),
    order("b", [["cf-sua", 1]]),
    order("c", [["cf-sua", 1]]),
  ]);
  expect(s!.orderIds).toHaveLength(3);
});

test("không đơn nào trùng món → null", () => {
  const s = computeBatchSuggestion([
    order("a", [["cf-sua", 1]]),
    order("b", [["tra-dao", 1]]),
    order("c", [["banh-mi", 1]]),
  ]);
  expect(s).toBeNull();
});

test("chỉ quét 3 đơn đầu hàng chờ — đơn thứ 4 trùng cũng bỏ qua", () => {
  const s = computeBatchSuggestion([
    order("a", [["cf-sua", 1]]),
    order("b", [["tra-dao", 1]]),
    order("c", [["banh-mi", 1]]),
    order("d", [["cf-sua", 3]]), // trùng với a nhưng đứng thứ 4
  ]);
  expect(s).toBeNull();
});

test("signature ổn định, không phụ thuộc thứ tự orderIds", () => {
  expect(suggestionSignature(["b", "a", "c"])).toBe(
    suggestionSignature(["c", "b", "a"]),
  );
  expect(suggestionSignature(["a", "b"])).not.toBe(
    suggestionSignature(["a", "c"]),
  );
});
