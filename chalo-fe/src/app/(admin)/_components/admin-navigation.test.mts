import assert from "node:assert/strict";
import test from "node:test";
import {
  getActiveAdminNavHref,
  shouldRestoreAdminRoute,
} from "./admin-navigation.ts";

const items = [
  { href: "/admin/dashboard" },
  { href: "/admin/menu/categories" },
  { href: "/admin/menu/products" },
  { href: "/admin/orders" },
];

test("selects the most specific matching menu route", () => {
  assert.equal(
    getActiveAdminNavHref("/admin/menu/products/123", items),
    "/admin/menu/products",
  );
});

test("only restores a saved route from the admin landing page", () => {
  const saved = { pathname: "/admin/orders", search: "?status=NEW" };

  assert.deepEqual(shouldRestoreAdminRoute("/admin", saved), saved);
  assert.equal(shouldRestoreAdminRoute("/admin/orders", saved), null);
  assert.equal(shouldRestoreAdminRoute("/login", saved), null);
});
