import assert from "node:assert/strict";
import test from "node:test";
import { parseRefundVnd } from "./refund.utils.ts";

test("parseRefundVnd only accepts an integer within the refundable balance", () => {
  assert.equal(parseRefundVnd("50000", 50_000), 50_000);
  assert.equal(parseRefundVnd("0", 50_000), null);
  assert.equal(parseRefundVnd("50001", 50_000), null);
  assert.equal(parseRefundVnd("50.5", 50_000), null);
});
