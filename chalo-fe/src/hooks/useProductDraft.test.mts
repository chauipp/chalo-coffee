import assert from "node:assert/strict";
import test from "node:test";
import { mergeProductDraft } from "./useProductDraft.ts";

test("draft values override server defaults", () => {
  assert.deepEqual(
    mergeProductDraft(
      { name: "Latte", price: 20_000 },
      { name: "Latte sua", price: 22_000 },
    ),
    { name: "Latte sua", price: 22_000 },
  );
});

test("missing draft keeps every server default", () => {
  assert.deepEqual(
    mergeProductDraft(
      { name: "Latte", price: 20_000, isActive: true },
      null,
    ),
    { name: "Latte", price: 20_000, isActive: true },
  );
});
