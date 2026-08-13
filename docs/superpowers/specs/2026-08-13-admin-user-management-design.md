# Màn admin quản lý người dùng (nhân viên + khách hàng)

## Bối cảnh

Vừa sửa xong bug tài khoản CUSTOMER (đăng nhập Google) bị hiển thị nhầm thành "Nhân viên" và
bị lọc khỏi `/user/page` mặc định (xem `docs/superpowers/summaries/` liên quan, thực hiện
2026-08-13). Kết quả phụ: admin hiện không có màn nào để xem danh sách khách hàng — trang
`/admin/staff` chỉ quản lý ADMIN/MODERATOR.

Yêu cầu: đổi trang này thành màn quản lý **người dùng** nói chung, chia tab hợp lý giữa nhân
viên và khách hàng, có responsive mobile chuẩn.

## Kiến trúc

Đổi route `/admin/staff` → `/admin/users` (đổi cả thư mục trang, route constant, sidebar,
2 e2e spec đang trỏ `/admin/staff`). Trang mới có 2 tab:

- **Tab "Nhân viên"** — giữ nguyên 100% hành vi hiện có (danh sách ADMIN/MODERATOR, tạo, sửa,
  đổi mật khẩu, khoá/mở khoá, xoá). Không đổi API, không đổi logic.
- **Tab "Khách hàng"** — mới. Chỉ xem + khoá/mở khoá, không tạo/sửa/xoá (khách tự quản lý qua
  đăng ký/Google).

Chuyển tab bằng state cục bộ trong component (không qua URL query), theo đúng pattern
`MobileFilterSheet` đang dùng state cục bộ trong trang.

## Backend

Không đổi API/logic đã có của tab Nhân viên.

Thêm cho tab Khách hàng, tất cả trong `UserController` (đã có sẵn guard `@Roles(ADMIN)`),
`UserModule` import thêm `CustomerModule` để lấy `CustomerService` (không có vòng phụ thuộc —
`CustomerModule` không import `UserModule`):

- **Danh sách khách hàng**: dùng lại `GET /user/page?role=CUSTOMER` — đã đúng từ bug fix trước,
  không cần đổi gì.
- **`GET /user/:id/orders?pageNo&pageSize`** (ADMIN) — gọi lại `CustomerService.getOrders(id, …)`
  đã có sẵn (dùng chung cho API tự-phục-vụ của khách ở `/customer/orders`). Map kết quả từ
  entity `Order` sang DTO gọn cho admin xem:
  ```ts
  { id, tableName: order.table.name, status, totalAmount, itemsCount: order.items.length, createdAt }
  ```
- **`GET /user/:id/loyalty`** (ADMIN) — gọi lại `CustomerService.getLoyalty(id)` đã có sẵn,
  trả `{ balance }`.
- **`PUT /user/:id/active`** (ADMIN), body `{ isActive: boolean }` — hàm mới
  `UserService.setActive(id, isActive, requesterId)`, **tách riêng khỏi `update()`** (vì
  `update()` hiện cố tình chặn mọi thay đổi lên tài khoản CUSTOMER để tránh lặp lại bug cũ).
  Quy tắc:
  - 404 nếu không tìm thấy user.
  - 403 nếu `id === requesterId && isActive === false` (không cho tự khoá chính mình).
  - Không đụng `role`/`fullName`/`avatar` — chỉ set `isActive`.
  - Dùng chung được cho cả CUSTOMER lẫn ADMIN/MODERATOR, nhưng UI tab Nhân viên vẫn dùng
    đường cũ qua `update()` để không đổi hành vi đang chạy ổn.

## Frontend

**Không đụng `UserDto`/`UserRole` hiện có** (`chalo-fe/src/services/user/user.types.ts`) —
lần trước mở rộng union role đã gây vỡ type ở `StaffForm.tsx`, phải revert. Lần này tách hẳn
module mới:

`chalo-fe/src/services/customer-admin/` (types, api, queries riêng):

```ts
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
  status: OrderStatus; // reuse từ services/order/order.types.ts
  totalAmount: number;
  itemsCount: number;
  createdAt: string;
}

export interface CustomerLoyaltyDto {
  balance: number;
}

export interface CustomerPageParams extends PageParam {
  keyword?: string;
  isActive?: boolean;
}
```

API layer gọi `GET /user/page` với `role: "CUSTOMER"` cố định (ép sẵn trong hàm
`getCustomerPage`, người gọi không cần biết chi tiết BE dùng chung endpoint với tab Nhân viên).

**Trang `/admin/users/page.tsx`** (đổi tên từ `staff/page.tsx`):
- Tab bar 2 nút full-width trên mobile (segment control), giữ ngang trên desktop.
- Tab Nhân viên: y nguyên code hiện có (đổi tên biến/route liên quan nếu cần).
- Tab Khách hàng:
  - `useTablePagination` với `queryFn: getCustomerPage`.
  - Cột: Tên + username + email, Trạng thái (Badge xanh "Hoạt động" / xám "Đã khoá"), Ngày tạo,
    Thao tác (nút "Xem" mở modal chi tiết, `Toggle` khoá/mở khoá).
  - `mobileCard` riêng cho khách hàng (tái dùng pattern card của tab Nhân viên).
- Modal chi tiết khách hàng: thông tin cơ bản + điểm tích luỹ (số) + danh sách đơn hàng gần đây
  (bảng rút gọn desktop / list card mobile), phân trang riêng bên trong modal.
- Khoá/mở khoá ở tab Khách hàng gọi hook mới `useSetCustomerActive` (PUT `/user/:id/active`),
  invalidate query key của danh sách khách hàng khi thành công.

**Đổi tên route**:
- `chalo-fe/src/constants/routes.ts`: `ADMIN.STAFF: "/admin/staff"` → `ADMIN.USERS: "/admin/users"`.
- `chalo-fe/src/app/(admin)/_components/sidebar.config.ts`: label "Nhân viên" → "Người dùng",
  href + `activePrefixes` cập nhật theo route mới.
- Di chuyển `chalo-fe/src/app/(admin)/admin/staff/` → `chalo-fe/src/app/(admin)/admin/users/`
  (cả `_components/`).
- `middleware.ts` không cần đổi (chỉ check prefix `ROUTES.ADMIN.ROOT`, không hardcode STAFF).

## Error handling

- 404/403 từ BE cho các case ở trên → toast lỗi FE (dùng pattern lỗi chung đã có ở
  `useUpdateUser`/`useDeleteUser`).
- Modal chi tiết: loading state khi đang fetch orders/loyalty, empty state nếu khách chưa có
  đơn hàng nào.

## Testing

**Backend (TDD, Jest)** — thêm vào `user.service.spec.ts`:
- `setActive`: khoá được customer, chặn tự khoá chính mình (403), 404 khi id không tồn tại,
  không đụng `role`/`fullName` sau khi gọi.

**Frontend**:
- Đổi tên/parts của `admin-staff.spec.ts` → nội dung path cập nhật `/admin/users` (giữ test
  hiện có cho tab Nhân viên hoạt động đúng sau khi đổi route).
- `admin-mobile.spec.ts`: cập nhật 2 chỗ path `/admin/staff` → `/admin/users`.
- Spec e2e mới `admin-users-customer-tab.spec.ts`: chạy trên cả project `chromium` (desktop) và
  `mobile` (đã có sẵn trong `playwright.config.ts`) — mở tab Khách hàng, thấy danh sách, xem
  chi tiết 1 khách (thấy điểm tích luỹ + lịch sử đơn), khoá rồi mở lại 1 tài khoản.

## Phạm vi KHÔNG làm (out of scope)

- Không cho admin tạo/sửa thông tin/đổi mật khẩu khách hàng.
- Không thêm chức năng xoá tài khoản khách hàng.
- Không đổi API/behavior của tab Nhân viên.

## Plan thực thi

Xem `../plans/2026-08-13-admin-user-management.md`.
