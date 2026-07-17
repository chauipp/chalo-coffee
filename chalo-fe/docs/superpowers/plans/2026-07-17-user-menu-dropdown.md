# User Menu Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fold the fixed top-right theme toggle and the standalone sidebar logout button into a dropdown anchored on the avatar, with theme becoming a sun/moon pill switch.

**Architecture:** Two new client components under `src/components/shared/`. `ThemeSwitch` is a pure visual control bound to the theme context. `UserMenu` owns identity plus the open/close behaviour and composes `ThemeSwitch` and logout. `Sidebar` sheds its auth and theme concerns and renders `<UserMenu collapsed={collapsed} />` in its footer.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind v4, Zustand, Playwright.

## Global Constraints

- Spec: `chalo-fe/docs/superpowers/specs/2026-07-17-user-menu-dropdown-design.md`. Read it before starting.
- All work happens in `chalo-fe/`. Branch is `feat/user-menu-dropdown`.
- **This is NOT the Next.js you know** (`chalo-fe/AGENTS.md`). Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.
- **No unit test framework exists.** The repo's only test tool is Playwright e2e (`pnpm test:e2e`), which runs against the real backend. Every test in this plan is an e2e test. Do not add vitest/jest.
- Do NOT modify `src/components/shared/ui/Toggle.tsx` — seven call sites depend on it.
- Do NOT modify `src/providers/ThemeProvider.tsx`. The `Theme` type keeps `"system"`.
- Do NOT delete `src/components/shared/icons/MonitorIcon.tsx` — `src/app/(staff)/staff/_components/header.config.ts` imports it as the staff POS nav icon.
- UI copy is Vietnamese. Exact strings: `"Đăng xuất"`, `"Người dùng"`, `"Chế độ tối"`.
- Tailwind only; no new dependency, no external asset.

## Environment prerequisites

Both servers must be running before any e2e step:

- Postgres: `cd chalo-be && docker compose up -d` (port 5433).
- Backend: `cd chalo-be && pnpm run start:dev` (port 8080). Verify: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health` prints `200`.
- Frontend: `cd chalo-fe && pnpm dev`. **Port 3000 is occupied by a different OS user (`anhdt`) running their own copy of this app.** Next will fall back to another port (3002 at time of writing). Note the port it actually prints — Task 1 Step 1 makes Playwright target it.

Login credentials seeded in the restored dump: `admin` / `admin` (ADMIN), `staff` / `staff` (MODERATOR).

## File Structure

| File | Responsibility |
|---|---|
| `src/components/shared/ThemeSwitch.tsx` (new) | The sun/moon pill. Reads `resolvedTheme`, writes explicit `light`/`dark`. Visuals only. |
| `src/components/shared/UserMenu.tsx` (new) | Avatar trigger + dropdown panel. Owns open state, outside-click, Escape, focus return. Composes `ThemeSwitch` + logout. |
| `src/components/shared/Sidebar.tsx` (modify) | Navigation and collapse state only. Drops `useAuthStore`, `useLogout`, `LogoutIcon`, `ThemeToggle`. |
| `playwright.config.ts` (modify) | `baseURL` reads an env override so tests can target the real dev port. |
| `e2e/admin-user-menu.spec.ts` (new) | Covers menu open/close/logout (Task 1) and the theme switch (Task 2). |
| `src/components/shared/ThemeToggle.tsx` (delete, Task 2) | Superseded. |
| `src/components/shared/icons/SunIcon.tsx` (delete, Task 2) | Orphaned. |
| `src/components/shared/icons/MoonIcon.tsx` (delete, Task 2) | Orphaned. |

---

- [ ] ### Task 1: UserMenu dropdown with logout

Builds the avatar dropdown and wires it into the sidebar. Theme is untouched here — `ThemeToggle` stays pinned top-right until Task 2 replaces it. This keeps the app shippable at every commit.

**Files:**
- Modify: `playwright.config.ts`
- Create: `src/components/shared/UserMenu.tsx`
- Modify: `src/components/shared/Sidebar.tsx`
- Test: `e2e/admin-user-menu.spec.ts`

**Interfaces:**
- Consumes: `useAuthStore()` → `{ user: AuthUser | null }` where `AuthUser` has `fullName: string`, `role: UserRole`. `useLogout()` → `() => Promise<void>`.
- Produces: `UserMenu` — `({ collapsed }: { collapsed: boolean }) => JSX.Element`. Test hooks: `data-testid="user-menu-trigger"` and `data-testid="user-menu-panel"`. Task 2 adds `ThemeSwitch` inside the panel.

- [ ] **Step 1: Let Playwright target the real dev port**

`baseURL` is hardcoded to port 3000, which belongs to another OS user's server. Pointing tests at it would exercise someone else's app. Make it overridable.

Replace `playwright.config.ts` in full:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    // Port 3000 is not guaranteed to be ours — Next falls back when it is taken.
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

- [ ] **Step 2: Write the failing test**

Create `e2e/admin-user-menu.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

const loginAsAdmin = async (page: import("@playwright/test").Page) => {
  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("admin");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin/dashboard");
};

test("avatar opens a menu that closes on Escape", async ({ page }) => {
  await loginAsAdmin(page);

  const panel = page.getByTestId("user-menu-panel");
  await expect(panel).toBeHidden();

  await page.getByTestId("user-menu-trigger").click();
  await expect(panel).toBeVisible();
  await expect(panel.getByText("Đăng xuất")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
});

test("menu closes when clicking outside", async ({ page }) => {
  await loginAsAdmin(page);

  await page.getByTestId("user-menu-trigger").click();
  await expect(page.getByTestId("user-menu-panel")).toBeVisible();

  await page.getByRole("heading", { name: "Tổng quan" }).click();
  await expect(page.getByTestId("user-menu-panel")).toBeHidden();
});

test("logout from the menu returns to the login page", async ({ page }) => {
  await loginAsAdmin(page);

  await page.getByTestId("user-menu-trigger").click();
  await page.getByRole("button", { name: "Đăng xuất" }).click();

  await page.waitForURL("**/login");
  await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible();
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run (substitute the port `pnpm dev` actually printed):

```bash
cd chalo-fe && PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test e2e/admin-user-menu.spec.ts --reporter=line
```

Expected: all 3 tests FAIL. The trigger does not exist yet, so failures read like `locator.click: Timeout ... waiting for getByTestId('user-menu-trigger')`.

If instead they fail at the login step, the backend or the DB is not up — fix that first (see Environment prerequisites), the test is not the problem.

- [ ] **Step 4: Create the UserMenu component**

Create `src/components/shared/UserMenu.tsx`:

```tsx
"use client";
// src/components/shared/UserMenu.tsx — avatar trigger + personal options dropdown

import { useEffect, useRef, useState } from "react";
import { LogoutIcon } from "./icons/LogoutIcon";
import { useLogout } from "@/hooks/useLogout";
import { useAuthStore } from "@/stores/auth.store";

export const UserMenu = ({ collapsed }: { collapsed: boolean }) => {
  const { user } = useAuthStore();
  const handleLogout = useLogout();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  const name = user?.fullName ?? "Người dùng";

  return (
    <div ref={rootRef} className="relative">
      {open && (
        <div
          data-testid="user-menu-panel"
          className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {name}
            </p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>

          <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            <LogoutIcon className="size-4" />
            Đăng xuất
          </button>
        </div>
      )}

      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        data-testid="user-menu-trigger"
        title={collapsed ? name : undefined}
        className={`flex w-full items-center gap-3 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
          collapsed ? "justify-center p-1.5" : "px-3 py-2.5"
        }`}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
          {user?.fullName?.[0] ?? "?"}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {name}
            </p>
            <p className="text-sm text-gray-400">{user?.role}</p>
          </div>
        )}
      </button>
    </div>
  );
};
```

- [ ] **Step 5: Wire UserMenu into the Sidebar footer**

In `src/components/shared/Sidebar.tsx`, replace the import block (lines 4–11) with:

```tsx
import { useState, type ComponentType, type SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { ChevronLeftIcon } from "./icons/ChevronLeftIcon";
import { UserMenu } from "./UserMenu";
```

Delete these two lines from the component body:

```tsx
  const { user } = useAuthStore();
  const handleLogout = useLogout();
```

Replace the whole `{/* Profile */}` block (lines 99–139, from `<div className="border-t border-gray-100 p-3 dark:border-gray-700">` through its closing `</div>`) with:

```tsx
      {/* Profile */}
      <div className="border-t border-gray-100 p-3 dark:border-gray-700">
        <UserMenu collapsed={collapsed} />
      </div>
```

Leave `<ThemeToggle />` and the fragment wrapper alone — Task 2 removes them.

- [ ] **Step 6: Run the test to verify it passes**

```bash
cd chalo-fe && PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test e2e/admin-user-menu.spec.ts --reporter=line
```

Expected: `3 passed`.

- [ ] **Step 7: Verify nothing else broke**

```bash
cd chalo-fe && npx tsc --noEmit && pnpm lint
```

Expected: no errors. In particular no "declared but never read" for `useAuthStore` / `useLogout` / `LogoutIcon` in `Sidebar.tsx` — if you see one, Step 5's import removal was incomplete.

- [ ] **Step 8: Commit**

```bash
git add chalo-fe/playwright.config.ts chalo-fe/src/components/shared/UserMenu.tsx chalo-fe/src/components/shared/Sidebar.tsx chalo-fe/e2e/admin-user-menu.spec.ts
git commit -m "feat: move logout into an avatar dropdown in the sidebar"
```

---

- [ ] ### Task 2: ThemeSwitch and retiring ThemeToggle

Adds the sun/moon pill to the menu, removes the fixed top-right toggle, and deletes what that leaves dead.

**Files:**
- Create: `src/components/shared/ThemeSwitch.tsx`
- Modify: `src/components/shared/UserMenu.tsx`
- Modify: `src/components/shared/Sidebar.tsx`
- Delete: `src/components/shared/ThemeToggle.tsx`, `src/components/shared/icons/SunIcon.tsx`, `src/components/shared/icons/MoonIcon.tsx`
- Test: `e2e/admin-user-menu.spec.ts`

**Interfaces:**
- Consumes: `useTheme()` from `@/providers/ThemeProvider` → `{ theme: Theme; resolvedTheme: "light" | "dark"; changeTheme: (t: Theme) => void }`. `UserMenu`'s `data-testid="user-menu-panel"` from Task 1.
- Produces: `ThemeSwitch` — `() => JSX.Element`, no props. Test hook: `data-testid="theme-switch"`.

- [ ] **Step 1: Write the failing test**

Append to `e2e/admin-user-menu.spec.ts`:

```ts
test("theme switch flips the theme and persists it", async ({ page }) => {
  await loginAsAdmin(page);
  await page.getByTestId("user-menu-trigger").click();

  const html = page.locator("html");
  const before = (await html.getAttribute("class")) ?? "";
  const wasDark = before.includes("dark");

  await page.getByTestId("theme-switch").click();
  await expect(html).toHaveClass(wasDark ? /light/ : /dark/);
  await expect(page.getByTestId("theme-switch")).toHaveAttribute(
    "aria-checked",
    wasDark ? "false" : "true",
  );

  // The choice is explicit now, so it must survive a reload.
  await page.reload();
  await expect(html).toHaveClass(wasDark ? /light/ : /dark/);
});

test("the fixed top-right theme toggle is gone", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByLabel(/Đổi giao diện/)).toHaveCount(0);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd chalo-fe && PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test e2e/admin-user-menu.spec.ts --reporter=line
```

Expected: the 3 Task 1 tests pass; the 2 new ones FAIL — `theme-switch` does not exist, and the old toggle still resolves to 1 element.

- [ ] **Step 3: Create the ThemeSwitch component**

The knob is drawn in CSS, not from an icon — the reference calls for a solid glowing disc and a cratered moon, which the repo's thin-stroke icons cannot express.

Geometry: track `w-16 h-8` (64×32), knob `size-6` (24) at `top-1 left-1`, travelling `translate-x-8` (32px) to land 4px from the right edge.

Create `src/components/shared/ThemeSwitch.tsx`:

```tsx
"use client";
// src/components/shared/ThemeSwitch.tsx — sun/moon pill bound to the theme context

import { useTheme } from "@/providers/ThemeProvider";

export const ThemeSwitch = () => {
  const { resolvedTheme, changeTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Chế độ tối"
      data-testid="theme-switch"
      onClick={() => changeTheme(isDark ? "light" : "dark")}
      className={`relative h-8 w-16 shrink-0 overflow-hidden rounded-full border motion-safe:transition-colors motion-safe:duration-300 ${
        isDark
          ? "border-gray-700 bg-gradient-to-b from-gray-800 to-gray-950"
          : "border-sky-300 bg-gradient-to-b from-sky-300 to-sky-500"
      }`}
    >
      {/* Clouds — decorative, light only */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 motion-safe:transition-opacity motion-safe:duration-300 ${
          isDark ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="absolute bottom-1 right-2 h-2.5 w-5 rounded-full bg-white/80" />
        <span className="absolute bottom-2.5 right-4 size-2 rounded-full bg-white/60" />
      </span>

      {/* Stars — decorative, dark only */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 motion-safe:transition-opacity motion-safe:duration-300 ${
          isDark ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="absolute left-2 top-2 size-1 rounded-full bg-white/90" />
        <span className="absolute left-4 top-4 size-0.5 rounded-full bg-white/70" />
        <span className="absolute left-3 top-6 size-1 rounded-full bg-white/60" />
        <span className="absolute left-6 top-2.5 size-0.5 rounded-full bg-white/50" />
      </span>

      {/* Knob: sun or moon */}
      <span
        aria-hidden="true"
        className={`absolute left-1 top-1 size-6 rounded-full motion-safe:transition-transform motion-safe:duration-300 ${
          isDark
            ? "translate-x-8 bg-gray-300 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.35)]"
            : "translate-x-0 bg-amber-400 shadow-[0_0_10px_3px_rgba(251,191,36,0.65)]"
        }`}
      >
        {/* Craters — only meaningful on the moon */}
        <span
          className={`pointer-events-none absolute inset-0 motion-safe:transition-opacity motion-safe:duration-300 ${
            isDark ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="absolute left-1 top-1.5 size-1.5 rounded-full bg-gray-400/70" />
          <span className="absolute right-1.5 top-3 size-1 rounded-full bg-gray-400/60" />
          <span className="absolute bottom-1 left-2.5 size-1 rounded-full bg-gray-400/50" />
        </span>
      </span>
    </button>
  );
};
```

- [ ] **Step 4: Put the switch in the menu**

In `src/components/shared/UserMenu.tsx`, add the import below the `LogoutIcon` import:

```tsx
import { ThemeSwitch } from "./ThemeSwitch";
```

Then replace the entire panel block — everything from `<div data-testid="user-menu-panel"` through its closing `</div>` — with the version below. The panel gains a switch row and a second divider, so it reads header → switch → logout:

```tsx
        <div
          data-testid="user-menu-panel"
          className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {name}
            </p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>

          <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

          <div className="flex justify-center py-2">
            <ThemeSwitch />
          </div>

          <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            <LogoutIcon className="size-4" />
            Đăng xuất
          </button>
        </div>
```

- [ ] **Step 5: Remove ThemeToggle from the Sidebar**

In `src/components/shared/Sidebar.tsx`, delete the import:

```tsx
import { ThemeToggle } from "./ThemeToggle";
```

Then drop the fragment wrapper and the toggle. The return changes from:

```tsx
  return (
    <>
      {/* fixed top-right theme icon */}
      <ThemeToggle />
    <aside
```

to:

```tsx
  return (
    <aside
```

and the closing tags change from:

```tsx
    </aside>
    </>
  );
```

to:

```tsx
    </aside>
  );
```

- [ ] **Step 6: Delete the dead files**

`ThemeToggle` was `SunIcon` and `MoonIcon`'s only consumer. `MonitorIcon` is NOT dead — the staff POS nav imports it.

```bash
cd chalo-fe
rm src/components/shared/ThemeToggle.tsx
rm src/components/shared/icons/SunIcon.tsx
rm src/components/shared/icons/MoonIcon.tsx
```

Confirm nothing still references them, and that `MonitorIcon` survived:

```bash
grep -rn "ThemeToggle\|SunIcon\|MoonIcon" --include=*.ts --include=*.tsx src/ e2e/
grep -rn "MonitorIcon" --include=*.ts --include=*.tsx src/
```

Expected: the first prints nothing. The second prints the `header.config.ts` import and the icon file itself. Note the `--include=*.ts` — a `.tsx`-only grep silently misses `header.config.ts`.

- [ ] **Step 7: Run the tests to verify they pass**

```bash
cd chalo-fe && PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test e2e/admin-user-menu.spec.ts --reporter=line
```

Expected: `5 passed`.

- [ ] **Step 8: Verify the staff sidebar and the rest of the suite**

The staff area shares `Sidebar`, and `MonitorIcon` lives in its nav:

```bash
cd chalo-fe && npx tsc --noEmit && pnpm lint
PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test --reporter=line
```

Expected: no type or lint errors; the full suite passes (13 pre-existing + 5 new = 18).

- [ ] **Step 9: Commit**

```bash
git add chalo-fe/src/components/shared/ThemeSwitch.tsx chalo-fe/src/components/shared/UserMenu.tsx chalo-fe/src/components/shared/Sidebar.tsx chalo-fe/e2e/admin-user-menu.spec.ts
git add -u chalo-fe/src/components/shared/
git commit -m "feat: replace the fixed theme toggle with a sun/moon switch in the user menu"
```

---

## Manual verification

Automated tests cover behaviour, not looks. Before calling this done, open the app and check:

1. `/admin/dashboard` — no floating button in the top-right corner.
2. Click the avatar. The panel opens **upward**, fully visible, not clipped by the sidebar.
3. The switch reads as a sky with clouds (knob left, sun) or a night sky with stars (knob right, moon). Both states legible at 64×32.
4. Collapse the sidebar (chevron in the brand row). The avatar centres; the panel still opens and overflows to the right over the page content.
5. `/staff/orders` — same menu, and the POS nav item still shows its monitor icon.
