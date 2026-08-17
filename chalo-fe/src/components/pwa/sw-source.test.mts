import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";

const workerPath = fileURLToPath(new URL("../../../public/sw.js", import.meta.url));

async function loadWorker({
  fetchResponse = new Response("network", { status: 200, headers: { "Content-Type": "image/png" } }),
  currentCacheResponse,
  foreignCacheResponse,
  throwOnFetch = false,
}: {
  fetchResponse?: Response;
  currentCacheResponse?: Response;
  foreignCacheResponse?: Response;
  throwOnFetch?: boolean;
} = {}) {
  const listeners = new Map<string, (event: any) => void>();
  const cachedRequests: Request[] = [];
  let fetchCalls = 0;

  const source = await readFile(workerPath, "utf8");
  vm.runInNewContext(source, {
    URL,
    Promise,
    caches: {
      match: async () => foreignCacheResponse,
      open: async () => ({
        match: async () => currentCacheResponse,
        put: async (request: Request) => cachedRequests.push(request),
        addAll: async () => undefined,
      }),
      keys: async () => [],
      delete: async () => true,
    },
    fetch: async () => {
      fetchCalls += 1;
      if (throwOnFetch) throw new Error("network should not run");
      return fetchResponse;
    },
    self: {
      location: { origin: "https://chalo.test" },
      addEventListener: (name: string, listener: (event: any) => void) => {
        listeners.set(name, listener);
      },
      skipWaiting: async () => undefined,
      clients: { claim: async () => undefined },
    },
  });

  return {
    cachedRequests,
    get fetchCalls() {
      return fetchCalls;
    },
    fetch: async (request: Request) => {
      let response: Promise<Response> | undefined;
      const pending: Promise<unknown>[] = [];

      listeners.get("fetch")?.({
        request,
        respondWith: (value: Promise<Response>) => {
          response = value;
        },
        waitUntil: (value: Promise<unknown>) => pending.push(value),
      });

      if (response) await response;
      await Promise.all(pending);
      return response;
    },
  };
}

test("worker leaves navigation, Flight, and SSE requests untouched", async () => {
  const worker = await loadWorker({ fetchResponse: new Response("asset", { status: 200, headers: { "Content-Type": "text/css" } }) });

  const navigation = await worker.fetch({
    method: "GET",
    url: "https://chalo.test/brand/chalo-logo-round.png",
    mode: "navigate",
    destination: "document",
    headers: new Headers(),
  } as Request);
  const flight = await worker.fetch({
    method: "GET",
    url: "https://chalo.test/_next/static/chunks/app.js?_rsc=abc",
    mode: "cors",
    destination: "",
    headers: new Headers({ RSC: "1", Accept: "text/x-component" }),
  } as Request);
  const eventStream = await worker.fetch({
    method: "GET",
    url: "https://chalo.test/brand/chalo-logo-round.png",
    mode: "cors",
    destination: "",
    headers: new Headers({ Accept: "text/event-stream" }),
  } as Request);

  assert.equal(navigation, undefined);
  assert.equal(flight, undefined);
  assert.equal(eventStream, undefined);
  assert.deepEqual(worker.cachedRequests, []);
});

test("worker does not cache HTML, JSON, or event-stream responses", async () => {
  for (const contentType of ["text/html", "application/json", "text/event-stream"]) {
    const worker = await loadWorker({ fetchResponse: new Response("dynamic", { status: 200, headers: { "Content-Type": contentType } }) });
    await worker.fetch(new Request("https://chalo.test/brand/chalo-logo-round.png"));
    assert.deepEqual(worker.cachedRequests, [], contentType);
  }
});

test("worker caches a successful static asset response", async () => {
  const worker = await loadWorker({ fetchResponse: new Response("body", { status: 200, headers: { "Content-Type": "image/png" } }) });
  await worker.fetch(new Request("https://chalo.test/brand/chalo-pwa-192.png"));
  assert.equal(worker.cachedRequests.length, 1);
});

test("worker only reads cache entries from its current static cache", async () => {
  const worker = await loadWorker(
    {
      fetchResponse: new Response("current", { status: 200, headers: { "Content-Type": "image/png" } }),
      foreignCacheResponse: new Response("foreign", { status: 200, headers: { "Content-Type": "image/png" } }),
    },
  );
  const result = await worker.fetch(new Request("https://chalo.test/brand/chalo-pwa-192.png"));

  assert.equal(await result?.text(), "current");
  assert.equal(worker.cachedRequests.length, 1);
});

test("worker serves a current static-cache hit without touching the network", async () => {
  const worker = await loadWorker({
    currentCacheResponse: new Response("cached", { status: 200, headers: { "Content-Type": "image/png" } }),
    throwOnFetch: true,
  });
  const result = await worker.fetch(new Request("https://chalo.test/brand/chalo-pwa-192.png"));

  assert.equal(await result?.text(), "cached");
  assert.equal(worker.fetchCalls, 0);
});
