import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("nút ly trong chế độ theo món công bố cả nguồn đơn", () => {
  const source = readFileSync(
    new URL("./PrepProductCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /aria-label=\{`\$\{u\.tableName\} \(\$\{getOrderSourceLabel\(u\.orderSource\)\}\) — ly/,
  );
});
