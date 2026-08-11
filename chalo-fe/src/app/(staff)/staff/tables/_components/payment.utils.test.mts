import test from "node:test";
import assert from "node:assert/strict";
import { calculateCashChange } from "./payment.utils.ts";

test("returns invalid when cash is missing or insufficient", () => {
  assert.deepEqual(calculateCashChange(100_000, ""), {
    valid: false,
    change: 0,
  });
  assert.deepEqual(calculateCashChange(100_000, -1), {
    valid: false,
    change: 0,
  });
  assert.deepEqual(calculateCashChange(100_000, 99_999), {
    valid: false,
    change: 0,
  });
});

test("accepts exact cash and calculates change", () => {
  assert.deepEqual(calculateCashChange(100_000, 100_000), {
    valid: true,
    change: 0,
  });
  assert.deepEqual(calculateCashChange(100_000, "150,000"), {
    valid: true,
    change: 50_000,
  });
});
