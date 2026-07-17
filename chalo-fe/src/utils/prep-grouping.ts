// src/utils/prep-grouping.ts
// Gom đơn đang pha theo MÓN (không theo bàn) cho khu pha chế, và tính tiến độ
// theo bàn cho dải dưới đáy. Hàm thuần, không JSX — test được ở node.
import { OrderDto } from "@/services/order/order.types";

/** Một ly cụ thể cần pha */
export interface PrepUnit {
  orderId: string;
  itemId: string;
  /** Ly thứ mấy trong item (0-based) */
  unitIndex: number;
  quantity: number;
  tableName: string;
  note: string | null;
  ticked: boolean;
}

/** Mẻ pha: các ly giống hệt nhau — cùng món, cùng ghi chú — pha chung một lượt */
export interface PrepBatch {
  /** Ghi chú đã chuẩn hoá; "" = mẻ thường */
  key: string;
  /** Ghi chú gốc để hiển thị; null = mẻ thường */
  note: string | null;
  units: PrepUnit[];
}

/** Card một món */
export interface ProductGroup {
  productId: string;
  productName: string;
  batches: PrepBatch[];
  total: number;
  done: number;
  oldestCreatedAt: string;
}

/** Chip tiến độ một bàn ở dải đáy */
export interface TableProgress {
  orderId: string;
  tableName: string;
  total: number;
  done: number;
  createdAt: string;
  items: {
    itemId: string;
    productName: string;
    note: string | null;
    quantity: number;
    preparedQuantity: number;
  }[];
}

/** "Ít Đá" và "  ít đá " là cùng một mẻ */
const normalizeNote = (note: string | null): string =>
  (note ?? "").trim().toLowerCase();

const asTime = (iso: string): number => new Date(iso).getTime();

/**
 * Gom mọi đơn đang pha theo productId, trong mỗi món chia mẻ theo ghi chú.
 * Card sắp theo đơn cũ nhất chứa món đó (FIFO) — pha từ trái sang là đúng thứ
 * tự khách chờ. Mẻ thường đứng trước các mẻ có ghi chú.
 */
export const groupByProduct = (orders: OrderDto[]): ProductGroup[] => {
  const map = new Map<string, ProductGroup>();

  for (const o of orders) {
    for (const it of o.items) {
      let g = map.get(it.productId);
      if (!g) {
        g = {
          productId: it.productId,
          productName: it.productName,
          batches: [],
          total: 0,
          done: 0,
          oldestCreatedAt: o.createdAt,
        };
        map.set(it.productId, g);
      }
      if (asTime(o.createdAt) < asTime(g.oldestCreatedAt))
        g.oldestCreatedAt = o.createdAt;

      const key = normalizeNote(it.note);
      let b = g.batches.find((x) => x.key === key);
      if (!b) {
        b = { key, note: key === "" ? null : it.note, units: [] };
        g.batches.push(b);
      }
      for (let u = 0; u < it.quantity; u++) {
        b.units.push({
          orderId: o.id,
          itemId: it.id,
          unitIndex: u,
          quantity: it.quantity,
          tableName: o.tableName,
          note: it.note,
          // preparedQuantity là một con số đếm ⇒ N ly đầu là đã pha
          ticked: u < it.preparedQuantity,
        });
      }
    }
  }

  const groups = [...map.values()];
  for (const g of groups) {
    g.batches.sort((a, b) =>
      a.key === "" ? -1 : b.key === "" ? 1 : a.key.localeCompare(b.key),
    );
    g.total = g.batches.reduce((s, b) => s + b.units.length, 0);
    g.done = g.batches.reduce(
      (s, b) => s + b.units.filter((u) => u.ticked).length,
      0,
    );
  }
  groups.sort((a, b) => asTime(a.oldestCreatedAt) - asTime(b.oldestCreatedAt));
  return groups;
};

/** Tiến độ từng bàn đang pha, FIFO theo đơn cũ nhất */
export const tableProgress = (orders: OrderDto[]): TableProgress[] =>
  [...orders]
    .sort((a, b) => asTime(a.createdAt) - asTime(b.createdAt))
    .map((o) => ({
      orderId: o.id,
      tableName: o.tableName,
      total: o.items.reduce((s, i) => s + i.quantity, 0),
      done: o.items.reduce(
        (s, i) => s + Math.min(i.preparedQuantity, i.quantity),
        0,
      ),
      createdAt: o.createdAt,
      items: o.items.map((i) => ({
        itemId: i.id,
        productName: i.productName,
        note: i.note,
        quantity: i.quantity,
        preparedQuantity: i.preparedQuantity,
      })),
    }));

/**
 * Giá trị preparedQuantity mới khi bấm vào một ly. Vì preparedQuantity là số
 * đếm chứ không phải mảng cờ, tick hoạt động như thanh chấm sao: bấm ly chưa
 * tick thì tick luôn các ly trước nó; bấm ly đã tick thì bỏ tick nó và các ly
 * sau. Chấp nhận được vì các ly trong cùng một item là hàng giống hệt nhau cho
 * cùng một bàn.
 */
export const nextPreparedQuantity = (unit: PrepUnit): number =>
  unit.ticked ? unit.unitIndex : unit.unitIndex + 1;
