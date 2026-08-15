import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_PREP_VISIBLE_STORAGE_KEY,
  readAdminPrepVisible,
} from "./adminPrepSidebarState.ts";

test("admin prep visibility is independent from the staff split key", () => {
  const values = new Map<string, string>([["staff-prep-split", "true"]]);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
  };

  assert.equal(readAdminPrepVisible(storage), false);

  values.set(ADMIN_PREP_VISIBLE_STORAGE_KEY, "true");
  assert.equal(readAdminPrepVisible(storage), true);

  values.set(ADMIN_PREP_VISIBLE_STORAGE_KEY, "false");
  assert.equal(readAdminPrepVisible(storage), false);
});
