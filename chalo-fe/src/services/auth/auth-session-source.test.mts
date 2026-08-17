import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relative: string) =>
  readFile(new URL(relative, import.meta.url), "utf8");

test("browser auth không persist JWT trong Zustand", async () => {
  const source = await readSource("../../stores/auth.store.ts");
  assert.doesNotMatch(source, /accessToken|refreshToken|setTokens/);
  assert.match(source, /partialize:[\s\S]*user: state\.user/);
});

test("staff SSE dùng cookie credentials, không đưa token lên URL", async () => {
  const source = await readSource("../../hooks/useSSE.ts");
  assert.doesNotMatch(source, /\?token=/);
  assert.match(source, /new EventSource\(url, \{ withCredentials: true \}\)/);
});
