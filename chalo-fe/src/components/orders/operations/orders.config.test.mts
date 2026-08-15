import test from "node:test";
import assert from "node:assert/strict";
import {
  KHACH_DAT_STATUSES,
  NEXT_STATUS,
  orderDragType,
} from "./orders.config.ts";

test("gom PENDING và CONFIRMED vào cột Khách đặt", () => {
  assert.deepEqual(KHACH_DAT_STATUSES, ["PENDING", "CONFIRMED"]);
});

test("không tự chuyển PREPARING sang READY", () => {
  assert.equal(NEXT_STATUS.PREPARING, undefined);
});

test("orderDragType tạo MIME type ổn định", () => {
  assert.equal(orderDragType("READY"), "chalo/ready");
  assert.equal(orderDragType("READY"), orderDragType("READY"));
});
