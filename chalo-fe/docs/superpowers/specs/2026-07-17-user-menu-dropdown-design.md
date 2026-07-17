# User Menu Dropdown — Design Spec

Date: 2026-07-17
Scope: `chalo-fe` — admin + staff sidebar

## Problem

Two personal controls sit in unrelated places. `ThemeToggle` is a `position: fixed` icon pinned to the top-right of the viewport, floating over page content and belonging to no layout region. Logout is a separate button in the sidebar footer, next to — but disconnected from — the avatar that identifies the user.

The avatar is the natural home for both: it is the thing that represents "me", and theme plus sign-out are the two things "I" control.

## Goals

- Clicking the sidebar avatar opens a dropdown containing the theme switch and logout.
- Theme is a two-state light/dark switch styled as a sun/moon pill (per the supplied reference image). No "Sáng"/"Tối" text.
- Remove the fixed top-right theme icon and the standalone logout button.
- Applies to both admin and staff, which share `Sidebar.tsx`.

## Non-goals

- The customer menu page (`CustomerMenuClient`) keeps its own three-option theme picker. Untouched.
- `ThemeProvider`, `ThemeScript`, and the `Theme` type are not changed. `"system"` survives as an internal state.
- `components/shared/ui/Toggle.tsx` is not modified. Seven call sites depend on it; the theme switch is a different control with different semantics and gets its own component.

## Theme semantics: why `"system"` stays

The `Theme` type remains `"system" | "light" | "dark"`. Only the sidebar UI drops `"system"` as an explicit choice.

The switch renders its knob position from `resolvedTheme` (always `"light"` or `"dark"`), never from `theme`. This makes the implicit default work correctly: on a first visit `theme === "system"`, and if the OS prefers dark, the knob already sits on the right — the control agrees with what the user sees on screen. The first click writes an explicit `"light"` or `"dark"` to localStorage and leaves system-following behind.

Keeping `"system"` also leaves `ThemeScript` untouched, so the existing no-flash-on-load behaviour is preserved.

## Components

### `src/components/shared/ThemeSwitch.tsx` (new)

A self-contained pill switch. Owns its visuals only; reads and writes theme through `useTheme()`.

- Size: 64×32px.
- Knob (24px circle) travels between left (light) and right (dark).
- Light state: amber knob with a soft glow, sky-blue gradient track, two simple cloud shapes.
- Dark state: grey knob with 2–3 craters, near-black gradient track, a few star dots.
- Pure CSS/Tailwind and inline shapes. No external assets, no new dependency.
- Cloud and star decorations are `aria-hidden`; they carry no information.
- Transitions on knob translate and track colour. Respect `motion-safe:` per the repo's existing convention.

A11y: `role="switch"`, `aria-checked={resolvedTheme === "dark"}`, `aria-label="Chế độ tối"`. Keyboard-operable as a native `<button>`.

Props: none. It is a singleton control bound to the theme context.

### `src/components/shared/UserMenu.tsx` (new)

Owns identity and personal options. Reads `user` from `useAuthStore`, logout from `useLogout`.

Props: `{ collapsed: boolean }`.

Trigger — the avatar button:
- Collapsed: avatar circle only, centred.
- Expanded: avatar + full name + role, matching the current footer layout.
- `aria-haspopup="menu"`, `aria-expanded={open}`.

Panel — `w-56`, absolutely positioned, opens upward (`bottom-full mb-2`) because the footer sits at the bottom of the sidebar. When the sidebar is collapsed the panel is wider than the 64px rail and overflows to the right; this is correct dropdown behaviour and is not clipped, as `aside` sets no `overflow-hidden`.

Panel contents, top to bottom:
1. Header: full name + role.
2. Divider.
3. `<ThemeSwitch />`, horizontally centred.
4. Divider.
5. Logout row: `LogoutIcon` + "Đăng xuất", red hover, `role="menuitem"`.

Behaviour:
- Click trigger toggles open state.
- Click outside closes (document `mousedown` listener, added only while open).
- `Escape` closes and returns focus to the trigger.
- Panel is `role="menu"`.

Deliberately excluded, to match the level `Modal.tsx` already sets: no focus trap, no arrow-key roving focus. Adding them here would make this the only component in the codebase with that behaviour.

### `src/components/shared/Sidebar.tsx` (edit)

Three changes:
- Remove the `ThemeToggle` import and its render (the fragment wrapper it required goes away with it).
- Remove the footer's avatar block and logout button, in both collapsed and expanded branches.
- Render `<UserMenu collapsed={collapsed} />` in the footer.

`Sidebar` is left owning navigation and collapse state only. It no longer touches `useAuthStore` or `useLogout` — those move to `UserMenu`.

## Deletions

The knob is drawn in CSS, not from an icon: the reference calls for a solid glowing disc and a cratered moon, which the repo's thin-stroke line icons cannot express. That decision determines what becomes dead code.

- `src/components/shared/ThemeToggle.tsx` — `Sidebar` was its only consumer.
- `src/components/shared/icons/SunIcon.tsx` — only `ThemeToggle` referenced it.
- `src/components/shared/icons/MoonIcon.tsx` — only `ThemeToggle` referenced it.

**`MonitorIcon` must be kept.** It looks like a third orphan, but `src/app/(staff)/staff/_components/header.config.ts` imports it as the staff POS nav icon. Deleting it breaks the staff header. Verified with a grep covering `.ts` as well as `.tsx` — a `.tsx`-only grep misses this file and gives the wrong answer.

## Error handling

`user` may be `null` before the auth store hydrates. The trigger falls back to `"?"` for the avatar letter and `"Người dùng"` for the name, exactly as the current footer does.

`useLogout` already swallows a failing `userLogout()` call and clears local state regardless. No new handling needed.

## Testing

No existing e2e spec references the theme toggle or the logout button — verified by grep across `e2e/`. Nothing breaks.

Add one Playwright spec, `e2e/admin-user-menu.spec.ts`:
1. Log in as admin.
2. Assert no fixed theme button remains in the top-right.
3. Click the avatar; assert the panel opens and shows the switch and "Đăng xuất".
4. Read `<html>`'s class, click the switch, assert the class flipped and the choice persists across a reload.
5. Press `Escape`; assert the panel closes.
6. Reopen, click "Đăng xuất", assert redirect to `/login`.

## Out of scope

- Restyling the customer page theme picker to match.
- Any change to how theme is persisted or read.
