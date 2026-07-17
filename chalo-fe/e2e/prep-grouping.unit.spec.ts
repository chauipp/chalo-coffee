import { test, expect } from "@playwright/test";
import {
  groupByProduct,
  tableProgress,
  nextPreparedQuantity,
} from "../src/utils/prep-grouping";
import { OrderDto } from "../src/services/order/order.types";

const item = (
  id: string,
  productId: string,
  productName: string,
  quantity = 1,
  preparedQuantity = 0,
  note: string | null = null,
) => ({
  id,
  productId,
  productName,
  productImageUrl: null,
  price: 39000,
  quantity,
  preparedQuantity,
  subtotal: 39000 * quantity,
  note,
});

const order = (
  id: string,
  tableName: string,
  createdAt: string,
  items: ReturnType<typeof item>[],
): OrderDto =>
  ({
    id,
    tableId: `t-${id}`,
    tableName,
    tableToken: `tok-${id}`,
    items,
    status: "PREPARING",
    paidStatus: false,
    totalAmount: 39000,
    estimateWaitMinutes: null,
    note: null,
    createdAt,
    updatedAt: createdAt,
  }) as OrderDto;

test("4 đơn cùng Cold Drip gom thành 1 card, 4 ly", () => {
  const orders = [
    order("o1", "Ban 02", "2026-07-17T01:00:00Z", [item("i1", "p1", "Cold Drip")]),
    order("o2", "Ban 06", "2026-07-17T01:01:00Z", [item("i2", "p1", "Cold Drip")]),
    order("o3", "Ban 07", "2026-07-17T01:02:00Z", [item("i3", "p1", "Cold Drip")]),
    order("o4", "Ban 08", "2026-07-17T01:03:00Z", [item("i4", "p1", "Cold Drip")]),
  ];
  const groups = groupByProduct(orders);
  expect(groups).toHaveLength(1);
  expect(groups[0].productName).toBe("Cold Drip");
  expect(groups[0].total).toBe(4);
  expect(groups[0].done).toBe(0);
  expect(groups[0].batches).toHaveLength(1);
});

test("ghi chú tách mẻ riêng, số lượng từng mẻ đúng", () => {
  const orders = [
    order("o1", "Ban 02", "2026-07-17T01:00:00Z", [item("i1", "p1", "Cold Drip")]),
    order("o2", "Ban 06", "2026-07-17T01:01:00Z", [
      item("i2", "p1", "Cold Drip", 1, 0, "ít đá"),
    ]),
    order("o3", "Ban 07", "2026-07-17T01:02:00Z", [item("i3", "p1", "Cold Drip")]),
  ];
  const [g] = groupByProduct(orders);
  expect(g.batches).toHaveLength(2);
  expect(g.batches[0].note).toBeNull(); // mẻ thường đứng trước
  expect(g.batches[0].units).toHaveLength(2);
  expect(g.batches[1].note).toBe("ít đá");
  expect(g.batches[1].units).toHaveLength(1);
});

test("ghi chú khác hoa thường / thừa khoảng trắng vẫn là một mẻ", () => {
  const orders = [
    order("o1", "Ban 02", "2026-07-17T01:00:00Z", [
      item("i1", "p1", "Cold Drip", 1, 0, "Ít Đá"),
    ]),
    order("o2", "Ban 06", "2026-07-17T01:01:00Z", [
      item("i2", "p1", "Cold Drip", 1, 0, "  ít đá "),
    ]),
  ];
  const [g] = groupByProduct(orders);
  expect(g.batches).toHaveLength(1);
  expect(g.batches[0].units).toHaveLength(2);
});

test("card sắp theo đơn cũ nhất chứa món đó", () => {
  const orders = [
    order("o1", "Ban 02", "2026-07-17T01:05:00Z", [item("i1", "p2", "Croissant")]),
    order("o2", "Ban 06", "2026-07-17T01:00:00Z", [item("i2", "p1", "Cold Drip")]),
  ];
  const groups = groupByProduct(orders);
  expect(groups.map((g) => g.productName)).toEqual(["Cold Drip", "Croissant"]);
});

test("tick đếm đúng: preparedQuantity 2/3 -> done=2, 2 ly đầu ticked", () => {
  const orders = [
    order("o1", "Ban 05", "2026-07-17T01:00:00Z", [
      item("i1", "p1", "Cold Drip", 3, 2),
    ]),
  ];
  const [g] = groupByProduct(orders);
  expect(g.total).toBe(3);
  expect(g.done).toBe(2);
  expect(g.batches[0].units.map((u) => u.ticked)).toEqual([true, true, false]);
});

test("bàn gọi 2 món -> 2 card, dải bàn báo 0/2", () => {
  const orders = [
    order("o1", "Ban 06", "2026-07-17T01:00:00Z", [
      item("i1", "p1", "Cold Drip"),
      item("i2", "p2", "Croissant"),
    ]),
  ];
  expect(groupByProduct(orders)).toHaveLength(2);
  const [t] = tableProgress(orders);
  expect(t.tableName).toBe("Ban 06");
  expect(t.total).toBe(2);
  expect(t.done).toBe(0);
  expect(t.items).toHaveLength(2);
});

test("dải bàn sắp FIFO theo đơn cũ nhất", () => {
  const orders = [
    order("o1", "Ban 09", "2026-07-17T01:05:00Z", [item("i1", "p1", "Cold Drip")]),
    order("o2", "Ban 03", "2026-07-17T01:00:00Z", [item("i2", "p1", "Cold Drip")]),
  ];
  expect(tableProgress(orders).map((t) => t.tableName)).toEqual([
    "Ban 03",
    "Ban 09",
  ]);
});

test("nextPreparedQuantity: bấm ly chưa tick -> tick tới nó", () => {
  const unit = { unitIndex: 1, ticked: false } as never;
  expect(nextPreparedQuantity(unit)).toBe(2);
});

test("nextPreparedQuantity: bấm ly đã tick -> bỏ tick nó và các ly sau", () => {
  const unit = { unitIndex: 1, ticked: true } as never;
  expect(nextPreparedQuantity(unit)).toBe(1);
});
