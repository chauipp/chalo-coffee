# Admin mobile UI and state persistence

## Goal

Make the admin area comfortable on phones and resilient when a mobile browser is backgrounded, reloaded, or restored after the operating system suspends it. The active admin page, list filters, and an unfinished product edit must return to the same working context.

## Scope

- Add a fixed bottom navigation bar for admin on mobile; keep the existing collapsible sidebar on desktop.
- Persist desktop sidebar collapsed state.
- Persist the last admin pathname and query string, keyed to the signed-in user. A direct route always wins; `/admin` may redirect to the saved route.
- Persist the current product list filters and the active product edit target.
- Persist product edit form values as a debounced draft keyed by user and product ID. Restore it when the edit modal reopens. Clear it on successful submit or cancel.
- Make product names in the admin product table clickable and open the existing edit modal.
- Add mobile-safe spacing, touch target sizes, safe-area padding, and horizontal overflow for dense tables/forms.

## Design

### Admin shell

`src/app/(admin)/layout.tsx` remains the shell. It renders the desktop `Sidebar` at `md` and above, a compact mobile header, and a `MobileAdminNav` fixed to the bottom below `md`. Main content gets bottom padding on mobile so the bar cannot cover controls. The active item is derived from `usePathname`, with the menu route active for both category and product pages.

`Sidebar` stores its collapsed flag in `localStorage` and guards browser APIs for SSR. The existing visual language (brand color, light/dark variants, rounded controls) is retained.

### Route and list restoration

A small client hook/provider in the admin shell observes pathname and search params. It writes `{ pathname, search }` to a versioned, user-scoped storage key after hydration, ignoring auth/login paths. On `/admin` only, it performs a single guarded replace to the saved route if one exists. Product filters use the same storage namespace and are restored as initial state; changing or resetting filters updates the saved value.

### Product editing

The products page keeps its current modal-based editor. The name cell becomes a semantic button styled like a link and calls the same edit handler as “Sửa”. The active edit target is stored as a small serializable product snapshot so the modal can reopen even if the list query has not completed. `ProductForm` watches its values and writes a debounced draft (`userId`, `productId`, values, updatedAt). On mount it merges a valid draft over server defaults. Successful update and cancel remove that product draft; a stale draft is ignored after a bounded retention period.

### Responsive behavior

Products, dashboard, and nested menu pages use responsive padding (`px-4` on phones, larger at `sm`/`lg`), stacked headers/actions, one-column form grids on narrow screens, and touch-friendly buttons. Data tables remain usable via an explicitly scrollable container with a minimum content width. The bottom nav uses `env(safe-area-inset-bottom)` and does not intercept content scrolling.

## Data flow and failure handling

- Storage access is wrapped in try/catch; malformed or expired JSON is removed and ignored.
- Storage failures never block navigation, fetching, or form submission.
- Draft writes are debounced and cancelled on unmount. File objects are not persisted; only the resulting uploaded URL is.
- Logout clears the active route/edit metadata for the current user. User-scoped keys prevent another account on the same device from seeing drafts.

## Verification

- Unit tests cover storage parsing/expiry, route restoration precedence, and product draft save/restore/clear behavior.
- Existing lint/build checks must pass.
- Playwright/mobile checks verify bottom-nav visibility, content clearance, clickable product names, and restoration after reload/navigation.
