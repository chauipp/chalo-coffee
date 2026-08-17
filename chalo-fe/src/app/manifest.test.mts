import assert from "node:assert/strict";
import test from "node:test";
import manifest from "./manifest.ts";

test("manifest opens Chalo as an installable standalone app", () => {
  const value = manifest();
  assert.equal(value.display, "standalone");
  assert.equal(value.start_url, "/");
  assert.deepEqual(value.icons?.map((icon) => icon.src), [
    "/brand/chalo-pwa-192.png",
    "/brand/chalo-pwa-512.png",
  ]);
});
