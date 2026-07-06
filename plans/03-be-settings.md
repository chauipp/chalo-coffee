# 03 — Backend: Runtime Settings Endpoint (global wait-time toggle)

**Goal:** Replace the hardcoded `ESTIMATED_WAIT_BARISTAS = 3` constant with a runtime-editable, single-row DB settings record. Admin can turn the customer-facing estimated-wait display on/off (`waitTimeEnabled`) and change the parallel-barista divisor (`baristaCount`) without a redeploy. Expose `GET /settings` (public read — the customer app needs `waitTimeEnabled` to decide whether to render the ETA badge) and `PUT /settings` (ADMIN only). Wire the order service's estimated-wait math to read from settings and to short-circuit when the toggle is off.

**Architecture:** New `SettingsModule` (entity + service + controller + DTO) following the exact `CategoryModule` pattern. Single-row table `app_settings` with a CHECK-constrained singleton primary key (`id = 1`), seeded by a migration and self-healing via `SettingsService.get()`. `OrderModule` imports `SettingsModule` and `OrderService` injects `SettingsService`.

**Tech Stack:** NestJS 11, TypeORM 0.3, PostgreSQL, class-validator, Jest (ts-jest).

**Depends on:** none.

---

## Global Constraints

- **Response envelope:** every controller return value is auto-wrapped by `ResponseInterceptor` into `{ code, message: 'success', data }` (`src/common/interceptors/response.interceptor.ts`). Controllers/services return the raw payload only — do NOT wrap manually. All response shapes documented below are the `data` field.
- **Guards are global:** `JwtAuthGuard` + `RolesGuard` are registered as `APP_GUARD` in `app.module.ts`. A route is public only with `@Public()`; `@Roles(UserRole.ADMIN)` restricts writes. `UserRole` has only `ADMIN` and `MODERATOR` (`src/common/enums/user-role.enum.ts`).
- **Migrations:** raw-SQL `up`/`down` implementing `MigrationInterface`, filename `<epoch-ms>-Name.ts` under `src/migrations/` (follow `1736150500000-AddPaidOrderStatus.ts`). Runtime auto-runs migrations only in production (`migrationsRun: isProd`); dev uses `DB_SYNCHRONIZE`. Run manually with `npm run migration:run`.
- **Do NOT delete `ESTIMATED_WAIT_BARISTAS`** from `constants.ts` — keep it as the fallback default value referenced by the seed migration and as a defensive divisor guard. It just stops being read directly by `OrderService`.
- **Tests:** Jest, `rootDir: src`, `testRegex: .*\.spec\.ts$`. Unit tests mock the TypeORM `Repository` — no live DB. Place specs next to source (`*.spec.ts`).
- **TDD:** every task writes the failing test first, then the implementation, then runs the exact command shown.

**Test command (run from `g:\Chalo\chalo-be`):**
```bash
npm test -- settings
```
(Jest filters to spec files whose path matches `settings`.) Full suite: `npm test`.

---

## Task 1 — `AppSettings` entity + DTO

**Files:**
- `chalo-be/src/modules/settings/entities/app-settings.entity.ts` (new)
- `chalo-be/src/modules/settings/dto/update-settings.dto.ts` (new)

**Entity** — copy the column/decorator style from `category.entity.ts`, but use a CHECK-constrained singleton PK so only one row can ever exist:

```ts
// chalo-be/src/modules/settings/entities/app-settings.entity.ts
import { Entity, PrimaryColumn, Column, UpdateDateColumn, Check } from 'typeorm';

/**
 * Single-row runtime settings. id is pinned to 1 (CHECK constraint) so the
 * table can never hold more than one settings record.
 */
@Entity('app_settings')
@Check(`"id" = 1`)
export class AppSettings {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  /** Bật/tắt hiển thị thời gian chờ cho khách */
  @Column({ type: 'boolean', default: true })
  waitTimeEnabled: boolean;

  /** Số barista phục vụ song song (divisor khi ước lượng wait time) */
  @Column({ type: 'int', default: 3 })
  baristaCount: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**DTO** — both fields optional so admin can PATCH-style update either one; validation copied from `update-category.dto.ts` conventions:

```ts
// chalo-be/src/modules/settings/dto/update-settings.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: true, description: 'Bật/tắt hiển thị wait time cho khách' })
  @IsOptional()
  @IsBoolean()
  waitTimeEnabled?: boolean;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 50, description: 'Số barista song song' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  baristaCount?: number;
}
```

No test for this task (declarative only); it is exercised by Task 2.

---

## Task 2 — `SettingsService` (get with self-heal + partial update)

**Files:**
- `chalo-be/src/modules/settings/settings.service.spec.ts` (new — write FIRST)
- `chalo-be/src/modules/settings/settings.service.ts` (new)

**Test first:**

```ts
// chalo-be/src/modules/settings/settings.service.spec.ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { AppSettings } from './entities/app-settings.entity';

describe('SettingsService', () => {
  let service: SettingsService;
  let repo: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  const defaultRow: AppSettings = {
    id: 1,
    waitTimeEnabled: true,
    baristaCount: 3,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    repo = {
      findOneBy: jest.fn(),
      create: jest.fn((v) => v),
      save: jest.fn((v) => Promise.resolve(v)),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getRepositoryToken(AppSettings), useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(SettingsService);
  });

  it('get() returns the existing singleton row', async () => {
    repo.findOneBy.mockResolvedValue(defaultRow);
    await expect(service.get()).resolves.toEqual(defaultRow);
    expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('get() self-heals by creating the default row when missing', async () => {
    repo.findOneBy.mockResolvedValue(null);
    const result = await service.get();
    expect(repo.create).toHaveBeenCalledWith({ id: 1, waitTimeEnabled: true, baristaCount: 3 });
    expect(repo.save).toHaveBeenCalled();
    expect(result).toMatchObject({ id: 1, waitTimeEnabled: true, baristaCount: 3 });
  });

  it('update() applies only provided fields', async () => {
    repo.findOneBy.mockResolvedValue({ ...defaultRow });
    const result = await service.update({ waitTimeEnabled: false });
    expect(result.waitTimeEnabled).toBe(false);
    expect(result.baristaCount).toBe(3); // untouched
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, waitTimeEnabled: false, baristaCount: 3 }),
    );
  });

  it('update() can change baristaCount alone', async () => {
    repo.findOneBy.mockResolvedValue({ ...defaultRow });
    const result = await service.update({ baristaCount: 5 });
    expect(result.baristaCount).toBe(5);
    expect(result.waitTimeEnabled).toBe(true);
  });
});
```

**Implementation:**

```ts
// chalo-be/src/modules/settings/settings.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSettings } from './entities/app-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ESTIMATED_WAIT_BARISTAS } from '../../common/constants';

@Injectable()
export class SettingsService {
  /** Bảng chỉ có đúng 1 dòng, pin cứng id = 1 */
  private static readonly SINGLETON_ID = 1;

  constructor(
    @InjectRepository(AppSettings)
    private readonly settingsRepo: Repository<AppSettings>,
  ) {}

  /**
   * Luôn trả về dòng settings. Nếu chưa có (DB mới / bị TRUNCATE) thì tự tạo
   * dòng mặc định để endpoint không bao giờ 404.
   */
  async get(): Promise<AppSettings> {
    let settings = await this.settingsRepo.findOneBy({ id: SettingsService.SINGLETON_ID });
    if (!settings) {
      settings = this.settingsRepo.create({
        id: SettingsService.SINGLETON_ID,
        waitTimeEnabled: true,
        baristaCount: ESTIMATED_WAIT_BARISTAS,
      });
      settings = await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async update(dto: UpdateSettingsDto): Promise<AppSettings> {
    const settings = await this.get();
    if (dto.waitTimeEnabled !== undefined) settings.waitTimeEnabled = dto.waitTimeEnabled;
    if (dto.baristaCount !== undefined) settings.baristaCount = dto.baristaCount;
    return this.settingsRepo.save(settings);
  }
}
```

**Run:** `npm test -- settings`

---

## Task 3 — `SettingsController` (public GET, ADMIN PUT) + `SettingsModule`

**Files:**
- `chalo-be/src/modules/settings/settings.controller.ts` (new)
- `chalo-be/src/modules/settings/settings.module.ts` (new)
- `chalo-be/src/app.module.ts` (edit — register module)

**Controller** — mirrors `CategoryController` decorator usage (`@Public()`/`@SkipThrottle()` on public read, `@ApiBearerAuth`+`@Roles(UserRole.ADMIN)` on write):

```ts
// chalo-be/src/modules/settings/settings.controller.ts
import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Public()
  @SkipThrottle()
  @ApiOkResponse({
    description: 'Runtime settings (public read)',
    schema: {
      example: {
        code: 200,
        message: 'success',
        data: { id: 1, waitTimeEnabled: true, baristaCount: 3, updatedAt: '2026-01-01T00:00:00.000Z' },
      },
    },
  })
  get() {
    return this.settingsService.get();
  }

  @Put()
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({
    description: 'Update runtime settings (ADMIN only)',
    schema: {
      example: {
        code: 200,
        message: 'success',
        data: { id: 1, waitTimeEnabled: false, baristaCount: 4, updatedAt: '2026-07-05T11:00:00.000Z' },
      },
    },
  })
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
```

**Module** — copy `category.module.ts`, export the service so `OrderModule` can consume it:

```ts
// chalo-be/src/modules/settings/settings.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppSettings } from './entities/app-settings.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AppSettings])],
  providers: [SettingsService],
  controllers: [SettingsController],
  exports: [SettingsService],
})
export class SettingsModule {}
```

**Register in `app.module.ts`** — add the import and list it alongside the other feature modules:

```ts
import { SettingsModule } from './modules/settings/settings.module';
// ...
  imports: [
    // ...existing...
    OrderModule,
    HealthModule,
    SseModule,
    SettingsModule,
  ],
```

**Run:** `npm test -- settings` (still green — no new spec, this task is DI wiring; verified live in Task 6 / `npm run build`).

---

## Task 4 — Migration: create `app_settings` + seed default row

**Files:**
- `chalo-be/src/migrations/1736150700000-AddAppSettings.ts` (new)

Follow `1736150500000-AddPaidOrderStatus.ts`: raw SQL, idempotent guards. The `ON CONFLICT DO NOTHING` keeps re-runs safe; the CHECK matches the entity `@Check`.

```ts
// chalo-be/src/migrations/1736150700000-AddAppSettings.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppSettings1736150700000 implements MigrationInterface {
  name = 'AddAppSettings1736150700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "app_settings" (
        "id" integer NOT NULL DEFAULT 1,
        "waitTimeEnabled" boolean NOT NULL DEFAULT true,
        "baristaCount" integer NOT NULL DEFAULT 3,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_app_settings" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_app_settings_singleton" CHECK ("id" = 1)
      )
    `);
    await queryRunner.query(`
      INSERT INTO "app_settings" ("id", "waitTimeEnabled", "baristaCount")
      VALUES (1, true, 3)
      ON CONFLICT ("id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "app_settings"`);
  }
}
```

**Note on seed reset:** `SeedService.resetAllData()` (`src/seed/seed.service.ts:141`) `TRUNCATE`s a fixed table list that does NOT include `app_settings`, so the settings row survives a re-seed. Even if it were dropped, `SettingsService.get()` self-heals. No seed change required.

**Run (against a dev DB):** `npm run migration:run` — expect `AddAppSettings1736150700000` applied; a follow-up run is a no-op.

---

## Task 5 — Wire estimated-wait math to settings

**Files:**
- `chalo-be/src/modules/order/order.module.ts` (edit — import `SettingsModule`)
- `chalo-be/src/modules/order/order.service.ts` (edit)
- `chalo-be/src/modules/order/order.service.estimated-wait.spec.ts` (new — write FIRST)

### 5a. Module wiring

```ts
// order.module.ts — add import
import { SettingsModule } from '../settings/settings.module';
// ...
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, CheckoutSession, Table, Product]),
    SseModule,
    SettingsModule,
  ],
```

### 5b. Test first

`OrderService` has many repo deps; the spec supplies mocks for all of them plus a stubbed `SettingsService`, then drives the query-builder chain used by `computeEstimatedWait`.

```ts
// chalo-be/src/modules/order/order.service.estimated-wait.spec.ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Table } from '../table/entities/table.entity';
import { Product } from '../product/entities/product.entity';
import { SseService } from '../sse/sse.service';
import { SettingsService } from '../settings/settings.service';

describe('OrderService estimated-wait wiring', () => {
  let service: OrderService;
  let settings: { get: jest.Mock };
  let orderItemQb: any;

  beforeEach(async () => {
    // Query-builder stub for orderItemRepo.createQueryBuilder(...) in computeEstimatedWait
    orderItemQb = {
      select: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ totalMinutes: '30' }), // 30 prep-minutes queued
    };

    settings = { get: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: {} },
        { provide: getRepositoryToken(OrderItem), useValue: { createQueryBuilder: () => orderItemQb } },
        { provide: getRepositoryToken(Table), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: SseService, useValue: { emit: jest.fn() } },
        { provide: SettingsService, useValue: settings },
      ],
    }).compile();

    service = moduleRef.get(OrderService);
  });

  it('divides queued minutes by settings.baristaCount (not the constant)', async () => {
    settings.get.mockResolvedValue({ waitTimeEnabled: true, baristaCount: 5 });
    // 30 / 5 = 6
    await expect(service.computeEstimatedWait()).resolves.toBe(6);
  });

  it('returns null when waitTimeEnabled is false and skips the query', async () => {
    settings.get.mockResolvedValue({ waitTimeEnabled: false, baristaCount: 3 });
    await expect(service.computeEstimatedWait()).resolves.toBeNull();
    expect(orderItemQb.getRawOne).not.toHaveBeenCalled();
  });

  it('estimatedWait() system mode reports enabled:false when toggled off', async () => {
    settings.get.mockResolvedValue({ waitTimeEnabled: false, baristaCount: 3 });
    await expect(service.estimatedWait()).resolves.toEqual({
      mode: 'system',
      enabled: false,
      estimatedMinutes: null,
    });
  });

  it('estimatedWait() system mode reports enabled:true with minutes', async () => {
    settings.get.mockResolvedValue({ waitTimeEnabled: true, baristaCount: 3 });
    // 30 / 3 = 10
    await expect(service.estimatedWait()).resolves.toEqual({
      mode: 'system',
      enabled: true,
      estimatedMinutes: 10,
    });
  });
});
```

### 5c. Implementation — before/after of the REAL code

**Constructor** — inject `SettingsService` (add import + param). Current constructor ends at `private readonly sseService: SseService,`:

```ts
import { SettingsService } from '../settings/settings.service';
// ...
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Table) private readonly tableRepo: Repository<Table>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
    private readonly sseService: SseService,
    private readonly settingsService: SettingsService, // NEW
  ) {}
```

**`computeEstimatedWait()`** — currently (`order.service.ts:187-202`):

```ts
// BEFORE
async computeEstimatedWait(): Promise<number> {
  const result = await this.orderItemRepo
    .createQueryBuilder('oi')
    .select('SUM(oi.quantity * p.prepTime)', 'totalMinutes')
    .innerJoin('oi.order', 'o')
    .innerJoin('oi.product', 'p')
    .where('o.status IN (:...statuses)', {
      statuses: [OrderStatus.CONFIRMED, OrderStatus.PREPARING],
    })
    .getRawOne<{ totalMinutes: string }>();

  const totalMinutes = parseFloat(result?.totalMinutes ?? '0');
  if (!totalMinutes) return 0;
  return Math.ceil(totalMinutes / ESTIMATED_WAIT_BARISTAS);
}
```

```ts
// AFTER
async computeEstimatedWait(): Promise<number | null> {
  const settings = await this.settingsService.get();
  // Toggle off -> không tính, không hiển thị.
  if (!settings.waitTimeEnabled) return null;
  const baristas = settings.baristaCount || ESTIMATED_WAIT_BARISTAS; // guard chia cho 0

  const result = await this.orderItemRepo
    .createQueryBuilder('oi')
    .select('SUM(oi.quantity * p.prepTime)', 'totalMinutes')
    .innerJoin('oi.order', 'o')
    .innerJoin('oi.product', 'p')
    .where('o.status IN (:...statuses)', {
      statuses: [OrderStatus.CONFIRMED, OrderStatus.PREPARING],
    })
    .getRawOne<{ totalMinutes: string }>();

  const totalMinutes = parseFloat(result?.totalMinutes ?? '0');
  if (!totalMinutes) return 0;
  return Math.ceil(totalMinutes / baristas);
}
```

**`computeEstimatedWaitForOrder(orderId)`** — currently reads `ESTIMATED_WAIT_BARISTAS` twice (`order.service.ts:269` and `:273-275`). Change its signature to accept the divisor from the caller and replace the constant:

```ts
// BEFORE
private async computeEstimatedWaitForOrder(orderId: string) {
  // ...
    estimatedMinutes: Math.ceil(queueBeforeMinutes / ESTIMATED_WAIT_BARISTAS),
    orderPrepMinutes: Math.ceil(ownPrepMinutes),
    estimatedCompletionMinutes: Math.ceil(
      (queueBeforeMinutes + ownPrepMinutes) / ESTIMATED_WAIT_BARISTAS,
    ),
  // ...
}
```

```ts
// AFTER
private async computeEstimatedWaitForOrder(orderId: string, baristaCount: number) {
  const baristas = baristaCount || ESTIMATED_WAIT_BARISTAS;
  // ... (unchanged query + early-return branches unchanged) ...
    estimatedMinutes: Math.ceil(queueBeforeMinutes / baristas),
    orderPrepMinutes: Math.ceil(ownPrepMinutes),
    estimatedCompletionMinutes: Math.ceil(
      (queueBeforeMinutes + ownPrepMinutes) / baristas,
    ),
  // ...
}
```

**`estimatedWait(orderId?)`** — currently (`order.service.ts:423-428`):

```ts
// BEFORE
async estimatedWait(orderId?: string) {
  if (orderId) {
    return this.computeEstimatedWaitForOrder(orderId);
  }
  return { mode: 'system', estimatedMinutes: await this.computeEstimatedWait() };
}
```

```ts
// AFTER
async estimatedWait(orderId?: string) {
  const settings = await this.settingsService.get();
  if (!settings.waitTimeEnabled) {
    // Toggle off -> FE ẩn badge dựa vào enabled:false
    return { mode: orderId ? 'order' : 'system', enabled: false, estimatedMinutes: null };
  }
  if (orderId) {
    return this.computeEstimatedWaitForOrder(orderId, settings.baristaCount);
  }
  return {
    mode: 'system',
    enabled: true,
    estimatedMinutes: await this.computeEstimatedWait(),
  };
}
```

**`create()`** — no code change needed. It already does `const estimatedWaitMinutes = await this.computeEstimatedWait();` (`order.service.ts:316`) and stores it on the order. When the toggle is off, `computeEstimatedWait()` now returns `null`, and `Order.estimatedWaitMinutes` is already typed `number | null` (`order.entity.ts:43`), so the persisted value is `null` and `buildDto` surfaces `estimateWaitMinutes: null`. Confirm this is acceptable (badge simply hidden).

**Run:** `npm test -- "order.service.estimated-wait"` then full `npm test`.

---

## Task 6 — Build + smoke verification

**Files:** none (verification only).

- `npm run build` — confirms DI graph resolves (`SettingsModule` exported, imported by `OrderModule`) and no TS errors.
- Manual smoke (dev server, after `npm run migration:run`):
  - `GET /settings` unauthenticated → `200 { data: { id:1, waitTimeEnabled:true, baristaCount:3, updatedAt } }`.
  - `PUT /settings` without token → `403` (RolesGuard).
  - `PUT /settings` as ADMIN with `{ "waitTimeEnabled": false }` → `200`, `data.waitTimeEnabled=false`.
  - `GET /order/estimated-wait` → `{ mode:'system', enabled:false, estimatedMinutes:null }`.
  - `PUT /settings` as ADMIN `{ "waitTimeEnabled": true, "baristaCount": 6 }` → `GET /order/estimated-wait` now divides by 6.

---

## Interfaces > Produces

Consumed by the FE settings plan. All shapes below are the `data` field of the standard `{ code, message, data }` envelope.

### `GET /settings` — public, no auth
**Request:** none.
**Response `data`:**
```jsonc
{
  "id": 1,
  "waitTimeEnabled": true,
  "baristaCount": 3,
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```
Never 404s (self-healing default row). FE customer app reads `waitTimeEnabled` to decide whether to render the ETA badge.

### `PUT /settings` — ADMIN only (`Authorization: Bearer <JWT>`)
**Request body** (both fields optional; send only what changes):
```jsonc
{
  "waitTimeEnabled": false,   // optional, boolean
  "baristaCount": 4           // optional, int, 1..50
}
```
**Response `data`:** the full updated settings object (same shape as GET), e.g.:
```jsonc
{
  "id": 1,
  "waitTimeEnabled": false,
  "baristaCount": 4,
  "updatedAt": "2026-07-05T11:00:00.000Z"
}
```
**Errors:** `400` invalid body (e.g. `baristaCount < 1` or non-boolean `waitTimeEnabled`); `401/403` missing/non-ADMIN token.

### Side effect on `GET /order/estimated-wait` (public)
Shape now includes an `enabled` flag:
```jsonc
// waitTimeEnabled = true
{ "mode": "system", "enabled": true, "estimatedMinutes": 10 }
// waitTimeEnabled = false
{ "mode": "system", "enabled": false, "estimatedMinutes": null }
// per-order (?orderId=...) while enabled — unchanged fields + enabled implied by presence
{ "mode": "order", "orderId": "uuid", "status": "CONFIRMED",
  "estimatedMinutes": 6, "orderPrepMinutes": 4, "estimatedCompletionMinutes": 10 }
```
Newly created orders carry `estimateWaitMinutes: null` in their DTO while the toggle is off.
