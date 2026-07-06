# 02 — Backend: Public Customer Registration (`POST /auth/register`)

**Goal:** Let customers self-register through a public endpoint `POST /auth/register`. On success the account is created with a new `CUSTOMER` role and the caller is logged in immediately (same token payload shape as `POST /auth/login`). This is the tiền đề for a future Loyalty/member system. Today user creation is admin-only (`POST /user/create`, `@Roles(ADMIN)`).

**Architecture:** NestJS module `auth`. New `RegisterDto` + `AuthService.register()` + `AuthController.register()` marked `@Public()`. `register()` reuses the existing, already-tested `UserService.create()` (which performs bcrypt hashing + duplicate-username guard) and then mirrors `AuthService.login()` exactly to mint access/refresh tokens and persist the refresh-token hash. A new enum value `UserRole.CUSTOMER` is added, plus a matching Postgres enum migration (project runs `synchronize: false`).

**Tech Stack:** NestJS 11, TypeORM 0.3, bcrypt 6 (`BCRYPT_SALT_ROUNDS = 10` from `src/common/constants.ts`), `@nestjs/jwt`, class-validator 0.15, Jest 30 + ts-jest.

**Depends on:** none.

---

## Global Constraints

- **Identifier decision (documented):** The `users` table (`src/modules/user/entities/user.entity.ts`) has **no `email` column** — the unique login identifier is `username` (`varchar(50) unique`). The simplest correct approach that matches the current schema is to register with **`username`**, and to reuse the existing unique-username constraint for "duplicate" handling. `UserService.create()` already throws `BadRequestException('Tên đăng nhập đã tồn tại')` when the username exists; `register()` reuses that path unchanged (→ HTTP 400). Adding an `email`/`phone` column belongs to the later Loyalty schema work and is intentionally **out of scope** here. Wherever the source prompt says "duplicate-email", read it as **duplicate-username** for this codebase.
- **Role decision (documented):** `src/common/enums/user-role.enum.ts` currently has only `ADMIN` and `MODERATOR`. Registration must NOT create privileged accounts. Add a third value `CUSTOMER = 'CUSTOMER'`. `AuthService` holds `PERMISSIONS: Record<UserRole, string[]>` — TypeScript will fail to compile until `CUSTOMER` has an entry, so add `[UserRole.CUSTOMER]: []` (customers get no admin/staff permissions). `register()` always sets `role: UserRole.CUSTOMER` and `isActive: true` server-side; the client cannot choose a role (RegisterDto has no `role`/`isActive` fields).
- **Postgres enum migration required:** `data-source.ts` uses `synchronize: false`. The `role` column is a Postgres enum type `users_role_enum`. Adding `CUSTOMER` to the TS enum has no effect on an existing DB without a migration. Add one mirroring `src/migrations/1736150500000-AddPaidOrderStatus.ts` (idempotent `ALTER TYPE ... ADD VALUE IF NOT EXISTS`).
- **Reuse, don't duplicate:** Do not re-implement password hashing or the duplicate guard in `AuthService`. Call `UserService.create()`. Do not re-implement token building — call the existing private `buildTokens()`.
- **Response envelope:** `src/common/interceptors/response.interceptor.ts` wraps every controller return value as `{ code, message: 'success', data }`. `code` is the HTTP status. `POST` returns **201** by default (no `@HttpCode` override on register), so the success envelope is `code: 201`. Return the raw payload from the controller — do not wrap it manually.
- **DTO style:** Match `src/modules/user/dto/create-user.dto.ts` exactly — `@ApiProperty` + class-validator decorators, `@MinLength(3)/@MaxLength(50)` on username, `@MinLength(6)` on password, `@MinLength(1)/@MaxLength(100)` on fullName.
- **No new module wiring needed:** `AuthModule` already imports `UserModule`, which `exports: [UserService]`. `AuthService` already injects `UserService`, `JwtService`, `ConfigService`.
- **Test command:** `npm test` (Jest, `testRegex: ".*\\.spec\\.ts$"`, `rootDir: src`). Run one file with `npm test -- <path-relative-to-repo-root>`, e.g. `npm test -- src/modules/auth/auth.service.spec.ts`. All commands run from `g:\Chalo\chalo-be`.
- **TDD loop for every task:** write the failing test → `npm test -- <file>` shows RED → implement → `npm test -- <file>` shows GREEN → `rtk git add -A && rtk git commit`.

---

## Interfaces

### Produces (contract the FE registration plan consumes)

**Endpoint:** `POST /auth/register` — public, no `Authorization` header.

**Request body** (`application/json`):
```json
{
  "username": "customer01",
  "password": "123456",
  "fullName": "Nguyễn Văn Khách"
}
```
Validation: `username` string, 3–50 chars; `password` string, ≥6 chars; `fullName` string, 1–100 chars. `role` and `isActive` are NOT accepted from the client.

**Success response** — HTTP `201`:
```json
{
  "code": 201,
  "message": "success",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": 5,
      "username": "customer01",
      "fullName": "Nguyễn Văn Khách",
      "avatar": null,
      "role": "CUSTOMER",
      "permission": []
    }
  }
}
```
(Same `data` shape as `POST /auth/login`, so the FE can reuse its existing login-response handling; `permission` is an empty array for customers.)

**Error responses:**
- `400` duplicate username → `{ "code": 400, "message": "Tên đăng nhập đã tồn tại", ... }`
- `400` validation failure (bad/short username, short password, etc.) → standard Nest `ValidationPipe` 400.

### Consumes
- `UserService.create(dto)` → returns the created user without `password`/`currentRefreshTokenHash` (`id`, `username`, `fullName`, `avatar`, `role`, `isActive`, `createdAt`). Hashes password with bcrypt; throws `BadRequestException('Tên đăng nhập đã tồn tại')` on duplicate.
- `UserService.setRefreshTokenHash(userId, hash)` → persists the current refresh-token hash.
- `AuthService.buildTokens(userId, username, role)` (private) → `{ accessToken, refreshToken }`.

---

## Task 1 — Add `CUSTOMER` role + permissions entry

**Files:**
- `g:\Chalo\chalo-be\src\common\enums\user-role.enum.ts` (edit)
- `g:\Chalo\chalo-be\src\modules\auth\auth.service.ts` (edit — `PERMISSIONS` map)

**1a. Write the failing test.** Create `g:\Chalo\chalo-be\src\common\enums\user-role.enum.spec.ts`:
```ts
import { UserRole } from './user-role.enum';

describe('UserRole', () => {
  it('includes a CUSTOMER role for public self-registration', () => {
    expect(UserRole.CUSTOMER).toBe('CUSTOMER');
  });

  it('keeps the existing staff roles', () => {
    expect(UserRole.ADMIN).toBe('ADMIN');
    expect(UserRole.MODERATOR).toBe('MODERATOR');
  });
});
```

**1b. Run RED:** `npm test -- src/common/enums/user-role.enum.spec.ts` → fails to compile (`CUSTOMER` does not exist).

**1c. Implement.** Edit `user-role.enum.ts`:
```ts
export enum UserRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  CUSTOMER = 'CUSTOMER',
}
```
Edit the `PERMISSIONS` constant in `auth.service.ts` (top of file, after imports) so the `Record<UserRole, string[]>` stays exhaustive:
```ts
const PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: ['menu:write', 'table:write', 'order:write', 'staff:write'],
  [UserRole.MODERATOR]: ['order:write', 'order:read'],
  [UserRole.CUSTOMER]: [],
};
```

**1d. Run GREEN:** `npm test -- src/common/enums/user-role.enum.spec.ts` passes; also run `npm test` to confirm nothing else broke (the exhaustive `Record` now compiles).

**1e. Commit:** `rtk git add -A && rtk git commit -m "feat(auth): add CUSTOMER role for public registration"`

---

## Task 2 — `RegisterDto`

**Files:**
- `g:\Chalo\chalo-be\src\modules\auth\dto\register.dto.ts` (new)
- `g:\Chalo\chalo-be\src\modules\auth\dto\register.dto.spec.ts` (new)

**2a. Write the failing test.** Create `register.dto.spec.ts` (uses `class-validator`'s `validate()` + `class-transformer`'s `plainToInstance`, both already deps):
```ts
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

const base = { username: 'customer01', password: '123456', fullName: 'Khách' };

async function errorsFor(payload: Record<string, unknown>) {
  return validate(plainToInstance(RegisterDto, payload));
}

describe('RegisterDto', () => {
  it('accepts a valid customer payload', async () => {
    expect(await errorsFor(base)).toHaveLength(0);
  });

  it('rejects a username shorter than 3 chars', async () => {
    const errors = await errorsFor({ ...base, username: 'ab' });
    expect(errors).not.toHaveLength(0);
  });

  it('rejects a password shorter than 6 chars', async () => {
    const errors = await errorsFor({ ...base, password: '123' });
    expect(errors).not.toHaveLength(0);
  });

  it('rejects an empty fullName', async () => {
    const errors = await errorsFor({ ...base, fullName: '' });
    expect(errors).not.toHaveLength(0);
  });
});
```

**2b. Run RED:** `npm test -- src/modules/auth/dto/register.dto.spec.ts` → fails (module not found).

**2c. Implement.** Create `register.dto.ts` (mirrors `create-user.dto.ts`, minus `role`/`isActive`):
```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'customer01' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn Khách' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fullName: string;
}
```

**2d. Run GREEN:** `npm test -- src/modules/auth/dto/register.dto.spec.ts` passes.

**2e. Commit:** `rtk git add -A && rtk git commit -m "feat(auth): add RegisterDto"`

---

## Task 3 — `AuthService.register()`

**Files:**
- `g:\Chalo\chalo-be\src\modules\auth\auth.service.ts` (edit)
- `g:\Chalo\chalo-be\src\modules\auth\auth.service.spec.ts` (new)

**3a. Write the failing test.** Create `auth.service.spec.ts` with mocked `UserService`, `JwtService`, `ConfigService`:
```ts
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../../common/enums/user-role.enum';

describe('AuthService.register', () => {
  let service: AuthService;
  let userService: { create: jest.Mock; setRefreshTokenHash: jest.Mock };

  const dto: RegisterDto = {
    username: 'customer01',
    password: '123456',
    fullName: 'Nguyễn Văn Khách',
  };

  beforeEach(async () => {
    userService = {
      create: jest.fn(),
      setRefreshTokenHash: jest.fn().mockResolvedValue(undefined),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: { sign: jest.fn(() => 'signed.jwt.token') } },
        { provide: ConfigService, useValue: { get: jest.fn(() => 'secret') } },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('creates a CUSTOMER account and returns tokens + user (login-shaped)', async () => {
    userService.create.mockResolvedValue({
      id: 5,
      username: 'customer01',
      fullName: 'Nguyễn Văn Khách',
      avatar: null,
      role: UserRole.CUSTOMER,
      isActive: true,
    });

    const result = await service.register(dto);

    // reuses UserService.create with forced CUSTOMER role + isActive
    expect(userService.create).toHaveBeenCalledWith({
      username: 'customer01',
      password: '123456',
      fullName: 'Nguyễn Văn Khách',
      role: UserRole.CUSTOMER,
      isActive: true,
    });
    // persists a refresh-token hash for user 5
    expect(userService.setRefreshTokenHash).toHaveBeenCalledWith(5, expect.any(String));
    expect(result).toEqual({
      accessToken: 'signed.jwt.token',
      refreshToken: 'signed.jwt.token',
      user: {
        id: 5,
        username: 'customer01',
        fullName: 'Nguyễn Văn Khách',
        avatar: null,
        role: UserRole.CUSTOMER,
        permission: [],
      },
    });
  });

  it('propagates the duplicate-username error from UserService.create', async () => {
    userService.create.mockRejectedValue(
      new BadRequestException('Tên đăng nhập đã tồn tại'),
    );
    await expect(service.register(dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(userService.setRefreshTokenHash).not.toHaveBeenCalled();
  });
});
```

**3b. Run RED:** `npm test -- src/modules/auth/auth.service.spec.ts` → fails (`register` does not exist).

**3c. Implement.** Add `import { RegisterDto } from './dto/register.dto';` to `auth.service.ts`, then add the method (place it after `login()`, mirroring the login token/refresh-hash flow and reusing `buildTokens` + `BCRYPT_SALT_ROUNDS` already imported):
```ts
async register(dto: RegisterDto) {
  // UserService.create hashes the password (bcrypt) and enforces the
  // unique-username guard → BadRequestException('Tên đăng nhập đã tồn tại').
  const user = await this.userService.create({
    username: dto.username,
    password: dto.password,
    fullName: dto.fullName,
    role: UserRole.CUSTOMER,
    isActive: true,
  });

  const tokens = this.buildTokens(user.id, user.username, user.role);
  const tokenHash = await bcrypt.hash(tokens.refreshToken, BCRYPT_SALT_ROUNDS);
  await this.userService.setRefreshTokenHash(user.id, tokenHash);

  return {
    ...tokens,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      role: user.role,
      permission: PERMISSIONS[user.role],
    },
  };
}
```

**3d. Run GREEN:** `npm test -- src/modules/auth/auth.service.spec.ts` passes.

**3e. Commit:** `rtk git add -A && rtk git commit -m "feat(auth): AuthService.register creates CUSTOMER and issues tokens"`

---

## Task 4 — `POST /auth/register` controller route (`@Public`)

**Files:**
- `g:\Chalo\chalo-be\src\modules\auth\auth.controller.ts` (edit)
- `g:\Chalo\chalo-be\src\modules\auth\auth.controller.spec.ts` (new)

**4a. Write the failing test.** Create `auth.controller.spec.ts` — verifies the handler delegates to the service and that the route carries the `@Public()` metadata (`IS_PUBLIC_KEY`):
```ts
import { Reflector } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';

describe('AuthController.register', () => {
  const authService = { register: jest.fn() };
  const controller = new AuthController(authService as unknown as AuthService);

  const dto: RegisterDto = {
    username: 'customer01',
    password: '123456',
    fullName: 'Nguyễn Văn Khách',
  };

  it('delegates to AuthService.register', async () => {
    const payload = { accessToken: 'a', refreshToken: 'r', user: {} };
    authService.register.mockResolvedValue(payload);
    await expect(controller.register(dto)).resolves.toBe(payload);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('is a public route', () => {
    const isPublic = new Reflector().get<boolean>(IS_PUBLIC_KEY, controller.register);
    expect(isPublic).toBe(true);
  });
});
```

**4b. Run RED:** `npm test -- src/modules/auth/auth.controller.spec.ts` → fails (`register` not on controller).

**4c. Implement.** In `auth.controller.ts` add the import `import { RegisterDto } from './dto/register.dto';` and add the handler (after `login`, before `refresh`). No `@HttpCode` → POST returns 201:
```ts
@Post('register')
@Public()
@ApiOkResponse({
  description: 'Register success',
  schema: {
    example: {
      code: 201,
      message: 'success',
      data: {
        accessToken: 'eyJ...',
        refreshToken: 'eyJ...',
        user: { id: 5, username: 'customer01', fullName: 'Nguyễn Văn Khách', avatar: null, role: 'CUSTOMER', permission: [] },
      },
    },
  },
})
register(@Body() dto: RegisterDto) {
  return this.authService.register(dto);
}
```

**4d. Run GREEN:** `npm test -- src/modules/auth/auth.controller.spec.ts` passes.

**4e. Commit:** `rtk git add -A && rtk git commit -m "feat(auth): add public POST /auth/register endpoint"`

---

## Task 5 — Postgres enum migration for `CUSTOMER`

**Files:**
- `g:\Chalo\chalo-be\src\migrations\1736150700000-AddCustomerRole.ts` (new)

No unit test (migration is DDL). Verified by `npm run migration:run` against a dev DB. Mirror `1736150500000-AddPaidOrderStatus.ts` — idempotent, safe if run twice, and safe whether or not the enum type already exists.

**5a. Implement.** Create the migration:
```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerRole1736150700000 implements MigrationInterface {
  name = 'AddCustomerRole1736150700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type t WHERE t.typname = 'users_role_enum'
        ) THEN
          ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'CUSTOMER';
        END IF;
      END
      $$;
    `);
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing enum values safely.
  }
}
```

**5b. Verify (dev DB):** `npm run migration:run` → applies without error; re-running is a no-op (`ADD VALUE IF NOT EXISTS`).

**5c. Commit:** `rtk git add -A && rtk git commit -m "chore(db): migration adding CUSTOMER to users_role_enum"`

---

## Final verification

- `npm test` — full suite green (new: enum, dto, service, controller specs).
- `npm run build` — TypeScript compiles (confirms `PERMISSIONS` `Record<UserRole,string[]>` is exhaustive and `UserService.create()` accepts the constructed object).
- Manual smoke (optional): start `npm run dev`, `POST /auth/register` with a fresh username returns 201 + tokens; repeating the same username returns 400 `Tên đăng nhập đã tồn tại`.
