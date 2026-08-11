import assert from "node:assert/strict";
import test from "node:test";
import {
  DRAFT_TTL_MS,
  adminRouteKey,
  productDraftKey,
  readAdminRoute,
  readProductDraft,
  saveAdminRoute,
  saveProductDraft,
} from "./admin-persistence.ts";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

test("round-trips a route with query string", () => {
  const storage = new MemoryStorage();
  saveAdminRoute(storage, "user-1", "/admin/menu/products", "?categoryId=coffee");

  assert.deepEqual(readAdminRoute(storage, "user-1"), {
    pathname: "/admin/menu/products",
    search: "?categoryId=coffee",
  });
});

test("invalid JSON is removed and ignored", () => {
  const storage = new MemoryStorage();
  storage.setItem(adminRouteKey("user-1"), "{");

  assert.equal(readAdminRoute(storage, "user-1"), null);
  assert.equal(storage.getItem(adminRouteKey("user-1")), null);
});

test("product draft is isolated by user and expires", () => {
  const storage = new MemoryStorage();
  saveProductDraft(storage, "user-1", "p-1", { name: "Latte" }, 1_000);

  assert.deepEqual(readProductDraft(storage, "user-1", "p-1", 1_000), {
    name: "Latte",
  });
  assert.equal(readProductDraft(storage, "user-2", "p-1", 1_000), null);
  assert.equal(
    readProductDraft(storage, "user-1", "p-1", 1_000 + DRAFT_TTL_MS + 1),
    null,
  );
  assert.equal(storage.getItem(productDraftKey("user-1", "p-1")), null);
});
