# Màn admin quản lý người dùng (nhân viên + khách hàng) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đổi `/admin/staff` thành `/admin/users` với 2 tab "Nhân viên" (giữ nguyên hành vi cũ) và "Khách hàng" (mới: xem + khoá/mở khoá + xem lịch sử đơn/điểm tích luỹ), responsive chuẩn cho mobile.

**Architecture:** Backend thêm 3 endpoint admin-only trong `UserController` (2 endpoint gọi lại `CustomerService` có sẵn để tránh trùng logic, 1 endpoint `setActive` mới trong `UserService`). Frontend tách trang cũ thành `StaffTab`/`CustomerTab` dưới 1 trang `page.tsx` có tab switch bằng state cục bộ, và một module service mới `customer-admin` hoàn toàn tách biệt khỏi `services/user` để tránh lặp lại lỗi ripple type đã gặp trước đây.

**Tech Stack:** NestJS + TypeORM (BE), Next.js App Router + React Query + Tailwind (FE), Jest (BE unit test), Playwright (FE e2e, 2 project: `chromium` chạy mọi spec trừ `admin-mobile.spec.ts`, `admin-mobile` chỉ chạy đúng file đó ở viewport iPhone 13 — xem `chalo-fe/playwright.config.ts`).

## Global Constraints

- Không đổi API/behavior của tab Nhân viên (`UserService.update()`, `.page()` giữ nguyên logic đã sửa ở bug trước).
- Không đụng `UserDto`/`UserRole` trong `chalo-fe/src/services/user/user.types.ts` — mọi kiểu dữ liệu khách hàng nằm trong module mới `services/customer-admin/`.
- Không cho admin tạo/sửa thông tin/đổi mật khẩu/xoá tài khoản khách hàng — chỉ xem + khoá/mở khoá.
- Route mới: `/admin/users` (thay `/admin/staff`). Sidebar label mới: "Người dùng" (thay "Nhân viên").
- File cần đọc trước khi làm: `docs/superpowers/specs/2026-08-13-admin-user-management-design.md` (spec đã duyệt).

---

- [x] Task 1: Backend — `UserService.setActive` (TDD)
## Task 1: Backend — `UserService.setActive` (TDD)

**Files:**
- Modify: `chalo-be/src/modules/user/user.service.ts`
- Modify: `chalo-be/src/modules/user/user.service.spec.ts`

**Interfaces:**
- Produces: `UserService.setActive(id: number, isActive: boolean, requesterId: number): Promise<Omit<User, 'password' | 'currentRefreshTokenHash'>>` — 404 nếu không tìm thấy user, 403 nếu `id === requesterId && isActive === false`. Task 2 (controller) gọi hàm này.

- [x] **Step 1: Viết test fail trước**

Thêm vào cuối `chalo-be/src/modules/user/user.service.spec.ts` (cần thêm `NotFoundException` vào import ở dòng 1, hiện chỉ có `BadRequestException, ForbiddenException`):

```typescript
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
```

Thêm describe block mới ở cuối file:

```typescript
describe('UserService.setActive', () => {
  it('khoá được tài khoản khách hàng', async () => {
    const customer = {
      id: 5,
      username: 'google_khach_abc',
      role: UserRole.CUSTOMER,
      isActive: true,
    } as User;
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(customer),
      save: jest.fn(async (input: User) => input),
    };
    const service = new UserService(repo as unknown as Repository<User>);

    const updated = await service.setActive(5, false, 1);

    expect(updated).toMatchObject({ id: 5, isActive: false });
  });

  it('chặn admin tự khoá chính mình', async () => {
    const admin = {
      id: 1,
      username: 'admin',
      role: UserRole.ADMIN,
      isActive: true,
    } as User;
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(admin),
      save: jest.fn(),
    };
    const service = new UserService(repo as unknown as Repository<User>);

    await expect(service.setActive(1, false, 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('báo lỗi khi không tìm thấy người dùng', async () => {
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };
    const service = new UserService(repo as unknown as Repository<User>);

    await expect(service.setActive(999, false, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Chạy test, xác nhận fail**

Run: `cd chalo-be && npx jest user.service.spec.ts`
Expected: FAIL — `service.setActive is not a function`

- [x] **Step 3: Viết implementation tối thiểu**

Trong `chalo-be/src/modules/user/user.service.ts`, thêm method mới ngay sau `update()` (trước `changePassword`):

```typescript
  async setActive(id: number, isActive: boolean, requesterId: number) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    if (id === requesterId && !isActive) {
      throw new ForbiddenException(
        'Không thể tự khoá tài khoản đang đăng nhập',
      );
    }

    user.isActive = isActive;
    const saved = await this.userRepo.save(user);
    return this.toDto(saved);
  }
```

(`NotFoundException`, `ForbiddenException` đã có sẵn trong import ở đầu file — không cần thêm.)

- [x] **Step 4: Chạy test, xác nhận pass**

Run: `cd chalo-be && npx jest user.service.spec.ts`
Expected: PASS — toàn bộ file (bao gồm các test cũ của `update`/`page`) xanh.

- [x] **Step 5: Commit**

```bash
git add chalo-be/src/modules/user/user.service.ts chalo-be/src/modules/user/user.service.spec.ts
git commit -m "feat(be): thêm UserService.setActive để khoá/mở khoá tài khoản"
```

---

- [x] Task 2: Backend — Endpoint admin xem đơn hàng/điểm khách + khoá tài khoản
## Task 2: Backend — Endpoint admin xem đơn hàng/điểm khách + khoá tài khoản

**Files:**
- Modify: `chalo-be/src/modules/user/user.module.ts`
- Modify: `chalo-be/src/modules/user/user.controller.ts`
- Create: `chalo-be/src/modules/user/dto/set-active.dto.ts`

**Interfaces:**
- Consumes: `UserService.setActive` (Task 1); `CustomerService.getOrders(customerId, {pageNo?, pageSize?}): Promise<{list: Order[], total: number, pageNo: number, pageSize: number}>` và `CustomerService.getLoyalty(customerId): Promise<{balance: number}>` (đã có sẵn ở `chalo-be/src/modules/customer/customer.service.ts`, không đổi).
- Produces: 3 route mới, tất cả `@Roles(UserRole.ADMIN)`:
  - `GET /user/:id/orders?pageNo&pageSize` → `{list: [{id, tableName, status, totalAmount, itemsCount, createdAt}], total, pageNo, pageSize}`
  - `GET /user/:id/loyalty` → `{balance: number}`
  - `PUT /user/:id/active` body `{isActive: boolean}` → user đã cập nhật

Không có unit test riêng cho controller (codebase này không có `user.controller.spec.ts`, quy ước hiện tại là verify qua e2e Playwright chạy trên backend thật — xem Task 7).

- [x] **Step 1: Tạo DTO cho body của endpoint khoá/mở khoá**

Tạo file `chalo-be/src/modules/user/dto/set-active.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetActiveDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  isActive: boolean;
}
```

- [x] **Step 2: Import `CustomerModule` vào `UserModule`**

Sửa `chalo-be/src/modules/user/user.module.ts` thành:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SeedService } from '../../seed/seed.service';
import { Category } from '../category/entities/category.entity';
import { Product } from '../product/entities/product.entity';
import { Table } from '../table/entities/table.entity';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Category, Product, Table, Order, OrderItem]),
    CustomerModule,
  ],
  providers: [UserService, SeedService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
```

(`CustomerModule` đã `exports: [CustomerService]` sẵn ở `chalo-be/src/modules/customer/customer.module.ts` và không import ngược lại `UserModule` — không có vòng phụ thuộc.)

- [x] **Step 3: Thêm 3 route vào `UserController`**

Sửa `chalo-be/src/modules/user/user.controller.ts` thành toàn bộ nội dung sau:

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CustomerService } from '../customer/customer.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { SetActiveDto } from './dto/set-active.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('User')
@ApiBearerAuth('JWT-auth')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly customerService: CustomerService,
  ) {}

  @Get('page')
  @Roles(UserRole.ADMIN)
  @ApiQuery({ name: 'pageNo', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiOkResponse({ description: 'Paginated users', schema: { example: { code: 200, message: 'success', data: { list: [], total: 0 } } } })
  page(
    @Query('pageNo') pageNo?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
  ) {
    return this.userService.page({
      pageNo: pageNo ? Number(pageNo) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
      keyword,
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Post('create')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ description: 'Create user success', schema: { example: { code: 201, message: 'success', data: { id: 2, username: 'staff02' } } } })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Put('update')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ description: 'Update user success', schema: { example: { code: 200, message: 'success', data: { id: 2, fullName: 'Updated Name' } } } })
  update(@Body() dto: UpdateUserDto) {
    return this.userService.update(dto);
  }

  @Put('change-password')
  @ApiOkResponse({ description: 'Change password success', schema: { example: { code: 200, message: 'success', data: null } } })
  changePassword(@Body() dto: ChangePasswordDto, @Request() req: Express.Request & { user: { id: number; role: UserRole } }) {
    return this.userService.changePassword(dto, req.user.id, req.user.role);
  }

  @Delete('delete')
  @Roles(UserRole.ADMIN)
  @ApiQuery({ name: 'id', required: true })
  @ApiOkResponse({ description: 'Delete user success', schema: { example: { code: 200, message: 'success', data: null } } })
  delete(@Query('id') id: number, @Request() req: Express.Request & { user: { id: number } }) {
    return this.userService.delete(Number(id), req.user.id);
  }

  @Get(':id/orders')
  @Roles(UserRole.ADMIN)
  @ApiQuery({ name: 'pageNo', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiOkResponse({
    description: 'Lịch sử đơn hàng của 1 khách hàng (admin xem)',
    schema: { example: { code: 200, message: 'success', data: { list: [], total: 0, pageNo: 1, pageSize: 5 } } },
  })
  async customerOrders(
    @Param('id') id: string,
    @Query('pageNo') pageNo?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.customerService.getOrders(Number(id), {
      pageNo: pageNo ? Number(pageNo) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return {
      list: result.list.map((order) => ({
        id: order.id,
        tableName: order.table?.name ?? '',
        status: order.status,
        totalAmount: order.totalAmount,
        itemsCount: order.items?.length ?? 0,
        createdAt: order.createdAt,
      })),
      total: result.total,
      pageNo: result.pageNo,
      pageSize: result.pageSize,
    };
  }

  @Get(':id/loyalty')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({
    description: 'Điểm tích luỹ của 1 khách hàng (admin xem)',
    schema: { example: { code: 200, message: 'success', data: { balance: 0 } } },
  })
  customerLoyalty(@Param('id') id: string) {
    return this.customerService.getLoyalty(Number(id));
  }

  @Put(':id/active')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({
    description: 'Khoá / mở khoá tài khoản',
    schema: { example: { code: 200, message: 'success', data: { id: 3, isActive: false } } },
  })
  setActive(
    @Param('id') id: string,
    @Body() dto: SetActiveDto,
    @Request() req: Express.Request & { user: { id: number } },
  ) {
    return this.userService.setActive(Number(id), dto.isActive, req.user.id);
  }
}
```

- [x] **Step 4: Build kiểm tra biên dịch**

Run: `cd chalo-be && npx tsc --noEmit`
Expected: 0 lỗi.

- [x] **Step 5: Chạy toàn bộ test BE, xác nhận không có gì vỡ**

Run: `cd chalo-be && npx jest`
Expected: PASS toàn bộ (bao gồm `customer.service.spec.ts`, `user.service.spec.ts`, `user.service.google.spec.ts` — các test này không đổi, `CustomerService` không bị sửa).

- [x] **Step 6: Commit**

```bash
git add chalo-be/src/modules/user/user.module.ts chalo-be/src/modules/user/user.controller.ts chalo-be/src/modules/user/dto/set-active.dto.ts
git commit -m "feat(be): thêm endpoint admin xem đơn/điểm khách hàng + khoá tài khoản"
```

---

- [x] Task 3: Frontend — Module `services/customer-admin` (types/api/queries)
## Task 3: Frontend — Module `services/customer-admin` (types/api/queries)

**Files:**
- Modify: `chalo-fe/src/constants/api-endpoints.ts`
- Modify: `chalo-fe/src/constants/query-keys.ts`
- Create: `chalo-fe/src/services/customer-admin/customer-admin.types.ts`
- Create: `chalo-fe/src/services/customer-admin/customer-admin.api.ts`
- Create: `chalo-fe/src/services/customer-admin/customer-admin.queries.ts`
- Create: `chalo-fe/src/services/customer-admin/index.ts`

**Interfaces:**
- Produces:
  - `CustomerDto { id: number; username: string; fullName: string; avatar: string | null; email: string | null; isActive: boolean; createdAt: string }`
  - `CustomerOrderDto { id: string; tableName: string; status: OrderStatus; totalAmount: number; itemsCount: number; createdAt: string }`
  - `CustomerLoyaltyDto { balance: number }`
  - `CustomerPageParams extends PageParam { keyword?: string }`
  - `getCustomerPage(params: CustomerPageParams): Promise<PageResult<CustomerDto>>`
  - `getCustomerOrders(id: number, params: PageParam): Promise<PageResult<CustomerOrderDto>>`
  - `getCustomerLoyalty(id: number): Promise<CustomerLoyaltyDto>`
  - `setCustomerActive(id: number, isActive: boolean): Promise<CustomerDto>`
  - `useGetCustomerLoyalty(id: number)` — react-query hook
  - `useSetCustomerActive()` — react-query mutation hook, invalidate `QUERY_KEYS.CUSTOMERS.ALL` khi thành công
- Consumed bởi Task 6 (`CustomerTab`, `CustomerDetailContent`).

Không cần test riêng cho module này (thuần API/query wiring, không có logic rẽ nhánh — cùng quy ước với `services/user/*` hiện tại không có unit test, verify qua e2e ở Task 7/8).

- [x] **Step 1: Thêm endpoint path vào `API.USER`**

Sửa `chalo-fe/src/constants/api-endpoints.ts`, khối `USER` (hiện ở dòng 20-26) thành:

```typescript
  USER: {
    PAGE: "/user/page",
    CREATE: "/user/create",
    UPDATE: "/user/update",
    CHANGE_PASSWORD: "/user/change-password",
    DELETE: "/user/delete",
    CUSTOMER_ORDERS: (id: number) => `/user/${id}/orders`,
    CUSTOMER_LOYALTY: (id: number) => `/user/${id}/loyalty`,
    SET_ACTIVE: (id: number) => `/user/${id}/active`,
  },
```

- [x] **Step 2: Thêm nhóm query key `CUSTOMERS`**

Sửa `chalo-fe/src/constants/query-keys.ts`, thêm ngay sau khối `USERS` (hiện ở dòng 12-15):

```typescript
  CUSTOMERS: {
    ALL: ["customers"] as const,
    PAGE: (params: object) => ["customers", "page", params] as const,
    ORDERS: (id: number, params: object) =>
      ["customers", id, "orders", params] as const,
    LOYALTY: (id: number) => ["customers", id, "loyalty"] as const,
  },
```

- [x] **Step 3: Tạo `customer-admin.types.ts`**

```typescript
// src/services/customer-admin/customer-admin.types.ts
import { PageParam } from "../types";
import { OrderStatus } from "../order/order.types";

export interface CustomerDto {
  id: number;
  username: string;
  fullName: string;
  avatar: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerOrderDto {
  id: string;
  tableName: string;
  status: OrderStatus;
  totalAmount: number;
  itemsCount: number;
  createdAt: string;
}

export interface CustomerLoyaltyDto {
  balance: number;
}

export interface CustomerPageParams extends PageParam {
  keyword?: string;
}
```

- [x] **Step 4: Tạo `customer-admin.api.ts`**

```typescript
// src/services/customer-admin/customer-admin.api.ts
import { API } from "@/constants";
import { request } from "@/lib/api-client";
import { PageParam, PageResult } from "../types";
import {
  CustomerDto,
  CustomerLoyaltyDto,
  CustomerOrderDto,
  CustomerPageParams,
} from "./customer-admin.types";

export const getCustomerPage = (
  params: CustomerPageParams,
): Promise<PageResult<CustomerDto>> =>
  request.get(API.USER.PAGE, { params: { ...params, role: "CUSTOMER" } });

export const getCustomerOrders = (
  id: number,
  params: PageParam,
): Promise<PageResult<CustomerOrderDto>> =>
  request.get(API.USER.CUSTOMER_ORDERS(id), { params });

export const getCustomerLoyalty = (id: number): Promise<CustomerLoyaltyDto> =>
  request.get(API.USER.CUSTOMER_LOYALTY(id));

export const setCustomerActive = (
  id: number,
  isActive: boolean,
): Promise<CustomerDto> => request.put(API.USER.SET_ACTIVE(id), { isActive });
```

- [x] **Step 5: Tạo `customer-admin.queries.ts`**

```typescript
"use client";
// src/services/customer-admin/customer-admin.queries.ts
import { QUERY_KEYS } from "@/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCustomerLoyalty, setCustomerActive } from "./customer-admin.api";

export const useGetCustomerLoyalty = (id: number) =>
  useQuery({
    queryKey: QUERY_KEYS.CUSTOMERS.LOYALTY(id),
    queryFn: () => getCustomerLoyalty(id),
    staleTime: 30_000,
  });

export const useSetCustomerActive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      setCustomerActive(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMERS.ALL });
      toast.success("Cập nhật trạng thái khách hàng thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
```

- [x] **Step 6: Tạo `index.ts`**

```typescript
// src/services/customer-admin/index.ts
export * from "./customer-admin.api";
export * from "./customer-admin.types";
export * from "./customer-admin.queries";
```

- [x] **Step 7: Kiểm biên dịch TypeScript**

Run: `cd chalo-fe && npx tsc --noEmit`
Expected: 0 lỗi (module mới chưa được import ở đâu nên không thể lỗi runtime, chỉ cần biên dịch sạch).

- [x] **Step 8: Commit**

```bash
git add chalo-fe/src/constants/api-endpoints.ts chalo-fe/src/constants/query-keys.ts chalo-fe/src/services/customer-admin/
git commit -m "feat(fe): thêm module services/customer-admin (types/api/queries)"
```

---

- [x] Task 4: Frontend — Đổi route `/admin/staff` → `/admin/users`, tách `StaffTab`
## Task 4: Frontend — Đổi route `/admin/staff` → `/admin/users`, tách `StaffTab`

**Files:**
- Modify: `chalo-fe/src/constants/routes.ts`
- Modify: `chalo-fe/src/app/(admin)/_components/sidebar.config.ts`
- Move: `chalo-fe/src/app/(admin)/admin/staff/_components/StaffForm.tsx` → `chalo-fe/src/app/(admin)/admin/users/_components/StaffForm.tsx`
- Move: `chalo-fe/src/app/(admin)/admin/staff/_components/ChangePasswordForm.tsx` → `chalo-fe/src/app/(admin)/admin/users/_components/ChangePasswordForm.tsx`
- Create: `chalo-fe/src/app/(admin)/admin/users/_components/StaffTab.tsx` (nội dung cũ của `staff/page.tsx`, bỏ phần `AdminMobilePageHeader`)
- Create: `chalo-fe/src/app/(admin)/admin/users/page.tsx` (tạm thời chỉ render `<StaffTab />`, Task 6 sẽ thêm tab Khách hàng)
- Delete: `chalo-fe/src/app/(admin)/admin/staff/page.tsx`
- Modify: `chalo-fe/e2e/admin-staff.spec.ts`
- Modify: `chalo-fe/e2e/admin-mobile.spec.ts`

**Interfaces:**
- Produces: `ROUTES.ADMIN.USERS = "/admin/users"` (thay `ROUTES.ADMIN.STAFF`), component `StaffTab` (không nhận prop) dùng bởi Task 6's `page.tsx`.

- [x] **Step 1: Đổi route constant**

Sửa `chalo-fe/src/constants/routes.ts`, dòng `STAFF: "/admin/staff",` (trong khối `ADMIN`, hiện ở dòng 31) thành:

```typescript
    USERS: "/admin/users",
```

- [x] **Step 2: Đổi sidebar**

Sửa `chalo-fe/src/app/(admin)/_components/sidebar.config.ts`:

Dòng 19 (`{ label: "Nhân viên", href: ROUTES.ADMIN.STAFF, icon: UsersIcon },`) →

```typescript
  { label: "Người dùng", href: ROUTES.ADMIN.USERS, icon: UsersIcon },
```

Dòng 32 (trong `ADMIN_MOBILE_OVERFLOW_HREFS`, `ROUTES.ADMIN.STAFF,`) →

```typescript
  ROUTES.ADMIN.USERS,
```

- [x] **Step 3: Tạo thư mục `admin/users`, di chuyển 2 file form**

```bash
mkdir -p "chalo-fe/src/app/(admin)/admin/users/_components"
git mv "chalo-fe/src/app/(admin)/admin/staff/_components/StaffForm.tsx" "chalo-fe/src/app/(admin)/admin/users/_components/StaffForm.tsx"
git mv "chalo-fe/src/app/(admin)/admin/staff/_components/ChangePasswordForm.tsx" "chalo-fe/src/app/(admin)/admin/users/_components/ChangePasswordForm.tsx"
```

Sửa dòng comment path ở đầu 2 file vừa di chuyển:
- `StaffForm.tsx` dòng 2: `// src/app/(admin)/admin/staff/_components/StaffForm.tsx` → `// src/app/(admin)/admin/users/_components/StaffForm.tsx`
- `ChangePasswordForm.tsx` dòng 2: tương tự đổi `staff` → `users`.

(Nội dung còn lại của 2 file này giữ nguyên 100% — không có logic nào phụ thuộc đường dẫn.)

- [x] **Step 4: Tạo `StaffTab.tsx`**

Tạo `chalo-fe/src/app/(admin)/admin/users/_components/StaffTab.tsx`:

```typescript
"use client";
// src/app/(admin)/admin/users/_components/StaffTab.tsx
import { Badge } from "@/components/shared/ui/Badge";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { Column, DataTable } from "@/components/shared/ui/DataTable";
import { Input } from "@/components/shared/ui/Input";
import { Modal } from "@/components/shared/ui/Modal";
import { Select } from "@/components/shared/ui/Select";
import { Toggle } from "@/components/shared/ui/Toggle";
import { QUERY_KEYS } from "@/constants";
import { useTablePagination } from "@/hooks/useTablePagination";
import { getUserRoleBadge } from "@/utils/user-role-label";
import {
  ChangePasswordType,
  StaffCreateType,
  StaffUpdateType,
} from "@/schemas/user.schema";
import {
  getUserPage,
  UserDto,
  UserPageParams,
  useChangePassword,
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
} from "@/services/user";
import { useState } from "react";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { StaffForm } from "./StaffForm";
import { MobileFilterSheet } from "../../../_components/MobileFilterSheet";

const INITIAL_FILTER: UserPageParams = { pageNo: 1, pageSize: 10 };

export function StaffTab() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserDto | null>(null);
  const [pwTarget, setPwTarget] = useState<UserDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const createM = useCreateUser();
  const updateM = useUpdateUser();
  const pwM = useChangePassword();
  const deleteM = useDeleteUser();

  const table = useTablePagination<UserDto, UserPageParams>({
    initialFilter: INITIAL_FILTER,
    queryFn: getUserPage,
    queryKey: QUERY_KEYS.USERS.ALL,
  });

  const handleCreate = (data: StaffCreateType) =>
    createM.mutate(data, { onSuccess: () => setCreateOpen(false) });

  const handleUpdate = (data: StaffUpdateType) => {
    if (!editTarget) return;
    updateM.mutate(
      { id: editTarget.id, avatar: editTarget.avatar, ...data },
      { onSuccess: () => setEditTarget(null) },
    );
  };

  const handleToggleActive = (row: UserDto, isActive: boolean) =>
    updateM.mutate({
      id: row.id,
      fullName: row.fullName,
      avatar: row.avatar,
      role: row.role,
      isActive,
    });

  const handleChangePw = (data: ChangePasswordType) => {
    if (!pwTarget) return;
    pwM.mutate(
      { id: pwTarget.id, newPassword: data.newPassword },
      { onSuccess: () => setPwTarget(null) },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteM.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  const columns: Array<Column<UserDto>> = [
    {
      key: "user",
      header: "Nhân viên",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {r.fullName}
          </p>
          <p className="text-xs text-gray-400">@{r.username}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Vai trò",
      render: (r) => {
        const badge = getUserRoleBadge(r.role);
        return <Badge label={badge.label} variant={badge.variant} />;
      },
    },
    {
      key: "active",
      header: "Hoạt động",
      render: (r) => (
        <Toggle
          checked={r.isActive}
          onChange={(v) => handleToggleActive(r, v)}
          disabled={updateM.isPending}
        />
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (r) => (
        <div className="flex items-center gap-2 [&>button]:min-h-11">
          <button
            onClick={() => setEditTarget(r)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20 transition-colors"
          >
            Sửa
          </button>
          <button
            onClick={() => setPwTarget(r)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Đổi MK
          </button>
          <button
            onClick={() => setDeleteTarget(r)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            Xoá
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          {table.pagination.total} tài khoản nhân viên
        </p>
        <button
          onClick={() => setCreateOpen(true)}
          className="w-full rounded-xl bg-brand-400 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500 sm:w-auto"
        >
          + Thêm nhân viên
        </button>
      </div>

      <div className="hidden flex-wrap items-center gap-3 md:flex">
        <Input
          placeholder="Tìm tên / tài khoản..."
          className="w-full sm:w-56"
          onChange={(e) =>
            table.updateFilter({ keyword: e.target.value || undefined })
          }
        />
        <Select
          className="w-full sm:w-44"
          placeholder="Tất cả vai trò"
          options={[
            { label: "Quản trị", value: "ADMIN" },
            { label: "Nhân viên", value: "MODERATOR" },
          ]}
          onChange={(e) =>
            table.updateFilter({
              role: (e.target.value as UserDto["role"]) || undefined,
            })
          }
        />
        <Select
          className="w-full sm:w-44"
          placeholder="Tất cả trạng thái"
          options={[
            { label: "Đang hoạt động", value: "true" },
            { label: "Ngừng", value: "false" },
          ]}
          onChange={(e) =>
            table.updateFilter({
              isActive:
                e.target.value === "" ? undefined : e.target.value === "true",
            })
          }
        />
      </div>

      <div className="flex gap-2 md:hidden">
        <Input
          aria-label="Tìm nhân viên"
          placeholder="Tìm tên / tài khoản..."
          value={table.filter.keyword ?? ""}
          className="min-w-0 flex-1"
          onChange={(event) =>
            table.updateFilter({ keyword: event.target.value || undefined })
          }
        />
        <button
          type="button"
          aria-label="Bộ lọc nhân viên"
          onClick={() => setFilterSheetOpen(true)}
          className="min-h-11 shrink-0 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          Lọc
        </button>
      </div>
      <MobileFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Lọc nhân viên"
      >
        <Select
          aria-label="Vai trò nhân viên"
          className="w-full"
          placeholder="Tất cả vai trò"
          options={[
            { label: "Quản trị", value: "ADMIN" },
            { label: "Nhân viên", value: "MODERATOR" },
          ]}
          value={table.filter.role ?? ""}
          onChange={(event) =>
            table.updateFilter({
              role: (event.target.value as UserDto["role"]) || undefined,
            })
          }
        />
        <Select
          aria-label="Trạng thái nhân viên"
          className="w-full"
          placeholder="Tất cả trạng thái"
          options={[
            { label: "Đang hoạt động", value: "true" },
            { label: "Ngừng", value: "false" },
          ]}
          value={
            table.filter.isActive === undefined
              ? ""
              : String(table.filter.isActive)
          }
          onChange={(event) =>
            table.updateFilter({
              isActive:
                event.target.value === ""
                  ? undefined
                  : event.target.value === "true",
            })
          }
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setFilterSheetOpen(false)}
            className="min-h-11 rounded-xl bg-brand-400 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
          >
            Áp dụng bộ lọc
          </button>
        </div>
      </MobileFilterSheet>

      <DataTable
        columns={columns}
        data={table.data}
        keyExtractor={(r) => r.id}
        isLoading={table.isLoading}
        pagination={table.pagination}
        onPageChange={table.changePage}
        onPageSizeChange={table.changePageSize}
        emptyText="Chưa có nhân viên nào."
        mobileCard={(row) => (
          <article
            data-testid="admin-mobile-staff-card"
            className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {row.fullName}
                </p>
                <p className="mt-1 truncate text-xs text-gray-400">
                  @{row.username}
                </p>
              </div>
              <Badge
                label={getUserRoleBadge(row.role).label}
                variant={getUserRoleBadge(row.role).variant}
              />
            </div>
            <div className="mt-3 flex min-h-11 items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
              <Toggle
                checked={row.isActive}
                onChange={(isActive) => handleToggleActive(row, isActive)}
                disabled={updateM.isPending}
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setEditTarget(row)}
                  className="min-h-11 px-2 text-xs font-semibold text-brand-600"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => setPwTarget(row)}
                  className="min-h-11 px-2 text-xs font-semibold text-gray-600 dark:text-gray-300"
                >
                  Đổi MK
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(row)}
                  className="min-h-11 px-2 text-xs font-semibold text-red-600"
                >
                  Xóa
                </button>
              </div>
            </div>
          </article>
        )}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Thêm nhân viên"
      >
        <StaffForm
          onSubmitCreate={handleCreate}
          onCancel={() => setCreateOpen(false)}
          isLoading={createM.isPending}
        />
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Chỉnh sửa nhân viên"
      >
        {editTarget && (
          <StaffForm
            defaultValue={editTarget}
            onSubmitUpdate={handleUpdate}
            onCancel={() => setEditTarget(null)}
            isLoading={updateM.isPending}
          />
        )}
      </Modal>

      <Modal
        open={!!pwTarget}
        onClose={() => setPwTarget(null)}
        title={`Đổi mật khẩu · ${pwTarget?.fullName ?? ""}`}
      >
        {pwTarget && (
          <ChangePasswordForm
            onSubmit={handleChangePw}
            onCancel={() => setPwTarget(null)}
            isLoading={pwM.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xoá nhân viên"
        message={`Xác nhận xoá tài khoản "${deleteTarget?.fullName}"?`}
        confirmLabel="Xoá"
        isLoading={deleteM.isPending}
      />
    </div>
  );
}
```

- [x] **Step 5: Tạo `page.tsx` mới (tạm thời chỉ render StaffTab), xoá `page.tsx` cũ**

```bash
git rm "chalo-fe/src/app/(admin)/admin/staff/page.tsx"
rmdir "chalo-fe/src/app/(admin)/admin/staff/_components" 2>/dev/null
rmdir "chalo-fe/src/app/(admin)/admin/staff" 2>/dev/null
```

Tạo `chalo-fe/src/app/(admin)/admin/users/page.tsx`:

```typescript
"use client";
// src/app/(admin)/admin/users/page.tsx
import { AdminMobilePageHeader } from "../../_components/AdminMobilePageHeader";
import { StaffTab } from "./_components/StaffTab";

export default function UsersPage() {
  return (
    <div className="space-y-5 p-4 sm:p-6">
      <AdminMobilePageHeader
        title="Người dùng"
        description="Quản lý tài khoản nhân viên & khách hàng"
      />

      <StaffTab />
    </div>
  );
}
```

(Task 6 sẽ thêm tab switch + `CustomerTab` vào file này — viết tạm dạng đơn giản ở bước này để có thể test/verify riêng việc đổi route trước.)

- [x] **Step 6: Cập nhật e2e spec cho route mới**

Sửa `chalo-fe/e2e/admin-staff.spec.ts` — thay toàn bộ nội dung bằng:

```typescript
import { test, expect } from "@playwright/test";

// Exercises the real "Người dùng" admin page (tab Nhân viên) against the live
// backend (no mocking): log in as admin/admin, navigate via the real sidebar
// link, assert the seeded user list renders, then create a UNIQUE throwaway
// staff account and assert it appears in the list.
//
// NOTE: this writes a real user row to the shared DB with the identifiable
// prefix "e2e_staff_" so it can be found and cleaned up later.
test("admin lists users and creates a new staff account", async ({ page }) => {
  // 1. Log in through the real login form.
  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("admin");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin/dashboard");

  // 2. Navigate to the Users page via the real sidebar link (no 404). Tab
  //    "Nhân viên" is selected by default.
  await page.getByRole("link", { name: "Người dùng" }).click();
  await page.waitForURL("**/admin/users");
  await expect(
    page.getByRole("heading", { name: "Người dùng" }),
  ).toBeVisible();

  // 3. The seeded user list renders real rows: at least one "@username" cell
  //    and a positive total in the pagination footer.
  await expect(page.getByText(/^@\w+/).first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/Tổng:\s*\d+\s*bản ghi/)).toBeVisible();

  // 4. Create a UNIQUE throwaway staff account.
  const username = `e2e_staff_${Date.now()}`;
  await page.getByRole("button", { name: "+ Thêm nhân viên" }).click();

  const modal = page.locator("form");
  await modal.locator('input[name="username"]').fill(username);
  await modal.locator('input[name="password"]').fill("secret123");
  await modal.locator('input[name="fullName"]').fill("E2E Staff Bot");
  // role select defaults to MODERATOR, isActive toggle defaults to on.
  await page.getByRole("button", { name: "Tạo mới" }).click();

  // 5. Success toast + the new row appears at the top of the (id-desc) list.
  await expect(page.getByText("Thêm nhân viên thành công")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(`@${username}`)).toBeVisible({ timeout: 15_000 });
});
```

Sửa `chalo-fe/e2e/admin-mobile.spec.ts`:

Dòng ~182 (trong test `"mobile admin uses product cards and keeps overflow navigation reachable"`):

```typescript
  await page.getByRole("link", { name: "Nhân viên" }).click();
  await page.waitForURL("**/admin/staff");
```

→

```typescript
  await page.getByRole("link", { name: "Người dùng" }).click();
  await page.waitForURL("**/admin/users");
```

Dòng ~207 (trong test `"mobile admin presents every data collection as readable cards"`), mảng path/testid:

```typescript
    ["/admin/staff", "admin-mobile-staff-card"],
```

→

```typescript
    ["/admin/users", "admin-mobile-staff-card"],
```

- [x] **Step 7: Kiểm biên dịch TypeScript**

Run: `cd chalo-fe && npx tsc --noEmit`
Expected: 0 lỗi. Nếu có lỗi "Cannot find module './StaffForm'" hay tương tự — kiểm tra lại Step 3 đã `git mv` đúng file chưa.

- [x] **Step 8: Build production để chắc Turbopack không panic vì cấu trúc route đổi**

Run: `cd chalo-fe && pnpm build`
Expected: build thành công, thấy route `/admin/users` xuất hiện trong output, không còn `/admin/staff`.

- [x] **Step 9: Chạy e2e vừa sửa (cần backend + FE server thật đang chạy — xem `docs/recipes/playwright-middleware-standalone.md` nếu phải build+standalone)** — `admin-staff.spec.ts` PASS thật sau khi sửa 2 chỗ locator bị lỗi có sẵn (root cause: `DataTable` render node mobile-card ẩn trước node bảng desktop trong DOM, không liên quan Task 4 — xem `.superpowers/sdd/2026-08-13-admin-user-management/task-4-report.md`). `admin-mobile.spec.ts` không chạy trong task này theo quyết định của người dùng (thiếu system dependency WebKit trong sandbox) — sẽ verify bằng Playwright MCP thủ công ở task cuối cùng của cả plan.

Run: `cd chalo-fe && npx playwright test admin-staff.spec.ts --project=chromium`
Expected: PASS.

Run: `cd chalo-fe && npx playwright test admin-mobile.spec.ts --project=admin-mobile`
Expected: PASS toàn bộ (test cũ không đổi hành vi, chỉ đổi path/label).

- [x] **Step 10: Commit**

```bash
git add -A "chalo-fe/src/app/(admin)/admin/users" "chalo-fe/src/app/(admin)/admin/staff" chalo-fe/src/constants/routes.ts "chalo-fe/src/app/(admin)/_components/sidebar.config.ts" chalo-fe/e2e/admin-staff.spec.ts chalo-fe/e2e/admin-mobile.spec.ts
git commit -m "refactor(fe): đổi /admin/staff thành /admin/users, tách StaffTab"
```

---

- [x] Task 5: Frontend — `Toggle` hỗ trợ `testId` (để test khoá/mở khoá không bị đụng hàng)
## Task 5: Frontend — `Toggle` hỗ trợ `testId` (để test khoá/mở khoá không bị đụng hàng)

**Files:**
- Modify: `chalo-fe/src/components/shared/ui/Toggle.tsx`

**Interfaces:**
- Produces: `Toggle` nhận thêm prop optional `testId?: string`, gắn vào `data-testid` của phần tử `<div>` bấm được (không đổi behavior/props cũ — `StaffTab` ở Task 4 không truyền `testId` nên không đổi gì ở đó).
- Consumed bởi Task 6 (`CustomerTab`) và Task 7/8 (e2e).

- [x] **Step 1: Sửa component**

Sửa toàn bộ nội dung `chalo-fe/src/components/shared/ui/Toggle.tsx` thành:

```typescript
// src/components/shared/ui/Toggle.tsx

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
  testId?: string;
}

export const Toggle = ({
  checked,
  onChange,
  disabled,
  label,
  testId,
}: ToggleProps) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <div
      data-testid={testId}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors
        ${checked ? "bg-brand-400" : "bg-stone-200 dark:bg-stone-700"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform
        ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </div>
    {label && (
      <span className="text-sm text-stone-700 dark:text-stone-300">{label}</span>
    )}
  </label>
);
```

- [x] **Step 2: Kiểm biên dịch**

Run: `cd chalo-fe && npx tsc --noEmit`
Expected: 0 lỗi (prop mới optional, không phá vỡ chỗ gọi cũ nào).

- [x] **Step 3: Commit**

```bash
git add chalo-fe/src/components/shared/ui/Toggle.tsx
git commit -m "feat(fe): Toggle nhận optional testId để test dễ target hơn"
```

---

- [x] Task 6: Frontend — Tab "Khách hàng" (list + khoá/mở khoá + chi tiết)
## Task 6: Frontend — Tab "Khách hàng" (list + khoá/mở khoá + chi tiết)

**Files:**
- Create: `chalo-fe/src/app/(admin)/admin/users/_components/CustomerDetailContent.tsx`
- Create: `chalo-fe/src/app/(admin)/admin/users/_components/CustomerTab.tsx`
- Modify: `chalo-fe/src/app/(admin)/admin/users/page.tsx`

**Interfaces:**
- Consumes: `CustomerDto`, `CustomerOrderDto`, `getCustomerPage`, `getCustomerOrders`, `useGetCustomerLoyalty`, `useSetCustomerActive` (Task 3); `Toggle` với `testId` (Task 5); `StaffTab` (Task 4).
- Produces: component `CustomerTab` (không prop) render bởi `page.tsx`; testid `admin-mobile-customer-card` (mobile card) và `customer-active-toggle` (toggle khoá/mở khoá, dùng chung giữa desktop cột bảng và mobile card) — dùng ở Task 7/8.

- [x] **Step 1: Tạo `CustomerDetailContent.tsx`**

```typescript
"use client";
// src/app/(admin)/admin/users/_components/CustomerDetailContent.tsx
import { Badge, BadgeVariant } from "@/components/shared/ui/Badge";
import { QUERY_KEYS } from "@/constants";
import { useTablePagination } from "@/hooks/useTablePagination";
import {
  CustomerDto,
  CustomerOrderDto,
  getCustomerOrders,
  useGetCustomerLoyalty,
} from "@/services/customer-admin";
import { OrderStatus } from "@/services/order/order.types";
import { PageParam } from "@/services/types";

const STATUS_BADGE: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Khách đặt", variant: "yellow" },
  CONFIRMED: { label: "Khách đặt", variant: "blue" },
  PREPARING: { label: "Đang pha chế", variant: "blue" },
  READY: { label: "Sẵn sàng phục vụ", variant: "green" },
  COMPLETED: { label: "Đã phục vụ", variant: "gray" },
  CANCELLED: { label: "Đã huỷ", variant: "red" },
};

interface Props {
  customer: CustomerDto;
}

const INITIAL_ORDER_FILTER: PageParam = { pageNo: 1, pageSize: 5 };

export function CustomerDetailContent({ customer }: Props) {
  const loyaltyQuery = useGetCustomerLoyalty(customer.id);
  const orders = useTablePagination<CustomerOrderDto, PageParam>({
    initialFilter: INITIAL_ORDER_FILTER,
    queryFn: (params) => getCustomerOrders(customer.id, params),
    queryKey: QUERY_KEYS.CUSTOMERS.ORDERS(customer.id, {}),
  });

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400">Tài khoản</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            @{customer.username}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Email</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {customer.email ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Ngày tạo</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {new Date(customer.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Điểm tích luỹ</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {loyaltyQuery.isLoading
              ? "…"
              : `${loyaltyQuery.data?.balance ?? 0} điểm`}
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Lịch sử đơn hàng
        </h3>
        {orders.isLoading ? (
          <p className="text-sm text-gray-400">Đang tải...</p>
        ) : orders.data.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-800">
            Khách chưa có đơn hàng nào.
          </p>
        ) : (
          <ul className="space-y-2">
            {orders.data.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-sm dark:border-gray-800"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Bàn {order.tableName} · {order.itemsCount} món
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    label={STATUS_BADGE[order.status].label}
                    variant={STATUS_BADGE[order.status].variant}
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {order.totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {orders.pagination.totalPage > 1 && (
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              onClick={() => orders.changePage(orders.pagination.pageNo - 1)}
              disabled={!orders.pagination.hasPrevPage}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400"
            >
              ← Trước
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {orders.pagination.pageNo} / {orders.pagination.totalPage}
            </span>
            <button
              onClick={() => orders.changePage(orders.pagination.pageNo + 1)}
              disabled={!orders.pagination.hasNextPage}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400"
            >
              Sau →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
```

- [x] **Step 2: Tạo `CustomerTab.tsx`**

```typescript
"use client";
// src/app/(admin)/admin/users/_components/CustomerTab.tsx
import { Badge } from "@/components/shared/ui/Badge";
import { Column, DataTable } from "@/components/shared/ui/DataTable";
import { Input } from "@/components/shared/ui/Input";
import { Modal } from "@/components/shared/ui/Modal";
import { Toggle } from "@/components/shared/ui/Toggle";
import { QUERY_KEYS } from "@/constants";
import { useTablePagination } from "@/hooks/useTablePagination";
import {
  CustomerDto,
  CustomerPageParams,
  getCustomerPage,
  useSetCustomerActive,
} from "@/services/customer-admin";
import { useState } from "react";
import { CustomerDetailContent } from "./CustomerDetailContent";

const INITIAL_FILTER: CustomerPageParams = { pageNo: 1, pageSize: 10 };

export function CustomerTab() {
  const [detailTarget, setDetailTarget] = useState<CustomerDto | null>(null);
  const setActiveM = useSetCustomerActive();

  const table = useTablePagination<CustomerDto, CustomerPageParams>({
    initialFilter: INITIAL_FILTER,
    queryFn: getCustomerPage,
    queryKey: QUERY_KEYS.CUSTOMERS.ALL,
  });

  const handleToggleActive = (row: CustomerDto, isActive: boolean) =>
    setActiveM.mutate({ id: row.id, isActive });

  const columns: Array<Column<CustomerDto>> = [
    {
      key: "customer",
      header: "Khách hàng",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {r.fullName}
          </p>
          <p className="text-xs text-gray-400">
            @{r.username}
            {r.email ? ` · ${r.email}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (r) => (
        <Badge
          label={r.isActive ? "Hoạt động" : "Đã khoá"}
          variant={r.isActive ? "green" : "gray"}
        />
      ),
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      render: (r) => new Date(r.createdAt).toLocaleDateString("vi-VN"),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (r) => (
        <div className="flex items-center gap-3 [&>button]:min-h-11">
          <button
            onClick={() => setDetailTarget(r)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20 transition-colors"
          >
            Xem
          </button>
          <Toggle
            checked={r.isActive}
            onChange={(v) => handleToggleActive(r, v)}
            disabled={setActiveM.isPending}
            testId="customer-active-toggle"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          {table.pagination.total} khách hàng
        </p>
        <Input
          placeholder="Tìm tên / tài khoản / email..."
          className="w-full sm:w-64"
          onChange={(e) =>
            table.updateFilter({ keyword: e.target.value || undefined })
          }
        />
      </div>

      <DataTable
        columns={columns}
        data={table.data}
        keyExtractor={(r) => r.id}
        isLoading={table.isLoading}
        pagination={table.pagination}
        onPageChange={table.changePage}
        onPageSizeChange={table.changePageSize}
        emptyText="Chưa có khách hàng nào."
        mobileCard={(row) => (
          <article
            data-testid="admin-mobile-customer-card"
            className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {row.fullName}
                </p>
                <p className="mt-1 truncate text-xs text-gray-400">
                  @{row.username}
                  {row.email ? ` · ${row.email}` : ""}
                </p>
              </div>
              <Badge
                label={row.isActive ? "Hoạt động" : "Đã khoá"}
                variant={row.isActive ? "green" : "gray"}
              />
            </div>
            <div className="mt-3 flex min-h-11 items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
              <Toggle
                checked={row.isActive}
                onChange={(isActive) => handleToggleActive(row, isActive)}
                disabled={setActiveM.isPending}
                testId="customer-active-toggle"
              />
              <button
                type="button"
                onClick={() => setDetailTarget(row)}
                className="min-h-11 px-2 text-xs font-semibold text-brand-600"
              >
                Xem
              </button>
            </div>
          </article>
        )}
      />

      <Modal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={
          detailTarget ? `Khách hàng · ${detailTarget.fullName}` : "Khách hàng"
        }
        size="lg"
      >
        {detailTarget && <CustomerDetailContent customer={detailTarget} />}
      </Modal>
    </div>
  );
}
```

- [x] **Step 3: Nối tab vào `page.tsx`**

Sửa toàn bộ nội dung `chalo-fe/src/app/(admin)/admin/users/page.tsx` thành:

```typescript
"use client";
// src/app/(admin)/admin/users/page.tsx
import { useState } from "react";
import { AdminMobilePageHeader } from "../../_components/AdminMobilePageHeader";
import { CustomerTab } from "./_components/CustomerTab";
import { StaffTab } from "./_components/StaffTab";

type UserTab = "STAFF" | "CUSTOMER";

const TABS: Array<{ key: UserTab; label: string }> = [
  { key: "STAFF", label: "Nhân viên" },
  { key: "CUSTOMER", label: "Khách hàng" },
];

export default function UsersPage() {
  const [tab, setTab] = useState<UserTab>("STAFF");

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <AdminMobilePageHeader
        title="Người dùng"
        description="Quản lý tài khoản nhân viên & khách hàng"
      />

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800 sm:inline-flex">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "STAFF" ? <StaffTab /> : <CustomerTab />}
    </div>
  );
}
```

- [x] **Step 4: Kiểm biên dịch**

Run: `cd chalo-fe && npx tsc --noEmit`
Expected: 0 lỗi.

- [x] **Step 5: Build**

Run: `cd chalo-fe && pnpm build`
Expected: build thành công.

- [x] **Step 6: Chạy lại e2e Task 4 để chắc chưa vỡ (tab mặc định vẫn là Nhân viên)**

Run: `cd chalo-fe && npx playwright test admin-staff.spec.ts --project=chromium`
Expected: PASS (không đổi so với Task 4 vì tab mặc định vẫn STAFF).

- [x] **Step 7: Commit**

```bash
git add "chalo-fe/src/app/(admin)/admin/users"
git commit -m "feat(fe): thêm tab Khách hàng (xem + khoá/mở khoá + chi tiết) vào /admin/users"
```

---

- [x] Task 7: E2E (desktop) — Tab Khách hàng đầy đủ luồng
## Task 7: E2E (desktop) — Tab Khách hàng đầy đủ luồng

**Files:**
- Create: `chalo-fe/e2e/admin-users-customers.spec.ts`

**Interfaces:**
- Consumes: route `/register` (form thật, field id `#fullName`, `#username`, `#password`, `#confirmPassword`, nút "Đăng ký"), route `/admin/users`, tab button "Khách hàng", testid `customer-active-toggle` (Task 5/6), dialog title `Khách hàng · <fullName>`.

Chạy trên project `chromium` mặc định (file này KHÔNG khớp `testIgnore: /admin-mobile\.spec\.ts/` nên tự động được `chromium` chạy — xem `chalo-fe/playwright.config.ts`).

- [x] **Step 1: Viết spec**

Tạo `chalo-fe/e2e/admin-users-customers.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

// Kiểm tab "Khách hàng" ở /admin/users (không lẫn với tab Nhân viên): tạo 1
// tài khoản khách hàng THẬT qua form đăng ký công khai (không mock), đăng
// nhập lại bằng admin, xác nhận khách xuất hiện trong danh sách, xem được chi
// tiết (điểm tích luỹ + lịch sử đơn), và khoá/mở khoá được tài khoản đó.
//
// NOTE: ghi 1 dòng user thật vào DB dùng chung, prefix "e2e_cust_" để dễ dọn.
test("admin xem và khoá/mở khoá tài khoản khách hàng ở tab Khách hàng", async ({
  page,
}) => {
  // 1. Tạo khách hàng thật qua form đăng ký công khai.
  const username = `e2e_cust_${Date.now()}`;
  await page.goto("/register");
  await page.locator("#fullName").fill("E2E Customer Bot");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill("secret123");
  await page.locator("#confirmPassword").fill("secret123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await page.waitForURL("**/account");

  // 2. Đăng xuất khỏi phiên khách hàng (xoá token cục bộ), đăng nhập lại bằng
  //    admin/admin.
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("admin");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin/dashboard");

  // 3. Mở /admin/users, chuyển sang tab Khách hàng.
  await page.getByRole("link", { name: "Người dùng" }).click();
  await page.waitForURL("**/admin/users");
  await page.getByRole("button", { name: "Khách hàng" }).click();

  // 4. Khách hàng vừa tạo xuất hiện trong danh sách (bảng desktop — dùng
  //    locator "tr" để không đụng hàng vào <article> mobileCard vốn luôn nằm
  //    trong DOM dù bị ẩn bằng CSS trên viewport desktop).
  const row = page.locator("tr", { hasText: `@${username}` });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row.getByText("Hoạt động")).toBeVisible();

  // 5. Xem chi tiết: thấy điểm tích luỹ + thông báo chưa có đơn hàng.
  await row.getByRole("button", { name: "Xem" }).click();
  const dialog = page.getByRole("dialog", {
    name: "Khách hàng · E2E Customer Bot",
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/điểm/)).toBeVisible();
  await expect(dialog.getByText("Khách chưa có đơn hàng nào.")).toBeVisible();
  await page.getByLabel("Đóng").click();
  await expect(dialog).toBeHidden();

  // 6. Khoá tài khoản: toggle tắt, badge chuyển "Đã khoá".
  await row.getByTestId("customer-active-toggle").click();
  await expect(row.getByText("Đã khoá")).toBeVisible({ timeout: 15_000 });

  // 7. Mở khoá lại: toggle bật, badge quay về "Hoạt động".
  await row.getByTestId("customer-active-toggle").click();
  await expect(row.getByText("Hoạt động")).toBeVisible({ timeout: 15_000 });
});
```

- [x] **Step 2: Chạy spec**

Run: `cd chalo-fe && npx playwright test admin-users-customers.spec.ts --project=chromium`
Expected: PASS.

Nếu FAIL ở bước 4 (không tìm thấy hàng) — kiểm tra `getCustomerPage` có thật sự forward `role=CUSTOMER` lên `/user/page` không (Task 3 Step 4), và BE có đang chạy với DB thật không (test này cần backend thật, không mock — theo đúng quy ước `admin-staff.spec.ts`).

- [x] **Step 3: Commit**

```bash
git add chalo-fe/e2e/admin-users-customers.spec.ts
git commit -m "test(e2e): thêm luồng admin xem/khoá tài khoản khách hàng"
```

---

- [x] Task 8: E2E (mobile) — Tab Khách hàng responsive
## Task 8: E2E (mobile) — Tab Khách hàng responsive

> **Đã bỏ qua theo quyết định người dùng**: máy dev thiếu system dependency cho WebKit (`npx playwright install-deps webkit` cần sudo, không có trong phiên làm việc). Verify mobile cho tab Khách hàng được làm bằng Playwright MCP thủ công ở Task 9 thay vì test tự động — xem summary.

**Files:**
- Modify: `chalo-fe/e2e/admin-mobile.spec.ts`

**Interfaces:**
- Consumes: helper `loginAsAdmin(page)` đã có sẵn trong file này (dòng 3-11); testid `admin-mobile-customer-card`, `customer-active-toggle` (Task 6).

File này khớp `testMatch: /admin-mobile\.spec\.ts/` của project `admin-mobile` (viewport iPhone 13) — xem `chalo-fe/playwright.config.ts`.

- [ ] **Step 1: Thêm test mới vào cuối `chalo-fe/e2e/admin-mobile.spec.ts`**

```typescript
test("mobile admin manages customer accounts from the Khách hàng tab", async ({
  page,
}) => {
  const username = `e2e_cust_mobile_${Date.now()}`;
  await page.goto("/register");
  await page.locator("#fullName").fill("E2E Customer Mobile");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill("secret123");
  await page.locator("#confirmPassword").fill("secret123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await page.waitForURL("**/account");

  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await loginAsAdmin(page);

  await page.goto("/admin/users");
  await page.getByRole("button", { name: "Khách hàng" }).click();

  const card = page
    .getByTestId("admin-mobile-customer-card")
    .filter({ hasText: `@${username}` });
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("table")).toBeHidden();

  await card.getByTestId("customer-active-toggle").click();
  await expect(card.getByText("Đã khoá")).toBeVisible({ timeout: 15_000 });

  await card.getByTestId("customer-active-toggle").click();
  await expect(card.getByText("Hoạt động")).toBeVisible({ timeout: 15_000 });
});
```

- [ ] **Step 2: Chạy spec**

Run: `cd chalo-fe && npx playwright test admin-mobile.spec.ts --project=admin-mobile`
Expected: PASS toàn bộ file (test cũ + test mới).

- [ ] **Step 3: Commit**

```bash
git add chalo-fe/e2e/admin-mobile.spec.ts
git commit -m "test(e2e): thêm kiểm tra tab Khách hàng trên viewport mobile"
```

---

- [x] Task 9: Kiểm tra toàn diện + verify UI bằng Playwright MCP
## Task 9: Kiểm tra toàn diện + verify UI bằng Playwright MCP

**Files:** không tạo/sửa file (task kiểm chứng cuối).

- [x] **Step 1: Backend — toàn bộ test**

Run: `cd chalo-be && npx jest`
Expected: PASS toàn bộ.

- [x] **Step 2: Frontend — typecheck + unit test + build**

Run:
```bash
cd chalo-fe && npx tsc --noEmit
node --test --experimental-strip-types src/**/*.test.mts 2>/dev/null || true
pnpm build
```
Expected: 0 lỗi TypeScript, build thành công, không route `/admin/staff` nào còn trong output.

- [x] **Step 3: Toàn bộ Playwright e2e cả 2 project**

Run:
```bash
cd chalo-fe && npx playwright test --project=chromium
npx playwright test --project=admin-mobile
```
Expected: PASS. Nếu có test KHÁC (không liên quan `/admin/users`) fail sẵn từ trước — đối chiếu bằng cách chạy lại đúng test đó trên `git stash` của toàn bộ thay đổi (xem cách làm ở `docs/superpowers/summaries/` của bug fix trước, mục "Full e2e suite regression scare") để xác nhận không phải do thay đổi lần này gây ra, trước khi báo cáo.

- [x] **Step 4: Verify UI thật bằng Playwright MCP (bắt buộc theo CLAUDE.md, không thay được bằng test tự động)**

Dùng công cụ Playwright MCP (`mcp__playwright__browser_navigate`, `browser_click`, `browser_resize`, `browser_take_screenshot`) trên server FE đang chạy thật:
1. Đăng nhập admin, vào `/admin/users`, chụp màn hình desktop tab Nhân viên (mặc định) và tab Khách hàng.
2. Xem chi tiết 1 khách hàng, chụp modal.
3. `browser_resize` xuống kích thước điện thoại (vd 390x844), xác nhận tab bar full-width, card hiển thị đúng, không tràn ngang.
4. Khoá/mở khoá 1 tài khoản khách trên giao diện mobile, xác nhận badge đổi ngay không cần reload.

Nếu không dựng được server để verify (môi trường không cho phép) — báo rõ với người dùng là chưa kiểm được bằng trình duyệt thật, không được báo "xong".

- [x] **Step 5: Viết summary**

Viết `docs/superpowers/summaries/2026-08-13-admin-user-management-summary.md` theo đúng 4 mục quy định trong CLAUDE.md (Đã làm gì / File chính / Khác với plan / Còn dở), dựa trên diff và commit thật — không chép lại mô tả từ plan này.

---

## Kết quả

Xem `../summaries/2026-08-13-admin-user-management-summary.md` (viết ở Task 9 Step 5, sau khi toàn bộ task đã tick `- [x]` và verify UI xong).
