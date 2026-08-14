import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("thanh toán từ staff mặc định áp dụng cho cả bàn", () => {
  const source = readFileSync(new URL("./OrderPaymentPanel.tsx", import.meta.url), "utf8");

  assert.match(source, /initialScope\s*=\s*"table"/);
});
