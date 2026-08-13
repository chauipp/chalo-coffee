import assert from "node:assert/strict";
import test from "node:test";
import { getUserRoleBadge } from "./user-role-label.ts";

test("labels ADMIN as Quản trị with the blue variant", () => {
  assert.deepEqual(getUserRoleBadge("ADMIN"), {
    label: "Quản trị",
    variant: "blue",
  });
});

test("labels MODERATOR as Nhân viên with the gray variant", () => {
  assert.deepEqual(getUserRoleBadge("MODERATOR"), {
    label: "Nhân viên",
    variant: "gray",
  });
});

test("never mislabels a CUSTOMER account as Nhân viên", () => {
  const badge = getUserRoleBadge("CUSTOMER");
  assert.notEqual(badge.label, "Nhân viên");
  assert.deepEqual(badge, { label: "Khách hàng", variant: "yellow" });
});
