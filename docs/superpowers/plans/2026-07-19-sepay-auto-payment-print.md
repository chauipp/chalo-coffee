# SePay Auto-Payment + Trạm In Hóa Đơn — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps AND task headers use checkbox (`- [ ]`) syntax for tracking — check off a task's box only when all its steps are done and verified, so an interrupted session can resume by scanning this file alone.

**Goal:** Khi khách chuyển khoản VietQR, webhook SePay tự động đánh dấu đơn đã thanh toán và trạm in ở quầy tự in hóa đơn; bỏ toàn bộ đường "khách tự khai đã thanh toán".

**Architecture:** BE (NestJS) thêm `payCode` duy nhất trên checkout session (là nội dung chuyển khoản trong QR), module `payment` mới nhận webhook SePay khớp mã + số tiền rồi tái dùng `checkoutCompleteStaff`; bảng `sepay_transactions` log + chống trùng. FE (Next.js) gom cả thanh toán 1-đơn về checkout session, thay nút tự khai bằng trạng thái "chờ ngân hàng xác nhận" (SSE), thêm trang `/staff/print-station` nghe SSE `payment_completed` và `window.print()` hóa đơn gộp (Chrome `--kiosk-printing`).

**Tech Stack:** NestJS + TypeORM + Postgres, SSE (đã có), Next.js App Router, TanStack Query, Playwright e2e, jest BE unit. Không thêm dependency mới.

**Spec:** `docs/superpowers/specs/2026-07-19-sepay-auto-payment-print-design.md`

## Global Constraints

- Package manager: **pnpm**, chạy lệnh trong từng package (`cd chalo-be` / `cd chalo-fe`).
- **KHÔNG** đổi enum `OrderStatus`, không đổi luồng trạng thái đơn, không bắt buộc trả trước.
- Migration mới phải có timestamp **lớn hơn** `1784365811591` (InitialSchema). Dùng đúng `1784850000000`.
- payCode format: `CK` + 6 ký tự thuộc bảng `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (không 0/O/1/I/L). Regex dùng chung: `/CK[A-HJKMNP-Z2-9]{6}/`.
- SSE `payment_completed` phải mang `source: 'sepay' | 'staff'` từ MỌI đường hoàn tất thanh toán.
- GET `/settings` là public — **không bao giờ** trả raw `sepayWebhookKey`, chỉ trả cờ `sepayWebhookKeySet`.
- Mỗi trang FE chỉ được có đúng MỘT node `#receipt-print` trong DOM (ràng buộc của CSS `@media print` trong `chalo-fe/src/app/globals.css:118-149`).
- FE: đọc `chalo-fe/AGENTS.md` — bản Next.js này có breaking changes; bắt chước pattern các file sẵn có, khi cần API lạ phải tra `chalo-fe/node_modules/next/dist/docs/`.
- UI copy + comment code bằng tiếng Việt, khớp giọng văn hiện có.
- Commit message: tiếng Việt, prefix `feat(be):`, `feat(fe):`, `test:`, `docs:` như log hiện tại.
- Suite e2e (`cd chalo-fe && pnpm test:e2e`) chỉ được kỳ vọng xanh lại sau Task 9 (giữa chừng có spec bám hành vi cũ).

---

### Task 1: BE — Schema + Settings (payCode, sepay_transactions, sepayWebhookKey) [x]

**Files:**
- Modify: `chalo-be/src/modules/order/entities/checkout-session.entity.ts`
- Create: `chalo-be/src/modules/payment/entities/sepay-transaction.entity.ts`
- Modify: `chalo-be/src/modules/settings/entities/app-settings.entity.ts`
- Create: `chalo-be/src/migrations/1784850000000-AddSepayPayment.ts`
- Modify: `chalo-be/src/modules/settings/dto/update-settings.dto.ts`
- Modify: `chalo-be/src/modules/settings/settings.service.ts`
- Modify: `chalo-be/src/modules/settings/settings.controller.ts`
- Test: `chalo-be/src/modules/settings/settings.service.spec.ts`

**Interfaces:**
- Consumes: entity/migration pattern hiện có.
- Produces: `CheckoutSession.payCode: string | null`; entity `SepayTransaction` + enum `SepayTxStatus { MATCHED, NO_MATCH, DUPLICATE, NEEDS_REVIEW }`; `AppSettings.sepayWebhookKey: string | null`; `SettingsService.toPublicDto(s: AppSettings)` trả object không có `sepayWebhookKey`, thêm `sepayWebhookKeySet: boolean`; `UpdateSettingsDto.sepayWebhookKey?: string` (rỗng = xóa).

- [ ] **Step 1: Viết test fail cho settings**

Trong `chalo-be/src/modules/settings/settings.service.spec.ts`: thêm `sepayWebhookKey: null` vào `defaultRow` (đang thiếu sẽ lỗi type sau khi sửa entity), và thêm 2 test cuối `describe`:

```ts
  it('update() lưu và xoá sepayWebhookKey (trim, rỗng = null)', async () => {
    repo.findOneBy.mockResolvedValue({ ...defaultRow });
    const set = await service.update({ sepayWebhookKey: '  my-key  ' });
    expect(set.sepayWebhookKey).toBe('my-key');
    const cleared = await service.update({ sepayWebhookKey: '' });
    expect(cleared.sepayWebhookKey).toBeNull();
  });

  it('toPublicDto() không lộ key, chỉ trả cờ sepayWebhookKeySet', () => {
    const dto = service.toPublicDto({ ...defaultRow, sepayWebhookKey: 'secret' });
    expect((dto as Record<string, unknown>).sepayWebhookKey).toBeUndefined();
    expect(dto.sepayWebhookKeySet).toBe(true);
    expect(service.toPublicDto({ ...defaultRow }).sepayWebhookKeySet).toBe(false);
  });
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `cd chalo-be && pnpm test -- settings.service`
Expected: FAIL — `toPublicDto` không tồn tại / type `sepayWebhookKey` không có trên UpdateSettingsDto.

- [ ] **Step 3: Sửa entities**

`checkout-session.entity.ts` — thêm sau field `clientSecret`:

```ts
  /** Nội dung CK duy nhất trong VietQR (VD "CK7F3K2M") — webhook SePay khớp phiên theo mã này */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 16, nullable: true })
  payCode: string | null;
```

`app-settings.entity.ts` — thêm sau `bankAccountName`:

```ts
  /** SePay: API key xác thực webhook (header `Authorization: Apikey <key>`). Null = webhook tắt. */
  @Column({ type: 'varchar', length: 128, nullable: true })
  sepayWebhookKey: string | null;
```

Tạo `chalo-be/src/modules/payment/entities/sepay-transaction.entity.ts`:

```ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum SepayTxStatus {
  /** Khớp mã + đúng số tiền → đã tự động hoàn tất phiên */
  MATCHED = 'MATCHED',
  /** Không tìm thấy payCode / không có phiên tương ứng — chỉ ghi log đối soát */
  NO_MATCH = 'NO_MATCH',
  /** SePay gọi lại webhook cho giao dịch đã xử lý */
  DUPLICATE = 'DUPLICATE',
  /** Có phiên nhưng lệch (sai tiền / hết hạn / đã thanh toán trước đó) — cần người đối soát */
  NEEDS_REVIEW = 'NEEDS_REVIEW',
}

/** Log mọi giao dịch SePay webhook gửi về — đối soát + chống xử lý trùng */
@Entity('sepay_transactions')
export class SepayTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** id giao dịch phía SePay */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  sepayTxId: string;

  @Column({ type: 'int' })
  transferAmount: number;

  /** Nội dung chuyển khoản nguyên văn từ ngân hàng */
  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  accountNumber: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  transactionDate: string | null;

  @Column({ type: 'uuid', nullable: true })
  matchedSessionId: string | null;

  @Column({ type: 'enum', enum: SepayTxStatus })
  status: SepayTxStatus;

  @Column({ type: 'json' })
  rawPayload: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
```

- [ ] **Step 4: Viết migration**

Tạo `chalo-be/src/migrations/1784850000000-AddSepayPayment.ts`:

```ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSepayPayment1784850000000 implements MigrationInterface {
    name = 'AddSepayPayment1784850000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checkout_sessions" ADD "payCode" character varying(16)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_checkout_sessions_payCode" ON "checkout_sessions" ("payCode")`);
        await queryRunner.query(`ALTER TABLE "app_settings" ADD "sepayWebhookKey" character varying(128)`);
        await queryRunner.query(`CREATE TYPE "public"."sepay_transactions_status_enum" AS ENUM('MATCHED', 'NO_MATCH', 'DUPLICATE', 'NEEDS_REVIEW')`);
        await queryRunner.query(`CREATE TABLE "sepay_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sepayTxId" character varying(64) NOT NULL, "transferAmount" integer NOT NULL, "content" text, "accountNumber" character varying(30), "transactionDate" character varying(32), "matchedSessionId" uuid, "status" "public"."sepay_transactions_status_enum" NOT NULL, "rawPayload" json NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_sepay_transactions_sepayTxId" UNIQUE ("sepayTxId"), CONSTRAINT "PK_sepay_transactions_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "sepay_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."sepay_transactions_status_enum"`);
        await queryRunner.query(`ALTER TABLE "app_settings" DROP COLUMN "sepayWebhookKey"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_checkout_sessions_payCode"`);
        await queryRunner.query(`ALTER TABLE "checkout_sessions" DROP COLUMN "payCode"`);
    }
}
```

- [ ] **Step 5: Sửa settings DTO/service/controller**

`update-settings.dto.ts` — thêm import `IsString` vào class-validator imports, thêm field cuối class:

```ts
  @ApiPropertyOptional({
    description: 'SePay: API key webhook. Chuỗi rỗng = xoá (tắt webhook tự xác nhận).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  sepayWebhookKey?: string;
```

`settings.service.ts` — trong `update()` thêm trước `return`:

```ts
    if (dto.sepayWebhookKey !== undefined)
      settings.sepayWebhookKey = dto.sepayWebhookKey.trim() || null;
```

và thêm method mới cuối class:

```ts
  /**
   * DTO công khai cho controller: GET /settings là public nên tuyệt đối không
   * trả raw sepayWebhookKey — chỉ trả cờ đã-cấu-hình để admin UI hiển thị.
   */
  toPublicDto(s: AppSettings) {
    const { sepayWebhookKey, ...rest } = s;
    return { ...rest, sepayWebhookKeySet: !!sepayWebhookKey };
  }
```

`settings.controller.ts` — đổi 2 handler thành async + map qua `toPublicDto`:

```ts
  async get() {
    const s = await this.settingsService.get();
    return this.settingsService.toPublicDto(s);
  }
```

```ts
  async update(@Body() dto: UpdateSettingsDto) {
    const s = await this.settingsService.update(dto);
    return this.settingsService.toPublicDto(s);
  }
```

- [ ] **Step 6: Chạy test pass + build**

Run: `cd chalo-be && pnpm test -- settings.service && pnpm build`
Expected: PASS toàn bộ, build sạch.

- [ ] **Step 7: Commit**

```bash
git add chalo-be/src/modules/order/entities/checkout-session.entity.ts chalo-be/src/modules/payment chalo-be/src/modules/settings chalo-be/src/migrations/1784850000000-AddSepayPayment.ts
git commit -m "feat(be): schema SePay — payCode phiên thanh toán, bảng sepay_transactions, sepayWebhookKey (không lộ key qua GET public)"
```

---

### Task 2: BE — Sinh payCode trong checkoutStart [x]

**Files:**
- Create: `chalo-be/src/modules/order/pay-code.ts`
- Test: `chalo-be/src/modules/order/pay-code.spec.ts`
- Modify: `chalo-be/src/modules/order/order.service.ts:871-905` (method `checkoutStart`)
- Test: `chalo-be/src/modules/order/order.service.checkout-paycode.spec.ts`
- Modify: `chalo-be/src/modules/order/order.controller.ts:332-357` (Swagger example `checkout/start`)

**Interfaces:**
- Consumes: `CheckoutSession.payCode` (Task 1).
- Produces: `generatePayCode(): string` và `PAY_CODE_REGEX` (export từ `pay-code.ts`, Task 4 dùng); response `checkoutStart` có thêm `payCode: string` (Task 5 FE dùng).

- [ ] **Step 1: Viết test fail cho helper**

Tạo `chalo-be/src/modules/order/pay-code.spec.ts`:

```ts
import { generatePayCode, PAY_CODE_REGEX } from './pay-code';

describe('generatePayCode', () => {
  it('sinh mã CK + 6 ký tự không nhầm lẫn (không 0/O/1/I/L)', () => {
    for (let i = 0; i < 200; i++) {
      const code = generatePayCode();
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^CK[A-HJKMNP-Z2-9]{6}$/);
    }
  });

  it('PAY_CODE_REGEX bắt được mã nằm giữa nội dung CK ngân hàng thêm rác', () => {
    expect('MBVCB.123 CK7F3K2M GD 999'.match(PAY_CODE_REGEX)?.[0]).toBe('CK7F3K2M');
    expect('KHONG CO MA NAO O DAY'.match(PAY_CODE_REGEX)).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `cd chalo-be && pnpm test -- pay-code`
Expected: FAIL — `Cannot find module './pay-code'`.

- [ ] **Step 3: Viết helper**

Tạo `chalo-be/src/modules/order/pay-code.ts`:

```ts
import { randomInt } from 'crypto';

/** Bảng chữ cái không nhầm lẫn khi khách gõ tay: bỏ 0/O, 1/I/L */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Sinh nội dung chuyển khoản duy nhất cho một phiên thanh toán, VD "CK7F3K2M" */
export function generatePayCode(): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `CK${s}`;
}

/**
 * Tìm payCode trong nội dung CK thực tế (ngân hàng thường chèn thêm mã GD,
 * tên người gửi...). So khớp trên chuỗi ĐÃ uppercase.
 */
export const PAY_CODE_REGEX = /CK[A-HJKMNP-Z2-9]{6}/;
```

- [ ] **Step 4: Chạy test pass**

Run: `cd chalo-be && pnpm test -- pay-code`
Expected: PASS (2 tests).

- [ ] **Step 5: Viết test fail cho checkoutStart**

Tạo `chalo-be/src/modules/order/order.service.checkout-paycode.spec.ts`:

```ts
import { OrderService } from './order.service';
import { CheckoutSession } from './entities/checkout-session.entity';
import { Table } from '../table/entities/table.entity';
import { Order } from './entities/order.entity';

describe('OrderService.checkoutStart — payCode', () => {
  const table = { id: 'tbl-1', qrToken: 'tok-1', name: 'Bàn 01' };
  const order = {
    id: 'ord-1',
    tableToken: 'tok-1',
    totalAmount: 50000,
    status: 'PENDING',
    paidStatus: false,
    items: [],
    table,
  };

  // Fake manager: chỉ mock đúng những gì checkoutStart + resolvePayableOrders chạm tới
  function build(sessionFindOne: jest.Mock) {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ ...order }]),
    };
    const repos = new Map<unknown, unknown>([
      [Table, { findOne: jest.fn().mockResolvedValue(table) }],
      [Order, { createQueryBuilder: jest.fn(() => qb) }],
      [CheckoutSession, { findOne: sessionFindOne }],
    ]);
    const manager = {
      getRepository: jest.fn((e: unknown) => repos.get(e)),
      create: jest.fn((_e: unknown, v: unknown) => v),
      save: jest.fn((_e: unknown, v: Record<string, unknown>) =>
        Promise.resolve({ id: 'sess-1', ...v }),
      ),
    };
    const dataSource = {
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb(manager)),
    };
    const service = new OrderService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      dataSource as never,
      { emit: jest.fn() } as never,
      {} as never,
    );
    return { service };
  }

  it('gán payCode đúng định dạng và trả về trong response', async () => {
    const { service } = build(jest.fn().mockResolvedValue(null));
    const res = await service.checkoutStart({ tableToken: 'tok-1' });
    expect(res.payCode).toMatch(/^CK[A-HJKMNP-Z2-9]{6}$/);
  });

  it('trùng payCode thì sinh lại (unique retry)', async () => {
    const sessionFindOne = jest
      .fn()
      .mockResolvedValueOnce({ id: 'sess-x' }) // lần 1: mã đã tồn tại
      .mockResolvedValueOnce(null); // lần 2: ok
    const { service } = build(sessionFindOne);
    const res = await service.checkoutStart({ tableToken: 'tok-1' });
    expect(sessionFindOne).toHaveBeenCalledTimes(2);
    expect(res.payCode).toMatch(/^CK[A-HJKMNP-Z2-9]{6}$/);
  });
});
```

Run: `cd chalo-be && pnpm test -- checkout-paycode`
Expected: FAIL — `res.payCode` là `undefined`.

- [ ] **Step 6: Sửa checkoutStart**

`order.service.ts` — thêm import đầu file:

```ts
import { generatePayCode } from './pay-code';
```

Trong `checkoutStart` (hiện tại `order.service.ts:871-905`), sau dòng `const expiresAt = ...` thêm:

```ts
      // Nội dung CK duy nhất — webhook SePay khớp phiên theo mã này
      const sessRepo = manager.getRepository(CheckoutSession);
      let payCode = generatePayCode();
      let attempts = 0;
      while (await sessRepo.findOne({ where: { payCode } })) {
        attempts += 1;
        if (attempts >= 5) {
          throw new BadRequestException(
            'Không sinh được mã thanh toán, vui lòng thử lại',
          );
        }
        payCode = generatePayCode();
      }
```

Thêm `payCode,` vào object `manager.create(CheckoutSession, { ... })`, và thêm `payCode: saved.payCode,` vào object return (cạnh `clientSecret`).

Trong `order.controller.ts` Swagger example của `checkout/start` (dòng ~342-352) thêm `payCode: 'CK7F3K2M',` cạnh `clientSecret: 'hex',`.

- [ ] **Step 7: Chạy test pass + toàn suite BE**

Run: `cd chalo-be && pnpm test -- checkout-paycode && pnpm test`
Expected: PASS tất cả (test cũ không đụng checkoutStart).

- [ ] **Step 8: Commit**

```bash
git add chalo-be/src/modules/order
git commit -m "feat(be): checkout session sinh payCode duy nhất làm nội dung chuyển khoản VietQR"
```

---

### Task 3: BE — SSE `source` + `payment_review_needed`; đóng đường tự khai [x]

**Files:**
- Modify: `chalo-be/src/modules/sse/sse.service.ts:5-13`
- Modify: `chalo-be/src/modules/order/order.service.ts` (paySingleOrder :789-797, payUnpaidOrdersByTable :833-843, checkoutComplete :967-1031 XÓA, checkoutCompleteStaff :1033-1091)
- Modify: `chalo-be/src/modules/order/order.controller.ts` (route `checkout/complete` :359-381 XÓA; guard `pay` :248-267, `pay-all` :269-289)
- Modify: `chalo-be/src/modules/order/dto/checkout.dto.ts:43-55` (xóa `CheckoutCompleteDto`)

**Interfaces:**
- Consumes: `SseService.emit`.
- Produces: `SseEventType` có thêm `'payment_review_needed'`; `checkoutCompleteStaff(dto: CheckoutCompleteStaffDto, source: 'staff' | 'sepay' = 'staff')` (Task 4 gọi với `'sepay'`); mọi emit `payment_completed` mang `source`.
- **Ghi chú spec (addendum):** spec ghi "pay-all giữ nguyên", nhưng để nhất quán mục tiêu đóng lỗ hổng tự khai, `/order/pay-all` cũng chuyển JWT-guarded (không còn caller nào phía khách — FE gỡ ở Task 6).

- [x] **Step 1: SseEventType thêm sự kiện mới**

`sse.service.ts` — thêm vào union `SseEventType`:

```ts
  | 'payment_review_needed'
```

- [x] **Step 2: Thêm `source` vào mọi emit payment_completed**

Trong `paySingleOrder` (emit tại :789-797) thêm `source: 'staff',` vào `data`. Tương tự trong `payUnpaidOrdersByTable` (emit tại :833-843).

Đổi chữ ký `checkoutCompleteStaff`:

```ts
  async checkoutCompleteStaff(
    dto: CheckoutCompleteStaffDto,
    source: 'staff' | 'sepay' = 'staff',
  ) {
```

và trong emit `payment_completed` của nó thêm `source,` vào `data`.

- [x] **Step 3: Xóa đường tự khai của khách**

- Xóa nguyên method `checkoutComplete` trong `order.service.ts` (:967-1031).
- Xóa route `@Post('checkout/complete')` trong `order.controller.ts` (:359-381).
- Xóa class `CheckoutCompleteDto` trong `dto/checkout.dto.ts` và mọi import của nó (service + controller).

- [x] **Step 4: Guard 2 endpoint thanh toán tay**

Trong `order.controller.ts`, cả `@Post('pay')` và `@Post('pay-all')`: bỏ `@Public()`, thay bằng:

```ts
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
```

(giữ `@HttpCode(200)` và swagger example như cũ).

- [x] **Step 5: Build + test**

Run: `cd chalo-be && pnpm build && pnpm test`
Expected: build sạch, toàn bộ test PASS.

- [x] **Step 6: Commit**

```bash
git add chalo-be/src
git commit -m "feat(be): payment_completed mang source, thêm payment_review_needed; xoá checkout/complete tự khai, JWT-guard /order/pay + /order/pay-all"
```

---

### Task 4: BE — PaymentModule: webhook SePay [x]

**Files:**
- Create: `chalo-be/src/modules/payment/dto/sepay-webhook.dto.ts`
- Create: `chalo-be/src/modules/payment/sepay-webhook.service.ts`
- Create: `chalo-be/src/modules/payment/sepay-webhook.controller.ts`
- Create: `chalo-be/src/modules/payment/payment.module.ts`
- Test: `chalo-be/src/modules/payment/sepay-webhook.service.spec.ts`
- Modify: `chalo-be/src/modules/order/order.module.ts` (export OrderService)
- Modify: `chalo-be/src/app.module.ts` (import PaymentModule)

**Interfaces:**
- Consumes: `SepayTransaction`/`SepayTxStatus` (Task 1), `PAY_CODE_REGEX` (Task 2), `checkoutCompleteStaff(dto, 'sepay')` (Task 3), `SettingsService.get()`, `SseService.emit`.
- Produces: `POST /payment/sepay/webhook` (public + api-key), response `{ status: SepayTxStatus, txId?: string }`.

- [x] **Step 1: Viết DTO**

Tạo `chalo-be/src/modules/payment/dto/sepay-webhook.dto.ts` (ValidationPipe toàn cục đã bật `transform` + `enableImplicitConversion` — xem `chalo-be/src/main.ts:54-57`; `whitelist: true` nên các field lạ của SePay bị strip, `rawPayload` chỉ còn field khai báo — chấp nhận được):

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/** Payload SePay gửi khi có giao dịch mới (docs.sepay.vn — webhooks) */
export class SepayWebhookDto {
  @ApiProperty({ description: 'ID giao dịch phía SePay' })
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({ description: 'Ngân hàng (VD "MBBank")' })
  @IsOptional()
  @IsString()
  gateway?: string;

  @ApiPropertyOptional({ description: 'VD "2026-07-19 14:02:37"' })
  @IsOptional()
  @IsString()
  transactionDate?: string;

  @ApiPropertyOptional({ description: 'Số tài khoản nhận' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Nội dung chuyển khoản' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: '"in" = tiền vào, "out" = tiền ra' })
  @IsIn(['in', 'out'])
  transferType: 'in' | 'out';

  @ApiProperty({ description: 'Số tiền giao dịch (VND, số nguyên)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  transferAmount: number;

  @ApiPropertyOptional({ description: 'Mã tham chiếu phía ngân hàng' })
  @IsOptional()
  @IsString()
  referenceCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
```

- [x] **Step 2: Viết test fail cho service**

Tạo `chalo-be/src/modules/payment/sepay-webhook.service.spec.ts`:

```ts
import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { SepayWebhookService } from './sepay-webhook.service';
import { SepayTxStatus } from './entities/sepay-transaction.entity';
import { CheckoutSessionStatus } from '../order/entities/checkout-session.entity';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';

describe('SepayWebhookService', () => {
  const KEY = 'test-api-key';
  const futureDate = new Date(Date.now() + 10 * 60 * 1000);

  const session = () => ({
    id: 'sess-1',
    tableId: 'tbl-1',
    tableToken: 'tok-1',
    orderIds: ['ord-1'],
    totalAmount: 85000,
    status: CheckoutSessionStatus.PENDING,
    payCode: 'CK7F3K2M',
    expiresAt: futureDate,
  });

  const dto = (over: Partial<SepayWebhookDto> = {}): SepayWebhookDto =>
    ({
      id: 'tx-100',
      transferType: 'in',
      transferAmount: 85000,
      content: 'MBVCB CK7F3K2M chuyen tien',
      ...over,
    }) as SepayWebhookDto;

  let txRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let sessionRepo: { findOne: jest.Mock };
  let settingsService: { get: jest.Mock };
  let orderService: { checkoutCompleteStaff: jest.Mock };
  let sseService: { emit: jest.Mock };
  let service: SepayWebhookService;

  beforeEach(() => {
    txRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((v) => v),
      save: jest.fn((v) => Promise.resolve({ id: 'log-1', ...v })),
    };
    sessionRepo = { findOne: jest.fn().mockResolvedValue(session()) };
    settingsService = {
      get: jest.fn().mockResolvedValue({ sepayWebhookKey: KEY }),
    };
    orderService = {
      checkoutCompleteStaff: jest.fn().mockResolvedValue({ idempotent: false }),
    };
    sseService = { emit: jest.fn() };
    service = new SepayWebhookService(
      txRepo as never,
      sessionRepo as never,
      settingsService as never,
      orderService as never,
      sseService as never,
    );
  });

  it('sai API key → 401', async () => {
    await expect(
      service.handleWebhook('Apikey wrong-key', dto()),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('chưa cấu hình key → 503', async () => {
    settingsService.get.mockResolvedValue({ sepayWebhookKey: null });
    await expect(
      service.handleWebhook(`Apikey ${KEY}`, dto()),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('trùng sepayTxId → DUPLICATE, không complete', async () => {
    txRepo.findOne.mockResolvedValue({ id: 'log-0' });
    const res = await service.handleWebhook(`Apikey ${KEY}`, dto());
    expect(res.status).toBe(SepayTxStatus.DUPLICATE);
    expect(orderService.checkoutCompleteStaff).not.toHaveBeenCalled();
  });

  it('tiền RA (transferType=out) → NO_MATCH', async () => {
    const res = await service.handleWebhook(
      `Apikey ${KEY}`,
      dto({ transferType: 'out' }),
    );
    expect(res.status).toBe(SepayTxStatus.NO_MATCH);
  });

  it('không có payCode trong nội dung → NO_MATCH', async () => {
    const res = await service.handleWebhook(
      `Apikey ${KEY}`,
      dto({ content: 'chuyen tien an trua' }),
    );
    expect(res.status).toBe(SepayTxStatus.NO_MATCH);
    expect(sessionRepo.findOne).not.toHaveBeenCalled();
  });

  it('có mã nhưng không có phiên → NO_MATCH', async () => {
    sessionRepo.findOne.mockResolvedValue(null);
    const res = await service.handleWebhook(`Apikey ${KEY}`, dto());
    expect(res.status).toBe(SepayTxStatus.NO_MATCH);
  });

  it('sai số tiền → NEEDS_REVIEW + SSE payment_review_needed, không complete', async () => {
    const res = await service.handleWebhook(
      `Apikey ${KEY}`,
      dto({ transferAmount: 10000 }),
    );
    expect(res.status).toBe(SepayTxStatus.NEEDS_REVIEW);
    expect(orderService.checkoutCompleteStaff).not.toHaveBeenCalled();
    expect(sseService.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'payment_review_needed' }),
    );
  });

  it('phiên hết hạn → NEEDS_REVIEW', async () => {
    sessionRepo.findOne.mockResolvedValue({
      ...session(),
      expiresAt: new Date(Date.now() - 1000),
    });
    const res = await service.handleWebhook(`Apikey ${KEY}`, dto());
    expect(res.status).toBe(SepayTxStatus.NEEDS_REVIEW);
  });

  it('phiên ĐÃ thanh toán trước đó → NEEDS_REVIEW (nguy cơ thu trùng)', async () => {
    sessionRepo.findOne.mockResolvedValue({
      ...session(),
      status: CheckoutSessionStatus.COMPLETED,
    });
    const res = await service.handleWebhook(`Apikey ${KEY}`, dto());
    expect(res.status).toBe(SepayTxStatus.NEEDS_REVIEW);
    expect(orderService.checkoutCompleteStaff).not.toHaveBeenCalled();
  });

  it('khớp mã + đúng tiền → complete với source sepay, MATCHED', async () => {
    const res = await service.handleWebhook(`Apikey ${KEY}`, dto());
    expect(orderService.checkoutCompleteStaff).toHaveBeenCalledWith(
      { sessionId: 'sess-1' },
      'sepay',
    );
    expect(res.status).toBe(SepayTxStatus.MATCHED);
    expect(txRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: SepayTxStatus.MATCHED,
        matchedSessionId: 'sess-1',
      }),
    );
  });
});
```

Run: `cd chalo-be && pnpm test -- sepay-webhook`
Expected: FAIL — module chưa tồn tại.

- [x] **Step 3: Viết service**

Tạo `chalo-be/src/modules/payment/sepay-webhook.service.ts`:

```ts
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { timingSafeEqual } from 'crypto';
import {
  SepayTransaction,
  SepayTxStatus,
} from './entities/sepay-transaction.entity';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import {
  CheckoutSession,
  CheckoutSessionStatus,
} from '../order/entities/checkout-session.entity';
import { PAY_CODE_REGEX } from '../order/pay-code';
import { OrderService } from '../order/order.service';
import { SettingsService } from '../settings/settings.service';
import { SseService } from '../sse/sse.service';

type TxBase = Pick<
  SepayTransaction,
  | 'sepayTxId'
  | 'transferAmount'
  | 'content'
  | 'accountNumber'
  | 'transactionDate'
  | 'rawPayload'
>;

@Injectable()
export class SepayWebhookService {
  private readonly logger = new Logger(SepayWebhookService.name);

  constructor(
    @InjectRepository(SepayTransaction)
    private readonly txRepo: Repository<SepayTransaction>,
    @InjectRepository(CheckoutSession)
    private readonly sessionRepo: Repository<CheckoutSession>,
    private readonly settingsService: SettingsService,
    private readonly orderService: OrderService,
    private readonly sseService: SseService,
  ) {}

  async handleWebhook(authorization: string | undefined, dto: SepayWebhookDto) {
    await this.assertApiKey(authorization);
    return this.process(dto);
  }

  /** SePay gửi header `Authorization: Apikey <key>` — so khớp timing-safe */
  private async assertApiKey(authorization?: string) {
    const settings = await this.settingsService.get();
    const expected = settings.sepayWebhookKey;
    if (!expected) {
      throw new ServiceUnavailableException('SePay webhook chưa được cấu hình');
    }
    const provided = (authorization ?? '').replace(/^apikey\s+/i, '').trim();
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Sai API key');
    }
  }

  private async process(dto: SepayWebhookDto) {
    // 1) Chống trùng: SePay có thể retry webhook cho cùng giao dịch
    const existing = await this.txRepo.findOne({
      where: { sepayTxId: String(dto.id) },
    });
    if (existing) {
      return { status: SepayTxStatus.DUPLICATE, txId: existing.id };
    }

    const base: TxBase = {
      sepayTxId: String(dto.id),
      transferAmount: dto.transferAmount,
      content: dto.content ?? null,
      accountNumber: dto.accountNumber ?? null,
      transactionDate: dto.transactionDate ?? null,
      rawPayload: { ...dto } as unknown as Record<string, unknown>,
    };

    // 2) Chỉ quan tâm tiền VÀO
    if (dto.transferType !== 'in') {
      return this.saveTx(base, SepayTxStatus.NO_MATCH, null);
    }

    // 3) Tìm payCode trong nội dung CK (ngân hàng có thể chèn thêm chữ)
    const match = (dto.content ?? '').toUpperCase().match(PAY_CODE_REGEX);
    if (!match) return this.saveTx(base, SepayTxStatus.NO_MATCH, null);

    const session = await this.sessionRepo.findOne({
      where: { payCode: match[0] },
    });
    if (!session) return this.saveTx(base, SepayTxStatus.NO_MATCH, null);

    // 4) Các ca lệch → KHÔNG tự gạt, cần người đối soát (spec mục 4.3)
    const mismatch =
      session.status !== CheckoutSessionStatus.PENDING
        ? 'Phiên đã kết thúc trước đó — nguy cơ thu trùng'
        : new Date() > session.expiresAt
          ? 'Phiên thanh toán đã hết hạn'
          : dto.transferAmount !== session.totalAmount
            ? `Số tiền không khớp (cần ${session.totalAmount})`
            : null;
    if (mismatch) return this.review(base, session, mismatch);

    // 5) Khớp — hoàn tất như thu ngân xác nhận, nguồn 'sepay'
    try {
      await this.orderService.checkoutCompleteStaff(
        { sessionId: session.id },
        'sepay',
      );
    } catch (e) {
      this.logger.error(`Hoàn tất phiên ${session.id} thất bại`, e as Error);
      return this.review(base, session, 'Hoàn tất phiên thất bại, cần kiểm tra tay');
    }
    return this.saveTx(base, SepayTxStatus.MATCHED, session.id);
  }

  private async saveTx(
    base: TxBase,
    status: SepayTxStatus,
    matchedSessionId: string | null,
  ) {
    try {
      const tx = await this.txRepo.save(
        this.txRepo.create({ ...base, status, matchedSessionId }),
      );
      return { status, txId: tx.id };
    } catch (e) {
      // 2 webhook cùng giao dịch chạy song song → unique sepayTxId đỡ nốt
      if ((e as { code?: string }).code === '23505') {
        return { status: SepayTxStatus.DUPLICATE };
      }
      throw e;
    }
  }

  private async review(base: TxBase, session: CheckoutSession, reason: string) {
    const res = await this.saveTx(base, SepayTxStatus.NEEDS_REVIEW, session.id);
    this.sseService.emit({
      type: 'payment_review_needed',
      data: {
        sepayTxId: base.sepayTxId,
        content: base.content,
        transferAmount: base.transferAmount,
        sessionId: session.id,
        tableId: session.tableId,
        reason,
      },
    });
    return res;
  }
}
```

- [x] **Step 4: Chạy test pass**

Run: `cd chalo-be && pnpm test -- sepay-webhook`
Expected: PASS (10 tests).

- [x] **Step 5: Controller + module + wiring**

Tạo `chalo-be/src/modules/payment/sepay-webhook.controller.ts`:

```ts
import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SepayWebhookService } from './sepay-webhook.service';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Payment')
@Controller('payment')
export class SepayWebhookController {
  constructor(private readonly sepayWebhookService: SepayWebhookService) {}

  @Post('sepay/webhook')
  @Public()
  @SkipThrottle()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Webhook SePay — tự động xác nhận thanh toán khi tiền về',
    description:
      'SePay gọi khi tài khoản nhận giao dịch mới. Xác thực bằng header ' +
      '`Authorization: Apikey <sepayWebhookKey>` (cấu hình trong Cài đặt admin). ' +
      'Luôn trả 200 khi đã ghi nhận (kể cả không khớp) để SePay không retry vô hạn.',
  })
  @ApiHeader({ name: 'authorization', description: 'Apikey <sepayWebhookKey>' })
  @ApiOkResponse({
    schema: {
      example: { code: 200, message: 'success', data: { status: 'MATCHED', txId: 'uuid' } },
    },
  })
  webhook(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: SepayWebhookDto,
  ) {
    return this.sepayWebhookService.handleWebhook(authorization, dto);
  }
}
```

Tạo `chalo-be/src/modules/payment/payment.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SepayTransaction } from './entities/sepay-transaction.entity';
import { CheckoutSession } from '../order/entities/checkout-session.entity';
import { SepayWebhookController } from './sepay-webhook.controller';
import { SepayWebhookService } from './sepay-webhook.service';
import { OrderModule } from '../order/order.module';
import { SettingsModule } from '../settings/settings.module';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SepayTransaction, CheckoutSession]),
    OrderModule,
    SettingsModule,
    SseModule,
  ],
  controllers: [SepayWebhookController],
  providers: [SepayWebhookService],
})
export class PaymentModule {}
```

`order.module.ts` — thêm `exports: [OrderService],` sau `providers`.

`app.module.ts` — thêm `import { PaymentModule } from './modules/payment/payment.module';` và `PaymentModule,` vào mảng `imports` (sau `SettingsModule`).

- [x] **Step 6: Build + full test + smoke thủ công (smoke thủ công SKIP — dev DB/port đang bận, xem ghi chú controller)**

Run: `cd chalo-be && pnpm build && pnpm test`
Expected: PASS.

Smoke (cần Postgres dev đang chạy): `pnpm start:dev`, đợi migration chạy, rồi:

```bash
curl -s -X POST http://localhost:8080/api/payment/sepay/webhook \
  -H 'Content-Type: application/json' \
  -d '{"id":1,"transferType":"in","transferAmount":10000,"content":"test"}'
```

Expected: HTTP 503 (`SePay webhook chưa được cấu hình`) — vì chưa đặt key. Sau khi PUT `/settings` với `sepayWebhookKey`, gọi lại không header → 401; đúng header + content không mã → `{"status":"NO_MATCH"}`.

- [x] **Step 7: Commit**

```bash
git add chalo-be/src
git commit -m "feat(be): webhook SePay — khớp payCode + số tiền, tự complete phiên, log sepay_transactions, cảnh báo đối soát"
```

---

### Task 5: FE — Checkout cả bàn: chờ webhook thay vì tự khai [x]

**Files:**
- Modify: `chalo-fe/src/services/order/order.types.ts` (CheckoutSessionResult + xóa types complete)
- Modify: `chalo-fe/src/services/order/order.api.ts` (xóa `checkoutComplete`)
- Modify: `chalo-fe/src/services/order/order.queries.ts` (xóa `useCheckoutComplete`)
- Modify: `chalo-fe/src/constants/api-endpoints.ts:61` (xóa `CHECKOUT_COMPLETE`)
- Modify: `chalo-fe/src/hooks/useSSE.ts` (types sự kiện mới)
- Modify: `chalo-fe/src/hooks/useCustomerOrderEvents.ts` (thêm callback)
- Create: `chalo-fe/src/components/shared/PaymentQRBox.tsx`
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutSessionPanel.tsx`
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/checkout/page.tsx`

**Interfaces:**
- Consumes: BE `checkout/start` trả `payCode` (Task 2); SSE `payment_completed { sessionId?, orderIds, totalAmount, source? }`.
- Produces: `PaymentQRBox({ totalAmount, expiresAt, payCode, onRestart })` (Task 6 tái dùng); `useCustomerOrderEvents(tableToken, opts?: { onPaymentCompleted? })` (Task 6 tái dùng); `CheckoutSessionResult.payCode: string`.

- [ ] **Step 1: Types + API + endpoint constants**

`order.types.ts`:
- Trong `CheckoutSessionResult` thêm (cạnh `clientSecret: string;`):

```ts
  /** Nội dung chuyển khoản BE sinh sẵn — nhúng nguyên văn vào VietQR */
  payCode: string;
```

- Xóa `CheckoutCompletePayload` và `CheckoutCompleteResult` (interface nào chỉ phục vụ complete tự khai).

`order.api.ts`: xóa hàm `checkoutComplete` + import 2 type vừa xóa.
`order.queries.ts`: xóa `useCheckoutComplete`.
`api-endpoints.ts`: xóa dòng `CHECKOUT_COMPLETE: "/order/checkout/complete",`.

`useSSE.ts`:
- `ALL_SSE_EVENTS` thêm `"payment_review_needed",`.
- `SSEPayload.payment_completed` thêm `source?: "sepay" | "staff";`.
- Thêm vào `SSEPayload`:

```ts
  payment_review_needed: {
    sepayTxId: string;
    content: string | null;
    transferAmount: number;
    sessionId: string;
    tableId: string;
    reason: string;
  };
```

- [ ] **Step 2: useCustomerOrderEvents nhận callback**

Ghi đè toàn bộ `chalo-fe/src/hooks/useCustomerOrderEvents.ts`:

```ts
// src/hooks/useCustomerOrderEvents.ts
"use client";
import { API, QUERY_KEYS } from "@/constants";
import { API_BASE } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { SSEPayload, useSSE } from "./useSSE";

/**
 * Khách theo dõi realtime đơn của bàn mình qua stream SSE public
 * `/order/events/by-table/:token` — mọi sự kiện đều invalidate các query
 * liên quan để UI cập nhật ngay thay vì chờ polling.
 * `onPaymentCompleted`: gọi khi bàn này có thanh toán hoàn tất (webhook SePay
 * hoặc nhân viên xác nhận) — dùng để tự chuyển màn "đã thanh toán".
 */
export function useCustomerOrderEvents(
  tableToken: string,
  opts?: {
    onPaymentCompleted?: (data: SSEPayload["payment_completed"]) => void;
  },
) {
  const qc = useQueryClient();

  useSSE({
    url: `${API_BASE}${API.SSE.ORDER_EVENTS_BY_TABLE}/${tableToken}`,
    enabled: !!tableToken,
    onEvent: (type, data) => {
      if (type === "payment_completed") {
        opts?.onPaymentCompleted?.(data as SSEPayload["payment_completed"]);
      }
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.ORDERS.BY_TABLE_TOKEN(tableToken),
      });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ESTIMATED_WAIT() });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.ORDERS.CHECKOUT_PREVIEW(tableToken),
      });
    },
  });
}
```

- [ ] **Step 3: Component chia sẻ PaymentQRBox**

Tạo `chalo-fe/src/components/shared/PaymentQRBox.tsx`:

```tsx
"use client";
// src/components/shared/PaymentQRBox.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { buildVietQR } from "@/lib/vietqr";
import { useGetSettings } from "@/services/settings";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

/**
 * Khối VietQR + đếm ngược hết hạn + trạng thái "chờ ngân hàng xác nhận".
 * Không còn nút tự khai "Tôi đã thanh toán" — thanh toán được xác nhận tự động
 * qua webhook SePay (hoặc nhân viên xác nhận tay), màn khách nhận SSE là xong.
 */
export const PaymentQRBox = ({
  totalAmount,
  expiresAt,
  payCode,
  onRestart,
}: {
  totalAmount: number;
  expiresAt: string;
  /** Nội dung chuyển khoản BE sinh sẵn (VD "CK7F3K2M") — dùng NGUYÊN VĂN */
  payCode: string;
  onRestart: () => void;
}) => {
  const [remainingMs, setRemainingMs] = useState<number>(
    () => new Date(expiresAt).getTime() - Date.now(),
  );
  const { data: settings } = useGetSettings();

  useEffect(() => {
    const id = setInterval(() => {
      setRemainingMs(new Date(expiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const expired = remainingMs <= 0;
  const mm = Math.max(0, Math.floor(remainingMs / 60000));
  const ss = Math.max(0, Math.floor((remainingMs % 60000) / 1000));

  const bankConfigured =
    !!settings?.bankBin && !!settings?.bankAccountNo && !!settings?.bankAccountName;

  // QR động: số tiền khoá sẵn + nội dung = payCode để webhook khớp chính xác
  const qrPayload =
    bankConfigured && !expired
      ? buildVietQR({
          bankBin: settings!.bankBin!,
          accountNo: settings!.bankAccountNo!,
          amount: totalAmount,
          addInfo: payCode,
        })
      : null;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">
          {totalAmount.toLocaleString("vi-VN")}đ
        </p>
        <p
          className={`mt-2 text-sm font-medium ${
            expired
              ? "text-red-600 dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {expired
            ? "Phiên đã hết hạn"
            : `Hết hạn sau ${mm}:${ss.toString().padStart(2, "0")}`}
        </p>
      </div>

      {qrPayload && (
        <div className="flex flex-col items-center gap-3">
          {/* QR luôn nền trắng để app ngân hàng quét được ở cả dark mode */}
          <div
            data-testid="vietqr-code"
            className="rounded-2xl border-2 border-gray-100 bg-white p-3 dark:border-gray-800"
          >
            <QRCodeSVG value={qrPayload} size={208} marginSize={1} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {settings!.bankAccountName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {settings!.bankAccountNo}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Nội dung CK:{" "}
              <span className="font-mono font-semibold">{payCode}</span> (đã
              điền sẵn trong QR — đừng sửa khi chuyển).
            </p>
          </div>
        </div>
      )}

      {expired ? (
        <button
          onClick={onRestart}
          className="w-full rounded-2xl bg-brand-500 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 active:scale-[0.98] transition-all"
        >
          Tạo lại phiên thanh toán
        </button>
      ) : (
        <>
          <div
            data-testid="awaiting-bank"
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-50 dark:bg-blue-900/20 py-3.5 text-sm font-medium text-blue-700 dark:text-blue-300"
          >
            <SpinnerIcon className="size-4 animate-spin" />
            Đang chờ ngân hàng xác nhận — thường vài giây sau khi chuyển
          </div>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Trả tiền mặt? Ra quầy để nhân viên xác nhận — màn hình sẽ tự cập
            nhật.
          </p>
        </>
      )}
    </div>
  );
};
```

- [ ] **Step 4: CheckoutSessionPanel thành wrapper mỏng**

Ghi đè toàn bộ `CheckoutSessionPanel.tsx`:

```tsx
// src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutSessionPanel.tsx
"use client";
import { PaymentQRBox } from "@/components/shared/PaymentQRBox";

export const CheckoutSessionPanel = ({
  totalAmount,
  expiresAt,
  payCode,
  onRestart,
}: {
  totalAmount: number;
  expiresAt: string;
  payCode: string;
  onRestart: () => void;
}) => (
  <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-4">
    <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
      Phiên thanh toán gộp
    </p>
    <PaymentQRBox
      totalAmount={totalAmount}
      expiresAt={expiresAt}
      payCode={payCode}
      onRestart={onRestart}
    />
  </div>
);
```

- [ ] **Step 5: checkout/page.tsx — bỏ complete, done theo SSE**

Sửa `checkout/page.tsx`:
- Xóa import `useCheckoutComplete` (giữ `useCheckoutPreview`, `useCheckoutStart`).
- Xóa `const completeMutation = ...` và `handleComplete`.
- Đổi lời gọi hook events thành:

```tsx
  useCustomerOrderEvents(tableToken, {
    onPaymentCompleted: (data) => {
      // Chỉ chuyển màn khi đúng phiên đang mở (tránh nhầm khi bàn có nguồn thanh toán khác)
      if (session && data.sessionId === session.sessionId) {
        setSession(null);
        setDone(true);
      }
    },
  });
```

(đặt SAU `const [session, setSession] = useState...` để closure thấy `session`; `useSSE` giữ callback qua ref nên nhận bản mới nhất mỗi render.)
- Đổi chỗ render panel thành:

```tsx
          <CheckoutSessionPanel
            totalAmount={session.totalAmount}
            expiresAt={session.expiresAt}
            payCode={session.payCode}
            onRestart={handleRestart}
          />
```

- [ ] **Step 6: Lint + build**

Run: `cd chalo-fe && pnpm lint && pnpm build`
Expected: sạch. (Lỗi compile ở `orders/[orderId]/page.tsx` KHÔNG được xảy ra — file đó chưa đụng, vẫn dùng `usePayOrder` còn tồn tại.)

- [ ] **Step 7: Commit**

```bash
git add chalo-fe/src
git commit -m "feat(fe): checkout cả bàn chờ webhook xác nhận — bỏ nút tự khai, QR dùng payCode từ BE"
```

---

### Task 6: FE — Thanh toán 1 đơn qua session + dọn code tự khai [x]

**Files:**
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/PaySessionModal.tsx`
- Delete: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/PayConfirmModal.tsx`
- Delete: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/PayAllConfirmModal.tsx` (dead code — không ai import)
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/page.tsx`
- Modify: `chalo-fe/src/services/order/order.api.ts` + `order.queries.ts` + `order.types.ts` + `api-endpoints.ts` (xóa `payAllOrders`/`usePayAllOrders`/`PayAllOrdersPayload`/`PAY_ALL` — không còn caller)

**Interfaces:**
- Consumes: `PaymentQRBox`, `useCheckoutStart` (`{ tableToken, orderIds: [id] }`), `useCustomerOrderEvents` opts (Task 5).
- Produces: khách thanh toán 1 đơn qua checkout session; `usePayOrder` GIỮ NGUYÊN (staff modal `chalo-fe/src/app/(staff)/staff/orders/@modal/(.)orders/[orderId]/page.tsx` vẫn dùng — endpoint giờ JWT, staff luôn đăng nhập nên request client tự gắn Bearer).

- [x] **Step 1: PaySessionModal**

Tạo `PaySessionModal.tsx`:

```tsx
// src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/PaySessionModal.tsx
"use client";
import { PaymentQRBox } from "@/components/shared/PaymentQRBox";
import { CheckoutSessionResult } from "@/services/order/order.types";

/** Modal thanh toán 1 đơn: QR chuyển khoản + chờ webhook xác nhận (không tự khai) */
export const PaySessionModal = ({
  session,
  onClose,
  onRestart,
}: {
  session: CheckoutSessionResult;
  onClose: () => void;
  onRestart: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4 transition-opacity">
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thanh toán chuyển khoản"
      className="w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-[2rem] sm:rounded-3xl shadow-2xl p-6 pb-8 sm:pb-6 motion-safe:animate-[modal-pop_0.18s_cubic-bezier(0.16,1,0.3,1)]"
    >
      <h2 className="mb-4 text-center text-lg font-bold text-gray-900 dark:text-white">
        Thanh toán đơn này
      </h2>
      <PaymentQRBox
        totalAmount={session.totalAmount}
        expiresAt={session.expiresAt}
        payCode={session.payCode}
        onRestart={onRestart}
      />
      <button
        onClick={onClose}
        className="mt-4 w-full rounded-2xl bg-gray-50 dark:bg-gray-800 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-[0.98] transition-all"
      >
        Đóng
      </button>
    </div>
  </div>
);
```

- [x] **Step 2: Rewire trang chi tiết đơn của khách**

`orders/[orderId]/page.tsx` — các hunk sửa:

Imports — xóa `usePayOrder` khỏi import services, xóa import `PayConfirmModal`; thêm:

```tsx
import { useCheckoutStart } from "@/services/order/order.queries";
import { CheckoutSessionResult } from "@/services/order/order.types";
import { PaySessionModal } from "./_components/PaySessionModal";
```

(gộp `useGetOrderByToken, useCheckoutStart` chung một import từ `order.queries`.)

Thay state + mutation cũ:

```tsx
  const [showPayConfirm, setShowPayConfirm] = useState<boolean>(false);
  ...
  const payOrderMutation = usePayOrder(tableToken);
```

bằng:

```tsx
  const [paySession, setPaySession] = useState<CheckoutSessionResult | null>(null);
  ...
  const startMutation = useCheckoutStart();
```

Thay `useCustomerOrderEvents(tableToken);` bằng:

```tsx
  useCustomerOrderEvents(tableToken, {
    onPaymentCompleted: (data) => {
      // Đơn này (hoặc phiên của nó) vừa được xác nhận → đóng modal, badge header tự đổi
      if (
        paySession &&
        (data.sessionId === paySession.sessionId ||
          data.orderIds?.includes(orderId))
      ) {
        setPaySession(null);
      }
    },
  });
```

Thay `handlePay` bằng:

```tsx
  const handleOpenPay = async () => {
    const s = await startMutation.mutateAsync({
      tableToken,
      orderIds: [order.id],
    });
    setPaySession(s);
  };
```

(LƯU Ý: `handleOpenPay` dùng `order` nên phải đặt SAU guard `if (!order) return ...` như `handlePay` cũ.)

Thay block modal đầu JSX:

```tsx
      {showPayConfirm && (
        <PayConfirmModal ... />
      )}
```

bằng:

```tsx
      {paySession && (
        <PaySessionModal
          session={paySession}
          onClose={() => setPaySession(null)}
          onRestart={handleOpenPay}
        />
      )}
```

Thay nút thanh toán (trong Sticky Dock):

```tsx
            <button
              onClick={() => setShowPayConfirm(true)}
```

bằng:

```tsx
            <button
              onClick={handleOpenPay}
              disabled={startMutation.isPending}
```

(giữ nguyên className, thêm ` disabled:opacity-60` vào cuối className).

- [x] **Step 3: Xóa dead code + API pay-all phía khách**

- Xóa file `PayConfirmModal.tsx` và `PayAllConfirmModal.tsx`.
- `order.api.ts`: xóa `payAllOrders`; `order.queries.ts`: xóa `usePayAllOrders`; `order.types.ts`: xóa `PayAllOrdersPayload`; `api-endpoints.ts`: xóa `PAY_ALL: "/order/pay-all",`.
- MSW: xóa handler chết `http.post("*/api/order/pay-all", ...)` trong `chalo-fe/src/mocks/handlers/order.handlers.ts:333-351` (mock hardcode URL, không import constants — xóa để khỏi lệch hành vi BE mới).
- `usePayOrder`, `PayOrderPayload`, `API.ORDER.PAY` GIỮ NGUYÊN (staff modal dùng).

- [x] **Step 4: Lint + build**

Run: `cd chalo-fe && pnpm lint && pnpm build`
Expected: sạch, không còn reference tới file đã xóa.

- [x] **Step 5: Commit**

```bash
git add -A chalo-fe/src
git commit -m "feat(fe): khách thanh toán 1 đơn qua checkout session + payCode; xoá toàn bộ modal tự khai"
```

---

### Task 7: FE — Trạm in `/staff/print-station` [x]

**Files:**
- Create: `chalo-fe/src/app/(staff)/staff/print-station/page.tsx`
- Create: `chalo-fe/src/app/(staff)/staff/print-station/_components/PaymentReceipt.tsx`
- Create: `chalo-fe/src/app/(staff)/staff/print-station/_lib/print-log.ts`
- Create: `chalo-fe/src/components/shared/icons/PrinterIcon.tsx`
- Modify: `chalo-fe/src/constants/routes.ts:13-18` (thêm PRINT_STATION)
- Modify: `chalo-fe/src/app/(staff)/staff/_components/header.config.ts` (thêm mục nav)

**Interfaces:**
- Consumes: SSE `payment_completed` (staff stream, token từ `useAuthStore`), `getOrderById`, `getOrderPage` từ `@/services/order/order.api`, CSS `#receipt-print` sẵn có.
- Produces: trang trạm in tự `window.print()` mỗi lần thanh toán hoàn tất; testids `payment-receipt-root`; nút "In lại"/"In bù"; heading "Trạm in hoá đơn" (e2e Task 9 bám các chuỗi này).

- [x] **Step 1: print-log.ts**

```ts
// src/app/(staff)/staff/print-station/_lib/print-log.ts
// Nhật ký ORDER đã in, lưu localStorage theo NGÀY (giờ máy quầy) — sang ngày là log mới.
// Ghi theo từng orderId (không theo session) để "in bù" sau khi mở lại tab
// đối chiếu được với danh sách đơn đã thanh toán trong ngày.

const key = () => `chalo-print-log:${new Date().toLocaleDateString("sv-SE")}`;

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(key()) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function markPrinted(orderIds: string[]): void {
  const log = load();
  const at = new Date().toISOString();
  for (const id of orderIds) log[id] = at;
  localStorage.setItem(key(), JSON.stringify(log));
}

/** Đã in khi MỌI đơn trong nhóm đều có trong log hôm nay */
export function isPrinted(orderIds: string[]): boolean {
  const log = load();
  return orderIds.length > 0 && orderIds.every((id) => log[id]);
}
```

- [x] **Step 2: PaymentReceipt.tsx**

```tsx
"use client";
// src/app/(staff)/staff/print-station/_components/PaymentReceipt.tsx
import { OrderDto } from "@/services/order/order.types";

/**
 * Hoá đơn gộp cho MỘT lần thanh toán (có thể gồm nhiều đơn của cùng bàn).
 * Render vào #receipt-print — dùng chung CSS @media print trong globals.css
 * với Receipt.tsx. Mỗi trang chỉ được có một #receipt-print.
 */
export const PaymentReceipt = ({
  orders,
  totalAmount,
  shopName = "Chalo Coffee",
}: {
  orders: OrderDto[];
  totalAmount: number;
  shopName?: string;
}) => {
  const printedAt = new Date().toLocaleString("vi-VN");
  const tableName = orders[0]?.tableName ?? "";

  return (
    <div
      className="receipt-print-root"
      aria-hidden
      data-testid="payment-receipt-root"
    >
      <div id="receipt-print">
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>{shopName}</div>
          <div style={{ marginTop: "4px", fontWeight: 700 }}>
            HOÁ ĐƠN THANH TOÁN
          </div>
        </div>

        <div style={{ borderTop: "1px dashed #000", paddingTop: "4px" }}>
          <div>Bàn: {tableName}</div>
          <div>Thời gian: {printedAt}</div>
          {orders.length > 1 && <div>Gộp {orders.length} đơn</div>}
        </div>

        {orders.map((order) => (
          <div key={order.id}>
            <div style={{ marginTop: "6px", fontWeight: 700 }}>
              Đơn #{order.id.slice(-6).toUpperCase()}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderTop: "1px dashed #000",
                    borderBottom: "1px dashed #000",
                  }}
                >
                  <th style={{ textAlign: "left", padding: "2px 0" }}>Món</th>
                  <th style={{ textAlign: "center" }}>SL</th>
                  <th style={{ textAlign: "right" }}>T.Tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: "2px 0" }}>
                      {item.productName}
                      {item.note ? ` (${item.note})` : ""}
                    </td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>
                      {item.subtotal.toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div
          style={{
            borderTop: "1px dashed #000",
            marginTop: "6px",
            paddingTop: "4px",
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          <span>TỔNG CỘNG</span>
          <span>{totalAmount.toLocaleString("vi-VN")}đ</span>
        </div>

        <div style={{ textAlign: "center", marginTop: "8px" }}>
          Đã thanh toán
          <div style={{ marginTop: "4px" }}>Cảm ơn quý khách!</div>
        </div>
      </div>
    </div>
  );
};
```

- [x] **Step 3: page.tsx trạm in**

```tsx
"use client";
// src/app/(staff)/staff/print-station/page.tsx
// Trạm in ở quầy: mở bằng Chrome --kiosk-printing trên PC nối máy in nhiệt.
// Nghe SSE payment_completed → fetch chi tiết đơn → render hoá đơn gộp →
// window.print(). Thanh toán KHÔNG phụ thuộc trạm in — tắt trạm vẫn xác nhận
// bình thường, mở lại thì "in bù" từ danh sách đơn đã trả tiền hôm nay.
import { API } from "@/constants";
import { SSEPayload, useSSE } from "@/hooks/useSSE";
import { getOrderById, getOrderPage } from "@/services/order/order.api";
import { OrderDto } from "@/services/order/order.types";
import { useAuthStore } from "@/stores/auth.store";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PaymentReceipt } from "./_components/PaymentReceipt";
import { isPrinted, markPrinted } from "./_lib/print-log";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

interface PrintJob {
  jobId: string;
  orderIds: string[];
  totalAmount: number;
  source: "sepay" | "staff";
  /** In lại: bỏ qua kiểm tra đã-in */
  force?: boolean;
}

export default function PrintStationPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [connected, setConnected] = useState(false);
  const [queue, setQueue] = useState<PrintJob[]>([]);
  const [current, setCurrent] = useState<{
    job: PrintJob;
    orders: OrderDto[];
  } | null>(null);
  const [history, setHistory] = useState<PrintJob[]>([]);
  const [catchUp, setCatchUp] = useState<PrintJob[]>([]);
  const busyRef = useRef(false);

  const enqueue = useCallback((job: PrintJob) => {
    if (!job.force && isPrinted(job.orderIds)) return;
    setQueue((q) => [...q, job]);
  }, []);

  // Thanh toán hoàn tất ở bất kỳ đâu (webhook SePay / nhân viên xác nhận) → in
  useSSE({
    url: `${API_BASE}${API.SSE.ORDER_EVENTS}`,
    token: accessToken,
    enabled: !!accessToken,
    onConnectionChange: setConnected,
    onEvent: (type, data) => {
      if (type !== "payment_completed") return;
      const p = data as SSEPayload["payment_completed"];
      enqueue({
        jobId: p.sessionId ?? p.orderIds.join("+"),
        orderIds: p.orderIds,
        totalAmount: p.totalAmount,
        source: p.source ?? "staff",
      });
    },
  });

  // In bù: đơn hôm nay đã thanh toán nhưng chưa có trong nhật ký in
  // (trạm bị tắt đúng lúc tiền về). Hiện danh sách, nhân viên bấm in tay.
  useEffect(() => {
    if (!accessToken) return;
    const today = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD
    getOrderPage({ pageNo: 1, pageSize: 100, date: today })
      .then((res) => {
        const unprinted = res.list.filter(
          (o) => o.paidStatus && !isPrinted([o.id]),
        );
        setCatchUp(
          unprinted.map((o) => ({
            jobId: `catchup-${o.id}`,
            orderIds: [o.id],
            totalAmount: o.totalAmount,
            source: "staff" as const,
          })),
        );
      })
      .catch(() => {});
  }, [accessToken]);

  // Xử lý hàng đợi TUẦN TỰ: fetch chi tiết → render → in → ghi nhật ký
  useEffect(() => {
    if (busyRef.current || queue.length === 0) return;
    busyRef.current = true;
    const job = queue[0];
    (async () => {
      try {
        const orders = await Promise.all(
          job.orderIds.map((id) => getOrderById(id)),
        );
        setCurrent({ job, orders });
        // đợi 2 frame cho #receipt-print render xong rồi mới gọi in
        await new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        );
        window.print();
        markPrinted(job.orderIds);
        setHistory((h) => [job, ...h.filter((x) => x.jobId !== job.jobId)]);
        setCatchUp((l) =>
          l.filter((x) => !x.orderIds.some((id) => job.orderIds.includes(id))),
        );
      } catch {
        toast.error("In hoá đơn thất bại — thử lại từ danh sách bên dưới");
      } finally {
        setQueue((q) => q.slice(1));
        busyRef.current = false;
      }
    })();
  }, [queue]);

  const money = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Trạm in hoá đơn
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tự in khi thanh toán hoàn tất · để tab này luôn mở trên máy quầy
          </p>
        </div>
        <div
          className={`flex items-center gap-1.5 text-sm font-semibold ${
            connected
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          <span
            className={`size-3 rounded-full ${
              connected ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          />
          {connected ? "Đang nghe thanh toán" : "Mất kết nối!"}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {catchUp.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-2">
              ⚠️ Chưa in ({catchUp.length}) — đơn đã thanh toán khi trạm tắt
            </h2>
            <ul className="space-y-2">
              {catchUp.map((job) => (
                <li
                  key={job.jobId}
                  className="flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 px-4 py-2.5 text-sm"
                >
                  <span>
                    Đơn #{job.orderIds[0].slice(-6).toUpperCase()} ·{" "}
                    {money(job.totalAmount)}
                  </span>
                  <button
                    onClick={() => enqueue({ ...job, force: true })}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
                  >
                    In bù
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
            Đã in phiên này ({history.length})
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400">
              Chưa có hoá đơn nào — khi khách thanh toán xong sẽ tự in.
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((job) => (
                <li
                  key={job.jobId}
                  className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm"
                >
                  <span>
                    {job.orderIds.length > 1
                      ? `Gộp ${job.orderIds.length} đơn`
                      : `Đơn #${job.orderIds[0].slice(-6).toUpperCase()}`}{" "}
                    · {money(job.totalAmount)} ·{" "}
                    {job.source === "sepay" ? "CK tự động" : "Nhân viên xác nhận"}
                  </span>
                  <button
                    onClick={() => enqueue({ ...job, force: true })}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    In lại
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Ẩn trên màn hình, chỉ hiện khi in (CSS @media print có sẵn) */}
      {current && (
        <PaymentReceipt
          orders={current.orders}
          totalAmount={current.job.totalAmount}
        />
      )}
    </div>
  );
}
```

- [x] **Step 4: Icon + routes + nav**

Tạo `chalo-fe/src/components/shared/icons/PrinterIcon.tsx`:

```tsx
import { SVGProps } from "react";

export const PrinterIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 9V2h12v7" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);
```

`routes.ts` — trong `STAFF` thêm `PRINT_STATION: "/staff/print-station",`.

`header.config.ts` — thêm import `PrinterIcon` và mục cuối mảng:

```ts
  { label: 'Trạm in', href: ROUTES.STAFF.PRINT_STATION, icon: PrinterIcon }
```

- [x] **Step 5: Lint + build + smoke tay**

Run: `cd chalo-fe && pnpm lint && pnpm build`
Expected: sạch.

Smoke (BE + FE dev đang chạy): đăng nhập staff → `/staff/print-station` → tạo đơn từ màn khách, thanh toán bằng nút staff (modal đơn) → hộp thoại in của trình duyệt hiện ra (chưa kiosk), hoá đơn có món + tổng tiền.

- [x] **Step 6: Commit**

```bash
git add chalo-fe/src
git commit -m "feat(fe): trạm in hoá đơn /staff/print-station — tự in qua SSE, in bù, in lại"
```

---

### Task 8: FE — Admin settings SePay key + toast đối soát cho staff [x]

**Files:**
- Modify: `chalo-fe/src/services/settings/settings.types.ts`
- Modify: `chalo-fe/src/app/(admin)/admin/settings/page.tsx`
- Modify: `chalo-fe/src/app/(staff)/staff/orders/page.tsx:62-109` (switch SSE)

**Interfaces:**
- Consumes: BE `GET/PUT /settings` với `sepayWebhookKeySet` / `sepayWebhookKey` (Task 1); SSE `payment_review_needed` + `payment_completed.source` (Task 3/4, FE types từ Task 5).
- Produces: admin đặt/gỡ được key; staff thấy toast khi có giao dịch cần đối soát và khi CK tự động thành công.

- [x] **Step 1: Settings types**

`settings.types.ts`:

```ts
export interface SettingsDto {
  waitTimeEnabled: boolean;
  baristaCount: number;
  /** VietQR: mã BIN ngân hàng nhận tiền (MB = 970422). Null = chưa cấu hình. */
  bankBin: string | null;
  bankAccountNo: string | null;
  bankAccountName: string | null;
  /** true nếu SePay webhook key đã cấu hình (BE không bao giờ trả key thật) */
  sepayWebhookKeySet: boolean;
}

export interface UpdateSettingsPayload {
  waitTimeEnabled: boolean;
  baristaCount: number;
  /** Chuỗi rỗng = xoá cấu hình */
  bankBin?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  /** Bỏ qua = giữ nguyên key; chuỗi rỗng = xoá key (tắt webhook) */
  sepayWebhookKey?: string;
}
```

- [x] **Step 2: Admin settings UI**

`admin/settings/page.tsx`:
- Thêm state: `const [sepayKeyInput, setSepayKeyInput] = useState("");`
- `dirty` thêm điều kiện: `... || sepayKeyInput !== ""` (đổi biểu thức thành `(!!data && !!draft && (...)) || sepayKeyInput !== ""`).
- `save()` payload thêm: `...(sepayKeyInput.trim() ? { sepayWebhookKey: sepayKeyInput.trim() } : {}),` và `onSuccess` thêm `setSepayKeyInput("");` (giữ `setDraft(null)`).
- Thêm card mới TRƯỚC nút Lưu:

```tsx
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-5">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Tự động xác nhận chuyển khoản (SePay)
          </p>
          <p className="text-xs text-gray-400">
            Dán API key webhook của SePay. Khi tiền về tài khoản, hệ thống tự
            đánh dấu đã thanh toán và trạm in tự in hoá đơn. Hướng dẫn đăng ký:
            deploy/PRINTING.md.
          </p>
        </div>

        <FormField
          label="SePay Webhook API Key"
          hint={
            data?.sepayWebhookKeySet
              ? "Đã cấu hình — nhập key mới để thay, hoặc bấm Gỡ key."
              : "Chưa cấu hình — webhook đang tắt, chỉ xác nhận tay."
          }
        >
          <Input
            type="password"
            value={sepayKeyInput}
            placeholder={data?.sepayWebhookKeySet ? "••••••••" : "Dán key từ SePay"}
            onChange={(e) => setSepayKeyInput(e.target.value)}
          />
        </FormField>

        {data?.sepayWebhookKeySet && (
          <button
            onClick={() =>
              updateM.mutate({ waitTimeEnabled, baristaCount, sepayWebhookKey: "" })
            }
            className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
          >
            Gỡ key (tắt tự động xác nhận)
          </button>
        )}
      </div>
```

- [x] **Step 3: Staff toast**

`staff/orders/page.tsx` — trong switch của `onEvent`: tách `payment_completed` ra khỏi nhóm invalidate chung và thêm case mới:

```tsx
        case "payment_completed": {
          const p = data as SSEPayload["payment_completed"];
          if (p.source === "sepay") {
            playBeep(880);
            toast.success(
              `💰 Đã nhận chuyển khoản ${p.totalAmount.toLocaleString("vi-VN")}đ — hoá đơn đang in`,
              { duration: 8000 },
            );
          }
          qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ACTIVE });
          qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
          break;
        }
        case "payment_review_needed": {
          const p = data as SSEPayload["payment_review_needed"];
          playBeep(440);
          toast.error(
            `⚠️ Chuyển khoản cần đối soát tay: ${p.reason} — ${p.transferAmount.toLocaleString("vi-VN")}đ${p.content ? ` ("${p.content}")` : ""}`,
            { duration: 15000 },
          );
          break;
        }
```

(case nhóm cũ còn lại: `new_order`, `order_status_changed`, `order_prep_progress`.)

- [x] **Step 4: Lint + build + commit**

Run: `cd chalo-fe && pnpm lint && pnpm build`
Expected: sạch.

```bash
git add chalo-fe/src
git commit -m "feat(fe): cài đặt SePay key (write-only) + toast CK tự động / cần đối soát cho staff"
```

---

### Task 9: E2E — cập nhật spec cũ + spec trạm in mới [ ] — BLOCKED (xem task-9-report.md)

> **BLOCKED**: Step 1–3 + 5 xong (spec đúng y hệt brief, đã commit). Step 4 KHÔNG xanh —
> `customer-checkout.spec.ts` và `print-station.spec.ts` fail vì bug thật ở BE:
> `app.useGlobalInterceptors(new ResponseInterceptor())` (`chalo-be/src/main.ts:67`) bọc
> MỌI item của stream `@Sse()` thành `{code,message,data:{type,data}}`, xoá field `type`
> top-level mà `SseStream._transform` cần để ghi dòng `event: <type>`. Hệ quả: mọi sự kiện SSE
> (kể cả `payment_completed`) tới trình duyệt KHÔNG có tên event (`addEventListener("payment_completed",...)`
> phía FE không bao giờ bắn) — verify bằng curl thô, xem task-9-report.md. Bug có từ commit đầu tiên
> (`18f8c3f`), không phải do Task 1-8 branch này gây ra, nhưng chặn đúng 2 test mà Task 9 yêu cầu.
> Không tự sửa impl code theo đúng chỉ dẫn — cần người quyết hướng fix (BE bỏ interceptor khỏi SSE
> route, hoặc FE thêm fallback nghe `message` + đọc `data.type`).
> 2 spec khác fail (`admin-dashboard.spec.ts`, `admin-orders.spec.ts`) do môi trường live thiếu seed
> ~250 đơn lịch sử (DB chỉ có ~16-19 đơn, toàn tạo trong phiên test) — không liên quan branch này.
> 3 test trong `prep-product-centric.spec.ts` fail vì cần BE riêng ở cổng 8082 (không có trong môi
> trường được cấp) — cũng không liên quan branch này, có từ trước (commit `f875d45` trên `main`).

**Files:**
- Modify: `chalo-fe/e2e/customer-checkout.spec.ts:66-95`
- Create: `chalo-fe/e2e/print-station.spec.ts`
- Modify (nếu grep ra): mọi spec còn assert chuỗi đã xóa

**Interfaces:**
- Consumes: BE + FE của các task trước, chạy live (BE :8080 + FE :3000, tài khoản seed `admin/admin`, `staff/staff`).
- Produces: suite e2e xanh.

- [x] **Step 1: Grep chuỗi hành vi cũ**

Run: `cd chalo-fe && grep -rn "Tôi đã thanh toán\|checkout/complete\b\|PayConfirmModal\|PayAllConfirmModal" e2e src`
Expected: không còn kết quả trong `src`; trong `e2e` chỉ còn `customer-checkout.spec.ts` (sửa ở step 2). Spec nào khác dính thì sửa cùng pattern.

- [x] **Step 2: Sửa customer-checkout.spec.ts**

Thay toàn bộ phần từ comment `// --- open the pay-all session ...` đến hết assertions cuối test bằng:

```ts
  // --- open the pay-all session (real POST /order/checkout/start) ---
  const startResPromise = page.waitForResponse(
    (r) => r.url().includes("/order/checkout/start") && r.ok(),
  );
  await payCta.click();
  await expect(page.getByText("Phiên thanh toán gộp")).toBeVisible({
    timeout: 15_000,
  });
  const session = (await (await startResPromise).json()).data;
  expect(session.payCode).toMatch(/^CK[A-HJKMNP-Z2-9]{6}$/);

  await expect(page.getByText(/Hết hạn sau \d+:\d{2}/)).toBeVisible();

  // VietQR khoá số tiền + nội dung CK = payCode do BE sinh
  await expect(page.getByTestId("vietqr-code")).toBeVisible();
  await expect(page.getByText("CHALO COFFEE")).toBeVisible();
  await expect(page.getByText(session.payCode)).toBeVisible();

  // Không còn nút tự khai — thay bằng trạng thái chờ ngân hàng xác nhận
  await expect(page.getByTestId("awaiting-bank")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "✓ Tôi đã thanh toán" }),
  ).toHaveCount(0);

  // --- thu ngân xác nhận (JWT) → SSE đẩy màn khách sang trạng thái xong ---
  const completeRes = await request.post(
    `${BE}/order/checkout/complete-staff`,
    { headers: auth, data: { sessionId: session.sessionId } },
  );
  expect(completeRes.ok()).toBeTruthy();

  await expect(
    page.getByText("Đã thanh toán tất cả đơn của bàn"),
  ).toBeVisible({ timeout: 15_000 });

  // Các đơn đã thật sự được trả: preview mới không còn đơn mở nào
  const afterRes = await request.post(`${BE}/order/checkout/preview`, {
    data: { tableToken },
  });
  const afterOrders = (await afterRes.json()).data?.orders ?? [];
  expect(afterOrders.length).toBe(0);
});
```

- [x] **Step 3: Spec trạm in mới**

Tạo `chalo-fe/e2e/print-station.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

// Trạm in: thanh toán hoàn tất (bất kể nguồn) → trang tự render hoá đơn gộp
// và gọi window.print đúng 1 lần; "In lại" hoạt động. Chạy với BE thật.
const BE = "http://localhost:8080/api";

test("trạm in tự in hoá đơn khi thanh toán hoàn tất + in lại được", async ({
  page,
  request,
}) => {
  const login = await request.post(`${BE}/auth/login`, {
    data: { username: "staff", password: "staff" },
  });
  const token = (await login.json()).data.accessToken;
  const auth = { Authorization: `Bearer ${token}` };

  const tables = (
    await (await request.get(`${BE}/table/list`, { headers: auth })).json()
  ).data;
  const tableToken: string = tables[0].qrToken;
  const product = (
    await (
      await request.get(`${BE}/menu/product/simple-list`, { headers: auth })
    ).json()
  ).data[0];

  // Đếm số lần window.print được gọi thay vì mở hộp thoại thật
  await page.addInitScript(() => {
    (window as unknown as { __printCount: number }).__printCount = 0;
    window.print = () => {
      (window as unknown as { __printCount: number }).__printCount += 1;
    };
  });

  await page.goto("/login");
  await page.locator("#username").fill("staff");
  await page.locator("#password").fill("staff");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/staff/**");
  await page.goto("/staff/print-station");
  await expect(page.getByText("Trạm in hoá đơn")).toBeVisible();
  await expect(page.getByText("Đang nghe thanh toán")).toBeVisible({
    timeout: 15_000,
  });

  // Tạo đơn + phiên + thu ngân xác nhận (SAU khi trạm đã mở để nhận SSE)
  const created = await request.post(`${BE}/order/create`, {
    data: {
      tableToken,
      note: "E2E_PRINT_STATION",
      items: [{ productId: product.id, quantity: 2 }],
    },
  });
  expect(created.status()).toBe(201);
  const order = (await created.json()).data;

  try {
    const startRes = await request.post(`${BE}/order/checkout/start`, {
      data: { tableToken, orderIds: [order.id] },
    });
    const session = (await startRes.json()).data;

    const completeRes = await request.post(
      `${BE}/order/checkout/complete-staff`,
      { headers: auth, data: { sessionId: session.sessionId } },
    );
    expect(completeRes.ok()).toBeTruthy();

    // Hoá đơn render + in đúng 1 lần
    const receipt = page.getByTestId("payment-receipt-root");
    await expect(receipt).toContainText(product.name, { timeout: 15_000 });
    await expect(receipt).toContainText("TỔNG CỘNG");
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { __printCount: number }).__printCount,
        ),
      )
      .toBe(1);

    // In lại từ lịch sử
    await page.getByRole("button", { name: "In lại" }).first().click();
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { __printCount: number }).__printCount,
        ),
      )
      .toBe(2);
  } finally {
    // Dọn: huỷ đơn throwaway để không rác board
    try {
      await request.put(`${BE}/order/status`, {
        headers: auth,
        data: { id: order.id, status: "CANCELLED" },
      });
    } catch {
      // ignore
    }
  }
});
```

- [ ] **Step 4: Chạy toàn bộ e2e** — KHÔNG xanh, xem hộp BLOCKED ở đầu Task 9 + task-9-report.md

Chuẩn bị: BE dev (`cd chalo-be && pnpm start:dev`, DB có seed demo) + FE (`cd chalo-fe && pnpm dev`).
Run: `cd chalo-fe && pnpm test:e2e`
Expected: PASS toàn bộ (kể cả `staff-order-pay.spec.ts` — staff modal vẫn trả qua `/order/pay` với JWT; `admin-settings.spec.ts` — nếu fail vì card SePay mới, sửa assertion tương ứng).

Thực tế (2026-07-19, `PLAYWRIGHT_BASE_URL=http://localhost:3001 pnpm test:e2e --workers=1`):
**39 passed / 7 failed.** `admin-settings.spec.ts` và `staff-order-pay.spec.ts` PASS như dự đoán
(không cần sửa). 1 spec khác cần sửa do JWT-gate `/order/pay` (đã sửa, xem Step 1). 7 fail còn
lại KHÔNG phải do spec sai — 2 do bug BE thật (SSE mất tên event, chi tiết ở trên), 4 do thiếu
seed/BE phụ trợ ngoài phạm vi nhánh này (2 admin/*, 3 prep-product-centric — không đụng).

- [x] **Step 5: Commit**

```bash
git add chalo-fe/e2e
git commit -m "test(e2e): checkout chờ webhook + xác nhận staff; spec trạm in tự in + in lại"
```

---

### Task 10: Docs — deploy/PRINTING.md + trỏ từ README [ ]

**Files:**
- Create: `deploy/PRINTING.md`
- Modify: `deploy/README.md` (thêm mục trỏ sang)

**Interfaces:** không có code; tài liệu vận hành cho chủ quán.

- [ ] **Step 1: Viết deploy/PRINTING.md**

```markdown
# Thanh toán tự động (SePay) + Trạm in hoá đơn

Luồng: khách quét VietQR chuyển khoản → SePay báo tiền về qua webhook →
backend tự đánh dấu ĐÃ THANH TOÁN → trạm in ở quầy tự in hoá đơn.
Tiền mặt: nhân viên bấm xác nhận trên màn staff → cũng tự in như vậy.

## 1. Đăng ký SePay (làm 1 lần)

1. Tạo tài khoản tại https://sepay.vn, liên kết đúng **tài khoản ngân hàng
   nhận tiền** đã khai trong *Cài đặt → Thanh toán chuyển khoản (VietQR)*.
2. Vào **Webhooks → Thêm webhook**:
   - URL: `https://<TÊN_MIỀN>/api/payment/sepay/webhook`
   - Sự kiện: giao dịch **tiền vào**.
   - Kiểu xác thực: **API Key** → SePay sẽ gửi header
     `Authorization: Apikey <key>`.
3. Copy API key đó, dán vào **trang Cài đặt admin → SePay Webhook API Key**
   rồi Lưu. (Chưa dán key = webhook tắt, hệ thống chỉ xác nhận tay.)
4. Thử: chuyển khoản vài nghìn đồng vào tài khoản với đúng nội dung CK của
   một phiên thanh toán đang mở → vài giây sau màn khách phải tự chuyển
   sang "Thanh toán thành công" và máy in nhả hoá đơn.

Lưu ý khớp lệnh: hệ thống chỉ TỰ xác nhận khi nội dung CK chứa đúng mã
(`CK` + 6 ký tự, QR đã điền sẵn) **và** đúng số tiền. Mọi ca lệch
(sai tiền, phiên hết hạn, trả trùng...) chỉ hiện cảnh báo "cần đối soát tay"
trên màn staff — nhân viên kiểm tra app ngân hàng rồi xác nhận tay.

## 2. Trạm in trên PC Windows ở quầy (làm 1 lần)

1. Cài driver máy in nhiệt (USB), đặt làm **máy in mặc định**.
   Trong *Printing preferences* chọn đúng khổ giấy (80mm hoặc 58mm).
2. Tạo shortcut Chrome in-im-lặng — chuột phải Desktop → New → Shortcut:

   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --app=https://<TÊN_MIỀN>/staff/print-station
   ```

3. Mở shortcut, đăng nhập tài khoản nhân viên. Trang phải hiện chấm xanh
   **"Đang nghe thanh toán"**.
4. Cho trạm tự mở cùng Windows: `Win+R` → `shell:startup` → kéo shortcut vào.

## 3. Vận hành hằng ngày

- Tab trạm in phải luôn mở. Mất kết nối sẽ hiện chấm đỏ **"Mất kết nối!"**
  (tự nối lại khi có mạng).
- Trạm bị tắt đúng lúc khách trả tiền? Đơn vẫn được xác nhận bình thường.
  Mở lại trạm → mục **"Chưa in"** liệt kê các đơn đã thanh toán trong ngày
  chưa in → bấm **In bù**.
- Kẹt giấy/hết giấy: thay giấy rồi bấm **In lại** ở mục "Đã in phiên này".
- Không dùng `--kiosk-printing` (mở tab thường) vẫn được — chỉ khác là hộp
  thoại in của Chrome sẽ hiện lên, bấm Print thủ công.

## 4. Sự cố nhanh

| Triệu chứng | Kiểm tra |
|---|---|
| Chuyển khoản xong không tự xác nhận | Key trong Cài đặt admin đúng chưa? Webhook SePay có log gửi thành công không? Nội dung CK có bị app ngân hàng cắt/sửa mã `CK...`? |
| Có cảnh báo "cần đối soát tay" trên màn staff | Khách chuyển sai số tiền / phiên hết hạn / trả trùng — kiểm tra app ngân hàng rồi xác nhận tay |
| Xác nhận rồi nhưng không in | Tab trạm in có đang mở + chấm xanh? Máy in mặc định đúng chưa? Vào trạm bấm In bù |
| In ra khổ lệch/chữ bé | Chỉnh khổ giấy trong driver máy in (80mm/58mm), tắt header/footer của Chrome |
```

- [ ] **Step 2: Trỏ từ deploy/README.md**

Thêm cuối `deploy/README.md`:

```markdown

---

## 9. Thanh toán tự động + máy in hoá đơn

Xem [deploy/PRINTING.md](./PRINTING.md): đăng ký webhook SePay (tự xác nhận
chuyển khoản) và dựng trạm in hoá đơn bằng Chrome kiosk-printing trên PC quầy.
```

- [ ] **Step 3: Commit**

```bash
git add deploy
git commit -m "docs(deploy): hướng dẫn SePay webhook + trạm in hoá đơn Chrome kiosk-printing"
```

---

## Verification cuối (sau Task 10)

1. `cd chalo-be && pnpm lint && pnpm build && pnpm test` — xanh.
2. `cd chalo-fe && pnpm lint && pnpm build` — xanh.
3. BE + FE dev chạy → `cd chalo-fe && pnpm test:e2e` — xanh.
4. Giả lập webhook tay (BE dev, sau khi đặt key qua trang admin và mở 1 phiên checkout trên màn khách, lấy `payCode` hiển thị dưới QR):

```bash
curl -s -X POST http://localhost:8080/api/payment/sepay/webhook \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Apikey <KEY_ĐÃ_ĐẶT>' \
  -d '{"id":9001,"transferType":"in","transferAmount":<ĐÚNG_TỔNG_TIỀN>,"content":"MBVCB <PAYCODE> GD123"}'
```

Expected: response `{"status":"MATCHED",...}`; màn khách tự chuyển "Thanh toán thành công"; trạm in (nếu đang mở) tự gọi in.
