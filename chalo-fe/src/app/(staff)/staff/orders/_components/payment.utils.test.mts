import assert from "node:assert/strict";
import test from "node:test";
import { calculateCashChange } from "./payment.utils.ts";

test("tiền mặt chỉ hợp lệ khi khách đưa đủ", () => {
  assert.deepEqual(calculateCashChange(120_000, ""), { valid: false, change: 0 });
  assert.deepEqual(calculateCashChange(120_000, -1), { valid: false, change: 0 });
  assert.deepEqual(calculateCashChange(120_000, 119_000), { valid: false, change: 0 });
  assert.deepEqual(calculateCashChange(120_000, 120_000), { valid: true, change: 0 });
  assert.deepEqual(calculateCashChange(120_000, "150000"), { valid: true, change: 30_000 });
});
