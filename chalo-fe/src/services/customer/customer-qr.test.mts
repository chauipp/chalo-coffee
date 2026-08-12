import assert from "node:assert/strict";
import test from "node:test";
import { parseCustomerTableToken } from "./customer-qr.ts";

test("accepts a plain Chalo table token", () => {
  assert.equal(parseCustomerTableToken("  fixed-qr  ", "https://chalocoffee.com"), "fixed-qr");
});

test("extracts a token from a same-origin menu link", () => {
  assert.equal(
    parseCustomerTableToken(
      "https://chalocoffee.com/menu/fixed-qr?utm_source=table",
      "https://chalocoffee.com",
    ),
    "fixed-qr",
  );
});

test("rejects foreign links and malformed menu paths", () => {
  assert.throws(
    () =>
      parseCustomerTableToken(
        "https://evil.example/menu/fixed-qr",
        "https://chalocoffee.com",
      ),
    /không thuộc Chalo Coffee/,
  );
  assert.throws(
    () =>
      parseCustomerTableToken(
        "https://chalocoffee.com/admin/tables",
        "https://chalocoffee.com",
      ),
    /không hợp lệ/,
  );
});
