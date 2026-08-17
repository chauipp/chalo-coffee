# PWA cài đặt Chalo Coffee Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép cài Chalo Coffee từ Home Screen như một web app độc lập, với branding chuẩn và cache tĩnh an toàn.

**Architecture:** Next App Router sinh manifest type-safe; Root Layout khai báo iOS/PWA metadata và mount client component nhỏ để đăng ký service worker cùng lời nhắc cài đặt. Service worker thuần trong `public/sw.js` chỉ cache static same-origin, tuyệt đối chuyển API/HTML/RSC/SSE qua mạng để giữ POS/đơn hàng realtime chính xác.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Web App Manifest, Service Worker Web API, Node test, Playwright.

## Global Constraints

- Không thêm package PWA hay service-worker package.
- Manifest có `display: "standalone"`, `start_url: "/"`, icon 192×192 và 512×512 dựa trên logo tròn Chalo.
- Metadata iOS gồm `appleWebApp.capable: true` và `viewportFit: "cover"`.
- Service worker chỉ cache `GET` cùng origin đến `/_next/static/`, `/brand/`, `/manifest.webmanifest`, `/icon.svg` và các icon PWA đã nêu.
- Không cache hoặc intercept `/api/*`, SSE, HTML document, RSC/Flight request, mutation hoặc bất kỳ response dữ liệu runtime nào.
- Prompt cài đặt chỉ ở mobile, không chặn UI; Chromium dùng `beforeinstallprompt`, iOS Safari hiện hướng dẫn Share → Thêm vào Màn hình chính.
- Khi display mode là `standalone`/`fullscreen`, không hiện prompt. Đóng prompt chỉ ẩn trong tab/phiên hiện tại.
- Không đổi endpoint, auth, quyền, realtime, POS, pha chế, navigation hoặc layout ngoài vùng notice PWA.
- UI bắt buộc kiểm bằng Playwright production standalone ở viewport 375×667; không dùng port 3001.

---

## File structure

- `chalo-fe/src/app/manifest.ts`: manifest PWA type-safe, mô tả app/brand/icons/display.
- `chalo-fe/src/app/layout.tsx`: metadata iOS + viewport và mount PWA client controller một lần cho toàn app.
- `chalo-fe/src/components/pwa/pwa-install.ts`: pure helpers detect standalone/mobile/install eligibility, Node-testable.
- `chalo-fe/src/components/pwa/PwaInstallPrompt.tsx`: đăng ký worker, quản lý deferred install event và UI notice mobile/iOS.
- `chalo-fe/src/components/pwa/pwa-install.test.mts`: regression helpers, đảm bảo installed/desktop không prompt.
- `chalo-fe/public/sw.js`: service worker cache static-only versioned.
- `chalo-fe/public/brand/chalo-pwa-192.png`, `chalo-fe/public/brand/chalo-pwa-512.png`: icon PWA được resize từ logo round 1254×1254.
- `chalo-fe/e2e/pwa-install.spec.ts`: browser fixture kiểm manifest, worker, prompt và bảo toàn network API.
- `docs/superpowers/summaries/2026-08-17-pwa-install-summary.md`: bàn giao sau khi hoàn thành.

- [x] Task 1: Tạo manifest, icon và metadata cài đặt

**Files:**
- Create: `chalo-fe/src/app/manifest.ts`
- Create: `chalo-fe/src/app/manifest.test.mts`
- Create: `chalo-fe/public/brand/chalo-pwa-192.png`
- Create: `chalo-fe/public/brand/chalo-pwa-512.png`
- Modify: `chalo-fe/src/app/layout.tsx`

**Interfaces:**
- Produces default `manifest(): MetadataRoute.Manifest`, served by Next tại `/manifest.webmanifest`.
- Produces branded icon URLs `/brand/chalo-pwa-192.png` and `/brand/chalo-pwa-512.png`.
- Root `viewport` exposes `viewportFit: "cover"`; root `metadata.appleWebApp` exposes `capable: true`.

- [ ] **Step 1: Write failing manifest assertions**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import manifest from "./manifest";

test("manifest opens Chalo as an installable standalone app", () => {
  const value = manifest();
  assert.equal(value.display, "standalone");
  assert.equal(value.start_url, "/");
  assert.deepEqual(value.icons?.map((icon) => icon.src), [
    "/brand/chalo-pwa-192.png",
    "/brand/chalo-pwa-512.png",
  ]);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `pnpm --dir chalo-fe test:unit -- src/app/manifest.test.mts`

Expected: FAIL because `src/app/manifest.ts` does not exist.

- [ ] **Step 3: Generate icons and implement manifest/layout metadata**

```bash
cd chalo-fe/public/brand
convert chalo-logo-round.png -resize 192x192 chalo-pwa-192.png
convert chalo-logo-round.png -resize 512x512 chalo-pwa-512.png
```

```ts
// src/app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chalo Coffee",
    short_name: "Chalo",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#d4a15a",
    icons: [
      { src: "/brand/chalo-pwa-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/chalo-pwa-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
```

In `layout.tsx`, extend existing `metadata` with `manifest`, `appleWebApp: { capable: true, title: "Chalo Coffee", statusBarStyle: "default" }`, and extend existing `viewport` with `viewportFit: "cover"`. Keep theme colors and providers unchanged.

- [ ] **Step 4: Run focused test and typecheck**

Run: `pnpm --dir chalo-fe test:unit -- src/app/manifest.test.mts && pnpm --dir chalo-fe exec tsc --noEmit --pretty false`

Expected: PASS; generated manifest has both icons and correct standalone fields.

- [ ] **Step 5: Commit the install metadata slice**

```bash
git add chalo-fe/src/app/manifest.ts chalo-fe/src/app/manifest.test.mts chalo-fe/src/app/layout.tsx chalo-fe/public/brand/chalo-pwa-192.png chalo-fe/public/brand/chalo-pwa-512.png
git commit -m "feat: add installable app manifest"
```

- [x] Task 2: Đăng ký static-only service worker và notice cài app

**Files:**
- Create: `chalo-fe/src/components/pwa/pwa-install.ts`
- Create: `chalo-fe/src/components/pwa/pwa-install.test.mts`
- Create: `chalo-fe/src/components/pwa/PwaInstallPrompt.tsx`
- Create: `chalo-fe/public/sw.js`
- Modify: `chalo-fe/src/app/layout.tsx`

**Interfaces:**
- Produces `isStandaloneDisplay(mediaMatches: boolean, navigatorStandalone?: boolean): boolean` and `getPwaPromptKind({ standalone, mobile, ios, installAvailable }): "none" | "install" | "ios-guide"`.
- `PwaInstallPrompt` has no props and registers `/sw.js` only when `"serviceWorker" in navigator`.
- The notice has `data-testid="pwa-install-prompt"`, install button `Cài ứng dụng`, close button `Để sau`; iOS guide explicitly contains `Thêm vào Màn hình chính`.

- [ ] **Step 1: Write failing helper tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { getPwaPromptKind, isStandaloneDisplay } from "./pwa-install";

test("installed display mode never shows a prompt", () => {
  assert.equal(isStandaloneDisplay(true, false), true);
  assert.equal(getPwaPromptKind({ standalone: true, mobile: true, ios: false, installAvailable: true }), "none");
});

test("mobile Chromium installs and iOS receives instructions", () => {
  assert.equal(getPwaPromptKind({ standalone: false, mobile: true, ios: false, installAvailable: true }), "install");
  assert.equal(getPwaPromptKind({ standalone: false, mobile: true, ios: true, installAvailable: false }), "ios-guide");
});
```

- [ ] **Step 2: Run focused test to verify it fails**

Run: `pnpm --dir chalo-fe test:unit -- src/components/pwa/pwa-install.test.mts`

Expected: FAIL because the helper module does not exist.

- [ ] **Step 3: Implement helpers, worker and notice**

```ts
export function getPwaPromptKind(input: {
  standalone: boolean; mobile: boolean; ios: boolean; installAvailable: boolean;
}) {
  if (input.standalone || !input.mobile) return "none";
  if (input.ios) return "ios-guide";
  return input.installAvailable ? "install" : "none";
}
```

`PwaInstallPrompt` must call `event.preventDefault()` for `beforeinstallprompt`, keep the event in a ref, await `event.prompt()` only after the user clicks `Cài ứng dụng`, then hide after `userChoice`. Register `/sw.js` in an effect and silently tolerate registration failure; never surface a blocking error/toast. Detect iOS from `navigator.userAgent` and display mode from `window.matchMedia("(display-mode: standalone)")` plus `navigator.standalone` fallback.

`public/sw.js` must use a cache name such as `chalo-static-v1`; precache only exact branding/manifest/icon URLs. In the fetch handler, return early unless `request.method === "GET"`, `url.origin === self.location.origin`, and pathname matches one of the static prefixes. Static matches use `caches.match(request) || fetch(request).then(response => { if (response.ok) cache.put(request, response.clone()); return response; })`. API/HTML/RSC/SSE never pass this branch. On activate, delete only cache keys starting with `chalo-static-` that differ from the current cache name, then `clients.claim()`.

Mount `<PwaInstallPrompt />` inside RootLayout after `MSWProvider`, without changing provider order or `Toaster` behavior.

- [ ] **Step 4: Run helper tests and full frontend unit suite**

Run: `pnpm --dir chalo-fe test:unit && pnpm --dir chalo-fe exec tsc --noEmit --pretty false`

Expected: PASS; helper returns no prompt for desktop/installed mode and correctly separates Chromium/iOS paths.

- [ ] **Step 5: Commit the PWA runtime slice**

```bash
git add chalo-fe/src/components/pwa chalo-fe/public/sw.js chalo-fe/src/app/layout.tsx
git commit -m "feat: add PWA install experience"
```

- [x] Task 3: Kiểm chứng PWA trên browser và bàn giao

**Files:**
- Create: `chalo-fe/e2e/pwa-install.spec.ts`
- Modify: `docs/superpowers/plans/2026-08-17-pwa-install.md`
- Create: `docs/superpowers/summaries/2026-08-17-pwa-install-summary.md`

**Interfaces:**
- Produces browser evidence that manifest and worker are available, the notice is mobile-only and dismissible, and API traffic remains network-backed.
- Produces the required linked four-section summary.

- [ ] **Step 1: Write failing production-browser test**

```ts
await page.setViewportSize({ width: 375, height: 667 });
await page.goto("/");
await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
await expect.poll(() => page.evaluate(() => navigator.serviceWorker.getRegistration().then(Boolean))).toBe(true);
await page.evaluate(() => window.dispatchEvent(new Event("beforeinstallprompt")));
await expect(page.getByTestId("pwa-install-prompt")).toBeVisible();
await page.getByRole("button", { name: "Để sau" }).click();
await expect(page.getByTestId("pwa-install-prompt")).toBeHidden();
```

Mock a compliant `beforeinstallprompt` event with `prompt` and `userChoice`, and route `/api/customer/table-session` with a unique network response; assert its handler executes once after worker activation to prove it was not served from static cache.

- [ ] **Step 2: Run focused test to verify it fails**

Run: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3018 pnpm --dir chalo-fe exec playwright test e2e/pwa-install.spec.ts --project=chromium --reporter=line`

Expected: FAIL because no manifest/service worker/install notice exists.

- [ ] **Step 3: Complete browser fixture and assertions**

Use a fresh production standalone server after `pnpm --dir chalo-fe build`, copy `/.next/static` and `/public` into standalone, then launch a fresh unused loopback port. The fixture must:

```ts
await page.setViewportSize({ width: 375, height: 667 });
await expect(page.getByTestId("pwa-install-prompt")).toBeVisible();
await expect(page.locator("body").evaluate((body) => body.scrollWidth <= body.clientWidth)).resolves.toBe(true);
await page.getByRole("button", { name: "Để sau" }).click();
await expect(page.getByTestId("pwa-install-prompt")).toBeHidden();
expect(consoleErrors).toEqual([]);
expect(failedResponses).toEqual([]);
```

Also validate `/manifest.webmanifest` response JSON `display === "standalone"`, presence of 192/512 icons, active worker registration, cache key prefix `chalo-static-`, no cached request whose URL path starts `/api/`, and desktop 1280×800 has no notice.

- [ ] **Step 4: Run complete quality suite**

Run: `pnpm --dir chalo-fe test:unit && pnpm --dir chalo-fe exec tsc --noEmit --pretty false && pnpm --dir chalo-fe build && PLAYWRIGHT_BASE_URL=http://127.0.0.1:<fresh-port> pnpm --dir chalo-fe exec playwright test e2e/pwa-install.spec.ts --project=chromium --reporter=line && git diff --check main...HEAD`

Expected: PASS. Browser evidence records manifest, service worker, 375×667 prompt close flow, desktop suppression, API network pass-through, console and failed response lists.

- [ ] **Step 5: Update plan and summary, then commit**

Tick all completed Task headings. Create the summary beginning with links to `../specs/2026-08-17-pwa-install-design.md` and this plan, then include `Đã làm gì`, `File chính`, `Khác với plan`, and `Còn dở / cần lưu ý` sections.

```bash
git add chalo-fe/e2e/pwa-install.spec.ts docs/superpowers/plans/2026-08-17-pwa-install.md docs/superpowers/summaries/2026-08-17-pwa-install-summary.md
git commit -m "test: verify installable PWA"
```

## Kết quả

Sau khi hoàn thành: [summary](../summaries/2026-08-17-pwa-install-summary.md).
