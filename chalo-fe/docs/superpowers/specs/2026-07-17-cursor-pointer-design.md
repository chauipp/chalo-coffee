# Restore the Button Cursor — Design Spec

Date: 2026-07-17
Scope: `chalo-fe` — one CSS block in `src/app/globals.css`

## Problem

Every button in the app shows the default arrow cursor instead of a pointing hand. This is not an oversight by whoever wrote the buttons — it is a Tailwind v4 behaviour change.

Tailwind v3's Preflight included `button, [role="button"] { cursor: pointer }`. Tailwind v4 removed it. Verified directly against the installed copy: `node_modules/tailwindcss/preflight.css` (v4.2.2) contains no `cursor` declaration for `button` — its only `cursor` line targets Safari's number-input spin buttons. The app is on `tailwindcss@^4` (resolved 4.2.2), so all 112 `<button>` elements lost the pointer at once.

This is why only 3 files in the codebase mention `cursor-pointer`, and none of those are on a `<button>` — they are on a `<label>` and two `<div>`s, added by developers who happened to notice.

## Goal

One CSS rule restores the pointer everywhere, so the next person to write a button does not have to remember anything.

## Non-goals

- No `.tsx` file changes.
- No `cursor-pointer` utility classes sprinkled across components.
- The 4 modal backdrops keep the default arrow (see Decisions).

## The change

Add one block to `src/app/globals.css`, directly below the existing `@custom-variant dark` declaration. The two belong together: both are notes about Tailwind v4 changing a default this app relies on.

```css
/* Tailwind v3 đặt cursor:pointer cho button trong preflight; v4 bỏ đi, nên mọi
   button trong app trỏ mũi tên thường. Khôi phục ở đây thay vì rải cursor-pointer
   vào 112 button — người viết button tiếp theo không phải nhớ gì cả. */
@layer base {
  button:not(:disabled),
  [role="button"]:not(:disabled),
  select:not(:disabled) {
    cursor: pointer;
  }

  button:disabled,
  select:disabled {
    cursor: not-allowed;
  }
}
```

## Coverage

| Element | Count | Outcome |
|---|---|---|
| `<button>` | 112 | `pointer` via the rule |
| `role="button"` (`OrderCard`) | 1 | `pointer` via the rule |
| `<select>` | 2 | `pointer` via the rule |
| `<Link>` → `<a href>` | 5 | Already `pointer`; browser default, rule not needed |
| `<label>` in `FormField` | 14 | Unchanged — plain text labels, no `htmlFor`, not clickable |
| Modal backdrops (`<div>`) | 4 | Unchanged — `<div>` does not match the rule |
| `OrderCard`, `Toggle` | 2 | Already carry `cursor-pointer`; the rule is consistent with them |

`:disabled` is excluded from the pointer rule so that disabled buttons do not look clickable.

## Decisions

**Backdrops keep the default arrow.** `Modal.tsx`, `TableDrawer.tsx`, `PagerBoard.tsx` and the staff order modal each render a `fixed inset-0` div that closes on click. Radix, MUI and Headless UI all leave these as default. A pointer covering the whole viewport suggests everything under it is clickable. They are `<div>`s, so the rule skips them for free.

**Selects get the pointer.** Tailwind v3 did not do this either, so it is an improvement rather than a restoration — but a select is a control you click to open, and the hand is right.

**Disabled gets `not-allowed` globally.** 13 places already declare `disabled:cursor-not-allowed` by hand; the global rule makes that behaviour uniform across all 112 buttons instead of the handful someone remembered.

**The 12 redundant utility classes stay.** With the global rule in place, `disabled:cursor-not-allowed` on buttons and on `Select.tsx` becomes redundant — same cursor, declared twice. Removing them would touch 8 files for no user-visible change, so they stay. `Input.tsx`'s copy is **not** redundant and must not be removed: it targets an `<input>`, which the global rule deliberately does not cover.

## Testing

Cursor is directly observable, so this is a real e2e assertion rather than a snapshot: `getComputedStyle(el).cursor`.

Add `e2e/cursor.spec.ts`. Every anchor below was verified against the current code — each is disabled or enabled *at rest*, so no test races a loading state:

| # | Anchor | Expected |
|---|---|---|
| 1 | Sidebar avatar trigger, `data-testid="user-menu-trigger"` — an enabled `<button>` | `pointer` |
| 2 | Customer menu → the quantity stepper's "Giảm số lượng" button | `not-allowed` |
| 3 | `/admin/dashboard` → the period filter, a `<Select>` rendering `<select>` | `pointer` |
| 4 | `/admin/menu/categories` → open "Thêm danh mục" → the modal backdrop | `auto` |
| 5 | A sidebar nav `<Link>` → `<a href>` | `pointer` |

The backdrop (#4) has no test id and must not gain one — this spec changes no `.tsx`. Select it by class substring: `div[class*="bg-black/50"]`. #4 and #5 are the load-bearing guards: they pin the two decisions (backdrops excluded, links untouched) that a future widening of the rule would silently break. Both already pass before the fix — that is their job.

**Two things the red run corrected in this spec, both worth recording:**

*The backdrop computes to `auto`, not `default`.* `auto` is the CSS initial value for `cursor`; `default` is an explicit arrow. Buttons, by contrast, do compute to `default` before the fix.

*The disabled anchor must be a button with no cursor utility of its own.* The first draft used DataTable's "← Trước" — it passed **before** the fix, because DataTable already declares `disabled:cursor-not-allowed`, so it proved nothing about the global rule. The quantity stepper is the right anchor: `disabled={quantity <= 1}` with `quantity` initialised to 1 makes it disabled at rest, and `stepperButtonClass` carries only `disabled:opacity-30` — no cursor. It genuinely fails without the rule.

The login submit button is also unusable for #2: it is `disabled={isLoading}`, disabled only while the request is in flight, so a test would race the loading state.

## Out of scope

- Cursor styling for `<input>`, textareas, or drag handles.
- Any change to the customer page's own theme picker or other unrelated UI.
