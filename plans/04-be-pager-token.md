# 04 — Backend: Pager Token (Thẻ bàn) entity + API

**Goal:** For counter / takeaway orders, staff types a printed pager number (e.g. `#12`) onto an order and hands the physical pager to the customer. The backend must track every pager as `WAITING | ASSIGNED | COMPLETED`, guarantee a number is only in use by one active order at a time, expose list/assign/call/release endpoints for the staff app, and let a pager be attached at POS order-creation time.

**Architecture:**
- New self-contained **`PagerModule`** (`src/modules/pager/`) mirroring the shape of `TableModule` (entity + dto + service + controller + module). It is registered in `AppModule`.
- **Why a new module, not an extension of `TableController`:** `Table` models a *physical seat with a QR token* and its controller/service (`table.service.ts` is ~215 lines, already juggling active-order aggregation + QR regeneration). A `PagerToken` is a distinct short-lived aggregate with its own status lifecycle and its own DB table. Bolting it onto `TableController` would blur two unrelated aggregates. It follows the exact same conventions as the table module, so there is no new pattern to learn.
- `PagerToken` links to `Order` via a nullable `orderId` FK. `Order` gets a reciprocal nullable `pagerId` FK + relation so a pager can be shown inside the order DTO and attached during `OrderService.create`.
- Lifecycle: `assign` → **ASSIGNED** (customer holds pager, drink being made) → `call` → **WAITING** (drink ready, pager buzzing, waiting for pickup) → `release` → **COMPLETED** (pager reclaimed / free). A number is unique only among non-`COMPLETED` rows (Postgres partial unique index), so a physical pager can be reused across many orders over time.

**Tech Stack:** NestJS 11, TypeORM 11, PostgreSQL.

**Depends on:** none.

---

## Global Constraints

- **Response envelope:** every controller returns the *raw* payload; `ResponseInterceptor` (global) wraps it as `{ code, message: 'success', data }`. Do **not** hand-wrap. POST handlers that must return HTTP 200 (not the Nest default 201) use `@HttpCode(200)` — follow `OrderController`.
- **Auth:** global guards are `JwtAuthGuard` + `RolesGuard` (registered in `AppModule`). A route is protected by default; add `@Public()` to open it, `@Roles(UserRole.ADMIN, UserRole.MODERATOR)` to scope it. All pager endpoints are **staff-only** → `@Roles(UserRole.ADMIN, UserRole.MODERATOR)` + `@ApiBearerAuth('JWT-auth')`. `UserRole` has only `ADMIN` and `MODERATOR` (no `STAFF`).
- **Enums** live in `src/common/enums/*.enum.ts` (one enum per file, string values equal to the key) — follow `table-status.enum.ts`.
- **Entities:** `@PrimaryGeneratedColumn('uuid')`, enum columns via `{ type: 'enum', enum: X, default: … }`, `@CreateDateColumn()` + `@UpdateDateColumn()`, `@Index()` on FK/filter columns — follow `checkout-session.entity.ts` and `order.entity.ts`.
- **Migrations** are hand-written raw SQL, class name `Name<epochMillis>`, filename `<epochMillis>-Name.ts`. Existing max timestamp is `1736150600000`; this plan uses **`1736150700000`**. `synchronize` is off in prod; migrations run via `npm run migration:run`. Register nothing extra — `data-source.ts` globs `**/*.entity` and `migrations/*`.
- **Validation** via `class-validator` DTOs (global `ValidationPipe` is assumed as in the rest of the app). Error messages are Vietnamese, thrown as `NotFoundException` / `BadRequestException` — follow `order.service.ts`.
- **Concurrency:** state transitions that touch both `pager_tokens` and `orders` run inside `this.dataSource.transaction(...)` with `pessimistic_write` locks, exactly like `OrderService.updateStatus` / `paySingleOrder`.
- **Test command (run from `g:/Chalo/chalo-be`):**
  ```bash
  npm test -- pager
  ```
  (Jest `rootDir` is `src`, `testRegex` `.*\.spec\.ts$`; the positional arg is a path filter matching `src/modules/pager/pager.service.spec.ts`.)

---

## Task 1 — `PagerStatus` enum

**Files:**
- create `src/common/enums/pager-status.enum.ts`

```ts
export enum PagerStatus {
  WAITING = 'WAITING',
  ASSIGNED = 'ASSIGNED',
  COMPLETED = 'COMPLETED',
}
```

No test (trivial constant; exercised via the service spec in Task 6).

---

## Task 2 — `PagerToken` entity

**Files:**
- create `src/modules/pager/entities/pager-token.entity.ts`

```ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PagerStatus } from '../../../common/enums/pager-status.enum';
import { Order } from '../../order/entities/order.entity';

@Entity('pager_tokens')
export class PagerToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Số in trên thẻ bàn (vd 12). Unique giữa các thẻ chưa COMPLETED
  // — ràng buộc bằng partial unique index trong migration.
  @Index()
  @Column({ type: 'int' })
  number: number;

  @Column({
    type: 'enum',
    enum: PagerStatus,
    default: PagerStatus.ASSIGNED,
  })
  status: PagerStatus;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @ManyToOne(() => Order, { eager: false, nullable: true })
  @JoinColumn({ name: 'orderId' })
  order: Order | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## Task 3 — Order entity: reciprocal `pagerId` relation

**Files:**
- edit `src/modules/order/entities/order.entity.ts`

Add the import and the two members (place after the `paymentRequested` column, before `@CreateDateColumn`):

```ts
// at top, alongside the other entity imports
import { PagerToken } from '../../pager/entities/pager-token.entity';
```

```ts
  @Index()
  @Column({ type: 'uuid', nullable: true })
  pagerId: string | null;

  @ManyToOne(() => PagerToken, { eager: false, nullable: true })
  @JoinColumn({ name: 'pagerId' })
  pager: PagerToken | null;
```

> Two independent nullable FKs (`pager_tokens.orderId` and `orders.pagerId`) is intentional and mirrors the existing independent `Order`↔`Table` wiring; TypeORM resolves the circular `() => PagerToken` lazily.

---

## Task 4 — Migration: `pager_tokens` table + `orders.pagerId`

**Files:**
- create `src/migrations/1736150700000-AddPagerTokens.ts`

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPagerTokens1736150700000 implements MigrationInterface {
  name = 'AddPagerTokens1736150700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."pager_tokens_status_enum" AS ENUM('WAITING', 'ASSIGNED', 'COMPLETED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "pager_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "number" integer NOT NULL,
        "status" "public"."pager_tokens_status_enum" NOT NULL DEFAULT 'ASSIGNED',
        "orderId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pager_tokens" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pager_tokens_number" ON "pager_tokens" ("number")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pager_tokens_status" ON "pager_tokens" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pager_tokens_order_id" ON "pager_tokens" ("orderId")`,
    );
    // Một số thẻ chỉ được dùng bởi 1 thẻ đang hoạt động (chưa COMPLETED).
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_pager_tokens_active_number" ON "pager_tokens" ("number") WHERE "status" <> 'COMPLETED'`,
    );
    await queryRunner.query(
      `ALTER TABLE "pager_tokens" ADD CONSTRAINT "FK_pager_tokens_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Liên kết ngược order → pager
    await queryRunner.query(`ALTER TABLE "orders" ADD "pagerId" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_pager_id" ON "orders" ("pagerId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_pager" FOREIGN KEY ("pagerId") REFERENCES "pager_tokens"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_pager"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_pager_id"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "pagerId"`);
    await queryRunner.query(`ALTER TABLE "pager_tokens" DROP CONSTRAINT "FK_pager_tokens_order"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_pager_tokens_active_number"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_pager_tokens_order_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_pager_tokens_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_pager_tokens_number"`);
    await queryRunner.query(`DROP TABLE "pager_tokens"`);
    await queryRunner.query(`DROP TYPE "public"."pager_tokens_status_enum"`);
  }
}
```

Apply with `npm run migration:run` after Task 8 compiles.

---

## Task 5 — Pager DTOs

**Files:**
- create `src/modules/pager/dto/assign-pager.dto.ts`
- create `src/modules/pager/dto/pager-id.dto.ts`

`assign-pager.dto.ts`:
```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsUUID } from 'class-validator';

export class AssignPagerDto {
  @ApiProperty({ example: 12, description: 'Số in trên thẻ bàn' })
  @IsInt()
  @Min(1)
  number: number;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  orderId: string;
}
```

`pager-id.dto.ts` (shared by `call` and `release`):
```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class PagerIdDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  id: string;
}
```

---

## Task 6 — `PagerService` (TDD)

**Files:**
- create `src/modules/pager/pager.service.spec.ts` (write first — red)
- create `src/modules/pager/pager.service.ts` (make it green)

### 6a. Spec (write first)

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PagerService } from './pager.service';
import { PagerToken } from './entities/pager-token.entity';
import { Order } from '../order/entities/order.entity';
import { PagerStatus } from '../../common/enums/pager-status.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';

describe('PagerService', () => {
  let service: PagerService;
  let pagerRepo: any;
  let managerQb: any;
  let manager: any;
  let dataSource: any;

  beforeEach(async () => {
    managerQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    manager = {
      findOne: jest.fn(),
      create: jest.fn((_e, v) => v),
      save: jest.fn((_e, v) => Promise.resolve({ id: 'pager-uuid', ...v })),
      getRepository: jest.fn(() => ({ createQueryBuilder: () => managerQb })),
    };
    dataSource = { transaction: jest.fn((cb: any) => cb(manager)) };

    const listQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    pagerRepo = {
      createQueryBuilder: jest.fn(() => listQb),
      findOneBy: jest.fn(),
      save: jest.fn((v) => Promise.resolve(v)),
      _listQb: listQb,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagerService,
        { provide: getRepositoryToken(PagerToken), useValue: pagerRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(PagerService);
  });

  it('list applies status filter when provided', async () => {
    await service.list(PagerStatus.ASSIGNED);
    expect(pagerRepo._listQb.where).toHaveBeenCalledWith('p.status = :status', {
      status: PagerStatus.ASSIGNED,
    });
  });

  it('assign creates an ASSIGNED pager and links the order', async () => {
    manager.findOne.mockResolvedValueOnce({
      id: 'order-1',
      status: OrderStatus.PREPARING,
      pagerId: null,
    });
    managerQb.getOne.mockResolvedValueOnce(null); // no active pager with that number

    const result = await service.assign({ number: 12, orderId: 'order-1' });

    expect(result.number).toBe(12);
    expect(result.status).toBe(PagerStatus.ASSIGNED);
    expect(result.orderId).toBe('order-1');
    expect(manager.save).toHaveBeenCalledWith(Order, expect.objectContaining({ pagerId: 'pager-uuid' }));
  });

  it('assign rejects when number already in use by an active pager', async () => {
    manager.findOne.mockResolvedValueOnce({
      id: 'order-1',
      status: OrderStatus.PREPARING,
      pagerId: null,
    });
    managerQb.getOne.mockResolvedValueOnce({ id: 'other', number: 12, status: PagerStatus.ASSIGNED });

    await expect(service.assign({ number: 12, orderId: 'order-1' })).rejects.toThrow(BadRequestException);
  });

  it('assign rejects when the order already holds a pager', async () => {
    manager.findOne.mockResolvedValueOnce({
      id: 'order-1',
      status: OrderStatus.PREPARING,
      pagerId: 'existing-pager',
    });

    await expect(service.assign({ number: 12, orderId: 'order-1' })).rejects.toThrow(BadRequestException);
  });

  it('assign rejects a finished order', async () => {
    manager.findOne.mockResolvedValueOnce({
      id: 'order-1',
      status: OrderStatus.COMPLETED,
      pagerId: null,
    });

    await expect(service.assign({ number: 12, orderId: 'order-1' })).rejects.toThrow(BadRequestException);
  });

  it('assign throws NotFound when the order does not exist', async () => {
    manager.findOne.mockResolvedValueOnce(null);
    await expect(service.assign({ number: 12, orderId: 'nope' })).rejects.toThrow(NotFoundException);
  });

  it('call moves ASSIGNED -> WAITING', async () => {
    pagerRepo.findOneBy.mockResolvedValueOnce({ id: 'p1', number: 12, status: PagerStatus.ASSIGNED });
    const result = await service.call({ id: 'p1' });
    expect(result.status).toBe(PagerStatus.WAITING);
  });

  it('call rejects a pager that is not ASSIGNED', async () => {
    pagerRepo.findOneBy.mockResolvedValueOnce({ id: 'p1', number: 12, status: PagerStatus.COMPLETED });
    await expect(service.call({ id: 'p1' })).rejects.toThrow(BadRequestException);
  });

  it('release marks the pager COMPLETED and clears the order link', async () => {
    manager.findOne
      .mockResolvedValueOnce({ id: 'p1', number: 12, status: PagerStatus.WAITING, orderId: 'order-1' }) // pager
      .mockResolvedValueOnce({ id: 'order-1', pagerId: 'p1' }); // linked order

    const result = await service.release({ id: 'p1' });

    expect(result.status).toBe(PagerStatus.COMPLETED);
    expect(result.orderId).toBeNull();
    expect(manager.save).toHaveBeenCalledWith(Order, expect.objectContaining({ pagerId: null }));
  });

  it('release is idempotent on an already COMPLETED pager', async () => {
    manager.findOne.mockResolvedValueOnce({ id: 'p1', number: 12, status: PagerStatus.COMPLETED, orderId: null });
    const result = await service.release({ id: 'p1' });
    expect(result.status).toBe(PagerStatus.COMPLETED);
  });
});
```

### 6b. Service (implement)

```ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PagerToken } from './entities/pager-token.entity';
import { Order } from '../order/entities/order.entity';
import { AssignPagerDto } from './dto/assign-pager.dto';
import { PagerIdDto } from './dto/pager-id.dto';
import { PagerStatus } from '../../common/enums/pager-status.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';

@Injectable()
export class PagerService {
  constructor(
    @InjectRepository(PagerToken)
    private readonly pagerRepo: Repository<PagerToken>,
    private readonly dataSource: DataSource,
  ) {}

  private buildDto(pager: PagerToken) {
    return {
      id: pager.id,
      number: pager.number,
      status: pager.status,
      orderId: pager.orderId ?? null,
      createdAt: pager.createdAt,
      updatedAt: pager.updatedAt,
    };
  }

  async list(status?: PagerStatus) {
    const qb = this.pagerRepo.createQueryBuilder('p');
    if (status) qb.where('p.status = :status', { status });
    qb.orderBy('p.createdAt', 'DESC');
    const pagers = await qb.getMany();
    return pagers.map((p) => this.buildDto(p));
  }

  async assign(dto: AssignPagerDto) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: dto.orderId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
      if (
        order.status === OrderStatus.CANCELLED ||
        order.status === OrderStatus.COMPLETED
      ) {
        throw new BadRequestException('Đơn hàng đã kết thúc, không thể gán thẻ bàn');
      }
      if (order.pagerId) {
        throw new BadRequestException('Đơn hàng đã có thẻ bàn');
      }

      const active = await manager
        .getRepository(PagerToken)
        .createQueryBuilder('p')
        .where('p.number = :number', { number: dto.number })
        .andWhere('p.status != :completed', { completed: PagerStatus.COMPLETED })
        .getOne();
      if (active) {
        throw new BadRequestException(`Thẻ bàn #${dto.number} đang được sử dụng`);
      }

      const pager = manager.create(PagerToken, {
        number: dto.number,
        status: PagerStatus.ASSIGNED,
        orderId: order.id,
      });
      const saved = await manager.save(PagerToken, pager);

      order.pagerId = saved.id;
      await manager.save(Order, order);

      return this.buildDto(saved);
    });
  }

  // ASSIGNED -> WAITING: đồ uống đã xong, gọi khách tới lấy
  async call(dto: PagerIdDto) {
    const pager = await this.pagerRepo.findOneBy({ id: dto.id });
    if (!pager) throw new NotFoundException('Thẻ bàn không tồn tại');
    if (pager.status !== PagerStatus.ASSIGNED) {
      throw new BadRequestException('Chỉ thẻ đang phục vụ mới có thể gọi khách');
    }
    pager.status = PagerStatus.WAITING;
    const saved = await this.pagerRepo.save(pager);
    return this.buildDto(saved);
  }

  // -> COMPLETED: thu hồi thẻ, gỡ liên kết order. Idempotent.
  async release(dto: PagerIdDto) {
    return this.dataSource.transaction(async (manager) => {
      const pager = await manager.findOne(PagerToken, {
        where: { id: dto.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!pager) throw new NotFoundException('Thẻ bàn không tồn tại');
      if (pager.status === PagerStatus.COMPLETED) {
        return this.buildDto(pager);
      }

      if (pager.orderId) {
        const order = await manager.findOne(Order, { where: { id: pager.orderId } });
        if (order && order.pagerId === pager.id) {
          order.pagerId = null;
          await manager.save(Order, order);
        }
      }

      pager.status = PagerStatus.COMPLETED;
      pager.orderId = null;
      const saved = await manager.save(PagerToken, pager);
      return this.buildDto(saved);
    });
  }
}
```

Run: `npm test -- pager` → all green.

---

## Task 7 — `PagerController`

**Files:**
- create `src/modules/pager/pager.controller.ts`

```ts
import { Controller, Get, Post, Body, Query, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { PagerService } from './pager.service';
import { AssignPagerDto } from './dto/assign-pager.dto';
import { PagerIdDto } from './dto/pager-id.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { PagerStatus } from '../../common/enums/pager-status.enum';

@ApiTags('Pager')
@ApiBearerAuth('JWT-auth')
@Controller('pager')
export class PagerController {
  constructor(private readonly pagerService: PagerService) {}

  @Get('list')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiQuery({ name: 'status', required: false, enum: PagerStatus })
  @ApiOkResponse({
    description: 'Pager list',
    schema: {
      example: {
        code: 200,
        message: 'success',
        data: [
          {
            id: 'uuid',
            number: 12,
            status: 'ASSIGNED',
            orderId: 'uuid',
            createdAt: '2026-07-05T12:00:00.000Z',
            updatedAt: '2026-07-05T12:00:00.000Z',
          },
        ],
      },
    },
  })
  list(@Query('status') status?: PagerStatus) {
    return this.pagerService.list(status);
  }

  @Post('assign')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOkResponse({
    description: 'Assign a pager number to an order',
    schema: {
      example: {
        code: 201,
        message: 'success',
        data: {
          id: 'uuid',
          number: 12,
          status: 'ASSIGNED',
          orderId: 'uuid',
          createdAt: '2026-07-05T12:00:00.000Z',
          updatedAt: '2026-07-05T12:00:00.000Z',
        },
      },
    },
  })
  assign(@Body() dto: AssignPagerDto) {
    return this.pagerService.assign(dto);
  }

  @Post('call')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Mark a pager WAITING (drink ready, page the customer)',
    schema: {
      example: {
        code: 200,
        message: 'success',
        data: { id: 'uuid', number: 12, status: 'WAITING', orderId: 'uuid' },
      },
    },
  })
  call(@Body() dto: PagerIdDto) {
    return this.pagerService.call(dto);
  }

  @Post('release')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Release / complete a pager (reclaim it, unlink the order)',
    schema: {
      example: {
        code: 200,
        message: 'success',
        data: { id: 'uuid', number: 12, status: 'COMPLETED', orderId: null },
      },
    },
  })
  release(@Body() dto: PagerIdDto) {
    return this.pagerService.release(dto);
  }
}
```

---

## Task 8 — `PagerModule` + register in `AppModule`

**Files:**
- create `src/modules/pager/pager.module.ts`
- edit `src/app.module.ts`

`pager.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagerToken } from './entities/pager-token.entity';
import { Order } from '../order/entities/order.entity';
import { PagerService } from './pager.service';
import { PagerController } from './pager.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PagerToken, Order])],
  providers: [PagerService],
  controllers: [PagerController],
  exports: [PagerService],
})
export class PagerModule {}
```

`app.module.ts` — add the import and list it in `imports` (place after `OrderModule`):
```ts
import { PagerModule } from './modules/pager/pager.module';
```
```ts
    OrderModule,
    PagerModule,
    HealthModule,
```

Verify boot: `npm run build` then `npm run migration:run`.

---

## Task 9 — Attach a pager at POS order-creation + expose it in the order DTO

**Files:**
- edit `src/modules/order/dto/create-order.dto.ts`
- edit `src/modules/order/order.service.ts`
- edit `src/modules/order/order.module.ts`

### 9a. DTO — optional pager number

In `CreateOrderDto` add:
```ts
  @ApiPropertyOptional({ example: 12, description: 'Số thẻ bàn cho đơn quầy / mang đi' })
  @IsOptional()
  @IsInt()
  @Min(1)
  pagerNumber?: number | null;
```
(Import `IsInt`, `Min` from `class-validator` — `IsOptional` is already imported.)

### 9b. OrderModule — register the entity

```ts
import { PagerToken } from '../pager/entities/pager-token.entity';
```
```ts
    TypeOrmModule.forFeature([Order, OrderItem, CheckoutSession, Table, Product, PagerToken]),
```

### 9c. OrderService — create pager inside the create transaction + surface it in `buildDto`

Add imports:
```ts
import { PagerToken } from '../pager/entities/pager-token.entity';
import { PagerStatus } from '../../common/enums/pager-status.enum';
```

In `buildDto`, add two fields (after `paymentRequested`):
```ts
      pagerId: order.pagerId ?? null,
      pagerNumber: order.pager?.number ?? null,
```

In `create()`, right after `const saved = await manager.save(Order, order);` and before `table.status = TableStatus.OCCUPIED;`, insert:
```ts
      if (dto.pagerNumber != null) {
        const activePager = await manager
          .getRepository(PagerToken)
          .createQueryBuilder('p')
          .where('p.number = :number', { number: dto.pagerNumber })
          .andWhere('p.status != :completed', { completed: PagerStatus.COMPLETED })
          .getOne();
        if (activePager) {
          throw new BadRequestException(`Thẻ bàn #${dto.pagerNumber} đang được sử dụng`);
        }
        const pager = manager.create(PagerToken, {
          number: dto.pagerNumber,
          status: PagerStatus.ASSIGNED,
          orderId: saved.id,
        });
        const savedPager = await manager.save(PagerToken, pager);
        saved.pagerId = savedPager.id;
        await manager.save(Order, saved);
      }
```

Change the final fetch in `create()` to load the pager relation so the DTO can report it:
```ts
      const full = await manager.findOne(Order, {
        where: { id: saved.id },
        relations: ['items', 'table', 'pager'],
      });
```

> Optional (not required): add `'pager'` to the `relations` arrays in `detail()`, `page()`, `byToken()`, and the query-builder `leftJoinAndSelect` calls if the FE order views should also show the pager number outside of creation. Left out here to keep the diff focused; the pager list endpoint (Task 7) is the primary read surface.

Run `npm test -- pager` and `npm run build` to confirm nothing regressed.

---

## Interfaces

### Produces (for the FE staff pager plan)

Base path `/pager`. All endpoints require `Authorization: Bearer <accessToken>` with role `ADMIN` or `MODERATOR`. Every response is wrapped by the global interceptor as `{ code, message: 'success', data: <below> }`.

**Pager object shape** (the `data` element used throughout):
```jsonc
{
  "id": "uuid",
  "number": 12,
  "status": "WAITING | ASSIGNED | COMPLETED",
  "orderId": "uuid | null",
  "createdAt": "2026-07-05T12:00:00.000Z",
  "updatedAt": "2026-07-05T12:00:00.000Z"
}
```

1. **`GET /pager/list?status=<PagerStatus?>`**
   - Query: optional `status` ∈ `WAITING | ASSIGNED | COMPLETED`. Omit → all pagers.
   - Response `data`: `PagerObject[]`, newest first (`createdAt DESC`).

2. **`POST /pager/assign`** — HTTP 201
   - Body: `{ "number": 12, "orderId": "uuid" }`
   - Response `data`: `PagerObject` with `status: "ASSIGNED"`, `orderId` set.
   - Errors: `404` order not found; `400` order already finished / order already has a pager / `Thẻ bàn #<n> đang được sử dụng`.

3. **`POST /pager/call`** — HTTP 200
   - Body: `{ "id": "uuid" }` (pager id)
   - Response `data`: `PagerObject` with `status: "WAITING"`.
   - Errors: `404` pager not found; `400` pager not in `ASSIGNED` state.

4. **`POST /pager/release`** — HTTP 200 (idempotent)
   - Body: `{ "id": "uuid" }` (pager id)
   - Response `data`: `PagerObject` with `status: "COMPLETED"`, `orderId: null`. Calling again on a COMPLETED pager returns the same shape.
   - Errors: `404` pager not found.

**Extended — `POST /order/create`** (existing endpoint, `@Public()`): the body now accepts an optional `pagerNumber`:
```jsonc
{ "tableToken": "uuid-v4", "items": [ ... ], "note": null, "pagerNumber": 12 }
```
When `pagerNumber` is provided, an `ASSIGNED` `PagerToken` is created atomically and linked; the returned order object now also carries `pagerId` and `pagerNumber` (both `null` when no pager). Error `400 Thẻ bàn #<n> đang được sử dụng` if that number is already active.

### Consumes
- `OrderStatus`, `UserRole` enums (existing `src/common/enums`).
- `Order` entity / `orders` table (adds `pagerId` FK).
- Global `JwtAuthGuard` + `RolesGuard`, `ResponseInterceptor`, `class-validator` `ValidationPipe`.
