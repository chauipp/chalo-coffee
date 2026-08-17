import assert from "node:assert/strict";
import test from "node:test";
import { inventoryState, parseInventoryQuantity } from "./inventory.utils.ts";

test("parseInventoryQuantity accepts up to three decimal places and rejects invalid values", () => {
  assert.equal(parseInventoryQuantity("1,25"), 1.25);
  assert.equal(parseInventoryQuantity(" 2000 "), 2000);
  assert.equal(parseInventoryQuantity("1.2345"), null);
  assert.equal(parseInventoryQuantity("-3"), null);
});

test("inventoryState distinguishes empty stock from reorder warning", () => {
  assert.equal(inventoryState(0, 20), "empty");
  assert.equal(inventoryState(20, 20), "low");
  assert.equal(inventoryState(20.001, 20), "healthy");
});
