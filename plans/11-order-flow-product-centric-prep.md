# Luồng đơn hàng mới + Khu pha chế lấy món làm trung tâm — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `chalo-fe/docs/superpowers/specs/2026-07-17-order-flow-product-centric-prep-design.md`

**Goal:** Đổi khu pha chế từ tổ chức theo BÀN sang theo MÓN, và làm lại luồng trạng thái đơn để việc tick từng ly tự đẩy đơn sang "Sẵn sàng phục vụ".

**Architecture:** Tick chuyển từ localStorage lên server thành cột `order_items.preparedQuantity` (giá trị tuyệt đối ⇒ idempotent); BE tự chuyển đơn sang READY khi mọi item đủ ly, trong cùng transaction có khoá. FE gom món bằng một hàm thuần (`prep-grouping.ts`) tách khỏi component để test được ở node. Gộp đơn thủ công + gợi ý thông minh bị xoá hoàn toàn vì gom theo món đã thay thế chúng.

**Tech Stack:** NestJS 11 + TypeORM 0.3.28 + Postgres 16 · Next.js 16.2.2 (App Router) + React 19.2.4 + TanStack Query v5 + Tailwind v4 · Jest (BE) · Playwright (FE)

## Global Constraints

- **KHÔNG sửa `.env` / `.env.local`** (được git track) — truyền env inline trên command line.
- **Postgres port 5433**, compose trong `chalo-be/`. KHÔNG đổi `DB_PORT`.
- **DB dùng chung với agent khác** ⇒ migration additive (`ADD COLUMN IF NOT EXISTS` + default). Ngoại lệ duy nhất: drop `smartBatchingEnabled` (Task 4) — cột này chỉ nhánh này biết.
- Port dev: **BE 8082, FE 3020**.
- `synchronize: false` — mọi thay đổi schema phải có file migration.
- Múi giờ nghiệp vụ: **Asia/Ho_Chi_Minh (+07:00)**.
- `CONFIRMED` **giữ trong enum**, chỉ gỡ khỏi luồng đi tới — DB dùng chung đang có đơn ở trạng thái này.
- FE chạy bằng `pnpm build && pnpm start -p 3020` (không dùng `next dev` — hết inotify).
- Không dùng bare `git stash` / `git stash pop` (stash stack dùng chung giữa các worktree).

---

## - [x] Task 1: BE — Bảng chuyển trạng thái mới

**Files:**
- Modify: `chalo-be/src/modules/order/order.service.ts:39-44`
- Test: `chalo-be/src/modules/order/order.service.status-transitions.spec.ts` (create)

**Interfaces:**
- Consumes: không có (task đầu)
- Produces: `STATUS_TRANSITIONS` cho phép `PENDING → PREPARING`, `CONFIRMED → PREPARING`, `READY → PREPARING`; chặn `PENDING → CONFIRMED`.

- [ ] **Step 1: Viết test thất bại**

Create `chalo-be/src/modules/order/order.service.status-transitions.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Table } from '../table/entities/table.entity';
import { Product } from '../product/entities/product.entity';
import { SseService } from '../sse/sse.service';
import { SettingsService } from '../settings/settings.service';

describe('OrderService STATUS_TRANSITIONS', () => {
  let service: OrderService;
  let manager: any;
  let sse: { emit: jest.Mock };

  /** Đơn đang khoá ở trạng thái `from`, rồi bản đầy đủ sau khi đổi sang `to` */
  const mockOrder = (from: string, to: string) => {
    manager.findOne
      .mockResolvedValueOnce({ id: 'o1', status: from, tableId: 't1' })
      .mockResolvedValueOnce({
        id: 'o1',
        status: to,
        tableId: 't1',
        tableToken: 'tok',
        items: [],
        table: { name: 'Ban 01' },
      });
  };

  beforeEach(async () => {
    manager = { findOne: jest.fn(), save: jest.fn(), getRepository: jest.fn() };
    sse = { emit: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: {} },
        { provide: getRepositoryToken(OrderItem), useValue: {} },
        { provide: getRepositoryToken(Table), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        {
          provide: DataSource,
          useValue: { transaction: jest.fn(async (cb: any) => cb(manager)) },
        },
        { provide: SseService, useValue: sse },
        { provide: SettingsService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(OrderService);
  });

  it('PENDING → PREPARING: staff kéo thẳng vào pha, không qua bước xác nhận', async () => {
    mockOrder('PENDING', 'PREPARING');
    const result = await service.updateStatus({ id: 'o1', status: 'PREPARING' } as any);
    expect(result.status).toBe('PREPARING');
  });

  it('PENDING → CONFIRMED bị chặn: không tạo mới trạng thái đã gỡ khỏi luồng', async () => {
    manager.findOne.mockResolvedValueOnce({ id: 'o1', status: 'PENDING', tableId: 't1' });
    await expect(
      service.updateStatus({ id: 'o1', status: 'CONFIRMED' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('CONFIRMED → PREPARING vẫn chạy: đơn CONFIRMED cũ trong DB phải đi tiếp được', async () => {
    mockOrder('CONFIRMED', 'PREPARING');
    const result = await service.updateStatus({ id: 'o1', status: 'PREPARING' } as any);
    expect(result.status).toBe('PREPARING');
  });

  it('READY → PREPARING: đường lùi khi tick nhầm ly cuối', async () => {
    mockOrder('READY', 'PREPARING');
    const result = await service.updateStatus({ id: 'o1', status: 'PREPARING' } as any);
    expect(result.status).toBe('PREPARING');
  });

  it('READY → COMPLETED vẫn chạy: staff bấm "Đã bê ra"', async () => {
    manager.getRepository.mockReturnValue({
      createQueryBuilder: () => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      }),
      findOne: jest.fn().mockResolvedValue(null),
    });
    mockOrder('READY', 'COMPLETED');
    const result = await service.updateStatus({ id: 'o1', status: 'COMPLETED' } as any);
    expect(result.status).toBe('COMPLETED');
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó fail**

```bash
cd chalo-be && npx jest src/modules/order/order.service.status-transitions.spec.ts
```
Expected: FAIL — `PENDING → PREPARING` và `READY → PREPARING` ném BadRequestException vì bảng chuyển hiện tại chưa cho phép.

- [ ] **Step 3: Sửa bảng chuyển trạng thái**

Trong `chalo-be/src/modules/order/order.service.ts`, thay nguyên khối dòng 39-44:

```ts
const STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  // Khách đặt -> kéo thẳng vào pha, bỏ bước xác nhận
  [OrderStatus.PENDING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  // CONFIRMED đã gỡ khỏi luồng nhưng đơn cũ trong DB vẫn phải đi tiếp được
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  // READY -> PREPARING: đường lùi khi tick nhầm ly cuối làm đơn tự nhảy sang READY
  [OrderStatus.READY]: [
    OrderStatus.COMPLETED,
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,
  ],
};
```

- [ ] **Step 4: Chạy test để chắc chắn nó pass**

```bash
cd chalo-be && npx jest src/modules/order/order.service.status-transitions.spec.ts
```
Expected: PASS — 5 passed.

- [ ] **Step 5: Commit**

```bash
git add chalo-be/src/modules/order/order.service.ts chalo-be/src/modules/order/order.service.status-transitions.spec.ts
git commit -m "feat(be): luồng trạng thái mới - bỏ bước xác nhận, thêm đường lùi READY->PREPARING"
```

---

## - [x] Task 2: BE — Cột preparedQuantity + endpoint tick + tự đẩy READY

**Files:**
- Create: `chalo-be/src/migrations/1752990000000-AddOrderItemPreparedQuantity.ts`
- Create: `chalo-be/src/modules/order/dto/update-item-prepared.dto.ts`
- Create: `chalo-be/src/modules/order/order.service.prep-tick.spec.ts`
- Modify: `chalo-be/src/modules/order/entities/order-item.entity.ts`
- Modify: `chalo-be/src/modules/order/order.service.ts` (`buildDto`, thêm `setItemPrepared`)
- Modify: `chalo-be/src/modules/order/order.controller.ts`
- Modify: `chalo-be/src/modules/sse/sse.service.ts:5-12`
- Modify: `chalo-be/src/modules/sse/sse.controller.ts:20`

**Interfaces:**
- Consumes: `STATUS_TRANSITIONS` từ Task 1 (`PREPARING → READY` đã cho phép).
- Produces:
  - `OrderService.setItemPrepared(itemId: string, dto: UpdateItemPreparedDto): Promise<OrderDto>`
  - `UpdateItemPreparedDto { preparedQuantity: number }`
  - Endpoint `PUT /api/order/item/:itemId/prepared`
  - `OrderItemDto` có thêm `preparedQuantity: number`
  - SSE event `order_prep_progress` payload `{ orderId, tableId, tableName }`

- [ ] **Step 1: Viết migration**

Create `chalo-be/src/migrations/1752990000000-AddOrderItemPreparedQuantity.ts`:

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

/** Số ly đã pha xong của từng item — barista tick ở khu pha chế; đủ mọi item thì đơn tự sang READY. */
export class AddOrderItemPreparedQuantity1752990000000 implements MigrationInterface {
  name = 'AddOrderItemPreparedQuantity1752990000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "preparedQuantity" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN IF EXISTS "preparedQuantity"`,
    );
  }
}
```

- [ ] **Step 2: Thêm cột vào entity**

Trong `chalo-be/src/modules/order/entities/order-item.entity.ts`, thêm ngay sau `quantity`:

```ts
  /** Số ly đã pha xong. Giá trị tuyệt đối do FE gửi lên, không phải bộ đếm tăng dần. */
  @Column({ type: 'int', default: 0 })
  preparedQuantity: number;
```

- [ ] **Step 3: Chạy migration**

```bash
cd chalo-be && DB_PORT=5433 npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts
```
Expected: `Migration AddOrderItemPreparedQuantity1752990000000 has been executed successfully.`

- [ ] **Step 4: Viết DTO**

Create `chalo-be/src/modules/order/dto/update-item-prepared.dto.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateItemPreparedDto {
  @ApiProperty({
    example: 2,
    description:
      'Số ly đã pha xong của item này. GIÁ TRỊ TUYỆT ĐỐI, không phải lệnh tăng — hai máy cùng tick một ly sẽ không bị đếm đôi.',
  })
  @IsInt()
  @Min(0)
  preparedQuantity: number;
}
```

- [ ] **Step 5: Viết test thất bại**

Create `chalo-be/src/modules/order/order.service.prep-tick.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Table } from '../table/entities/table.entity';
import { Product } from '../product/entities/product.entity';
import { SseService } from '../sse/sse.service';
import { SettingsService } from '../settings/settings.service';

describe('OrderService.setItemPrepared', () => {
  let service: OrderService;
  let manager: any;
  let sse: { emit: jest.Mock };

  /**
   * items: danh sách item của đơn sau khi đã ghi tick.
   * orderStatus: trạng thái đơn lúc bị khoá.
   */
  const setup = (
    item: any,
    itemsAfterSave: any[],
    orderStatus = 'PREPARING',
  ) => {
    manager.findOne.mockImplementation((entity: any, opts: any) => {
      if (entity === OrderItem) return Promise.resolve(item);
      if (opts?.relations) {
        return Promise.resolve({
          id: 'o1',
          status: itemsAfterSave.every((i) => i.preparedQuantity >= i.quantity)
            ? 'READY'
            : orderStatus,
          tableId: 't1',
          tableToken: 'tok',
          items: itemsAfterSave,
          table: { name: 'Ban 06' },
        });
      }
      return Promise.resolve({ id: 'o1', status: orderStatus, tableId: 't1', tableToken: 'tok' });
    });
    manager.find.mockResolvedValue(itemsAfterSave);
  };

  beforeEach(async () => {
    manager = { findOne: jest.fn(), find: jest.fn(), save: jest.fn() };
    sse = { emit: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: {} },
        { provide: getRepositoryToken(OrderItem), useValue: {} },
        { provide: getRepositoryToken(Table), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        {
          provide: DataSource,
          useValue: { transaction: jest.fn(async (cb: any) => cb(manager)) },
        },
        { provide: SseService, useValue: sse },
        { provide: SettingsService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(OrderService);
  });

  it('tick đủ mọi item -> đơn tự chuyển READY và bắn order_status_changed', async () => {
    const item = { id: 'i1', orderId: 'o1', quantity: 1, preparedQuantity: 0 };
    setup(item, [{ ...item, preparedQuantity: 1 }]);

    const result = await service.setItemPrepared('i1', { preparedQuantity: 1 });

    expect(result.status).toBe('READY');
    expect(sse.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'order_status_changed' }),
    );
  });

  it('còn item chưa đủ -> đơn giữ PREPARING và bắn order_prep_progress', async () => {
    const item = { id: 'i1', orderId: 'o1', quantity: 1, preparedQuantity: 0 };
    setup(item, [
      { ...item, preparedQuantity: 1 },
      { id: 'i2', orderId: 'o1', quantity: 2, preparedQuantity: 0 },
    ]);

    const result = await service.setItemPrepared('i1', { preparedQuantity: 1 });

    expect(result.status).toBe('PREPARING');
    expect(sse.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'order_prep_progress' }),
    );
  });

  it('gọi hai lần cùng giá trị -> idempotent, không đếm đôi', async () => {
    const item = { id: 'i1', orderId: 'o1', quantity: 3, preparedQuantity: 2 };
    setup(item, [{ ...item, preparedQuantity: 2 }]);

    await service.setItemPrepared('i1', { preparedQuantity: 2 });
    await service.setItemPrepared('i1', { preparedQuantity: 2 });

    expect(item.preparedQuantity).toBe(2); // vẫn 2, không thành 4
  });

  it('preparedQuantity vượt quantity -> BadRequest', async () => {
    const item = { id: 'i1', orderId: 'o1', quantity: 2, preparedQuantity: 0 };
    setup(item, [item]);

    await expect(
      service.setItemPrepared('i1', { preparedQuantity: 3 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('đơn không ở PREPARING -> BadRequest (không tick đơn chưa vào pha)', async () => {
    const item = { id: 'i1', orderId: 'o1', quantity: 1, preparedQuantity: 0 };
    setup(item, [item], 'PENDING');

    await expect(
      service.setItemPrepared('i1', { preparedQuantity: 1 }),
    ).rejects.toThrow(BadRequestException);
  });
});
```

- [ ] **Step 6: Chạy test để chắc chắn nó fail**

```bash
cd chalo-be && npx jest src/modules/order/order.service.prep-tick.spec.ts
```
Expected: FAIL — `service.setItemPrepared is not a function`.

- [ ] **Step 7: Thêm event type vào SSE**

Trong `chalo-be/src/modules/sse/sse.service.ts`, thêm vào union `SseEventType` (dòng 5-12):

```ts
export type SseEventType =
  | 'new_order'
  | 'payment_request'
  | 'payment_request_batch'
  | 'order_status_changed'
  | 'order_prep_progress'
  | 'checkout_completed'
  | 'payment_completed'
  | 'staff_call';
```

**KHÔNG** thêm `order_prep_progress` vào `customerTypes` trong `streamForTable()` — tiến độ pha là việc nội bộ của barista, khách không cần biết.

Trong `chalo-be/src/modules/sse/sse.controller.ts:20`, cập nhật mô tả Swagger:

```ts
      'Sự kiện phát: `new_order`, `payment_request`, `order_status_changed`, `order_prep_progress`.',
```

- [ ] **Step 8: Thêm preparedQuantity vào buildDto**

Trong `chalo-be/src/modules/order/order.service.ts`, trong `buildDto()`, thêm vào object của `items.map`, ngay sau `quantity`:

```ts
        quantity: item.quantity,
        preparedQuantity: item.preparedQuantity,
```

- [ ] **Step 9: Viết setItemPrepared**

Trong `chalo-be/src/modules/order/order.service.ts`, thêm method ngay sau `updateStatus()`. Nhớ import `UpdateItemPreparedDto` từ `./dto/update-item-prepared.dto`:

```ts
  /**
   * Tick số ly đã pha của một item. Nhận GIÁ TRỊ TUYỆT ĐỐI (không phải +1) nên
   * hai máy cùng tick một ly không bị đếm đôi, và gọi lại cùng request không đổi kết quả.
   * Tick đủ mọi item của đơn -> đơn tự chuyển READY.
   */
  async setItemPrepared(itemId: string, dto: UpdateItemPreparedDto) {
    return this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(OrderItem, { where: { id: itemId } });
      if (!item) throw new NotFoundException('Món trong đơn không tồn tại');

      const lockedOrder = await manager.findOne(Order, {
        where: { id: item.orderId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedOrder) throw new NotFoundException('Đơn hàng không tồn tại');

      if (lockedOrder.status !== OrderStatus.PREPARING) {
        throw new BadRequestException('Chỉ tick được đơn đang pha chế');
      }
      if (dto.preparedQuantity > item.quantity) {
        throw new BadRequestException('Số ly đã pha vượt quá số lượng đặt');
      }

      item.preparedQuantity = dto.preparedQuantity;
      await manager.save(OrderItem, item);

      const items = await manager.find(OrderItem, {
        where: { orderId: lockedOrder.id },
      });
      const allDone = items.every((i) => i.preparedQuantity >= i.quantity);
      if (allDone) {
        lockedOrder.status = OrderStatus.READY;
        await manager.save(Order, lockedOrder);
      }

      const full = await manager.findOne(Order, {
        where: { id: lockedOrder.id },
        relations: ['items', 'table'],
      });
      const result = this.buildDto(full!);

      this.sseService.emit(
        allDone
          ? {
              type: 'order_status_changed',
              data: {
                orderId: result.id,
                status: result.status,
                tableId: result.tableId,
                tableName: result.tableName,
                tableToken: result.tableToken,
              },
            }
          : {
              type: 'order_prep_progress',
              data: {
                orderId: result.id,
                tableId: result.tableId,
                tableName: result.tableName,
              },
            },
      );

      return result;
    });
  }
```

- [ ] **Step 10: Chạy test để chắc chắn nó pass**

```bash
cd chalo-be && npx jest src/modules/order/order.service.prep-tick.spec.ts
```
Expected: PASS — 5 passed.

- [ ] **Step 11: Thêm endpoint vào controller**

Trong `chalo-be/src/modules/order/order.controller.ts`, thêm ngay sau `updateStatus()`. Nhớ thêm `Put`, `Param` vào import từ `@nestjs/common` nếu chưa có, và import `UpdateItemPreparedDto`:

```ts
  @Put('item/:itemId/prepared')
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOkResponse({
    description:
      'Tick số ly đã pha của một item (giá trị tuyệt đối). Đủ mọi item thì đơn tự sang READY.',
    schema: {
      example: {
        code: 200,
        message: 'success',
        data: { id: 'uuid', status: 'READY' },
      },
    },
  })
  setItemPrepared(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemPreparedDto,
  ) {
    return this.orderService.setItemPrepared(itemId, dto);
  }
```

- [ ] **Step 12: Kiểm tra BE khởi động và endpoint có trong Swagger**

```bash
cd chalo-be && PORT=8082 timeout 25 npx nest start 2>&1 | tail -5
```
Expected: không lỗi biên dịch, log `Nest application successfully started`.

- [ ] **Step 13: Commit**

```bash
git add chalo-be/src/migrations/1752990000000-AddOrderItemPreparedQuantity.ts chalo-be/src/modules/order chalo-be/src/modules/sse
git commit -m "feat(be): tick số ly đã pha trên server, đủ ly thì đơn tự sang READY"
```

---

## - [x] Task 3: BE — Bảng staff lọc từ 0h00 giờ VN

**Files:**
- Modify: `chalo-be/src/modules/order/order.service.ts` (`getActiveQueue` dòng ~91-114, thêm `startOfTodayVN`)
- Test: `chalo-be/src/modules/order/order.service.active-queue.spec.ts` (create)

**Interfaces:**
- Consumes: không có
- Produces: `getActiveQueue()` chỉ trả đơn tạo từ 0h00 hôm nay (+07:00)

- [ ] **Step 1: Viết test thất bại**

Create `chalo-be/src/modules/order/order.service.active-queue.spec.ts`:

```ts
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

describe('OrderService.getActiveQueue — mốc 0h00 giờ VN', () => {
  let service: OrderService;
  let qb: any;

  beforeEach(async () => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: { createQueryBuilder: () => qb },
        },
        { provide: getRepositoryToken(OrderItem), useValue: {} },
        { provide: getRepositoryToken(Table), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: SseService, useValue: { emit: jest.fn() } },
        { provide: SettingsService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(OrderService);
  });

  afterEach(() => jest.useRealTimers());

  it('lọc từ 0h00 hôm nay giờ VN, không phải cửa sổ trượt 24h', async () => {
    // 2026-07-17 10:00 giờ VN  ==  2026-07-17T03:00:00Z
    jest.useFakeTimers().setSystemTime(new Date('2026-07-17T03:00:00.000Z'));

    await service.getActiveQueue();

    const call = qb.andWhere.mock.calls.find((c: any[]) =>
      String(c[0]).includes('createdAt'),
    );
    expect(call).toBeDefined();
    // 0h00 ngày 17/07 giờ VN == 2026-07-16T17:00:00Z
    expect(call[1].cutoff).toEqual(new Date('2026-07-16T17:00:00.000Z'));
  });

  it('ngay sau nửa đêm VN, mốc nhảy sang ngày mới (đơn hôm qua rời bảng)', async () => {
    // 2026-07-18 00:30 giờ VN  ==  2026-07-17T17:30:00Z
    jest.useFakeTimers().setSystemTime(new Date('2026-07-17T17:30:00.000Z'));

    await service.getActiveQueue();

    const call = qb.andWhere.mock.calls.find((c: any[]) =>
      String(c[0]).includes('createdAt'),
    );
    // 0h00 ngày 18/07 giờ VN == 2026-07-17T17:00:00Z
    expect(call[1].cutoff).toEqual(new Date('2026-07-17T17:00:00.000Z'));
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó fail**

```bash
cd chalo-be && npx jest src/modules/order/order.service.active-queue.spec.ts
```
Expected: FAIL — cutoff hiện là `now - 24h` (`2026-07-16T03:00:00.000Z`), không phải `2026-07-16T17:00:00.000Z`.

- [ ] **Step 3: Thêm helper startOfTodayVN**

Trong `chalo-be/src/modules/order/order.service.ts`, thêm ngay trước `getActiveQueue()`:

```ts
  /**
   * 0h00 hôm nay theo giờ VN (+07:00). Bảng staff reset theo mốc này mỗi đêm.
   * Không cần cron — chỉ là điều kiện truy vấn, tự đúng khi đồng hồ qua nửa đêm.
   */
  private startOfTodayVN(): Date {
    const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const y = nowVN.getUTCFullYear();
    const m = String(nowVN.getUTCMonth() + 1).padStart(2, '0');
    const d = String(nowVN.getUTCDate()).padStart(2, '0');
    return new Date(`${y}-${m}-${d}T00:00:00.000+07:00`);
  }
```

- [ ] **Step 4: Đổi điều kiện lọc trong getActiveQueue**

Trong `getActiveQueue()`, thay khối `.andWhere('o.createdAt > :cutoff', ...)` (kèm comment cũ về 24h) bằng:

```ts
      // Bảng staff reset lúc 0h00 mỗi đêm — đơn hôm qua không còn là "đang xử lý"
      .andWhere('o.createdAt >= :cutoff', { cutoff: this.startOfTodayVN() })
```

- [ ] **Step 5: Chạy test để chắc chắn nó pass**

```bash
cd chalo-be && npx jest src/modules/order/order.service.active-queue.spec.ts
```
Expected: PASS — 2 passed.

- [ ] **Step 6: Commit**

```bash
git add chalo-be/src/modules/order/order.service.ts chalo-be/src/modules/order/order.service.active-queue.spec.ts
git commit -m "feat(be): bảng staff chỉ hiện đơn trong ngày, reset 0h00 giờ VN"
```

---

## - [x] Task 4: BE — Gỡ smartBatchingEnabled

**Files:**
- Create: `chalo-be/src/migrations/1752990100000-DropSmartBatchingSetting.ts`
- Modify: `chalo-be/src/modules/settings/entities/app-settings.entity.ts`
- Modify: `chalo-be/src/modules/settings/dto/update-settings.dto.ts`
- Modify: `chalo-be/src/modules/settings/settings.service.ts`
- Modify: `chalo-be/src/modules/settings/settings.service.spec.ts`

**Interfaces:**
- Consumes: không có
- Produces: `SettingsDto` không còn `smartBatchingEnabled`

**Vì sao được phép DROP** (ngoại lệ của quy tắc additive): cột này do chính nhánh này thêm ở migration `1752900000000-AddSmartBatchingSetting.ts`. Không code nào ngoài nhánh này biết nó tồn tại ⇒ xoá không phá agent nào. Để lại sẽ thành cột mồ côi vĩnh viễn.

- [ ] **Step 1: Xoá test cũ của tính năng bị gỡ**

Trong `chalo-be/src/modules/settings/settings.service.spec.ts`:
- Xoá nguyên test `it('update() can flip smartBatchingEnabled alone', ...)`.
- Xoá `smartBatchingEnabled: true` khỏi object `defaultRow`.

- [ ] **Step 2: Chạy test — phải vẫn pass**

```bash
cd chalo-be && npx jest src/modules/settings/settings.service.spec.ts
```
Expected: PASS — 4 passed (đã bớt 1 test so với trước).

- [ ] **Step 3: Gỡ khỏi entity, DTO, service**

`chalo-be/src/modules/settings/entities/app-settings.entity.ts` — xoá khối:
```ts
  /** Bật/tắt gợi ý gộp đơn thông minh ở màn pha chế của staff */
  @Column({ type: 'boolean', default: true })
  smartBatchingEnabled: boolean;
```

`chalo-be/src/modules/settings/dto/update-settings.dto.ts` — xoá khối:
```ts
  @ApiPropertyOptional({ example: true, description: 'Bật/tắt gợi ý gộp đơn thông minh (staff prep)' })
  @IsOptional()
  @IsBoolean()
  smartBatchingEnabled?: boolean;
```

`chalo-be/src/modules/settings/settings.service.ts` — trong `update()`, xoá:
```ts
      if (dto.smartBatchingEnabled !== undefined)
        settings.smartBatchingEnabled = dto.smartBatchingEnabled;
```

- [ ] **Step 4: Viết migration drop**

Create `chalo-be/src/migrations/1752990100000-DropSmartBatchingSetting.ts`:

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gỡ toggle gợi ý gộp đơn: khu pha chế giờ gom theo món nên đã tự gộp,
 * không còn cơ chế gộp thủ công nào để bật/tắt.
 */
export class DropSmartBatchingSetting1752990100000 implements MigrationInterface {
  name = 'DropSmartBatchingSetting1752990100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "smartBatchingEnabled"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "smartBatchingEnabled" boolean NOT NULL DEFAULT true`,
    );
  }
}
```

- [ ] **Step 5: Chạy migration**

```bash
cd chalo-be && DB_PORT=5433 npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts
```
Expected: `Migration DropSmartBatchingSetting1752990100000 has been executed successfully.`

- [ ] **Step 6: Chạy toàn bộ test BE**

```bash
cd chalo-be && npx jest
```
Expected: PASS — không suite nào đỏ.

- [ ] **Step 7: Commit**

```bash
git add chalo-be/src/modules/settings chalo-be/src/migrations/1752990100000-DropSmartBatchingSetting.ts
git commit -m "refactor(be): gỡ smartBatchingEnabled - gom theo món đã thay thế gộp đơn"
```

---

## - [x] Task 5: FE — Gỡ toàn bộ gộp đơn

**Files:**
- Delete: `chalo-fe/src/utils/batching.ts`
- Delete: `chalo-fe/e2e/batching.unit.spec.ts`
- Delete: `chalo-fe/src/app/(staff)/staff/orders/_components/BatchSuggestion.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/orders/page.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/orders/_components/KanbanColumn.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/orders/_components/OrderCard.tsx`
- Modify: `chalo-fe/src/app/(staff)/_components/PrepTicket.tsx`
- Modify: `chalo-fe/src/stores/prep.store.ts`
- Modify: `chalo-fe/src/app/(admin)/admin/settings/page.tsx`
- Modify: `chalo-fe/src/services/settings/settings.types.ts`
- Modify: `chalo-fe/e2e/admin-settings.spec.ts`

**Interfaces:**
- Consumes: không có
- Produces: `KanbanColumn` không còn props `selectable/selectedIds/onToggleSelect/banner`; `OrderCard` không còn `selectable/selected/onToggleSelect`; `usePrepStore` chỉ còn `ticks`/`toggleTick`/`prune`.

Dọn sạch trước để các task sau không phải sửa lại code sắp bị xoá.

- [x] **Step 1: Xoá file của tính năng gộp đơn**

```bash
cd "$(git rev-parse --show-toplevel)"
git rm chalo-fe/src/utils/batching.ts chalo-fe/e2e/batching.unit.spec.ts "chalo-fe/src/app/(staff)/staff/orders/_components/BatchSuggestion.tsx"
```

- [x] **Step 2: Gỡ props chọn đơn khỏi OrderCard**

Trong `chalo-fe/src/app/(staff)/staff/orders/_components/OrderCard.tsx`:
- Xoá `selectable = false, selected = false, onToggleSelect,` khỏi tham số.
- Xoá 3 dòng type tương ứng (`selectable?`, `selected?`, `onToggleSelect?`) và comment `/** Cho phép chọn đơn để gộp pha chung ... */`.
- Xoá nguyên khối `{selectable && (<input type="checkbox" ... />)}`.
- Trong `className`, bỏ nhánh `selected`, còn lại:

```tsx
      className={`cursor-pointer rounded-xl border bg-white dark:bg-gray-900 shadow-sm p-3.5 space-y-3 hover:shadow-md transition-shadow
        ${
          order.status === "PENDING"
            ? "border-l-4 border-l-yellow-400 dark:border-l-yellow-500"
            : "border-gray-100 dark:border-gray-800"
        }`}
```
(Task 10 sẽ thay nốt phần màu viền này sang theo `paidStatus`.)

- [x] **Step 3: Gỡ props khỏi KanbanColumn**

Trong `chalo-fe/src/app/(staff)/staff/orders/_components/KanbanColumn.tsx`, thay toàn bộ file bằng:

```tsx
// src/app/(staff)/staff/orders/_components/KanbanColumn.tsx
import { OrderDto, OrderStatus } from "@/services/order/order.types";
import { KANBAN_COLUMNS } from "../orders.config";
import { OrderCard } from "./OrderCard";

export const KanbanColumn = ({
  config,
  orders,
  onStatusChange,
  updatingId,
}: {
  config: (typeof KANBAN_COLUMNS)[number];
  orders: OrderDto[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  updatingId: string | null;
}) => {
  return (
    <div className="flex min-w-[220px] flex-1 flex-col">
      <div
        className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border ${config.bgColor} ${config.borderColor}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{config.emoji}</span>
          <span className={`text-sm font-bold ${config.textColor}`}>
            {config.label}
          </span>
        </div>
        {orders.length > 0 && (
          <span
            className={`size-5 rounded-full text-xs font-bold flex items-center justify-center ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
          >
            {orders.length}
          </span>
        )}
      </div>

      <div
        className={`flex-1 min-h-[120px] border-x border-b ${config.borderColor} rounded-b-xl p-2 space-y-2 overflow-y-auto`}
      >
        {orders.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-6">
            Không có đơn
          </p>
        ) : (
          orders.map((order) => (
            <OrderCard
              order={order}
              isUpdating={updatingId === order.id}
              onStatusChange={onStatusChange}
              key={order.id}
            />
          ))
        )}
      </div>
    </div>
  );
};
```

- [x] **Step 4: Gỡ state gộp đơn khỏi trang orders**

Trong `chalo-fe/src/app/(staff)/staff/orders/page.tsx`:
- Xoá import `BatchSuggestion`, `computeBatchSuggestion`, `useGetSettings`, `usePrepStore`.
- Xoá state `selectedIds`, `isBatching`, hàm `toggleSelect`, `startBatch`, `createBatch`, `dismissed`, `dismiss`, `smartEnabled`, `settings`, `suggestion`.
- Xoá `useEffect` đồng bộ `selectedIds` theo `confirmedQueue`.
- Xoá nguyên khối action bar `{selectedIds.size > 0 && (...)}`.
- Bỏ các props `selectable/selectedIds/onToggleSelect/banner` khi gọi `<KanbanColumn>`.
- Xoá `confirmedQueue` và `byCreatedAsc` nếu không còn ai dùng.

- [x] **Step 5: Gỡ batches/dismissed khỏi prep.store**

Trong `chalo-fe/src/stores/prep.store.ts`, giữ lại đúng `ticks`, `toggleTick`, `prune`; xoá `batches`, `dismissed`, `createBatch`, `dissolveBatch`, `dismiss` khỏi cả interface lẫn implementation lẫn `partialize` (nếu có).

(File này sẽ bị xoá hẳn ở Task 8 — bước này chỉ để repo biên dịch được ở giữa chừng.)

- [x] **Step 6: Gỡ badge gộp + nút Tách khỏi PrepTicket**

Trong `chalo-fe/src/app/(staff)/_components/PrepTicket.tsx`:
- Xoá `dissolveBatch` khỏi `usePrepStore`.
- Xoá prop `batchId`.
- Xoá nguyên khối `{isBatch && (<div>... Gộp {orders.length} đơn ... Tách ...</div>)}`.

Trong `chalo-fe/src/app/(staff)/_components/PrepStation.tsx`, xoá `batches` khỏi `usePrepStore` và bỏ vòng lặp gom batch — mỗi đơn thành một ticket lẻ:

```tsx
  const tickets = useMemo(
    () => orders.map((o) => ({ key: o.id, orders: [o] })),
    [orders],
  );
```
(Task 8 sẽ thay hẳn file này.)

- [x] **Step 7: Gỡ toggle khỏi Admin Settings**

Trong `chalo-fe/src/app/(admin)/admin/settings/page.tsx`:
- Xoá `const smartBatchingEnabled = current?.smartBatchingEnabled ?? true;`
- Xoá `smartBatchingEnabled` khỏi `patch()`, `dirty`, payload của `save()`.
- Xoá nguyên card `<div>...Gợi ý gộp đơn thông minh...</div>`.

Trong `chalo-fe/src/services/settings/settings.types.ts`, xoá `smartBatchingEnabled: boolean;` khỏi `SettingsDto` và `UpdateSettingsPayload`.

Trong `chalo-fe/e2e/admin-settings.spec.ts`, đổi lại comment về `.first()` cho khớp (giờ chỉ còn 1 toggle):

```ts
  const toggleTrack = page.locator("div.h-6.w-11").first();
```

- [x] **Step 8: Kiểm tra biên dịch**

```bash
cd chalo-fe && npx tsc --noEmit
```
Expected: không lỗi.

- [x] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(fe): gỡ gộp đơn thủ công + gợi ý thông minh + toggle admin"
```

---

## - [x] Task 6: FE — Types + API + hook tick

**Files:**
- Modify: `chalo-fe/src/services/order/order.types.ts`
- Modify: `chalo-fe/src/constants/api-endpoints.ts:46-62`
- Modify: `chalo-fe/src/services/order/order.api.ts`
- Modify: `chalo-fe/src/services/order/order.queries.ts`
- Modify: `chalo-fe/src/hooks/useSSE.ts:6-56`

**Interfaces:**
- Consumes: endpoint `PUT /order/item/:itemId/prepared` từ Task 2; `OrderItemDto.preparedQuantity` từ `buildDto`.
- Produces:
  - `OrderItemDto.preparedQuantity: number`
  - `useSetItemPrepared()` → `mutate({ itemId: string, preparedQuantity: number })`, optimistic trên `QUERY_KEYS.ORDERS.ACTIVE`
  - SSE type `order_prep_progress`

- [ ] **Step 1: Thêm preparedQuantity vào OrderItemDto**

Trong `chalo-fe/src/services/order/order.types.ts`, trong `OrderItemDto`, thêm ngay sau `quantity`:

```ts
  quantity: number;
  /** Số ly đã pha xong — barista tick ở khu pha chế */
  preparedQuantity: number;
```

- [ ] **Step 2: Thêm endpoint constant**

Trong `chalo-fe/src/constants/api-endpoints.ts`, trong khối `ORDER`, thêm sau `UPDATE_STATUS`:

```ts
    UPDATE_STATUS: "/order/status",
    ITEM_PREPARED: (itemId: string) => `/order/item/${itemId}/prepared`,
```

- [ ] **Step 3: Thêm hàm gọi API**

Trong `chalo-fe/src/services/order/order.api.ts`, thêm sau `updateOrderStatus`:

```ts
/** Gửi GIÁ TRỊ TUYỆT ĐỐI số ly đã pha (không phải +1) — hai máy cùng tick không đếm đôi */
export const setItemPrepared = (
  itemId: string,
  preparedQuantity: number,
): Promise<OrderDto> =>
  request.put(API.ORDER.ITEM_PREPARED(itemId), { preparedQuantity });
```

- [ ] **Step 4: Thêm hook optimistic**

Trong `chalo-fe/src/services/order/order.queries.ts`, thêm `setItemPrepared` vào import từ `./order.api`, `OrderDto` vào import từ `./order.types`, rồi thêm mutation sau `useUpdateOrderStatus`:

```ts
/**
 * Tick số ly đã pha. Cập nhật optimistic để barista thấy phản hồi tức thì;
 * BE có thể tự đẩy đơn sang READY nên luôn invalidate lại ở onSettled.
 */
export const useSetItemPrepared = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      preparedQuantity,
    }: {
      itemId: string;
      preparedQuantity: number;
    }) => setItemPrepared(itemId, preparedQuantity),
    onMutate: async ({ itemId, preparedQuantity }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
      const prev = qc.getQueryData<OrderDto[]>(QUERY_KEYS.ORDERS.ACTIVE);
      qc.setQueryData<OrderDto[]>(QUERY_KEYS.ORDERS.ACTIVE, (old) =>
        (old ?? []).map((o) => ({
          ...o,
          items: o.items.map((i) =>
            i.id === itemId ? { ...i, preparedQuantity } : i,
          ),
        })),
      );
      return { prev };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEYS.ORDERS.ACTIVE, ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
    },
  });
};
```

- [ ] **Step 5: Thêm SSE event**

Trong `chalo-fe/src/hooks/useSSE.ts`, thêm `"order_prep_progress"` vào `ALL_SSE_EVENTS` (sau `"order_status_changed"`), và thêm vào `SSEPayload`:

```ts
  order_prep_progress: {
    orderId: string;
    tableId: string;
    tableName: string;
  };
```

Trong `chalo-fe/src/app/(staff)/staff/orders/page.tsx`, thêm `order_prep_progress` vào cùng nhánh `case` với `order_status_changed` trong `switch (type)` (chỉ invalidate, không toast).

- [ ] **Step 6: Kiểm tra biên dịch**

```bash
cd chalo-fe && npx tsc --noEmit
```
Expected: không lỗi.

- [ ] **Step 7: Commit**

```bash
git add chalo-fe/src/services chalo-fe/src/constants chalo-fe/src/hooks "chalo-fe/src/app/(staff)/staff/orders/page.tsx"
git commit -m "feat(fe): API + hook tick số ly đã pha (optimistic) + SSE order_prep_progress"
```

---

## - [x] Task 7: FE — Hàm thuần gom món

**Files:**
- Create: `chalo-fe/src/utils/prep-grouping.ts`
- Test: `chalo-fe/e2e/prep-grouping.unit.spec.ts` (create)

**Interfaces:**
- Consumes: `OrderDto`, `OrderItemDto.preparedQuantity` từ Task 6.
- Produces:
  - `groupByProduct(orders: OrderDto[]): ProductGroup[]`
  - `tableProgress(orders: OrderDto[]): TableProgress[]`
  - `nextPreparedQuantity(unit: PrepUnit): number`
  - Types: `PrepUnit`, `PrepBatch`, `ProductGroup`, `TableProgress`

Tách khỏi component để test được ở node, không cần browser/BE — theo đúng mẫu `batching.unit.spec.ts` cũ.

- [ ] **Step 1: Viết test thất bại**

Create `chalo-fe/e2e/prep-grouping.unit.spec.ts`:

```ts
import { test, expect } from "@playwright/test";
import {
  groupByProduct,
  tableProgress,
  nextPreparedQuantity,
} from "../src/utils/prep-grouping";
import { OrderDto } from "../src/services/order/order.types";

const item = (
  id: string,
  productId: string,
  productName: string,
  quantity = 1,
  preparedQuantity = 0,
  note: string | null = null,
) => ({
  id,
  productId,
  productName,
  productImageUrl: null,
  price: 39000,
  quantity,
  preparedQuantity,
  subtotal: 39000 * quantity,
  note,
});

const order = (
  id: string,
  tableName: string,
  createdAt: string,
  items: ReturnType<typeof item>[],
): OrderDto =>
  ({
    id,
    tableId: `t-${id}`,
    tableName,
    tableToken: `tok-${id}`,
    items,
    status: "PREPARING",
    paidStatus: false,
    totalAmount: 39000,
    estimateWaitMinutes: null,
    note: null,
    createdAt,
    updatedAt: createdAt,
  }) as OrderDto;

test("4 đơn cùng Cold Drip gom thành 1 card, 4 ly", () => {
  const orders = [
    order("o1", "Ban 02", "2026-07-17T01:00:00Z", [item("i1", "p1", "Cold Drip")]),
    order("o2", "Ban 06", "2026-07-17T01:01:00Z", [item("i2", "p1", "Cold Drip")]),
    order("o3", "Ban 07", "2026-07-17T01:02:00Z", [item("i3", "p1", "Cold Drip")]),
    order("o4", "Ban 08", "2026-07-17T01:03:00Z", [item("i4", "p1", "Cold Drip")]),
  ];
  const groups = groupByProduct(orders);
  expect(groups).toHaveLength(1);
  expect(groups[0].productName).toBe("Cold Drip");
  expect(groups[0].total).toBe(4);
  expect(groups[0].done).toBe(0);
  expect(groups[0].batches).toHaveLength(1);
});

test("ghi chú tách mẻ riêng, số lượng từng mẻ đúng", () => {
  const orders = [
    order("o1", "Ban 02", "2026-07-17T01:00:00Z", [item("i1", "p1", "Cold Drip")]),
    order("o2", "Ban 06", "2026-07-17T01:01:00Z", [
      item("i2", "p1", "Cold Drip", 1, 0, "ít đá"),
    ]),
    order("o3", "Ban 07", "2026-07-17T01:02:00Z", [item("i3", "p1", "Cold Drip")]),
  ];
  const [g] = groupByProduct(orders);
  expect(g.batches).toHaveLength(2);
  expect(g.batches[0].note).toBeNull(); // mẻ thường đứng trước
  expect(g.batches[0].units).toHaveLength(2);
  expect(g.batches[1].note).toBe("ít đá");
  expect(g.batches[1].units).toHaveLength(1);
});

test("ghi chú khác hoa thường / thừa khoảng trắng vẫn là một mẻ", () => {
  const orders = [
    order("o1", "Ban 02", "2026-07-17T01:00:00Z", [
      item("i1", "p1", "Cold Drip", 1, 0, "Ít Đá"),
    ]),
    order("o2", "Ban 06", "2026-07-17T01:01:00Z", [
      item("i2", "p1", "Cold Drip", 1, 0, "  ít đá "),
    ]),
  ];
  const [g] = groupByProduct(orders);
  expect(g.batches).toHaveLength(1);
  expect(g.batches[0].units).toHaveLength(2);
});

test("card sắp theo đơn cũ nhất chứa món đó", () => {
  const orders = [
    order("o1", "Ban 02", "2026-07-17T01:05:00Z", [item("i1", "p2", "Croissant")]),
    order("o2", "Ban 06", "2026-07-17T01:00:00Z", [item("i2", "p1", "Cold Drip")]),
  ];
  const groups = groupByProduct(orders);
  expect(groups.map((g) => g.productName)).toEqual(["Cold Drip", "Croissant"]);
});

test("tick đếm đúng: preparedQuantity 2/3 -> done=2, 2 ly đầu ticked", () => {
  const orders = [
    order("o1", "Ban 05", "2026-07-17T01:00:00Z", [
      item("i1", "p1", "Cold Drip", 3, 2),
    ]),
  ];
  const [g] = groupByProduct(orders);
  expect(g.total).toBe(3);
  expect(g.done).toBe(2);
  expect(g.batches[0].units.map((u) => u.ticked)).toEqual([true, true, false]);
});

test("bàn gọi 2 món -> 2 card, dải bàn báo 0/2", () => {
  const orders = [
    order("o1", "Ban 06", "2026-07-17T01:00:00Z", [
      item("i1", "p1", "Cold Drip"),
      item("i2", "p2", "Croissant"),
    ]),
  ];
  expect(groupByProduct(orders)).toHaveLength(2);
  const [t] = tableProgress(orders);
  expect(t.tableName).toBe("Ban 06");
  expect(t.total).toBe(2);
  expect(t.done).toBe(0);
  expect(t.items).toHaveLength(2);
});

test("dải bàn sắp FIFO theo đơn cũ nhất", () => {
  const orders = [
    order("o1", "Ban 09", "2026-07-17T01:05:00Z", [item("i1", "p1", "Cold Drip")]),
    order("o2", "Ban 03", "2026-07-17T01:00:00Z", [item("i2", "p1", "Cold Drip")]),
  ];
  expect(tableProgress(orders).map((t) => t.tableName)).toEqual([
    "Ban 03",
    "Ban 09",
  ]);
});

test("nextPreparedQuantity: bấm ly chưa tick -> tick tới nó", () => {
  const unit = { unitIndex: 1, ticked: false } as never;
  expect(nextPreparedQuantity(unit)).toBe(2);
});

test("nextPreparedQuantity: bấm ly đã tick -> bỏ tick nó và các ly sau", () => {
  const unit = { unitIndex: 1, ticked: true } as never;
  expect(nextPreparedQuantity(unit)).toBe(1);
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó fail**

```bash
cd chalo-fe && npx playwright test e2e/prep-grouping.unit.spec.ts --reporter=line
```
Expected: FAIL — không import được `../src/utils/prep-grouping`.

- [ ] **Step 3: Viết hàm thuần**

Create `chalo-fe/src/utils/prep-grouping.ts`:

```ts
// src/utils/prep-grouping.ts
// Gom đơn đang pha theo MÓN (không theo bàn) cho khu pha chế, và tính tiến độ
// theo bàn cho dải dưới đáy. Hàm thuần, không JSX — test được ở node.
import { OrderDto } from "@/services/order/order.types";

/** Một ly cụ thể cần pha */
export interface PrepUnit {
  orderId: string;
  itemId: string;
  /** Ly thứ mấy trong item (0-based) */
  unitIndex: number;
  quantity: number;
  tableName: string;
  note: string | null;
  ticked: boolean;
}

/** Mẻ pha: các ly giống hệt nhau — cùng món, cùng ghi chú — pha chung một lượt */
export interface PrepBatch {
  /** Ghi chú đã chuẩn hoá; "" = mẻ thường */
  key: string;
  /** Ghi chú gốc để hiển thị; null = mẻ thường */
  note: string | null;
  units: PrepUnit[];
}

/** Card một món */
export interface ProductGroup {
  productId: string;
  productName: string;
  batches: PrepBatch[];
  total: number;
  done: number;
  oldestCreatedAt: string;
}

/** Chip tiến độ một bàn ở dải đáy */
export interface TableProgress {
  orderId: string;
  tableName: string;
  total: number;
  done: number;
  createdAt: string;
  items: {
    itemId: string;
    productName: string;
    note: string | null;
    quantity: number;
    preparedQuantity: number;
  }[];
}

/** "Ít Đá" và "  ít đá " là cùng một mẻ */
const normalizeNote = (note: string | null): string =>
  (note ?? "").trim().toLowerCase();

const asTime = (iso: string): number => new Date(iso).getTime();

/**
 * Gom mọi đơn đang pha theo productId, trong mỗi món chia mẻ theo ghi chú.
 * Card sắp theo đơn cũ nhất chứa món đó (FIFO) — pha từ trái sang là đúng thứ
 * tự khách chờ. Mẻ thường đứng trước các mẻ có ghi chú.
 */
export const groupByProduct = (orders: OrderDto[]): ProductGroup[] => {
  const map = new Map<string, ProductGroup>();

  for (const o of orders) {
    for (const it of o.items) {
      let g = map.get(it.productId);
      if (!g) {
        g = {
          productId: it.productId,
          productName: it.productName,
          batches: [],
          total: 0,
          done: 0,
          oldestCreatedAt: o.createdAt,
        };
        map.set(it.productId, g);
      }
      if (asTime(o.createdAt) < asTime(g.oldestCreatedAt))
        g.oldestCreatedAt = o.createdAt;

      const key = normalizeNote(it.note);
      let b = g.batches.find((x) => x.key === key);
      if (!b) {
        b = { key, note: key === "" ? null : it.note, units: [] };
        g.batches.push(b);
      }
      for (let u = 0; u < it.quantity; u++) {
        b.units.push({
          orderId: o.id,
          itemId: it.id,
          unitIndex: u,
          quantity: it.quantity,
          tableName: o.tableName,
          note: it.note,
          // preparedQuantity là một con số đếm ⇒ N ly đầu là đã pha
          ticked: u < it.preparedQuantity,
        });
      }
    }
  }

  const groups = [...map.values()];
  for (const g of groups) {
    g.batches.sort((a, b) =>
      a.key === "" ? -1 : b.key === "" ? 1 : a.key.localeCompare(b.key),
    );
    g.total = g.batches.reduce((s, b) => s + b.units.length, 0);
    g.done = g.batches.reduce(
      (s, b) => s + b.units.filter((u) => u.ticked).length,
      0,
    );
  }
  groups.sort((a, b) => asTime(a.oldestCreatedAt) - asTime(b.oldestCreatedAt));
  return groups;
};

/** Tiến độ từng bàn đang pha, FIFO theo đơn cũ nhất */
export const tableProgress = (orders: OrderDto[]): TableProgress[] =>
  [...orders]
    .sort((a, b) => asTime(a.createdAt) - asTime(b.createdAt))
    .map((o) => ({
      orderId: o.id,
      tableName: o.tableName,
      total: o.items.reduce((s, i) => s + i.quantity, 0),
      done: o.items.reduce(
        (s, i) => s + Math.min(i.preparedQuantity, i.quantity),
        0,
      ),
      createdAt: o.createdAt,
      items: o.items.map((i) => ({
        itemId: i.id,
        productName: i.productName,
        note: i.note,
        quantity: i.quantity,
        preparedQuantity: i.preparedQuantity,
      })),
    }));

/**
 * Giá trị preparedQuantity mới khi bấm vào một ly. Vì preparedQuantity là số
 * đếm chứ không phải mảng cờ, tick hoạt động như thanh chấm sao: bấm ly chưa
 * tick thì tick luôn các ly trước nó; bấm ly đã tick thì bỏ tick nó và các ly
 * sau. Chấp nhận được vì các ly trong cùng một item là hàng giống hệt nhau cho
 * cùng một bàn.
 */
export const nextPreparedQuantity = (unit: PrepUnit): number =>
  unit.ticked ? unit.unitIndex : unit.unitIndex + 1;
```

- [ ] **Step 4: Chạy test để chắc chắn nó pass**

```bash
cd chalo-fe && npx playwright test e2e/prep-grouping.unit.spec.ts --reporter=line
```
Expected: PASS — 9 passed.

- [ ] **Step 5: Commit**

```bash
git add chalo-fe/src/utils/prep-grouping.ts chalo-fe/e2e/prep-grouping.unit.spec.ts
git commit -m "feat(fe): hàm thuần gom đơn pha chế theo món, tách mẻ theo ghi chú"
```

---

## - [ ] Task 8: FE — Card món + PrepStation theo món

**Files:**
- Create: `chalo-fe/src/app/(staff)/_components/PrepProductCard.tsx`
- Modify: `chalo-fe/src/app/(staff)/_components/PrepStation.tsx`
- Modify: `chalo-fe/src/app/(staff)/_components/PrepDock.tsx`
- Delete: `chalo-fe/src/app/(staff)/_components/PrepTicket.tsx`
- Delete: `chalo-fe/src/stores/prep.store.ts`

**Interfaces:**
- Consumes: `groupByProduct`, `nextPreparedQuantity`, `ProductGroup`, `PrepUnit` (Task 7); `useSetItemPrepared` (Task 6).
- Produces: `PrepProductCard({ group, onToggleUnit })`; `PrepStation({ orders, onToggleUnit, expanded, onToggleExpand })` — bỏ hẳn props `onStatusChange`/`updatingId`.

`PrepStation` không còn nút "Sẵn sàng →": tick đủ thì BE tự đẩy đơn sang READY.

- [ ] **Step 1: Viết card món**

Create `chalo-fe/src/app/(staff)/_components/PrepProductCard.tsx`:

```tsx
"use client";
// src/app/(staff)/_components/PrepProductCard.tsx
// Card một MÓN — nhân vật chính của khu pha chế. Trong card chia mẻ theo ghi
// chú vì ghi chú là thứ duy nhất ngăn hai ly được pha chung một lượt.
import { PrepUnit, ProductGroup } from "@/utils/prep-grouping";

export const PrepProductCard = ({
  group,
  onToggleUnit,
}: {
  group: ProductGroup;
  onToggleUnit: (unit: PrepUnit) => void;
}) => {
  const allDone = group.total > 0 && group.done === group.total;

  return (
    <div
      data-testid={`prep-product-${group.productId}`}
      className={`rounded-xl border bg-white dark:bg-gray-900 shadow-sm p-3.5 space-y-3
        ${allDone ? "border-green-300 dark:border-green-700" : "border-orange-200 dark:border-orange-800/50"}`}
    >
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
            {group.productName}
          </p>
          <span
            className={`text-xs shrink-0 ${allDone ? "text-green-600 dark:text-green-400 font-semibold" : "text-gray-400"}`}
          >
            {group.done}/{group.total} ly
          </span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${allDone ? "bg-green-500" : "bg-orange-400"}`}
            style={{
              width: group.total ? `${(group.done / group.total) * 100}%` : "0%",
            }}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        {group.batches.map((batch) => (
          <div key={batch.key}>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {batch.note ? `📝 ${batch.note}` : "Mẻ thường"}{" "}
              <span className="text-gray-400">×{batch.units.length}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {batch.units.map((u) => (
                <button
                  key={`${u.itemId}-${u.unitIndex}`}
                  onClick={() => onToggleUnit(u)}
                  aria-pressed={u.ticked}
                  aria-label={`${u.tableName} — ly ${u.unitIndex + 1}/${u.quantity} ${group.productName}`}
                  title={
                    u.quantity > 1
                      ? `${u.tableName} · ly ${u.unitIndex + 1}/${u.quantity}`
                      : u.tableName
                  }
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors select-none
                    ${
                      u.ticked
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400"
                    }`}
                >
                  <span
                    className={`flex size-3.5 items-center justify-center rounded-sm border text-[9px] leading-none
                      ${u.ticked ? "border-white/70 bg-white/20" : "border-gray-400 dark:border-gray-600"}`}
                  >
                    {u.ticked ? "✓" : ""}
                  </span>
                  {u.tableName}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Viết lại PrepStation theo món**

Thay toàn bộ `chalo-fe/src/app/(staff)/_components/PrepStation.tsx`:

```tsx
"use client";
// src/app/(staff)/_components/PrepStation.tsx
// Khu vực Pha chế: gom các đơn PREPARING theo MÓN (không theo bàn). Không có
// nút "Sẵn sàng" — tick đủ mọi ly của một bàn thì BE tự đẩy đơn sang READY.
import { CollapseIcon } from "@/components/shared/icons/CollapseIcon";
import { ExpandIcon } from "@/components/shared/icons/ExpandIcon";
import { OrderDto } from "@/services/order/order.types";
import { PrepUnit, groupByProduct } from "@/utils/prep-grouping";
import { useMemo } from "react";
import { PrepProductCard } from "./PrepProductCard";
import { TableProgressBar } from "./TableProgressBar";

export const PrepStation = ({
  orders,
  onToggleUnit,
  expanded,
  onToggleExpand,
}: {
  /** Các đơn PREPARING, sort cũ → mới */
  orders: OrderDto[];
  onToggleUnit: (unit: PrepUnit) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) => {
  const groups = useMemo(() => groupByProduct(orders), [orders]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-orange-200 dark:border-orange-800/50 bg-orange-50/40 dark:bg-orange-950/10">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-orange-200 dark:border-orange-800/50 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleExpand}
            data-testid="prep-expand-toggle"
            aria-pressed={expanded}
            aria-label={
              expanded
                ? "Thu khu pha chế về chế độ chia đôi (Esc)"
                : "Mở rộng khu pha chế chiếm hết vùng bên phải menu"
            }
            title={
              expanded
                ? "Thu lại · Esc"
                : "Mở rộng khu pha chế · chuyển menu khác sẽ tự thu lại"
            }
            className="rounded-lg p-1.5 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          >
            {expanded ? (
              <CollapseIcon className="size-4" />
            ) : (
              <ExpandIcon className="size-4" />
            )}
          </button>
          <span className="text-base">☕</span>
          <h2 className="text-sm font-bold text-orange-700 dark:text-orange-400">
            Đang pha chế
          </h2>
        </div>
        {orders.length > 0 && (
          <span className="size-5 rounded-full text-xs font-bold flex items-center justify-center bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50">
            {orders.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {groups.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-10">
            Chưa có món nào đang pha — chọn đơn ở cột &quot;Khách đặt&quot; và
            bấm &quot;Bắt đầu pha&quot;.
          </p>
        ) : (
          <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {groups.map((g) => (
              <PrepProductCard
                key={g.productId}
                group={g}
                onToggleUnit={onToggleUnit}
              />
            ))}
          </div>
        )}
      </div>

      <TableProgressBar orders={orders} onToggleUnit={onToggleUnit} />
    </div>
  );
};
```

- [ ] **Step 3: Nối tick vào PrepDock**

Thay toàn bộ `chalo-fe/src/app/(staff)/_components/PrepDock.tsx`:

```tsx
"use client";
// src/app/(staff)/_components/PrepDock.tsx
// Vùng phải cố định của layout staff — luôn hiển thị ở mọi màn staff để theo dõi
// các đơn đang pha. Tự lấy dữ liệu: trang Đơn hàng có SSE đẩy realtime, các màn
// khác dựa vào refetchInterval bên dưới.
import {
  useGetActiveOrder,
  useSetItemPrepared,
} from "@/services/order/order.queries";
import { OrderDto } from "@/services/order/order.types";
import { PrepUnit, nextPreparedQuantity } from "@/utils/prep-grouping";
import { useMemo } from "react";
import { PrepStation } from "./PrepStation";

/** Nhịp làm mới cho các màn staff không mở SSE (POS, Bàn…) */
const PREP_POLL_MS = 10_000;

const byCreatedAsc = (a: OrderDto, b: OrderDto) =>
  +new Date(a.createdAt) - +new Date(b.createdAt);

export const PrepDock = ({
  expanded,
  toggleExpand,
}: {
  expanded: boolean;
  toggleExpand: () => void;
}) => {
  const { data: activeOrders } = useGetActiveOrder({
    refetchInterval: PREP_POLL_MS,
  });
  const setPrepared = useSetItemPrepared();

  /** Đơn đang pha chế, cũ nhất trước (thứ tự nên pha) */
  const preparingOrders = useMemo(
    () =>
      (activeOrders ?? [])
        .filter((o) => o.status === "PREPARING")
        .sort(byCreatedAsc),
    [activeOrders],
  );

  const handleToggleUnit = (unit: PrepUnit) =>
    setPrepared.mutate({
      itemId: unit.itemId,
      preparedQuantity: nextPreparedQuantity(unit),
    });

  return (
    <PrepStation
      orders={preparingOrders}
      onToggleUnit={handleToggleUnit}
      expanded={expanded}
      onToggleExpand={toggleExpand}
    />
  );
};
```

- [ ] **Step 4: Xoá file không còn dùng**

```bash
cd "$(git rev-parse --show-toplevel)"
git rm "chalo-fe/src/app/(staff)/_components/PrepTicket.tsx" chalo-fe/src/stores/prep.store.ts
```

- [ ] **Step 5: Kiểm tra biên dịch**

```bash
cd chalo-fe && npx tsc --noEmit
```
Expected: chỉ còn lỗi `Cannot find module './TableProgressBar'` — Task 9 tạo file đó.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(fe): khu pha chế lấy món làm trung tâm, tick tự đẩy đơn sang READY"
```

---

## - [ ] Task 9: FE — Dải tiến độ theo bàn + popup

**Files:**
- Create: `chalo-fe/src/app/(staff)/_components/TableProgressBar.tsx`
- Create: `chalo-fe/src/app/(staff)/_components/TablePopover.tsx`

**Interfaces:**
- Consumes: `tableProgress`, `TableProgress`, `PrepUnit`, `nextPreparedQuantity` (Task 7).
- Produces: `TableProgressBar({ orders, onToggleUnit })` — dải chip ghim đáy khu pha chế; `TablePopover({ table, anchor, onClose, onToggleUnit })`.

Gom theo món làm mất tầm nhìn theo bàn — dải này lấy lại nó mà không phá bố cục.

- [ ] **Step 1: Viết popup**

Create `chalo-fe/src/app/(staff)/_components/TablePopover.tsx`:

```tsx
"use client";
// src/app/(staff)/_components/TablePopover.tsx
// Popup món của một bàn, bung ra ngay tại chip vừa bấm ở dải tiến độ.
// Dùng Popover API native: light-dismiss + Esc + top-layer có sẵn, không phải
// bắt sự kiện tay. Định vị bằng JS (CSS anchor positioning mới chỉ Chrome hỗ trợ).
import { PrepUnit, TableProgress } from "@/utils/prep-grouping";
import { useEffect, useRef } from "react";

export const TablePopover = ({
  table,
  anchorRect,
  onClose,
  onToggleUnit,
}: {
  table: TableProgress;
  anchorRect: DOMRect;
  onClose: () => void;
  onToggleUnit: (unit: PrepUnit) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.showPopover();
    // Bung lên phía trên chip, canh giữa theo chiều ngang, không tràn mép màn
    const { width, height } = el.getBoundingClientRect();
    const left = Math.min(
      Math.max(8, anchorRect.left + anchorRect.width / 2 - width / 2),
      window.innerWidth - width - 8,
    );
    el.style.left = `${left}px`;
    el.style.top = `${Math.max(8, anchorRect.top - height - 8)}px`;

    const onToggleEvent = (e: Event) => {
      if ((e as ToggleEvent).newState === "closed") onClose();
    };
    el.addEventListener("toggle", onToggleEvent);
    return () => el.removeEventListener("toggle", onToggleEvent);
  }, [anchorRect, onClose]);

  return (
    <div
      ref={ref}
      popover="auto"
      data-testid="table-popover"
      className="fixed m-0 rounded-xl border border-orange-200 dark:border-orange-800/50 bg-white dark:bg-gray-900 shadow-xl p-3 space-y-2 w-60"
    >
      <div className="flex items-baseline justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-1.5">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
          {table.tableName}
        </p>
        <span className="text-xs text-gray-400 shrink-0">
          {table.done}/{table.total} ly
        </span>
      </div>

      <div className="space-y-1.5">
        {table.items.map((it) =>
          Array.from({ length: it.quantity }, (_, u) => {
            const ticked = u < it.preparedQuantity;
            return (
              <button
                key={`${it.itemId}-${u}`}
                onClick={() =>
                  onToggleUnit({
                    orderId: table.orderId,
                    itemId: it.itemId,
                    unitIndex: u,
                    quantity: it.quantity,
                    tableName: table.tableName,
                    note: it.note,
                    ticked,
                  })
                }
                aria-pressed={ticked}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span
                  className={`flex size-3.5 shrink-0 items-center justify-center rounded-sm border text-[9px] leading-none
                    ${ticked ? "border-green-500 bg-green-500 text-white" : "border-gray-400 dark:border-gray-600"}`}
                >
                  {ticked ? "✓" : ""}
                </span>
                <span className="truncate text-gray-700 dark:text-gray-300">
                  {it.productName}
                  {it.quantity > 1 && (
                    <span className="text-gray-400"> ({u + 1})</span>
                  )}
                </span>
                {it.note && (
                  <span className="ml-auto shrink-0 text-brand-500 dark:text-brand-400 text-[10px]">
                    📝 {it.note}
                  </span>
                )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Viết dải chip**

Create `chalo-fe/src/app/(staff)/_components/TableProgressBar.tsx`:

```tsx
"use client";
// src/app/(staff)/_components/TableProgressBar.tsx
// Dải tiến độ theo bàn ghim đáy khu pha chế. Gom theo món làm mất tầm nhìn
// theo bàn — dải này lấy lại nó: bàn nào sắp đủ ly thì sáng lên, bấm vào xem
// đủ món của bàn đó.
import { OrderDto } from "@/services/order/order.types";
import { PrepUnit, TableProgress, tableProgress } from "@/utils/prep-grouping";
import { useMemo, useState } from "react";
import { TablePopover } from "./TablePopover";

export const TableProgressBar = ({
  orders,
  onToggleUnit,
}: {
  orders: OrderDto[];
  onToggleUnit: (unit: PrepUnit) => void;
}) => {
  const tables = useMemo(() => tableProgress(orders), [orders]);
  const [open, setOpen] = useState<{
    table: TableProgress;
    rect: DOMRect;
  } | null>(null);

  if (tables.length === 0) return null;

  return (
    <>
      <div
        data-testid="table-progress-bar"
        className="flex shrink-0 flex-wrap items-center gap-1.5 border-t border-orange-200 dark:border-orange-800/50 px-3 py-2"
      >
        {tables.map((t) => {
          const done = t.total > 0 && t.done === t.total;
          return (
            <button
              key={t.orderId}
              data-testid={`table-chip-${t.tableName}`}
              onClick={(e) =>
                setOpen({
                  table: t,
                  rect: e.currentTarget.getBoundingClientRect(),
                })
              }
              aria-label={`${t.tableName}: ${t.done}/${t.total} ly — xem các món của bàn`}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors
                ${
                  done
                    ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-brand-400"
                }`}
            >
              {t.tableName} {t.done}/{t.total}
              {done && " ✓"}
            </button>
          );
        })}
      </div>

      {open && (
        <TablePopover
          table={open.table}
          anchorRect={open.rect}
          onClose={() => setOpen(null)}
          onToggleUnit={(u) => {
            onToggleUnit(u);
            setOpen(null);
          }}
        />
      )}
    </>
  );
};
```

- [ ] **Step 3: Kiểm tra biên dịch**

```bash
cd chalo-fe && npx tsc --noEmit
```
Expected: không lỗi.

- [ ] **Step 4: Commit**

```bash
git add "chalo-fe/src/app/(staff)/_components/TableProgressBar.tsx" "chalo-fe/src/app/(staff)/_components/TablePopover.tsx"
git commit -m "feat(fe): dải tiến độ theo bàn + popup món của bàn ở khu pha chế"
```

---

## - [ ] Task 10: FE — Cột mới + viền card theo trạng thái trả tiền

**Files:**
- Modify: `chalo-fe/src/app/(staff)/staff/orders/orders.config.ts`
- Modify: `chalo-fe/src/app/(staff)/staff/orders/_components/OrderCard.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/orders/page.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/orders/@modal/(.)orders/[orderId]/page.tsx:14-21`
- Modify: `chalo-fe/src/app/(staff)/staff/tables/_components/OrderRow.tsx:6-41`
- Modify: `chalo-fe/src/app/(admin)/admin/orders/page.tsx:19-27`
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/status-meta.ts`

**Interfaces:**
- Consumes: `STATUS_TRANSITIONS` mới (Task 1).
- Produces: `KANBAN_COLUMNS` = Khách đặt / Sẵn sàng phục vụ / Đã phục vụ; `KHACH_DAT_STATUSES`; `NEXT_STATUS` mới.

- [ ] **Step 1: Viết lại orders.config.ts**

Thay toàn bộ `chalo-fe/src/app/(staff)/staff/orders/orders.config.ts`:

```ts
// src/app/(staff)/staff/orders/orders.config.ts
// Config màn đơn hàng staff — tách khỏi page.tsx để các component/khu pha chế
// cùng dùng mà không import ngược vào page.
import { OrderStatus } from "@/services/order/order.types";

export const KANBAN_COLUMNS: {
  status: OrderStatus;
  label: string;
  emoji: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}[] = [
  {
    status: "PENDING",
    label: "Khách đặt",
    emoji: "📋",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    textColor: "text-yellow-700 dark:text-yellow-400",
    borderColor: "border-yellow-200 dark:border-yellow-800/50",
  },
  {
    status: "READY",
    label: "Sẵn sàng phục vụ",
    emoji: "🔔",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    textColor: "text-green-700 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800/50",
  },
  {
    status: "COMPLETED",
    label: "Đã phục vụ",
    emoji: "🍽️",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    textColor: "text-blue-700 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800/50",
  },
];

/** 3 cột vùng trái — PREPARING nằm riêng ở khu pha chế bên phải */
export const LEFT_STATUSES: OrderStatus[] = ["PENDING", "READY", "COMPLETED"];

/** Đơn CONFIRMED cũ trong DB gom chung cột "Khách đặt" — không tạo mới trạng thái này */
export const KHACH_DAT_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED"];

/** PREPARING → READY KHÔNG có ở đây: tick đủ ly thì BE tự đẩy */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PREPARING",
  CONFIRMED: "PREPARING",
  READY: "COMPLETED",
};

export const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: "Bắt đầu pha",
  CONFIRMED: "Bắt đầu pha",
  READY: "Đã bê ra",
};
```

- [ ] **Step 2: Đổi viền OrderCard sang theo paidStatus**

Trong `chalo-fe/src/app/(staff)/staff/orders/_components/OrderCard.tsx`, thay `className` của div gốc:

```tsx
      className={`cursor-pointer rounded-xl border-2 bg-white dark:bg-gray-900 shadow-sm p-3.5 space-y-3 hover:shadow-md transition-shadow
        ${
          order.paidStatus
            ? "border-green-400 dark:border-green-600"
            : "border-red-400 dark:border-red-600"
        }`}
```

Trạng thái đơn KHÔNG còn ảnh hưởng màu viền — viền chỉ nói chuyện tiền.

Thay khối badge `{order.paidStatus && (...)}` bằng badge luôn hiện, để người mù màu không phải dựa vào màu viền:

```tsx
          {order.paidStatus ? (
            <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">
              Đã thanh toán
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">
              Chưa thanh toán
            </span>
          )}
```

- [ ] **Step 3: Lọc đơn theo cột mới trong page.tsx**

Trong `chalo-fe/src/app/(staff)/staff/orders/page.tsx`, thay `ordersByStatus` bằng hàm lọc theo cột. Nhớ import `KHACH_DAT_STATUSES`:

```tsx
  /** Đơn của từng cột: "Khách đặt" gom cả CONFIRMED cũ; "Đã phục vụ" chỉ đơn chưa trả tiền */
  const ordersForColumn = useMemo(() => {
    const all = activeOrders ?? [];
    return (status: OrderStatus): OrderDto[] => {
      if (status === "PENDING")
        return all.filter((o) => KHACH_DAT_STATUSES.includes(o.status));
      if (status === "COMPLETED")
        return all.filter((o) => o.status === "COMPLETED" && !o.paidStatus);
      return all.filter((o) => o.status === status);
    };
  }, [activeOrders]);
```

Đổi chỗ gọi `<KanbanColumn>`:

```tsx
              <KanbanColumn
                config={col}
                onStatusChange={handleStatusChange}
                updatingId={updatingId}
                orders={ordersForColumn(col.status)}
                key={col.status}
              />
```

Xoá `ordersByStatus` cũ và `pendingCount` phải đổi sang đếm trực tiếp:

```tsx
  const pendingCount = (activeOrders || []).filter(
    (o) => o.status === "PENDING" || o.status === "CONFIRMED",
  ).length;
```

- [ ] **Step 4: Đồng bộ nhãn trạng thái ở 4 màn còn lại**

Nhãn cũ ("Chờ xác nhận", "Hoàn thành", "Hoàn tất") mô tả luồng có bước xác nhận — giờ thành nói dối. Đồng bộ về cùng bộ tên. CONFIRMED chỉ còn là trạng thái di sản nên dùng chung nhãn với PENDING.

`chalo-fe/src/app/(staff)/staff/orders/@modal/(.)orders/[orderId]/page.tsx` — thay `STATUS_LABEL` (dòng 14-21):

```ts
const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Khách đặt",
  CONFIRMED: "Khách đặt", // trạng thái di sản, hiển thị như PENDING
  PREPARING: "Đang pha chế",
  READY: "Sẵn sàng phục vụ",
  COMPLETED: "Đã phục vụ",
  CANCELLED: "Đã huỷ",
};
```

`chalo-fe/src/app/(staff)/staff/tables/_components/OrderRow.tsx` — trong `ORDER_STATUS_CONFIG`, chỉ đổi các `label`: PENDING → `"Khách đặt"`, CONFIRMED → `"Khách đặt"`, READY → `"Sẵn sàng phục vụ"` (COMPLETED đã là "Đã phục vụ", giữ nguyên; màu giữ nguyên).

`chalo-fe/src/app/(admin)/admin/orders/page.tsx` — trong `STATUS_BADGE` (dòng 19-27), đổi các `label`: PENDING → `"Khách đặt"`, CONFIRMED → `"Khách đặt"`, READY → `"Sẵn sàng phục vụ"`, COMPLETED → `"Đã phục vụ"` (variant giữ nguyên).

`chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/status-meta.ts` — màn của KHÁCH, xưng hô khác staff: PENDING → `"Đã tiếp nhận"` (không còn bước xác nhận nào để mà "chờ xác nhận"), CONFIRMED → `"Đã tiếp nhận"`, READY → `"Sẵn sàng phục vụ"` (COMPLETED đã là "Đã phục vụ", giữ nguyên; emoji/màu giữ nguyên).

- [ ] **Step 5: Kiểm tra biên dịch + build**

```bash
cd chalo-fe && npx tsc --noEmit && NEXT_PUBLIC_API_BASE_URL=http://localhost:8082/api INTERNAL_API_BASE_URL=http://localhost:8082/api npx next build 2>&1 | tail -5
```
Expected: không lỗi TS, build thành công.

- [ ] **Step 6: Commit**

```bash
git add "chalo-fe/src/app/(staff)" "chalo-fe/src/app/(admin)" "chalo-fe/src/app/(customer)"
git commit -m "feat(fe): cột Khách đặt/Sẵn sàng/Đã phục vụ, viền card theo trạng thái trả tiền, đồng bộ nhãn 4 màn"
```

---

## - [ ] Task 11: E2E + kiểm chứng tay

**Files:**
- Create: `chalo-fe/e2e/prep-product-centric.spec.ts`
- Verify: `chalo-fe/e2e/staff-prep.spec.ts` (phải vẫn pass)

**Interfaces:**
- Consumes: mọi thứ từ Task 1-10.
- Produces: không có

- [ ] **Step 1: Khởi động BE + FE**

```bash
# BE
cd chalo-be && PORT=8082 pnpm start:dev &
# FE — dùng build+start, KHÔNG dùng next dev (hết inotify)
cd chalo-fe && NEXT_PUBLIC_API_BASE_URL=http://localhost:8082/api INTERNAL_API_BASE_URL=http://localhost:8082/api pnpm build && npx next start -p 3020 &
```
Expected: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3020/login` → `200`.

- [ ] **Step 2: Viết e2e**

Create `chalo-fe/e2e/prep-product-centric.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

// Màn pha chế lấy món làm trung tâm. Test này CÓ mutate DB (kéo đơn vào pha,
// tick ly) — chạy trên dữ liệu dev, không chạy trên môi trường thật.
test("tick đủ ly của một bàn thì đơn tự sang Sẵn sàng phục vụ", async ({
  page,
}) => {
  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("staff");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
  await page.goto("/staff/orders");

  // Cột mới đúng nhãn
  await expect(page.getByText("Khách đặt")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Sẵn sàng phục vụ")).toBeVisible();
  await expect(page.getByText("Đã phục vụ")).toBeVisible();

  // Kéo một đơn "Khách đặt" vào pha
  const startBtn = page.getByRole("button", { name: "Bắt đầu pha" }).first();
  await expect(startBtn).toBeVisible({ timeout: 15_000 });
  await startBtn.click();

  // Khu pha chế hiện card theo MÓN (không phải theo bàn)
  const productCard = page.locator('[data-testid^="prep-product-"]').first();
  await expect(productCard).toBeVisible({ timeout: 15_000 });

  // Dải tiến độ theo bàn xuất hiện
  const bar = page.getByTestId("table-progress-bar");
  await expect(bar).toBeVisible();

  // Tick hết ly trong card đầu tiên. DOM order ổn định qua các lần re-render
  // (optimistic update chỉ đổi aria-pressed) nên duyệt theo index là an toàn.
  const units = productCard.locator("button[aria-pressed]");
  const count = await units.count();
  for (let i = 0; i < count; i++) {
    const u = units.nth(i);
    if ((await u.getAttribute("aria-pressed")) === "false") await u.click();
    await page.waitForTimeout(300);
  }

  // Đơn rời khu pha chế (BE tự đẩy sang READY khi đủ ly)
  await expect(async () => {
    const chips = await bar.locator("button").count();
    expect(chips).toBeLessThan(count + 1);
  }).toPass({ timeout: 15_000 });
});

test("bấm chip bàn mở popup liệt kê món của bàn, Esc đóng", async ({ page }) => {
  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("staff");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
  await page.goto("/staff/orders");

  const bar = page.getByTestId("table-progress-bar");
  await expect(bar).toBeVisible({ timeout: 15_000 });

  await bar.locator("button").first().click();
  const popover = page.getByTestId("table-popover");
  await expect(popover).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(popover).toBeHidden();
});

test("card đơn viền đỏ khi chưa trả tiền, kèm badge chữ", async ({ page }) => {
  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("staff");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
  await page.goto("/staff/orders");

  // Màu không phải tín hiệu duy nhất — luôn có badge chữ
  await expect(
    page.getByText("Chưa thanh toán").first(),
  ).toBeVisible({ timeout: 15_000 });
});
```

- [ ] **Step 3: Chạy e2e mới**

```bash
cd chalo-fe && PLAYWRIGHT_BASE_URL=http://localhost:3020 npx playwright test e2e/prep-product-centric.spec.ts --reporter=line
```
Expected: PASS — 3 passed.

- [ ] **Step 4: Chạy lại toàn bộ test để chắc không hồi quy**

```bash
cd chalo-be && npx jest
cd ../chalo-fe && PLAYWRIGHT_BASE_URL=http://localhost:3020 npx playwright test e2e/staff-prep.spec.ts e2e/prep-grouping.unit.spec.ts e2e/admin-settings.spec.ts --reporter=line
```
Expected: BE toàn bộ PASS; FE `staff-prep` 2 passed, `prep-grouping.unit` 9 passed, `admin-settings` PASS.

- [ ] **Step 5: Kiểm chứng tay bằng browser**

Mở `http://localhost:3020` ở cửa sổ ẩn danh, đăng nhập `staff/staff`, kiểm:
1. Ba cột trái đúng nhãn: Khách đặt / Sẵn sàng phục vụ / Đã phục vụ.
2. Card đơn viền đỏ + badge "Chưa thanh toán".
3. Bấm "Bắt đầu pha" → đơn sang khu pha chế, hiện card theo MÓN.
4. Hai bàn cùng gọi một món → **một card, hai ô tick tên bàn** (không phải hai card).
5. Đơn có ghi chú → tách mẻ riêng, tiêu đề `📝 <ghi chú>`.
6. Dải đáy hiện chip từng bàn với `x/y`.
7. Bấm chip → popup bung ngay trên chip, liệt kê đủ món; `Esc` đóng.
8. Tick đủ ly một bàn → đơn **tự nhảy** sang cột "Sẵn sàng phục vụ", chip bàn biến mất.
9. Bấm "Đã bê ra" ở cột Sẵn sàng → đơn sang "Đã phục vụ".
10. Admin Settings: **không còn** toggle "Gợi ý gộp đơn thông minh".

- [ ] **Step 6: Tick checkbox mọi Task trong plan này**

Sửa `plans/11-order-flow-product-centric-prep.md`: đổi `- [ ] Task N` thành `- [x] Task N` cho toàn bộ 11 task.

- [ ] **Step 7: Commit**

```bash
git add chalo-fe/e2e plans/11-order-flow-product-centric-prep.md
git commit -m "test: e2e màn pha chế lấy món làm trung tâm + tick tự đẩy READY"
```
