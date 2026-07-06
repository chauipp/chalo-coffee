# Phase 6 — Cleanup & Polish — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or executing-plans. Steps use `- [ ]` checkboxes.

**Goal:** Remove dead code and small inconsistencies left over after the feature work.

**Architecture:** Pure deletions / small edits. No new behaviour.

**Tech Stack:** Next.js (modified), NestJS

**Depends on:** Do this LAST, after 01–08.

## Global Constraints
- Verify each deletion target has zero live references before removing (grep first).
- One commit per task.

---

### Task 1: Delete the dead mock SSE route

The real SSE stream is the backend `GET /order/events`, consumed by `chalo-fe/src/hooks/useSSE.ts` via `new EventSource(sseUrl)` where `sseUrl` builds on `ORDER_EVENTS = "/order/events"` (`chalo-fe/src/constants/api-endpoints.ts:63`). The file `chalo-fe/src/app/api/sse/orders/route.ts` is a `setInterval`-based mock with **zero references** anywhere in `src/`.

**Files:**
- Delete: `chalo-fe/src/app/api/sse/orders/route.ts`

- [ ] **Step 1: Confirm no references remain**

Run: `grep -rn "api/sse/orders" chalo-fe/src`
Expected: only the file's own header comment line (or nothing). If any real import exists, STOP and re-evaluate.

- [ ] **Step 2: Delete the file**

```bash
rm chalo-fe/src/app/api/sse/orders/route.ts
# if the api/sse/ and api/ dirs are now empty, remove them too:
rmdir chalo-fe/src/app/api/sse/orders chalo-fe/src/app/api/sse 2>/dev/null || true
```

- [ ] **Step 3: Build to confirm nothing broke**

Run: `cd chalo-fe && pnpm build` (or the project's build script from package.json)
Expected: build succeeds, no missing-module errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove dead mock SSE route (real SSE is BE /order/events)"
```

---

### Task 2: Verify the whole app still builds and boots

A final integration gate after all feature phases.

- [ ] **Step 1: Backend build + test**

Run: `cd chalo-be && pnpm build && pnpm test`
Expected: build + all tests pass.

- [ ] **Step 2: Frontend build**

Run: `cd chalo-fe && pnpm build`
Expected: build succeeds.

- [ ] **Step 3: Boot via docker-compose and smoke-check**

Run: `docker compose up -d --build`
Then manually verify: customer QR menu loads, staff kanban loads, admin dashboard loads, one order can be created and moved through statuses.
Expected: all core flows work; SEED_ON_STARTUP is NOT set so the DB is not wiped.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore: final integration pass"
```
