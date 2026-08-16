import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getActiveAdminNavHref,
  isAdminOverflowActive,
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

test("marks the prep workspace active from the mobile primary navigation", () => {
  const mobilePrimary = [
    { href: "/admin/dashboard" },
    { href: "/admin/menu/categories" },
    { href: "/admin/orders" },
    { href: "/admin/prep" },
  ];

  assert.equal(
    getActiveAdminNavHref("/admin/prep", mobilePrimary),
    "/admin/prep",
  );
  assert.equal(
    isAdminOverflowActive(
      "/admin/prep",
      mobilePrimary,
      [{ href: "/admin/tables" }],
    ),
    false,
  );
  const mobileConfig = readFileSync(
    new URL("./sidebar.config.ts", import.meta.url),
    "utf8",
  );
  assert.match(mobileConfig, /ROUTES\.ADMIN\.PREP/);
});

test("only restores a saved route from the admin landing page", () => {
  const saved = { pathname: "/admin/orders", search: "?status=NEW" };

  assert.deepEqual(shouldRestoreAdminRoute("/admin", saved), saved);
  assert.equal(shouldRestoreAdminRoute("/admin/orders", saved), null);
  assert.equal(shouldRestoreAdminRoute("/login", saved), null);
});

test("marks the overflow destination active for staff and settings routes", () => {
  const primary = [
    { href: "/admin/dashboard" },
    {
      href: "/admin/menu/categories",
      activePrefixes: ["/admin/menu/categories", "/admin/menu/products"],
    },
    { href: "/admin/orders" },
    { href: "/admin/tables" },
  ];
  const overflow = [{ href: "/admin/staff" }, { href: "/admin/settings" }];

  assert.equal(isAdminOverflowActive("/admin/staff", primary, overflow), true);
  assert.equal(
    isAdminOverflowActive("/admin/settings", primary, overflow),
    true,
  );
  assert.equal(isAdminOverflowActive("/admin/orders", primary, overflow), false);
});
