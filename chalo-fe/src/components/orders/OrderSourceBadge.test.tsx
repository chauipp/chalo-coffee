import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OrderSourceBadge } from "./OrderSourceBadge";

test("hiển thị nhãn nguồn đơn dễ đọc", () => {
  assert.match(renderToStaticMarkup(<OrderSourceBadge source="QR" />), />QR</);
  assert.match(renderToStaticMarkup(<OrderSourceBadge source="POS" />), />Quầy</);
  assert.match(renderToStaticMarkup(<OrderSourceBadge source="N_A" />), />N\/A</);
});
