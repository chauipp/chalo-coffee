import assert from "node:assert/strict";
import test from "node:test";
import { getActiveOrderSummary, getShiftSummary } from "./actionHub.utils.ts";

test("tóm tắt queue nêu rõ đơn cần xử lý và yêu cầu thanh toán", () => {
  assert.deepEqual(
    getActiveOrderSummary([
      { paymentRequested: true },
      { paymentRequested: false },
      { paymentRequested: false },
    ]),
    {
      value: 3,
      label: "3 đơn đang xử lý",
      detail: "1 yêu cầu thanh toán",
    },
  );
});

test("tóm tắt ca không che trạng thái chưa mở ca", () => {
  assert.deepEqual(getShiftSummary(null), {
    label: "Chưa mở ca",
    detail: "Mở ca trước khi nhận tiền mặt",
  });
});
