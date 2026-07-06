# Chalo Coffee — Implementation Audit & Plan

> Generated 2026-06-30 from codebase scan of `chalo-be/` (NestJS) + `chalo-fe/` (Next.js)

---

## Section A: Already Implemented

### CUSTOMER Subsystem

| File/Module | Status | Notes |
| --- | --- | --- |
| `chalo-fe/src/app/(customer)/layout.tsx` | ✅ | Customer layout |
| `chalo-fe/src/app/(customer)/menu/[tableToken]/page.tsx` | ✅ | SSR menu page — fetches table by token, categories, products |
| `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuClient.tsx` | ✅ | Client-side menu with category tabs, product grid, cart badge |
| `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.tsx` | ✅ | Product card with add-to-cart |
| `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/OccupiedModal.tsx` | ✅ | Shows when table status is OCCUPIED |
| `chalo-fe/src/app/(customer)/menu/[tableToken]/cart/page.tsx` | ✅ | Cart page — quantity, notes, place order |
| `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/page.tsx` | ✅ | Active orders list for the table |
| `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/page.tsx` | ✅ | Single order detail with estimated wait |
| `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.tsx` | ✅ | Order card with status badge |
| `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/PayAllConfirmModal.tsx` | ✅ | Pay-all confirmation modal |
| `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/PayConfirmModal.tsx` | ✅ | Single pay confirmation |
| `chalo-fe/src/app/(customer)/menu/[tableToken]/not-found.tsx` | ✅ | Invalid table token fallback |
| `chalo-fe/src/app/(auth)/login/page.tsx` | ✅ | Login page |
| `chalo-fe/src/app/(auth)/login/_components/LoginForm.tsx` | ✅ | Login form with validation |
| `chalo-fe/src/app/(auth)/layout.tsx` | ✅ | Auth layout |
| `chalo-be/src/modules/order/order.controller.ts` → `POST /order/create` | ✅ | `@Public()` — customer order creation |
| `chalo-be/src/modules/order/order.controller.ts` → `GET /order/by-token/:token` | ✅ | `@Public()` — customer order list |
| `chalo-be/src/modules/order/order.controller.ts` → `GET /order/estimated-wait` | ✅ | `@Public()` — estimated wait time |
| `chalo-be/src/modules/order/order.controller.ts` → `POST /order/request-payment` | ✅ | `@Public()` — request payment from phone |
| `chalo-be/src/modules/order/order.controller.ts` → `POST /order/pay` | ✅ | `@Public()` — pay single order |
| `chalo-be/src/modules/order/order.controller.ts` → `POST /order/pay-all` | ✅ | `@Public()` — pay all orders at table |
| `chalo-be/src/modules/table/table.controller.ts` → `GET /table/by-token/:token` | ✅ | `@Public()` — validate table QR token |

### STAFF/MODERATOR Subsystem

| File/Module | Status | Notes |
| --- | --- | --- |
| `chalo-fe/src/app/(staff)/layout.tsx` | ✅ | Staff layout |
| `chalo-fe/src/app/(staff)/staff/_components/StaffHeader.tsx` | ✅ | Staff header with nav |
| `chalo-fe/src/app/(staff)/staff/_components/header.config.ts` | ✅ | Header navigation config |
| `chalo-fe/src/app/(staff)/staff/orders/page.tsx` | ✅ | **Kanban board** — real-time SSE, audio alerts, 4-column drag/status flow |
| `chalo-fe/src/app/(staff)/staff/orders/_components/KanbanColumn.tsx` | ✅ | Kanban column component |
| `chalo-fe/src/app/(staff)/staff/orders/_components/OrderCard.tsx` | ✅ | Order card in kanban |
| `chalo-fe/src/app/(staff)/staff/orders/layout.tsx` | ✅ | Orders layout with parallel route modal |
| `chalo-fe/src/app/(staff)/staff/orders/@modal/(.)orders/[orderId]/page.tsx` | ✅ | Order detail modal (intercepted route) |
| `chalo-fe/src/app/(staff)/staff/pos/page.tsx` | ✅ | **Counter POS** — product grid, category filter, table selector, cart, create order |
| `chalo-fe/src/app/(staff)/staff/pos/_components/ProductCard.tsx` | ✅ | POS product card |
| `chalo-fe/src/app/(staff)/staff/pos/_components/CartItem.tsx` | ✅ | POS cart item with qty/note |
| `chalo-fe/src/app/(staff)/staff/pos/_hooks/useCart.ts` | ✅ | POS cart state hook |
| `chalo-fe/src/app/(staff)/staff/tables/page.tsx` | ✅ | Staff table view with TableCard/TableDrawer |
| `chalo-fe/src/app/(staff)/staff/tables/_components/TableCard.tsx` | ✅ | Table card (status, active orders) |
| `chalo-fe/src/app/(staff)/staff/tables/_components/TableDrawer.tsx` | ✅ | Table detail drawer |
| `chalo-fe/src/app/(staff)/staff/tables/_components/OrderRow.tsx` | ✅ | Order row in table drawer |
| `chalo-fe/src/hooks/useSSE.ts` | ✅ | EventSource hook — connects to BE SSE, 5 event types, auto-reconnect |
| `chalo-be/src/modules/order/order.controller.ts` → `GET /order/active` | ✅ | Staff kanban queue (PENDING→CONFIRMED→PREPARING→READY) |
| `chalo-be/src/modules/order/order.controller.ts` → `PUT /order/status` | ✅ | Status transition (guarded by STATUS_TRANSITIONS map) |
| `chalo-be/src/modules/order/order.controller.ts` → `POST /order/checkout/complete-staff` | ✅ | Staff-side payment confirmation |
| `chalo-be/src/modules/sse/sse.controller.ts` → `GET /order/events` | ✅ | SSE stream (new_order, payment_request, order_status_changed, payment_completed) |
| `chalo-be/src/modules/sse/sse.service.ts` | ✅ | RxJS Subject-based SSE event bus |

### ADMIN Subsystem

| File/Module | Status | Notes |
| --- | --- | --- |
| `chalo-fe/src/app/(admin)/layout.tsx` | ✅ | Admin layout |
| `chalo-fe/src/app/(admin)/_components/AdminSidebar.tsx` | ✅ | Sidebar component |
| `chalo-fe/src/app/(admin)/_components/SidebarNav.tsx` | ✅ | Sidebar navigation |
| `chalo-fe/src/app/(admin)/_components/SidebarProfile.tsx` | ✅ | User profile in sidebar |
| `chalo-fe/src/app/(admin)/_components/sidebar.config.ts` | ✅ | 6 nav items: Dashboard, Menu, Orders, Tables, Staff, Settings |
| `chalo-fe/src/app/(admin)/admin/menu/categories/page.tsx` | ✅ | Category list CRUD page |
| `chalo-fe/src/app/(admin)/admin/menu/categories/_components/CategoryForm.tsx` | ✅ | Category create/edit form |
| `chalo-fe/src/app/(admin)/admin/menu/products/page.tsx` | ✅ | Product list CRUD page |
| `chalo-fe/src/app/(admin)/admin/menu/products/_components/ProductForm.tsx` | ✅ | Product create/edit form (price, prepTime, status toggle) |
| `chalo-fe/src/app/(admin)/admin/menu/layout.tsx` | ✅ | Menu sub-layout with tabs |
| `chalo-fe/src/app/(admin)/admin/tables/page.tsx` | ✅ | Table management CRUD page |
| `chalo-fe/src/app/(admin)/admin/tables/_components/TableForm.tsx` | ✅ | Table create/edit form |
| `chalo-fe/src/app/(admin)/admin/tables/_components/QRModal.tsx` | ✅ | QR code display modal (qrserver.com API) |
| `chalo-be/src/modules/category/category.controller.ts` | ✅ | Full CRUD for categories |
| `chalo-be/src/modules/product/product.controller.ts` | ✅ | Full CRUD + status toggle (AVAILABLE/OUT_OF_STOCK) |
| `chalo-be/src/modules/table/table.controller.ts` | ✅ | Full CRUD + QR regenerate + areas list |
| `chalo-be/src/modules/user/user.controller.ts` | ✅ | User page/create/update/delete/change-password |
| `chalo-be/src/modules/order/order.controller.ts` → `GET /order/stats/revenue` | ✅ | Revenue stats (day/week/month, date range) |
| `chalo-be/src/modules/order/order.controller.ts` → `GET /order/stats/top-products` | ✅ | Top products by quantity sold |
| `chalo-be/src/modules/upload/upload.controller.ts` | ✅ | Image upload endpoint |

### Cross-Cutting (Both)

| File/Module | Status | Notes |
| --- | --- | --- |
| `chalo-be/src/modules/auth/` — JWT auth + refresh + roles + permissions | ✅ | ADMIN: menu/table/order/staff write; MODERATOR: order read/write |
| `chalo-be/src/common/guards/` — JwtAuthGuard, RolesGuard | ✅ | Global guards in AppModule |
| `chalo-be/src/common/enums/` — OrderStatus, ProductStatus, TableStatus, UserRole | ✅ | All enums defined |
| `chalo-be/src/seed/seed.service.ts` | ✅ | Seeds 25 tables, 250 orders, 6 categories, 50+ products |
| `chalo-fe/src/services/` — auth, menu, table, order, upload, lookup | ✅ | Full API client layer with React Query hooks |
| `chalo-fe/src/stores/auth.store.ts` | ✅ | Zustand persisted auth (token, user, role, permissions) |
| `chalo-fe/src/mocks/` — MSW handlers for auth, menu, order | ✅ | Full mock API for dev without BE |
| `chalo-fe/src/components/shared/ui/` — Badge, ConfirmDialog, DataTable, FormField, Input, Modal, Select, Toggle | ✅ | Reusable UI kit |
| `chalo-fe/src/lib/api-client.ts` | ✅ | Axios wrapper with JWT intercept + refresh |
| `docker-compose.yml` + `docker-compose.prod.yml` | ✅ | PostgreSQL 16, Redis 7, BE, FE |

---

## Section B: Missing or Incomplete

### CUSTOMER Subsystem

| Gap | Severity | What's Needed |
| --- | --- | --- |
| **No checkout session flow in FE** | 🔴 HIGH | BE has `POST /order/checkout/preview`, `POST /order/checkout/start`, `POST /order/checkout/complete` — FE has no checkout pages. Customer can pay individual orders but the batch checkout flow (scan once, pay all) is not wired. |
| **No member registration** | 🟡 MEDIUM | Spec says "member login/register" but `POST /user/create` is admin-only. Need a `@Public()` registration endpoint + registration page. |
| **FE SSE route is dead mock code** | 🟢 LOW | `chalo-fe/src/app/api/sse/orders/route.ts` uses `setInterval` — the real SSE connection is via `useSSE` hook directly to BE. Delete or repurpose the mock route. |
| **No auto table detection** | 🟡 MEDIUM | Spec mentions "auto table detection" — currently tableToken comes from QR URL param only. No fallback if user navigates directly. |

### STAFF/MODERATOR Subsystem

| Gap | Severity | What's Needed |
| --- | --- | --- |
| **No pager token management** | 🔴 HIGH | Spec mentions "pager token management" — no entity, no UI, no API endpoint exists. The POS has a table selector but no pager/token system for takeaway customers. |
| **No receipt printing** | 🟡 MEDIUM | Spec says "receipt printing (draft + final)" — nothing implemented. Need print layout component + browser print API or thermal printer integration. |
| **Staff tables page uses different DTO than admin** | 🟡 MEDIUM | Staff `tables/page.tsx` shows TableCard/TableDrawer with `activeOrders` from `GET /table/list` — BE returns embedded active orders. This works but may need pagination at scale. |
| **Payment accept + release table** | 🟢 LOW | Payment flow exists (`pay`, `pay-all`, `checkout/complete-staff`) but table release is implicit (auto-synced after payment). Staff-side explicit "release table" button for edge cases is missing. |

### ADMIN Subsystem

| Gap | Severity | What's Needed |
| --- | --- | --- |
| **Dashboard is a stub** | 🔴 HIGH | `chalo-fe/src/app/(admin)/admin/dashboard/page.tsx` shows "Phrase 7 - chart" — no revenue chart, no stats cards, no order summary. BE endpoints for revenue + top products exist. |
| **No staff management page** | 🔴 HIGH | Sidebar has "Nhân viên" link but `chalo-fe/src/app/(admin)/admin/staff/` does not exist. BE `GET/POST /user/page`, `PUT /user/update`, `DELETE /user/delete` exist. |
| **No settings page** | 🔴 HIGH | Sidebar has "Cài đặt" link but `chalo-fe/src/app/(admin)/admin/settings/` does not exist. Spec mentions "wait-time feature toggle (on/off globally)" — no BE endpoint for this either. |
| **No admin orders page** | 🟡 MEDIUM | Sidebar has "Đơn hàng" link — need order list with filters (status, date, table), paginated. BE `GET /order/page` exists. |
| **Order status labels mismatch spec** | 🟢 LOW | Code uses PENDING→CONFIRMED→PREPARING→READY→COMPLETED; spec says Pending→Brewing→Served→Completed. This is a labeling decision, not a functional gap — current granularity is better. |
| **Wait-time toggle** | 🟡 MEDIUM | `ESTIMATED_WAIT_BARISTAS` in `chalo-be/src/common/constants.ts` is hardcoded. No runtime toggle. Need a settings table or config endpoint. |

### Infrastructure

| Gap | Severity | What's Needed |
| --- | --- | --- |
| **Seed service resets DB on every boot** | 🔴 CRITICAL | `SeedService.onModuleInit()` truncates ALL tables then re-seeds. This will destroy production data. Must be gated behind an env flag like `SEED_ON_STARTUP=true`. |
| **No env.example or .env documentation** | 🟡 MEDIUM | No `.env.example` file. Env vars referenced in code: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES`, `APP_FRONTEND_URL`, `DB_*`, `REDIS_*`. |

---

## Section C: Ordered Task List

### Phase 1 — Critical Fixes (blocks everything)

1. **Gate seed service behind env flag** — add `SEED_ON_STARTUP` check in `chalo-be/src/seed/seed.service.ts`; only truncate + seed when explicitly enabled
2. **Create** `.env.example` — document all required env vars for both BE and FE

### Phase 2 — BE: Core Flow Completion

3. **Add** `@Public()` **customer registration endpoint** — `POST /auth/register` in `chalo-be/src/modules/auth/auth.controller.ts` + `AuthService.register()`
4. **Add wait-time toggle endpoint** — `GET/PUT /settings` or extend an existing controller with a runtime-configurable `waitTimeEnabled` + `baristaCount` fields (use a simple `settings` table or Redis key)
5. **Add pager token entity + API** — new `PagerToken` entity (`chalo-be/src/modules/table/entities/pager-token.entity.ts`) with `token`, `status` (WAITING/ASSIGNED/COMPLETED), `tableId`; CRUD in `TableController` or new `PagerController`

### Phase 3 — FE: Customer Completion

6. **Build checkout flow pages** — `chalo-fe/src/app/(customer)/menu/[tableToken]/checkout/` with preview, start, complete; wire to BE checkout endpoints
7. **Build registration page** — `chalo-fe/src/app/(auth)/register/page.tsx` with registration form

### Phase 4 — FE: Staff Completion

8. **Build pager token management UI** — add pager token tab/section to staff tables page or POS page
9. **Build receipt print component** — `chalo-fe/src/components/shared/Receipt.tsx` with draft + final views, browser print API

### Phase 5 — FE: Admin Completion

10. **Build admin dashboard** — `chalo-fe/src/app/(admin)/admin/dashboard/page.tsx` with revenue chart (recharts), stats cards (total revenue, total orders, top products), date range picker; wire to `GET /order/stats/revenue` + `GET /order/stats/top-products`
11. **Build staff management page** — `chalo-fe/src/app/(admin)/admin/staff/page.tsx` with user table (DataTable), create/edit staff modal, role assignment (ADMIN/MODERATOR), active/inactive toggle; wire to `GET/POST/PUT/DELETE /user/*`
12. **Build settings page** — `chalo-fe/src/app/(admin)/admin/settings/page.tsx` with wait-time toggle + barista count config; wire to new settings endpoint
13. **Build admin orders page** — `chalo-fe/src/app/(admin)/admin/orders/page.tsx` with status/date/table filters, paginated DataTable; wire to `GET /order/page`

### Phase 6 — Polish

14. **Clean up dead SSE mock route** — delete or repurpose `chalo-fe/src/app/api/sse/orders/route.ts`
15. **Add** `@Public()` **registration endpoint** (if not done in Phase 2)
16. **Add** `.env.example` files to both `chalo-be/` and `chalo-fe/`

---

## Section D: Risks & Blockers

| Risk | Impact | Mitigation |
| --- | --- | --- |
| **Seed service nukes DB on boot** | 🔴 Production data loss | Gate with `SEED_ON_STARTUP` env var — Phase 1 task 1 ✅ |
| **No migration for pager tokens** | 🔴 New pager feature needs schema change | Add migration in `chalo-be/src/migrations/` alongside entity |
| **Checkout session expiry not enforced** | 🟡 Sessions expire but no cleanup job | Add `@Cron()` job to mark expired sessions CANCELLED |
| **SSE auth via query param** | 🟡 Token in URL is logged by proxies/servers | Current approach is fine for MVP; upgrade to cookie-based SSE auth later |
| **QR codes use external API** | 🟡 `api.qrserver.com` — downtime means no QR codes | Cache generated QR URLs locally or use a library like `qrcode` |
| **No row-level security on orders** | 🟢 Any staff can modify any order | OK for MVP café use case; add audit log later |
| **MSW mocks diverge from real API** | 🟡 Mock handlers hardcode seed data that may not match BE responses | Keep mock types in sync with `order.types.ts`; test against real BE regularly |
| **No e2e tests** | 🟡 Only `chalo-be/test/app.e2e-spec.ts` exists, no FE tests | Add Playwright smoke tests for critical flows (order creation, payment) |
| **Redis in docker-compose but unused** | 🟢 Redis container runs but nothing uses it | Reserve for future WebSocket adapter or session store |
