# 08 — FE Admin: Staff, Settings & Orders pages

## Goal
Implement the three ADMIN pages whose sidebar links already exist (`ADMIN_NAV_ITEMS` in `chalo-fe/src/app/(admin)/_components/sidebar.config.ts`) but whose route files are missing:

- **A. Staff** — `admin/staff/page.tsx`: DataTable of users, create/edit staff modal, role (ADMIN/MODERATOR), active/inactive toggle, change-password modal. Wired to `GET /user/page`, `POST /user/create`, `PUT /user/update`, `PUT /user/change-password`, `DELETE /user/delete`.
- **B. Settings** — `admin/settings/page.tsx`: wait-time estimate toggle + barista count, wired to `GET/PUT /settings`.
- **C. Orders** — `admin/orders/page.tsx`: paginated DataTable of all orders with filters (status, date, table), wired to `GET /order/page`.

## Architecture
Copy the ESTABLISHED admin CRUD-page pattern verbatim (see `admin/tables/page.tsx` and `admin/menu/products/page.tsx`):
- **Service layer** per domain under `src/services/<domain>/`: `*.types.ts` (interfaces + `as const` unions), `*.api.ts` (thin `request.*` wrappers using `API.*` endpoint constants), `*.queries.ts` (`useQuery`/`useMutation` with `QUERY_KEYS.*`, `toast` on success/error, `invalidateQueries`), `index.ts` barrel.
- **Pagination** via the generic `useTablePagination<T, F>` hook (`src/hooks/useTablePagination.ts`) driving the shared `<DataTable>`.
- **Pages** are `"use client"` route files under `src/app/(admin)/admin/<x>/page.tsx`; per-page form components live in a sibling `_components/` folder.
- **Forms** use `react-hook-form` + `zodResolver` with a schema in `src/schemas/`, rendered through the shared UI kit (`FormField`, `Input`, `Select`, `Toggle`) inside `<Modal>`; destructive actions use `<ConfirmDialog>`.
- **API envelope**: `request.*` (`src/lib/api-client.ts`) already unwraps `{code,message,data}` → returns `data` directly and rejects non-200 with the backend message; global `error-handler` toasts errors. Query fns therefore type their return as the bare `data` shape.

## Tech Stack
Next.js (App Router, MODIFIED build — see Global Constraints), React 19, `@tanstack/react-query` v5, `react-hook-form` + `@hookform/resolvers/zod`, `zod`, `sonner` toast, Tailwind, axios (`request`).

## Depends on
- **`03-be-settings`** — the Settings page (Section B) requires the BE `GET/PUT /settings` endpoints and its response contract. No `settings` module exists in `chalo-be/src/modules/` yet. Section B assumes the contract below and MUST be reconciled against the plan-03 DTO before coding. Sections A and C have no cross-plan dependency (their BE endpoints already exist in `user.controller.ts` / `order.controller.ts`).

---

## Global Constraints

- **⚠️ MODIFIED Next.js — READ DOCS FIRST.** Per `chalo-fe/AGENTS.md`, this is NOT stock Next.js; APIs/conventions/file structure may differ from training data. BEFORE writing ANY FE code, the implementer MUST read the relevant guide(s) in `chalo-fe/node_modules/next/dist/docs/` (routing, client components, App Router conventions) and heed any deprecation notices. Do not assume stock behavior.
- **Copy the existing pattern exactly.** Match import style, Vietnamese UI copy, Tailwind class conventions, and file layout of `admin/tables/` and `admin/menu/products/`. Do not introduce new UI primitives — reuse `DataTable`, `Modal`, `ConfirmDialog`, `FormField`, `Input`, `Select`, `Toggle`, `Badge`.
- **Route files are `"use client"`** and default-export a `PascalCase` component named after the page.
- **Never call axios directly** — always go through `request` from `@/lib/api-client`. Query/mutation fns return the bare `data` type (envelope already unwrapped). Errors surface via the global handler + `sonner`; mutations still add `onError: (e: Error) => toast.error(e.message)` and `onSuccess` success toasts, matching `table.queries.ts`.
- **Endpoint & query-key registration**: add every new endpoint to `src/constants/api-endpoints.ts` (`API.*`) and every new key to `src/constants/query-keys.ts` (`QUERY_KEYS.*`). Never hardcode URLs or key arrays in services.
- **Import from `@/constants`** (barrel) for `API`, `QUERY_KEYS`, `ROUTES`.
- **Types are `as const` unions**, not TS `enum`, for domain statuses/roles (match `ORDER_STATUS`, `TABLE_STATUS`).
- **Verify by running the app** (`admin` shell). Manual checks are concrete route visits + expected UI/behavior. Commit after each section with the RTK-prefixed git commands shown.
- Do not run destructive git ops. Branch is already set by the executor.

---

# Section A — Staff management

BE reference (`chalo-be/src/modules/user/user.controller.ts`, all `@Roles(ADMIN)` except change-password):
- `GET /user/page` — query `pageNo, pageSize, keyword, role, isActive` → `{ list: UserDto[], total }`
- `POST /user/create` — body `CreateUserDto { username, password, fullName, role, isActive }`
- `PUT /user/update` — body `UpdateUserDto { id, fullName, avatar, role, isActive }`
- `PUT /user/change-password` — body `ChangePasswordDto { id, oldPassword?, newPassword }` (`oldPassword` only required when a MODERATOR changes their OWN password; admin changing staff omits it)
- `DELETE /user/delete?id=` — query `id`

UserDto shape = `User` entity minus `password`/`currentRefreshTokenHash` (`user.service.ts` `toDto`): `{ id:number, username, fullName, avatar:string|null, role, isActive:boolean, createdAt:string }`. Roles enum = `ADMIN | MODERATOR` (`common/enums/user-role.enum.ts`).

### A1. Register user endpoints & query keys
**Files:** `chalo-fe/src/constants/api-endpoints.ts`, `chalo-fe/src/constants/query-keys.ts`
- `API.USER` already has `PAGE, CREATE, UPDATE, CHANGE_PASSWORD, DELETE` (verify present — it is). No change needed unless missing.
- Add to `QUERY_KEYS`:
```ts
USERS: {
  ALL: ["users"] as const,
  PAGE: (params: object) => ["users", "page", params] as const,
} as const,
```

### A2. User service — types
**Files:** `chalo-fe/src/services/user/user.types.ts`
```ts
// src/services/user/user.types.ts
import { PageParam } from "../types";

export const USER_ROLE = ["ADMIN", "MODERATOR"] as const;
export type UserRole = (typeof USER_ROLE)[number];

export interface UserDto {
  id: number;
  username: string;
  fullName: string;
  avatar: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export interface UpdateUserPayload {
  id: number;
  fullName: string;
  avatar: string | null;
  role: UserRole;
  isActive: boolean;
}

export interface ChangePasswordPayload {
  id: number;
  oldPassword?: string;
  newPassword: string;
}

export interface UserPageParams extends PageParam {
  keyword?: string;
  role?: UserRole;
  isActive?: boolean;
}
```

### A3. User service — api
**Files:** `chalo-fe/src/services/user/user.api.ts`
```ts
// src/services/user/user.api.ts
import { API } from "@/constants";
import { request } from "@/lib/api-client";
import { PageResult } from "../types";
import {
  ChangePasswordPayload,
  CreateUserPayload,
  UpdateUserPayload,
  UserDto,
  UserPageParams,
} from "./user.types";

export const getUserPage = (
  params: UserPageParams,
): Promise<PageResult<UserDto>> => request.get(API.USER.PAGE, { params });

export const createUser = (data: CreateUserPayload): Promise<UserDto> =>
  request.post(API.USER.CREATE, data);

export const updateUser = (data: UpdateUserPayload): Promise<UserDto> =>
  request.put(API.USER.UPDATE, data);

export const changePassword = (data: ChangePasswordPayload): Promise<void> =>
  request.put(API.USER.CHANGE_PASSWORD, data);

export const deleteUser = (id: number): Promise<void> =>
  request.delete(API.USER.DELETE, { params: { id } });
```

### A4. User service — queries + barrel
**Files:** `chalo-fe/src/services/user/user.queries.ts`, `chalo-fe/src/services/user/index.ts`
- `user.queries.ts` (mirror `table.queries.ts` — `invalidate QUERY_KEYS.USERS.ALL`, success/error toasts):
```ts
"use client";
// src/services/user/user.queries.ts
import { QUERY_KEYS } from "@/constants";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  changePassword,
  createUser,
  deleteUser,
  getUserPage,
  updateUser,
} from "./user.api";
import {
  ChangePasswordPayload,
  CreateUserPayload,
  UpdateUserPayload,
  UserPageParams,
} from "./user.types";

export const useGetUserPage = (params: UserPageParams) =>
  useQuery({
    queryKey: QUERY_KEYS.USERS.PAGE(params),
    queryFn: () => getUserPage(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserPayload) => createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      toast.success("Thêm nhân viên thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserPayload) => updateUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      toast.success("Cập nhật nhân viên thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: (data: ChangePasswordPayload) => changePassword(data),
    onSuccess: () => toast.success("Đổi mật khẩu thành công"),
    onError: (e: Error) => toast.error(e.message),
  });

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      toast.success("Xoá nhân viên thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
```
- `index.ts`:
```ts
// src/services/user/index.ts
export * from "./user.api";
export * from "./user.types";
export * from "./user.queries";
```

### A5. Staff form schemas
**Files:** `chalo-fe/src/schemas/user.schema.ts`
Mirror BE class-validator rules (`create-user.dto.ts`, `update-user.dto.ts`).
```ts
// src/schemas/user.schema.ts
import z from "zod";

export const StaffRoleEnum = z.enum(["ADMIN", "MODERATOR"]);

// Used for BOTH create (password required) and edit (username/password hidden).
export const StaffCreateSchema = z.object({
  username: z.string().min(3, "Tối thiểu 3 ký tự").max(50),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  fullName: z.string().min(1, "Không được để trống").max(100),
  role: StaffRoleEnum,
  isActive: z.boolean(),
});
export type StaffCreateType = z.infer<typeof StaffCreateSchema>;

export const StaffUpdateSchema = z.object({
  fullName: z.string().min(1, "Không được để trống").max(100),
  role: StaffRoleEnum,
  isActive: z.boolean(),
});
export type StaffUpdateType = z.infer<typeof StaffUpdateSchema>;

export const ChangePasswordSchema = z.object({
  newPassword: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});
export type ChangePasswordType = z.infer<typeof ChangePasswordSchema>;
```

### A6. StaffForm component (create + edit)
**Files:** `chalo-fe/src/app/(admin)/admin/staff/_components/StaffForm.tsx`
Pattern = `tables/_components/TableForm.tsx`. On create show username+password+fullName+role+active; on edit hide username/password (BE `update` doesn't accept them). Use two `useForm` resolvers switched by `defaultValue`, OR two form components — keep ONE component branching on `defaultValue` presence:
```tsx
"use client";
// src/app/(admin)/admin/staff/_components/StaffForm.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { FormField } from "@/components/shared/ui/FormField";
import { Input } from "@/components/shared/ui/Input";
import { Select } from "@/components/shared/ui/Select";
import { Toggle } from "@/components/shared/ui/Toggle";
import {
  StaffCreateSchema,
  StaffCreateType,
  StaffUpdateSchema,
  StaffUpdateType,
} from "@/schemas/user.schema";
import { UserDto } from "@/services/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

const ROLE_OPTIONS = [
  { label: "Quản trị (ADMIN)", value: "ADMIN" },
  { label: "Nhân viên (MODERATOR)", value: "MODERATOR" },
];

interface StaffFormProps {
  defaultValue?: UserDto;
  onSubmitCreate?: (data: StaffCreateType) => void;
  onSubmitUpdate?: (data: StaffUpdateType) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const StaffForm = ({
  defaultValue,
  onSubmitCreate,
  onSubmitUpdate,
  onCancel,
  isLoading,
}: StaffFormProps) => {
  const isEdit = !!defaultValue;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StaffCreateType>({
    resolver: zodResolver(isEdit ? StaffUpdateSchema : StaffCreateSchema),
    defaultValues: isEdit
      ? {
          fullName: defaultValue!.fullName,
          role: defaultValue!.role,
          isActive: defaultValue!.isActive,
        }
      : { role: "MODERATOR", isActive: true },
  });

  const submit = handleSubmit((data) => {
    if (isEdit) {
      onSubmitUpdate?.({
        fullName: data.fullName,
        role: data.role,
        isActive: data.isActive,
      });
    } else {
      onSubmitCreate?.(data);
    }
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      {!isEdit && (
        <>
          <FormField label="Tên đăng nhập" required error={errors.username?.message}>
            <Input {...register("username")} error={!!errors.username} placeholder="vd: staff02" />
          </FormField>
          <FormField label="Mật khẩu" required error={errors.password?.message}>
            <Input type="password" {...register("password")} error={!!errors.password} placeholder="Tối thiểu 6 ký tự" />
          </FormField>
        </>
      )}

      <FormField label="Họ tên" required error={errors.fullName?.message}>
        <Input {...register("fullName")} error={!!errors.fullName} placeholder="vd: Lê Văn Nhân Viên" />
      </FormField>

      <FormField label="Vai trò" required error={errors.role?.message}>
        <Select options={ROLE_OPTIONS} {...register("role")} error={!!errors.role} />
      </FormField>

      <Controller
        control={control}
        name="isActive"
        render={({ field }) => (
          <Toggle checked={field.value} onChange={field.onChange} label="Đang hoạt động" />
        )}
      />

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={isLoading}
          className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
          Huỷ
        </button>
        <button type="submit" disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-brand-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors disabled:opacity-60">
          {isLoading && <SpinnerIcon className="animate-spin" />}
          {isEdit ? "Cập nhật" : "Tạo mới"}
        </button>
      </div>
    </form>
  );
};
```
> Note: confirm `SpinnerIcon` path (`@/components/shared/icons/SpinnerIcon`) exists — TableForm imports it. If register on a native `<select>` from the shared `Select` typechecks (it spreads `...props` onto `<select>`), `{...register("role")}` works; otherwise wrap role in a `Controller` like `isActive`.

### A7. ChangePasswordForm component
**Files:** `chalo-fe/src/app/(admin)/admin/staff/_components/ChangePasswordForm.tsx`
Admin resets a staff member's password (no `oldPassword` — see controller). Single field:
```tsx
"use client";
// src/app/(admin)/admin/staff/_components/ChangePasswordForm.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { FormField } from "@/components/shared/ui/FormField";
import { Input } from "@/components/shared/ui/Input";
import { ChangePasswordSchema, ChangePasswordType } from "@/schemas/user.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface Props {
  onSubmit: (data: ChangePasswordType) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ChangePasswordForm = ({ onSubmit, onCancel, isLoading }: Props) => {
  const { register, handleSubmit, formState: { errors } } = useForm<ChangePasswordType>({
    resolver: zodResolver(ChangePasswordSchema),
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Mật khẩu mới" required error={errors.newPassword?.message}>
        <Input type="password" {...register("newPassword")} error={!!errors.newPassword} placeholder="Tối thiểu 6 ký tự" />
      </FormField>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={isLoading}
          className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">Huỷ</button>
        <button type="submit" disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-brand-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors disabled:opacity-60">
          {isLoading && <SpinnerIcon className="animate-spin" />} Đổi mật khẩu
        </button>
      </div>
    </form>
  );
};
```

### A8. Staff page
**Files:** `chalo-fe/src/app/(admin)/admin/staff/page.tsx`
Pattern = `tables/page.tsx`. Filters: keyword `Input`, role `Select`, active `Select` (all → `updateFilter`). Columns: user (fullName + @username), role `Badge`, status `Toggle` (calls `useUpdateUser` preserving other fields), actions (Sửa / Đổi MK / Xoá). Four modals: create, edit, change-password, delete confirm.
```tsx
"use client";
// src/app/(admin)/admin/staff/page.tsx
import { Badge } from "@/components/shared/ui/Badge";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { Column, DataTable } from "@/components/shared/ui/DataTable";
import { Input } from "@/components/shared/ui/Input";
import { Modal } from "@/components/shared/ui/Modal";
import { Select } from "@/components/shared/ui/Select";
import { Toggle } from "@/components/shared/ui/Toggle";
import { QUERY_KEYS } from "@/constants";
import { useTablePagination } from "@/hooks/useTablePagination";
import { StaffCreateType, StaffUpdateType, ChangePasswordType } from "@/schemas/user.schema";
import {
  getUserPage,
  UserDto,
  UserPageParams,
  useChangePassword,
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
} from "@/services/user";
import { PageParam } from "@/services/types";
import { useState } from "react";
import { StaffForm } from "./_components/StaffForm";
import { ChangePasswordForm } from "./_components/ChangePasswordForm";

const INITIAL_FILTER: UserPageParams = { pageNo: 1, pageSize: 10 };

export default function StaffPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserDto | null>(null);
  const [pwTarget, setPwTarget] = useState<UserDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null);

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
    updateM.mutate({ id: row.id, fullName: row.fullName, avatar: row.avatar, role: row.role, isActive });

  const handleChangePw = (data: ChangePasswordType) => {
    if (!pwTarget) return;
    pwM.mutate({ id: pwTarget.id, newPassword: data.newPassword }, { onSuccess: () => setPwTarget(null) });
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
          <p className="font-medium text-gray-900 dark:text-gray-100">{r.fullName}</p>
          <p className="text-xs text-gray-400">@{r.username}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Vai trò",
      render: (r) => <Badge label={r.role === "ADMIN" ? "Quản trị" : "Nhân viên"} variant={r.role === "ADMIN" ? "blue" : "gray"} />,
    },
    {
      key: "active",
      header: "Hoạt động",
      render: (r) => (
        <Toggle checked={r.isActive} onChange={(v) => handleToggleActive(r, v)} disabled={updateM.isPending} />
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (r) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setEditTarget(r)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20 transition-colors">Sửa</button>
          <button onClick={() => setPwTarget(r)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">Đổi MK</button>
          <button onClick={() => setDeleteTarget(r)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">Xoá</button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Nhân viên</h1>
          <p className="mt-0.5 text-sm text-gray-500">Quản lý tài khoản nhân viên & quản trị</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors">+ Thêm nhân viên</button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Input placeholder="Tìm tên / tài khoản..." className="w-56"
          onChange={(e) => table.updateFilter({ keyword: e.target.value || undefined })} />
        <Select className="w-44" placeholder="Tất cả vai trò"
          options={[{ label: "Quản trị", value: "ADMIN" }, { label: "Nhân viên", value: "MODERATOR" }]}
          onChange={(e) => table.updateFilter({ role: (e.target.value as UserDto["role"]) || undefined })} />
        <Select className="w-44" placeholder="Tất cả trạng thái"
          options={[{ label: "Đang hoạt động", value: "true" }, { label: "Ngừng", value: "false" }]}
          onChange={(e) => table.updateFilter({ isActive: e.target.value === "" ? undefined : e.target.value === "true" })} />
      </div>

      <DataTable columns={columns} data={table.data} keyExtractor={(r) => r.id}
        isLoading={table.isLoading} pagination={table.pagination}
        onPageChange={table.changePage} onPageSizeChange={table.changePageSize}
        emptyText="Chưa có nhân viên nào." />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Thêm nhân viên">
        <StaffForm onSubmitCreate={handleCreate} onCancel={() => setCreateOpen(false)} isLoading={createM.isPending} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Chỉnh sửa nhân viên">
        {editTarget && (
          <StaffForm defaultValue={editTarget} onSubmitUpdate={handleUpdate} onCancel={() => setEditTarget(null)} isLoading={updateM.isPending} />
        )}
      </Modal>

      <Modal open={!!pwTarget} onClose={() => setPwTarget(null)} title={`Đổi mật khẩu · ${pwTarget?.fullName ?? ""}`}>
        {pwTarget && <ChangePasswordForm onSubmit={handleChangePw} onCancel={() => setPwTarget(null)} isLoading={pwM.isPending} />}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Xoá nhân viên" message={`Xác nhận xoá tài khoản "${deleteTarget?.fullName}"?`}
        confirmLabel="Xoá" isLoading={deleteM.isPending} />
    </div>
  );
}
```

### A9. Verify Staff
- Read `chalo-fe/node_modules/next/dist/docs/` routing/client-component guide first (Global Constraint).
- Run the FE app; log in as ADMIN; visit `http://localhost:3000/admin/staff`.
- Expect: table lists users with role badge + active toggle; pagination footer shows total.
- Click "+ Thêm nhân viên" → fill username/password/fullName, pick role, submit → success toast, row appears, modal closes.
- Toggle a row's active switch → success toast, state persists after refetch.
- "Sửa" → change fullName/role, submit → row updates (username field NOT shown).
- "Đổi MK" → set new password → success toast; log out and log in as that staff with the new password to confirm.
- "Xoá" → confirm dialog → row removed.
- Filters: type keyword / pick role / pick status → list narrows; empty state text shows when no match.

### A10. Commit Staff
```bash
rtk git add chalo-fe/src/services/user chalo-fe/src/schemas/user.schema.ts "chalo-fe/src/app/(admin)/admin/staff" chalo-fe/src/constants/query-keys.ts && rtk git commit -m "feat(admin): staff management page (list/create/edit/toggle/change-password/delete)"
```

---

# Section B — Settings  (Depends on 03-be-settings)

> **Reconcile before coding.** No `settings` module exists in `chalo-be/src/modules/` yet; plan `03-be-settings` introduces `GET/PUT /settings`. The BE currently hardcodes barista count as `ESTIMATED_WAIT_BARISTAS = 3` in `chalo-be/src/common/constants.ts` and uses it in `order.service.ts` wait estimation. The assumed contract below (a toggle to enable/disable showing the wait-time estimate + the parallel-barista count) MUST match the plan-03 response DTO. If field names differ, update `SettingsDto`/`UpdateSettingsPayload` in B2 accordingly — everything else stays.

**Assumed contract (align with plan 03):**
- `GET /settings` → `{ waitTimeEnabled: boolean, baristaCount: number }`
- `PUT /settings` — body `{ waitTimeEnabled: boolean, baristaCount: number }` → same shape

### B1. Register settings endpoint & query key
**Files:** `chalo-fe/src/constants/api-endpoints.ts`, `chalo-fe/src/constants/query-keys.ts`
- Add to `API`:
```ts
SETTINGS: {
  GET: "/settings",
  UPDATE: "/settings",
} as const,
```
- Add to `QUERY_KEYS`:
```ts
SETTINGS: {
  ALL: ["settings"] as const,
} as const,
```

### B2. Settings service (types + api + queries + barrel)
**Files:** `chalo-fe/src/services/settings/settings.types.ts`, `settings.api.ts`, `settings.queries.ts`, `index.ts`
```ts
// settings.types.ts
export interface SettingsDto {
  waitTimeEnabled: boolean;
  baristaCount: number;
}
export interface UpdateSettingsPayload {
  waitTimeEnabled: boolean;
  baristaCount: number;
}
```
```ts
// settings.api.ts
import { API } from "@/constants";
import { request } from "@/lib/api-client";
import { SettingsDto, UpdateSettingsPayload } from "./settings.types";

export const getSettings = (): Promise<SettingsDto> => request.get(API.SETTINGS.GET);
export const updateSettings = (data: UpdateSettingsPayload): Promise<SettingsDto> =>
  request.put(API.SETTINGS.UPDATE, data);
```
```ts
"use client";
// settings.queries.ts
import { QUERY_KEYS } from "@/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSettings, updateSettings } from "./settings.api";
import { UpdateSettingsPayload } from "./settings.types";

export const useGetSettings = () =>
  useQuery({ queryKey: QUERY_KEYS.SETTINGS.ALL, queryFn: getSettings, staleTime: 60_000 });

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSettingsPayload) => updateSettings(data),
    onSuccess: (res) => {
      qc.setQueryData(QUERY_KEYS.SETTINGS.ALL, res);
      toast.success("Đã lưu cài đặt");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
```
```ts
// index.ts
export * from "./settings.api";
export * from "./settings.types";
export * from "./settings.queries";
```

### B3. Settings page
**Files:** `chalo-fe/src/app/(admin)/admin/settings/page.tsx`
Local form state seeded from the query, a `Toggle` for `waitTimeEnabled`, a numeric `Input` for `baristaCount` (disabled while wait-time off), and a Save button gated on `isDirty`.
```tsx
"use client";
// src/app/(admin)/admin/settings/page.tsx
import { FormField } from "@/components/shared/ui/FormField";
import { Input } from "@/components/shared/ui/Input";
import { Toggle } from "@/components/shared/ui/Toggle";
import { useGetSettings, useUpdateSettings } from "@/services/settings";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { data, isLoading } = useGetSettings();
  const updateM = useUpdateSettings();

  const [waitTimeEnabled, setWaitTimeEnabled] = useState(true);
  const [baristaCount, setBaristaCount] = useState(3);

  useEffect(() => {
    if (data) {
      setWaitTimeEnabled(data.waitTimeEnabled);
      setBaristaCount(data.baristaCount);
    }
  }, [data]);

  const dirty =
    !!data && (data.waitTimeEnabled !== waitTimeEnabled || data.baristaCount !== baristaCount);

  const save = () => updateM.mutate({ waitTimeEnabled, baristaCount });

  if (isLoading) return <div className="p-6 text-sm text-gray-400">Đang tải cài đặt...</div>;

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cài đặt</h1>
        <p className="mt-0.5 text-sm text-gray-500">Cấu hình ước lượng thời gian chờ</p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Hiển thị thời gian chờ ước tính</p>
            <p className="text-xs text-gray-400">Hiện thời gian chờ dự kiến cho khách khi đặt món</p>
          </div>
          <Toggle checked={waitTimeEnabled} onChange={setWaitTimeEnabled} />
        </div>

        <FormField label="Số barista phục vụ song song" hint="Dùng để ước lượng thời gian chờ">
          <Input type="number" min={1} value={baristaCount} disabled={!waitTimeEnabled}
            onChange={(e) => setBaristaCount(Number(e.target.value))} className="w-40" />
        </FormField>
      </div>

      <button onClick={save} disabled={!dirty || updateM.isPending}
        className="rounded-xl bg-brand-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors disabled:opacity-50">
        {updateM.isPending ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </div>
  );
}
```

### B4. Verify Settings
- Ensure plan `03-be-settings` is merged and `GET/PUT /settings` respond (curl or Swagger). If field names differ from `SettingsDto`, fix B2 first.
- Read the Next.js docs guide (Global Constraint), then run FE, log in as ADMIN, visit `http://localhost:3000/admin/settings`.
- Expect: toggle + barista count pre-filled from `GET /settings`; Save button disabled until a value changes.
- Flip toggle off → barista input disables; Save enables. Click Save → success toast; reload page → persisted values load back.
- Change barista count to a new number, Save, reload → new value shown.

### B5. Commit Settings
```bash
rtk git add chalo-fe/src/services/settings "chalo-fe/src/app/(admin)/admin/settings" chalo-fe/src/constants/api-endpoints.ts chalo-fe/src/constants/query-keys.ts && rtk git commit -m "feat(admin): settings page (wait-time toggle + barista count) wired to /settings"
```

---

# Section C — Admin orders

BE reference (`chalo-be/src/modules/order/order.controller.ts`):
- `GET /order/page` — query `pageNo, pageSize, status, tableId, date (YYYY-MM-DD)` → `{ list: OrderDto[], total }` (default `pageSize` 20).

The order service **already exists** — `getOrderPage`/`useGetOrderPage` in `src/services/order/`, `OrderPageParams` already has `status, tableId, date, paidStatus`, and `QUERY_KEYS.ORDERS.PAGE` exists. No service changes needed. Reuse `getOrderPage` directly with `useTablePagination`. Table filter options come from the existing `useGetTableList()` (`src/services/table`).

### C1. Orders page
**Files:** `chalo-fe/src/app/(admin)/admin/orders/page.tsx`
Filters: status `Select` (from `ORDER_STATUS`), table `Select` (from `useGetTableList`), date `Input type="date"`. Columns: order (short id + table name), items count, total (formatted đ), status `Badge`, paid `Badge`, createdAt. Optional read-only detail modal via `useGetOrderById` (nice-to-have; can be a follow-up).
```tsx
"use client";
// src/app/(admin)/admin/orders/page.tsx
import { Badge, BadgeVariant } from "@/components/shared/ui/Badge";
import { Column, DataTable } from "@/components/shared/ui/DataTable";
import { Input } from "@/components/shared/ui/Input";
import { Select } from "@/components/shared/ui/Select";
import { QUERY_KEYS } from "@/constants";
import { useTablePagination } from "@/hooks/useTablePagination";
import { getOrderPage } from "@/services/order/order.api";
import { OrderDto, OrderPageParams, OrderStatus, ORDER_STATUS } from "@/services/order/order.types";
import { useGetTableList } from "@/services/table";
import { useState } from "react";

const STATUS_BADGE: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Chờ xác nhận", variant: "yellow" },
  CONFIRMED: { label: "Đã xác nhận", variant: "blue" },
  PREPARING: { label: "Đang pha chế", variant: "blue" },
  READY: { label: "Sẵn sàng", variant: "green" },
  COMPLETED: { label: "Hoàn tất", variant: "gray" },
  CANCELLED: { label: "Đã huỷ", variant: "red" },
};

const INITIAL_FILTER: OrderPageParams = { pageNo: 1, pageSize: 20 };

export default function AdminOrdersPage() {
  const { data: tables } = useGetTableList();
  const table = useTablePagination<OrderDto, OrderPageParams>({
    initialFilter: INITIAL_FILTER,
    queryFn: getOrderPage,
    queryKey: QUERY_KEYS.ORDERS.PAGE({}),
  });
  const [date, setDate] = useState("");

  const columns: Array<Column<OrderDto>> = [
    {
      key: "order",
      header: "Đơn",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">#{r.id.slice(0, 8)}</p>
          <p className="text-xs text-gray-400">{r.tableName}</p>
        </div>
      ),
    },
    { key: "items", header: "Số món", render: (r) => <span>{r.items?.length ?? 0}</span> },
    { key: "total", header: "Tổng tiền", render: (r) => <span className="font-medium">{r.totalAmount.toLocaleString("vi-VN")}đ</span> },
    { key: "status", header: "Trạng thái", render: (r) => { const s = STATUS_BADGE[r.status]; return <Badge label={s.label} variant={s.variant} />; } },
    { key: "paid", header: "Thanh toán", render: (r) => <Badge label={r.paidStatus ? "Đã trả" : "Chưa trả"} variant={r.paidStatus ? "green" : "gray"} /> },
    { key: "createdAt", header: "Thời gian", render: (r) => <span className="text-gray-500">{new Date(r.createdAt).toLocaleString("vi-VN")}</span> },
  ];

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Đơn hàng</h1>
        <p className="mt-0.5 text-sm text-gray-500">Toàn bộ đơn hàng của quán</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select className="w-48" placeholder="Tất cả trạng thái"
          options={ORDER_STATUS.map((s) => ({ value: s, label: STATUS_BADGE[s].label }))}
          onChange={(e) => table.updateFilter({ status: (e.target.value as OrderStatus) || undefined })} />
        <Select className="w-48" placeholder="Tất cả bàn"
          options={(tables ?? []).map((t) => ({ value: t.id, label: t.name }))}
          onChange={(e) => table.updateFilter({ tableId: e.target.value || undefined })} />
        <Input type="date" className="w-44" value={date}
          onChange={(e) => { setDate(e.target.value); table.updateFilter({ date: e.target.value || undefined }); }} />
        {(table.filter.status || table.filter.tableId || table.filter.date) && (
          <button onClick={() => { table.resetFilter(); setDate(""); }}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Xoá bộ lọc</button>
        )}
      </div>

      <DataTable columns={columns} data={table.data} keyExtractor={(r) => r.id}
        isLoading={table.isLoading} pagination={table.pagination}
        onPageChange={table.changePage} onPageSizeChange={table.changePageSize}
        emptyText="Không có đơn hàng nào." />
    </div>
  );
}
```
> Note: `getOrderPage` return type is `PageResult<OrderDto>`, matching `useTablePagination`'s `queryFn` signature. `tableId` is the table UUID (`TableDto.id`), which is what BE `order/page` expects.

### C2. Verify Orders
- Read the Next.js docs guide (Global Constraint), run FE, log in as ADMIN, visit `http://localhost:3000/admin/orders`.
- Expect: paginated table of orders (20/page default) with status + paid badges and formatted totals; total record count in footer.
- Filter by status → list narrows to that status; by table → only that table's orders; pick a date → only that day's orders. Combined filters apply together.
- "Xoá bộ lọc" resets all filters and the date input; full list returns.
- Change page size (10/20/50) and page navigation work.

### C3. Commit Orders
```bash
rtk git add "chalo-fe/src/app/(admin)/admin/orders" && rtk git commit -m "feat(admin): orders page with status/table/date filters wired to /order/page"
```

---

## Final verification
- `rtk tsc` (or the project's typecheck script) passes with no errors in the new files.
- All three sidebar links (`Nhân viên`, `Cài đặt`, `Đơn hàng`) navigate to working pages (no 404).
- `rtk lint` clean on changed files.
