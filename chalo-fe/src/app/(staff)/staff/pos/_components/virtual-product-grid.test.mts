import assert from "node:assert/strict";
import test from "node:test";
import {
  buildQuantitiesByProductId,
  getVirtualRange,
} from "./virtualProductGrid.utils.ts";

test("getVirtualRange includes visible rows and configured overscan", () => {
  assert.deepEqual(
    getVirtualRange({
      scrollTop: 2_400,
      viewportHeight: 600,
      rowHeight: 152,
      columns: 3,
      count: 300,
      overscanRows: 2,
    }),
    { start: 42, end: 59 },
  );
});

test("buildQuantitiesByProductId exposes the quantity for each product", () => {
  assert.equal(
    buildQuantitiesByProductId([{ productId: "p1", quantity: 3 }]).get("p1"),
    3,
  );
});
