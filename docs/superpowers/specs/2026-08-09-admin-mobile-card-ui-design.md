# Admin mobile card UI design

## Goal

Replace cramped mobile admin tables with a mobile-first card experience while preserving all existing desktop tables, admin routes, filters, restore behavior, and product edit drafts.

## Scope

- Apply the mobile card direction to all admin collection screens: products, categories, orders, tables/QR, users, pager, and settings collections where applicable.
- Keep desktop layouts and existing APIs unchanged.
- Preserve the current mobile bottom navigation, but reduce it to primary destinations plus a `Khác` destination for secondary pages.
- Keep the current restored admin route, persisted filters, and persisted product edit drafts working after the browser returns from the background.

## Layout and interaction

### Shared mobile list shell

At widths below the existing mobile breakpoint, each collection page uses a shared shell:

1. Compact page header with title, useful count or summary, and one primary action.
2. Search input when the page supports search.
3. A compact filter trigger. Active filters render as horizontally scrollable chips instead of permanently visible full-width selects.
4. A screen-specific card list, loading state, empty state, and pagination/load-more control.
5. Bottom safe-area padding so the fixed mobile navigation never obscures content or primary controls.

The filter trigger opens a mobile sheet/dialog. Applying, clearing, and restoring filters uses the page's current state and persistence mechanism; no filter data model changes are needed.

### Screen-specific cards

The shell supplies structure and spacing. Each screen provides a card body for its domain data.

- Products: thumbnail, name, category, price, preparation time, availability. Tapping the name or card opens the product editor; secondary actions remain accessible without requiring a desktop-width action column.
- Categories: icon/image, name, visible product count, active state, and contextual edit action.
- Orders: table identity, status, total, elapsed/created time, and the most useful next action.
- Tables/QR: table name, area, current state, token/QR action, and contextual management action.
- Users/pagers/settings collections: a compact identity/state summary and the primary management action, using the same visual hierarchy.

Cards must not rely on clipped text. Long labels truncate only after the important identifier is visible, and status uses a compact, readable chip.

### Mobile navigation

The fixed bar keeps only the most-used admin destinations. It has a clear active state, touch targets of at least 44px, short labels, and safe-area inset padding. Less frequent destinations move to a `Khác` sheet/list so labels cannot overflow or become unreadable.

## Visual language

- Preserve Chalo's orange brand accent but use it sparingly for the primary action and active navigation state.
- Use a light neutral page background, white cards, restrained borders, and readable dark text.
- Use consistent 12–16px card gaps, 14–16px page side padding, and 12–14px card radius.
- Favor a single strong title, a muted supporting line, and compact metadata over dense column headings.

## State and navigation

- The card UI consumes the existing queries, mutations, route restoration, filters, and local draft persistence.
- No state is reset solely because the viewport changes or the browser is backgrounded.
- Product drafts continue to flush on background/pagehide and clear only on cancel or successful submit.
- The product editor remains reachable by direct product-name/card tap as well as existing actions.

## Errors and accessibility

- Preserve existing loading, error, and empty states; present them inside the shared shell.
- Filters and sheets are keyboard-accessible, closable, and use clear labels.
- Cards and navigation controls have explicit accessible labels and do not depend solely on color.
- Primary touch controls meet a 44px minimum target.

## Verification

- Extend unit tests for responsive list selection and mobile navigation labels/routes.
- Extend the admin mobile Playwright scenario to assert card rendering, filter restoration, route restoration, and product-draft restoration.
- Run the targeted unit tests, TypeScript check, admin mobile E2E test, and production build.
- Manually check a narrow viewport with product names, status, and bottom navigation visible without overlap.

## Non-goals

- No backend/API contract changes.
- No desktop table redesign.
- No changes to persisted-state keys unless a new mobile filter sheet requires a compatible extension.
