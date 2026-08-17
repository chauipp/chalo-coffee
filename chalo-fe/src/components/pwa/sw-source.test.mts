import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";

const workerPath = fileURLToPath(new URL("../../../public/sw.js", import.meta.url));

async function loadWorker(fetchResponse: Response) {
  const listeners = new Map<string, (event: any) => void>();
  const cachedRequests: Request[] = [];

  const source = await readFile(workerPath, "utf8");
  vm.runInNewContext(source, {
    URL,
    Promise,
    caches: {
      match: async () => undefined,
      open: async () => ({
        put: async (request: Request) => cachedRequests.push(request),
        addAll: async () => undefined,
      }),
      keys: async () => [],
      delete: async () => true,
    },
    fetch: async () => fetchResponse,
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
  const worker = await loadWorker(new Response("asset", { status: 200, headers: { "Content-Type": "text/css" } }));

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
    const worker = await loadWorker(new Response("dynamic", { status: 200, headers: { "Content-Type": contentType } }));
    await worker.fetch(new Request("https://chalo.test/brand/chalo-logo-round.png"));
    assert.deepEqual(worker.cachedRequests, [], contentType);
  }
});

test("worker caches a successful static asset response", async () => {
  const worker = await loadWorker(new Response("body", { status: 200, headers: { "Content-Type": "image/png" } }));
  await worker.fetch(new Request("https://chalo.test/brand/chalo-pwa-192.png"));
  assert.equal(worker.cachedRequests.length, 1);
});
