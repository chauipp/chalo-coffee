# Phase 1 — Critical Infra Fixes — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or executing-plans. Steps use `- [ ]` checkboxes.

**Goal:** Guarantee the DB is never destructively truncated/reseeded on boot unless a developer explicitly opts in, and make every env var the code actually reads discoverable via validated schema + accurate `.env.example` docs.
**Architecture:** The NestJS backend wires config through a global `ConfigModule.forRoot` (Joi `envValidationSchema`) in `app.module.ts`; `SeedService.onModuleInit` runs at boot and is the only destructive path. Task work adds the `SEED_ON_STARTUP` flag to the Joi schema, locks the gate with a Jest regression spec, and reconciles both `.env.example` files against the real `process.env` / `ConfigService.get` call sites. The Next.js frontend has no test runner, so its `.env.example` is verified by grep against actual usage.
**Tech Stack:** NestJS, TypeORM, Docker
**Depends on:** none (do this FIRST — protects production data)

## Global Constraints
- Never break existing seed behaviour for local dev: default must be safe (no destructive seed) but developers can opt in with `SEED_ON_STARTUP=true`.
- Use the project's existing ConfigModule/ConfigService pattern (`ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema, validationOptions: { abortEarly: true, allowUnknown: true } })` in `chalo-be/src/app.module.ts`, backed by `chalo-be/src/config/env.validation.ts`).

---

## CURRENT STATE (verified against the real code — read before starting)

Two of the three sub-fixes are **already present in the repo**. This plan hardens and completes them; it is not a greenfield build.

1. **Seed gate — ALREADY IMPLEMENTED.** `chalo-be/src/seed/seed.service.ts` lines 125–138 already early-return unless `process.env.SEED_ON_STARTUP === 'true'`:
   ```ts
   async onModuleInit() {
     if (process.env.SEED_ON_STARTUP !== 'true') {
       this.logger.log('Skipping database seed: SEED_ON_STARTUP is not true');
       return;
     }

     await this.resetAllData();          // TRUNCATE ... RESTART IDENTITY CASCADE
     await this.seedUsers();
     const categories = await this.seedCategoriesFromMenu();
     const products = await this.seedProductsFromMenu(categories);
     const tables = await this.seedTables(25);
     await this.seedOrders(products, tables, 250);
     await this.syncTableCurrentOrders();
   }
   ```
   `SeedService` is provided via `chalo-be/src/modules/user/user.module.ts` (not a dedicated `SeedModule`). **Gap:** there is no test locking this behaviour, and `SEED_ON_STARTUP` is NOT declared in the Joi schema (it only passes today because `allowUnknown: true`).

2. **`chalo-be/.env.example` — ALREADY EXISTS** and documents NODE_ENV, PORT, APP_URL, CORS_ORIGIN, APP_FRONTEND_URL, DB_*, DB_SYNCHRONIZE, JWT_*, SEED_ON_STARTUP, SEED_ADMIN_PASSWORD, SEED_STAFF_PASSWORD. **Gaps:** `APP_FRONTEND_URL`, `SEED_ADMIN_PASSWORD`, `SEED_STAFF_PASSWORD` are declared but **never read anywhere in `src/`** (seed hardcodes passwords `'admin'`/`'staff'`); their comments overstate their effect.

3. **`chalo-fe/.env.example` — ALREADY EXISTS** and documents NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_ENABLE_MSW, INTERNAL_API_BASE_URL, NODE_ENV — which exactly matches the FE code usage. **Gap:** `docker-compose.yml` injects `NEXT_PUBLIC_API_URL` and `BACKEND_URL` into the frontend container, but the code reads `NEXT_PUBLIC_API_BASE_URL` and `INTERNAL_API_BASE_URL` — a silent name mismatch worth flagging.

### Env vars ACTUALLY READ IN CODE (authoritative enumeration)

**Backend — read via `ConfigService.get` or `process.env`:**
| Var | Read at | Notes |
|-----|---------|-------|
| `NODE_ENV` | main.ts:73, typeorm.config.ts:7-8 | dev/production/test |
| `PORT` | main.ts:89 | default 8080 |
| `APP_URL` | main.ts:91, upload/upload.service.ts:9 | default http://localhost:8080 |
| `CORS_ORIGIN` | main.ts:35 | comma-separated |
| `DB_HOST` | typeorm.config.ts:16, data-source.ts:18 | |
| `DB_PORT` | typeorm.config.ts:17, data-source.ts:19 | |
| `DB_USERNAME` | typeorm.config.ts:18, data-source.ts:20 | |
| `DB_PASSWORD` | typeorm.config.ts:19, data-source.ts:21 | allow empty |
| `DB_DATABASE` | typeorm.config.ts:20, data-source.ts:22 | |
| `DB_SYNCHRONIZE` | typeorm.config.ts:11 | 'true'/'false', dev only |
| `JWT_SECRET` | auth.module.ts:19, auth.service.ts:26, jwt.strategy.ts:18 | |
| `JWT_REFRESH_SECRET` | auth.service.ts:30,67 | must differ from JWT_SECRET |
| `JWT_ACCESS_EXPIRES` | auth.module.ts:21, auth.service.ts:27 | default 15m |
| `JWT_REFRESH_EXPIRES` | auth.service.ts:31 | default 7d |
| `SEED_ON_STARTUP` | seed/seed.service.ts:126 | destructive when 'true' |

**Backend — declared in Joi schema but NOT read by any `src/` code:** `APP_FRONTEND_URL`, `SEED_ADMIN_PASSWORD`, `SEED_STAFF_PASSWORD`.

**Frontend — read in code:**
| Var | Read at | Notes |
|-----|---------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | lib/api-client.ts:25, app/(staff)/staff/orders/page.tsx:69 | browser API base |
| `INTERNAL_API_BASE_URL` | constants/server.ts:4, services/lookup/lookup.server.ts:8,23 | server-side API base |
| `NEXT_PUBLIC_ENABLE_MSW` | mocks/MSWProvider.tsx:11 | 'true' enables MSW |
| `NODE_ENV` | mocks/MSWProvider.tsx:10 | set by Next |

Backend test command (from `chalo-be/package.json`): `pnpm test` → `jest`, `rootDir: src`, `testRegex: .*\.spec\.ts$`. Frontend has **no** test runner.

---

## Task 1 — Declare `SEED_ON_STARTUP` in the Joi validation schema

Right now the flag only survives boot because `allowUnknown: true`. Declaring it makes it validated, self-documenting, and impossible to typo silently into an "on" state (only `'true'`/`'false'` accepted; defaults to `'false'`).

**Files:**
- Modify: `chalo-be/src/config/env.validation.ts` (add one line inside the `Joi.object({...})` block, near lines 25–26)
- Create: `chalo-be/src/config/env.validation.spec.ts`

**Steps:**

- [x] 1. Write the failing test. Create `chalo-be/src/config/env.validation.spec.ts`:
  ```ts
  import { envValidationSchema } from './env.validation';

  const baseEnv = {
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_USERNAME: 'chalo_user',
    DB_PASSWORD: 'pw',
    DB_DATABASE: 'chalo_coffee',
    JWT_SECRET: 'a-very-long-access-secret',
    JWT_REFRESH_SECRET: 'a-very-long-refresh-secret',
  };

  describe('envValidationSchema — SEED_ON_STARTUP', () => {
    it('defaults SEED_ON_STARTUP to "false" when unset', () => {
      const { error, value } = envValidationSchema.validate(baseEnv);
      expect(error).toBeUndefined();
      expect(value.SEED_ON_STARTUP).toBe('false');
    });

    it('accepts "true"', () => {
      const { error, value } = envValidationSchema.validate({
        ...baseEnv,
        SEED_ON_STARTUP: 'true',
      });
      expect(error).toBeUndefined();
      expect(value.SEED_ON_STARTUP).toBe('true');
    });

    it('rejects a non-boolean string', () => {
      const { error } = envValidationSchema.validate({
        ...baseEnv,
        SEED_ON_STARTUP: 'yes',
      });
      expect(error).toBeDefined();
    });
  });
  ```
- [x] 2. Run it — expect RED. `cd chalo-be && pnpm test env.validation`
  Expected: the default test fails (`value.SEED_ON_STARTUP` is `undefined`) and the reject test fails (`'yes'` is allowed through by `allowUnknown`-style pass). Output shows `● envValidationSchema — SEED_ON_STARTUP › defaults ...` failing.
- [x] 3. Implement. In `chalo-be/src/config/env.validation.ts`, add the line right after `SEED_STAFF_PASSWORD: Joi.string().optional(),` (currently line 26), still inside the `Joi.object({...})`:
  ```ts
    SEED_ON_STARTUP: Joi.string().valid('true', 'false').default('false'),
  ```
- [x] 4. Run it — expect GREEN. `cd chalo-be && pnpm test env.validation`
  Expected: `Tests: 3 passed, 3 total`.
- [x] 5. Commit. `cd chalo-be && rtk git add src/config/env.validation.ts src/config/env.validation.spec.ts && rtk git commit -m "feat(config): validate SEED_ON_STARTUP in env schema"`
  Expected: one commit with 2 files changed.

---

## Task 2 — Lock the seed gate with a regression spec

The gate already works; this test prevents a future edit from re-enabling boot-time truncation. It instantiates `SeedService` directly with mocked repos and a spied `resetAllData` so the destructive query is never actually issued.

**Files:**
- Create: `chalo-be/src/seed/seed.service.spec.ts`

**Steps:**

- [x] 1. Write the failing test. Create `chalo-be/src/seed/seed.service.spec.ts`:
  ```ts
  import { DataSource, Repository } from 'typeorm';
  import { SeedService } from './seed.service';

  function makeService() {
    const repo = () => ({}) as unknown as Repository<any>;
    const dataSource = { query: jest.fn() } as unknown as DataSource;
    const service = new SeedService(
      repo(), repo(), repo(), repo(), repo(), repo(),
      dataSource,
    );
    // Stub every private step so a "true" run performs no real DB work.
    const reset = jest
      .spyOn(service as any, 'resetAllData')
      .mockResolvedValue(undefined);
    jest.spyOn(service as any, 'seedUsers').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'seedCategoriesFromMenu').mockResolvedValue([]);
    jest.spyOn(service as any, 'seedProductsFromMenu').mockResolvedValue([]);
    jest.spyOn(service as any, 'seedTables').mockResolvedValue([]);
    jest.spyOn(service as any, 'seedOrders').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'syncTableCurrentOrders').mockResolvedValue(undefined);
    return { service, reset };
  }

  describe('SeedService.onModuleInit — destructive-seed gate', () => {
    const original = process.env.SEED_ON_STARTUP;
    afterEach(() => {
      process.env.SEED_ON_STARTUP = original;
      jest.restoreAllMocks();
    });

    it('does NOT reset data when SEED_ON_STARTUP is unset', async () => {
      delete process.env.SEED_ON_STARTUP;
      const { service, reset } = makeService();
      await service.onModuleInit();
      expect(reset).not.toHaveBeenCalled();
    });

    it('does NOT reset data when SEED_ON_STARTUP is "false"', async () => {
      process.env.SEED_ON_STARTUP = 'false';
      const { service, reset } = makeService();
      await service.onModuleInit();
      expect(reset).not.toHaveBeenCalled();
    });

    it('resets data only when SEED_ON_STARTUP is exactly "true"', async () => {
      process.env.SEED_ON_STARTUP = 'true';
      const { service, reset } = makeService();
      await service.onModuleInit();
      expect(reset).toHaveBeenCalledTimes(1);
    });
  });
  ```
- [x] 2. Run it. `cd chalo-be && pnpm test seed.service`
  Expected: GREEN immediately (`Tests: 3 passed, 3 total`) because the gate already exists. This is the regression lock; if any of these three fail, the gate has regressed. (Optional sanity check: temporarily change the guard to `=== 'false'`, re-run, confirm tests go RED, then revert — do NOT commit that change.)
- [x] 3. Commit. `cd chalo-be && rtk git add src/seed/seed.service.spec.ts && rtk git commit -m "test(seed): lock destructive-seed gate to SEED_ON_STARTUP=true"`
  Expected: one commit, 1 file changed.

---

## Task 3 — Reconcile `chalo-be/.env.example` with real code usage

The file exists and covers every code-read var. Fix only the three misleading entries for vars the code never reads, so nobody sets `SEED_ADMIN_PASSWORD` expecting it to change the seeded password.

**Files:**
- Modify: `chalo-be/.env.example` (lines 17–19 for `APP_FRONTEND_URL`; lines 65–71 for the two `SEED_*_PASSWORD` vars)

**Steps:**

- [x] 1. Update the `APP_FRONTEND_URL` comment (currently lines 17–19). Replace:
  ```
  # Public frontend URL used to generate table QR/menu links.
  # Example: http://localhost:3000
  APP_FRONTEND_URL=http://localhost:3000
  ```
  with:
  ```
  # Reserved: public frontend URL. Declared/validated in env schema but not yet read by any backend code.
  # Example: http://localhost:3000
  APP_FRONTEND_URL=http://localhost:3000
  ```
- [x] 2. Update the two seed-password comments (currently lines 65–71). Replace:
  ```
  # Optional password for the seeded admin account when startup seeding is enabled.
  # Example: your-seed-admin-password-here
  SEED_ADMIN_PASSWORD=your-seed-admin-password-here

  # Optional password for the seeded staff account when startup seeding is enabled.
  # Example: your-seed-staff-password-here
  SEED_STAFF_PASSWORD=your-seed-staff-password-here
  ```
  with:
  ```
  # Reserved: intended seed admin password. NOT yet honored — seed.service.ts currently hardcodes "admin".
  # Example: your-seed-admin-password-here
  SEED_ADMIN_PASSWORD=your-seed-admin-password-here

  # Reserved: intended seed staff password. NOT yet honored — seed.service.ts currently hardcodes "staff".
  # Example: your-seed-staff-password-here
  SEED_STAFF_PASSWORD=your-seed-staff-password-here
  ```
- [x] 3. Verify no code-read backend var is missing from the file. `cd chalo-be && rtk grep -oE "(get<[^>]*>\(|process\.env\.)['\"]?[A-Z_]+" src | sort -u`
  Expected: every uppercase name printed appears as a key in `.env.example` (NODE_ENV, PORT, APP_URL, CORS_ORIGIN, DB_*, DB_SYNCHRONIZE, JWT_*, SEED_ON_STARTUP). Confirm visually.
- [x] 4. Commit. `cd chalo-be && rtk git add .env.example && rtk git commit -m "docs(env): mark unused reserved vars in backend .env.example"`
  Expected: one commit, 1 file changed.

---

## Task 4 — Verify `chalo-fe/.env.example` and flag the docker-compose name mismatch

The FE file already matches code usage exactly. The only real gap is that `docker-compose.yml` feeds the frontend container the wrong var names, so the containerized FE silently falls back to `http://localhost:8080/api` defaults. Fix the compose file to match the code.

**Files:**
- Modify: `docker-compose.yml` (frontend `environment:` block, lines 75–78)

**Steps:**

- [x] 1. Confirm the FE example is complete (no code change needed). `cd chalo-fe && rtk grep -oE "(NEXT_PUBLIC_[A-Z_]+|INTERNAL_API_BASE_URL|NODE_ENV)" src | sort -u`
  Expected exactly: `INTERNAL_API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_ENABLE_MSW`, `NODE_ENV` — all four already present in `chalo-fe/.env.example`. No edit to the FE example required.
- [x] 2. Fix the compose var names. In `docker-compose.yml`, in the `frontend` service `environment:` block (lines 76–78), replace:
  ```yaml
      NODE_ENV: development
      NEXT_PUBLIC_API_URL: http://localhost:3001
      BACKEND_URL: http://backend:3001
  ```
  with (names the FE code actually reads; backend listens on 8080 per `PORT` default and `/api` global prefix):
  ```yaml
      NODE_ENV: development
      NEXT_PUBLIC_API_BASE_URL: http://localhost:8080/api
      INTERNAL_API_BASE_URL: http://backend:8080/api
  ```
- [x] 3. Validate compose syntax. `cd /g/Chalo && rtk docker compose config -q`
  Expected: no output (exit 0) — file parses cleanly.
- [x] 4. Commit. `cd /g/Chalo && rtk git add docker-compose.yml && rtk git commit -m "fix(compose): pass FE the env var names the code reads"`
  Expected: one commit, 1 file changed.

---

## Done criteria
- `pnpm test` in `chalo-be` passes, including the two new specs (6 new assertions).
- `SEED_ON_STARTUP` is in the Joi schema, defaulting to `'false'`; a boot with it unset logs `Skipping database seed: SEED_ON_STARTUP is not true` and issues no TRUNCATE.
- `chalo-be/.env.example` no longer overstates the effect of unused reserved vars.
- The dockerized frontend receives `NEXT_PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` matching the code.
