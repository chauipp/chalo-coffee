# Luồng đơn hàng mới + Khu pha chế lấy món làm trung tâm

**Ngày:** 2026-07-17
**Nhánh:** `worktree-barista-split-screen`

## Mục tiêu

Hai thay đổi gắn liền nhau:

1. **Khu pha chế đổi trục tổ chức từ BÀN sang MÓN.** Barista mở màn ra phải thấy ngay "pha 4 ly Cold Drip", chứ không phải 4 thẻ bàn riêng rồi tự cộng nhẩm.
2. **Luồng trạng thái đơn làm lại** theo đúng vòng đời thật của quán, trong đó việc tick từng ly không còn là ghi chú cá nhân mà **trực tiếp đẩy đơn sang trạng thái tiếp theo**.

## Bối cảnh: những gì code đã có sẵn

Khảo sát trước khi thiết kế cho thấy model hiện tại khớp gần như hoàn toàn với luồng mong muốn:

- `status` là **enum thật của Postgres** (`order.entity.ts`) — thêm giá trị mới là thao tác additive, an toàn với DB dùng chung giữa nhiều agent.
- `paidStatus` là **cột boolean độc lập**, không nằm trong chuỗi trạng thái. `requestPayment()` cho phép trả tiền ở bất kỳ trạng thái nào ⇒ **khách trả trước rồi mới được phục vụ là luồng hợp lệ đang chạy**.
- `syncTableOccupancyAfterOrderChange()` đã coi **`COMPLETED && paidStatus`** là điểm kết thúc: bàn chỉ được giải phóng khi mọi đơn của nó đã xong *và* đã trả tiền.

Nghĩa là "đã phục vụ" và "đã thanh toán" **vốn đã là hai chiều độc lập** trong code. Thiết kế này không phát minh lại chúng, chỉ đặt tên đúng và bổ sung phần còn thiếu.

## Global Constraints

- **Không sửa `.env` / `.env.local`** (được git track) — truyền env inline trên command line.
- **Postgres chạy port 5433**; compose nằm trong `chalo-be/`. Không đổi `DB_PORT`.
- **DB dùng chung với các agent khác** ⇒ migration phải additive (`ADD COLUMN IF NOT EXISTS` kèm default). Ngoại lệ duy nhất: xem "Xoá cột `smartBatchingEnabled`" bên dưới.
- Port dev: BE `8082`, FE `3020`.
- `synchronize: false` — mọi thay đổi schema phải có file migration.
- Múi giờ nghiệp vụ: **Asia/Ho_Chi_Minh (+07:00)**, thống nhất với `parseDateRange()` đang dùng.

---

## 1. Luồng trạng thái

```
PENDING ────→ PREPARING ────→ READY ────→ COMPLETED
Khách đặt     Đang pha chế    Sẵn sàng    Đã phục vụ
                    ↑         phục vụ
                    └──────────┘
                  "Quay lại pha"

    │             │              │            │
    └─────────────┴──────────────┴──→ CANCELLED

paidStatus ── cờ độc lập, bật được bất kỳ lúc nào

Rời bảng khi: COMPLETED && paidStatus   (hoặc CANCELLED)
```

### Ánh xạ sang enum hiện có — không thêm giá trị nào

| Nhãn hiển thị | Enum |
|---|---|
| Khách đặt | `PENDING` |
| Đang pha chế | `PREPARING` |
| Sẵn sàng phục vụ | `READY` |
| Đã phục vụ | `COMPLETED` (đổi nhãn từ "Hoàn thành") |
| Đã thanh toán | cờ `paidStatus` — đã tồn tại |

`CONFIRMED` **giữ nguyên trong enum** nhưng gỡ khỏi luồng đi tới. Lý do: DB dùng chung đang có đơn ở trạng thái này; xoá giá trị enum sẽ phá dữ liệu của agent khác. Xử lý:

- Đơn `CONFIRMED` cũ **hiển thị chung cột "Khách đặt"** với `PENDING`.
- Vẫn cho phép `CONFIRMED → PREPARING` để các đơn cũ đi tiếp được.
- **Không tạo mới** đơn `CONFIRMED`: `PENDING → CONFIRMED` bị gỡ khỏi bảng chuyển.

### Bảng chuyển trạng thái mới

`chalo-be/src/modules/order/order.service.ts` (`STATUS_TRANSITIONS`):

```ts
const STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  // Đơn CONFIRMED cũ trong DB vẫn phải đi tiếp được — không tạo mới trạng thái này
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  // READY → PREPARING: đường lùi khi tick nhầm ly cuối
  [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.PREPARING, OrderStatus.CANCELLED],
};
```

**`READY → PREPARING` ("Quay lại pha")** là bổ sung có chủ đích. Vì tick giờ tự đẩy đơn sang READY, một cú tick nhầm sẽ đẩy đơn đi mà không có đường về — đơn kẹt ở READY trong khi món chưa pha xong. Khi quay lại PREPARING, **giữ nguyên `preparedQuantity`** để staff untick đúng ly sai thay vì tick lại từ đầu.

### Bố cục màn staff

- **Vùng trái — 3 cột:** `Khách đặt` (PENDING + CONFIRMED) | `Sẵn sàng phục vụ` (READY) | `Đã phục vụ` (COMPLETED && !paidStatus).
- **Vùng phải — khu pha chế:** PREPARING, lấy món làm trung tâm (mục 2). Luôn hiển thị ở mọi màn staff, giữ nguyên như hiện tại.

Cột "Đã phục vụ" chỉ chứa đơn **chưa trả tiền**, nên nó kiêm luôn danh sách bàn còn nợ tiền — trả xong là đơn rời bảng.

### Màu viền card = trạng thái trả tiền

Quyết định của người dùng, đã cân nhắc đánh đổi:

- **Viền đỏ** = `!paidStatus` — ở **mọi cột**.
- **Viền xanh lá** = `paidStatus` — ở **mọi cột**.
- **Trạng thái đơn KHÔNG ảnh hưởng màu viền.** Gỡ viền trái vàng của `PENDING` hiện có ở `OrderCard.tsx:59-61`.

Đánh đổi đã nêu và người dùng chấp nhận: vì luồng là thu tiền sau cùng, phần lớn bảng sẽ đỏ, và xanh chỉ xuất hiện ngay trước khi card rời bảng.

**Bắt buộc kèm theo:** giữ **badge chữ** ("Đã thanh toán" / "Chưa thanh toán") cạnh màu viền. Đỏ/xanh lá là cặp màu tệ nhất với người mù màu (~8% nam giới), nên màu không được là tín hiệu duy nhất.

---

## 2. Khu pha chế lấy món làm trung tâm

### Cấu trúc

**Card = một món.** Trong card chia **mẻ theo ghi chú** — ghi chú là thứ duy nhất ngăn hai ly được pha chung một lượt.

```
┌─────────────────────────────┐   ┌─────────────────────────────┐
│ Cold Drip           1/4 ly  │   │ Croissant           0/1 ly  │
│ ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░  │   │ ░░░░░░░░░░░░░░░░░░░░░░░░░░  │
├─────────────────────────────┤   ├─────────────────────────────┤
│ Mẻ thường ×3                │   │ Mẻ thường ×1                │
│  ☑ Ban 02   ☐ Ban 07        │   │  ☐ Ban 06                   │
│  ☐ Ban 08                   │   └─────────────────────────────┘
│                             │
│ 📝 ít đá ×1                 │
│  ☐ Ban 06                   │
└─────────────────────────────┘
├───────────────────────────────────────────────────────────────┤
│  Ban 02 1/1 ✓   Ban 06 0/2   Ban 07 0/1   Ban 08 0/1          │
└───────────────────────────────────────────────────────────────┘
```

**Quy tắc gom:**

- Gom theo `productId` trên **toàn bộ** đơn đang PREPARING.
- Trong mỗi card, chia mẻ theo `note` đã chuẩn hoá (trim + lowercase). `note` rỗng/null → mẻ "Mẻ thường".
- Mỗi ly = một nút tick riêng, nhãn là **tên bàn**.
- Header card: tên món + `đã tick / tổng` + thanh tiến độ.
- **Sắp xếp card:** theo `createdAt` của đơn cũ nhất có chứa món đó (FIFO) — pha từ trái sang là đúng thứ tự khách chờ.
- **Sắp xếp mẻ trong card:** "Mẻ thường" trước, các mẻ có ghi chú sau, mỗi nhóm theo FIFO.

### Dải tiến độ theo bàn

Gom theo món **làm mất tầm nhìn theo bàn**: bàn gọi 2 món khác nhau sẽ nằm rải ở 2 card, không ai nhìn ra "bàn này còn thiếu đúng 1 món là xong". Mà tick đủ một bàn chính là thứ đẩy đơn sang READY, nên thông tin đó có giá trị vận hành thật.

Dải mỏng ghim đáy khu pha chế, mỗi bàn đang pha một chip:

- Nội dung chip: `{tên bàn} {đã tick}/{tổng ly}`; đủ thì thêm ✓ và sáng lên.
- Sắp xếp: FIFO theo `createdAt` của đơn.
- Chip biến mất khi đơn rời PREPARING (tự động sau khi tick đủ).

### Popup theo bàn

Bấm chip → popup bung ra **ngay tại vị trí chip đó**:

```
                  ┌────────────────────────┐
                  │ Ban 06          0/2 ly │
                  │ ────────────────────── │
                  │  ☐ Cold Drip  📝 ít đá │
                  │  ☐ Croissant           │
                  └────────────▼───────────┘
├──────────────────────────────────────────────────────┤
│  Ban 02 1/1 ✓   [Ban 06 0/2]   Ban 07 0/1   Ban 08   │
└──────────────────────────────────────────────────────┘
```

- Liệt kê **đủ món của bàn** kèm ghi chú và trạng thái tick.
- **Tick được luôn trong popup** — cùng một hành động, cùng dữ liệu với card món.
- Đóng: click ra ngoài hoặc `Esc`.

**Kỹ thuật:** dùng **Popover API native** (`popover="auto"`) — được light-dismiss, `Esc`, và top-layer miễn phí, không cần bắt sự kiện tay. **Định vị bằng JS** từ `getBoundingClientRect()` của chip, **không dùng CSS anchor positioning** (mới chỉ Chrome/Edge hỗ trợ, Safari/Firefox chưa).

---

## 3. Tick chuyển lên server

Tick giờ quyết định trạng thái đơn ⇒ không thể là dữ liệu cục bộ của một máy nữa.

### Schema

`order_items` thêm cột:

```sql
ALTER TABLE "order_items"
ADD COLUMN IF NOT EXISTS "preparedQuantity" integer NOT NULL DEFAULT 0;
```

### API

`PATCH /api/order/item/:itemId/prepared`, guard `@Roles(UserRole.ADMIN, UserRole.MODERATOR)` — cùng chuẩn với các endpoint staff khác.

Body: `{ preparedQuantity: number }` — **giá trị tuyệt đối, không phải lệnh tăng**. Đây là điểm thiết kế có chủ đích: hai máy cùng tick một ly sẽ không bị đếm thành hai, và gọi lại cùng một request không đổi kết quả.

Xử lý trong **một transaction có khoá** (`pessimistic_write` trên order):

1. Khoá order theo `item.orderId`.
2. `order.status !== PREPARING` → `BadRequestException('Chỉ tick được đơn đang pha chế')`.
3. `preparedQuantity < 0 || > item.quantity` → `BadRequestException`.
4. Ghi `item.preparedQuantity`.
5. Nạp lại toàn bộ item của đơn; nếu **mọi item có `preparedQuantity >= quantity`** → `order.status = READY`, lưu, bắn SSE `order_status_changed`.
6. Nếu không đổi trạng thái → bắn SSE `order_prep_progress` (mới) để máy khác thấy tiến độ ngay.
7. Trả về `OrderDto` đầy đủ.

### SSE

Thêm loại sự kiện `order_prep_progress` với payload `{ orderId, tableId, tableName }`. FE nhận thì `invalidateQueries(ORDERS.ACTIVE)`.

Không tái dùng `order_status_changed` cho việc này vì trạng thái không đổi — đặt tên sai sẽ khiến handler tương lai xử lý nhầm.

### DTO

`OrderItemDto` thêm `preparedQuantity: number` (cả BE `buildDto()` và FE `order.types.ts`).

### FE

- **Xoá hoàn toàn `src/stores/prep.store.ts`** — ticks giờ ở server, batches/dismissed bị gỡ theo mục 5.
- Tick đọc từ `item.preparedQuantity` trong `OrderDto`.
- Cập nhật optimistic qua TanStack Query để tick phản hồi tức thì, rollback nếu API lỗi.

---

## 4. Reset 0h00

`getActiveQueue()` đổi điều kiện lọc:

```ts
// Cũ: cửa sổ trượt 24h
.andWhere('o.createdAt > :cutoff', { cutoff: new Date(Date.now() - 24 * 60 * 60 * 1000) })

// Mới: từ 0h00 hôm nay, giờ VN
.andWhere('o.createdAt >= :cutoff', { cutoff: this.startOfTodayVN() })
```

```ts
/** 0h00 hôm nay theo giờ VN (+07:00) */
private startOfTodayVN(): Date {
  const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const y = nowVN.getUTCFullYear();
  const m = String(nowVN.getUTCMonth() + 1).padStart(2, '0');
  const d = String(nowVN.getUTCDate()).padStart(2, '0');
  return new Date(`${y}-${m}-${d}T00:00:00.000+07:00`);
}
```

**Không cần cron.** Đây chỉ là điều kiện truy vấn, tự đúng khi đồng hồ qua nửa đêm. Đơn cũ vẫn nằm trong DB, admin xem được ở màn Đơn hàng.

**Hệ quả đã nêu và người dùng chấp nhận:** đơn hôm qua chưa thanh toán sẽ biến khỏi bảng staff nhưng **bàn vẫn bị đánh dấu có khách**, vì giải phóng bàn cần `COMPLETED && paidStatus`. Quán đóng cửa ban đêm nên gần như không xảy ra; admin xử lý được ở màn Đơn hàng. Người dùng đã chọn **không** tự đóng đơn lúc 0h00.

---

## 5. Gỡ bỏ gộp đơn

Gom theo món **thay thế hoàn toàn** gộp đơn, và làm tốt hơn ở ba điểm:

| | Gộp đơn cũ | Mẻ theo món (mới) |
|---|---|---|
| Phạm vi | chỉ quét **3 đơn** đầu hàng chờ | **toàn bộ** đơn đang pha |
| Ghi chú | bỏ qua ⇒ có thể xui gộp 1 ly "ít đá" vào 3 ly thường | tách mẻ theo ghi chú ⇒ luôn đúng |
| Thao tác | **tay**, phải nhớ làm | **tự động**, không sai được |

Giữ lại chỉ tạo hai cơ chế gộp chồng nhau cùng mục đích, cái nào cũng nửa vời.

### Xoá

**FE:**
- `src/utils/batching.ts`
- `e2e/batching.unit.spec.ts`
- `src/app/(staff)/staff/orders/_components/BatchSuggestion.tsx`
- Trong `OrderCard.tsx`: props `selectable` / `selected` / `onToggleSelect`, checkbox, ring khi chọn.
- Trong `KanbanColumn.tsx`: props `selectable` / `selectedIds` / `onToggleSelect` / `banner`.
- Trong `orders/page.tsx`: state `selectedIds` / `isBatching`, `startBatch()`, action bar "Pha chung", suggestion.
- Trong `PrepTicket.tsx` (sẽ bị thay thế): badge "Gộp N đơn", nút "Tách".
- Trong Admin Settings: toggle "Gợi ý gộp đơn thông minh".
- `settings.types.ts`: `smartBatchingEnabled` khỏi `SettingsDto` và `UpdateSettingsPayload`.

**BE:**
- `app-settings.entity.ts`: cột `smartBatchingEnabled`.
- `update-settings.dto.ts` + `settings.service.ts`: nhánh xử lý `smartBatchingEnabled`.
- `settings.service.spec.ts`: test `update() can flip smartBatchingEnabled alone`.

### Xoá cột `smartBatchingEnabled` — ngoại lệ của quy tắc additive

Migration mới `DROP COLUMN IF EXISTS "smartBatchingEnabled"` trên `app_settings`.

Quy tắc "chỉ thêm không xoá" tồn tại để **không phá agent khác**. Cột này do chính nhánh này thêm vào (migration `1752900000000-AddSmartBatchingSetting.ts`), **không code nào ngoài nhánh này biết nó tồn tại**, nên xoá không ảnh hưởng ai. Để lại sẽ thành cột mồ côi vĩnh viễn.

---

## 6. File structure

### BE — tạo mới

| File | Trách nhiệm |
|---|---|
| `src/migrations/<ts>-AddOrderItemPreparedQuantity.ts` | thêm cột `preparedQuantity` |
| `src/migrations/<ts>-DropSmartBatchingSetting.ts` | xoá cột `smartBatchingEnabled` |
| `src/modules/order/dto/update-item-prepared.dto.ts` | body của endpoint tick |
| `src/modules/order/order.service.prep-tick.spec.ts` | test tick → auto READY (theo mẫu `order.service.estimated-wait.spec.ts`) |

### BE — sửa

| File | Sửa gì |
|---|---|
| `src/modules/order/entities/order-item.entity.ts` | `+ preparedQuantity` |
| `src/modules/order/order.service.ts` | `STATUS_TRANSITIONS`, `setItemPrepared()`, `startOfTodayVN()`, `getActiveQueue()`, `buildDto()` |
| `src/modules/order/order.controller.ts` | `PATCH item/:itemId/prepared` |
| `src/modules/sse/sse.service.ts:5-12` | `+ 'order_prep_progress'` vào union `SseEventType`. **Không** thêm vào `customerTypes` trong `streamForTable()` — tiến độ pha là việc nội bộ của barista, khách không cần. |
| `src/modules/sse/sse.controller.ts:20` | cập nhật mô tả Swagger liệt kê sự kiện |
| `src/modules/settings/*` | gỡ `smartBatchingEnabled` |

### FE — tạo mới

| File | Trách nhiệm |
|---|---|
| `src/utils/prep-grouping.ts` | **hàm thuần**: `OrderDto[] → ProductGroup[]` (gom món + tách mẻ) và `→ TableProgress[]`. Không JSX, test được ở node. |
| `src/app/(staff)/_components/PrepProductCard.tsx` | card một món + các mẻ |
| `src/app/(staff)/_components/TableProgressBar.tsx` | dải chip tiến độ theo bàn |
| `src/app/(staff)/_components/TablePopover.tsx` | popup món của một bàn |
| `e2e/prep-grouping.unit.spec.ts` | test hàm thuần |

### FE — sửa / xoá

| File | Sửa gì |
|---|---|
| `src/app/(staff)/_components/PrepStation.tsx` | render theo món + dải bàn thay vì ticket theo bàn |
| `src/app/(staff)/_components/PrepTicket.tsx` | **xoá** — `PrepProductCard` thay thế |
| `src/app/(staff)/_components/PrepDock.tsx` | bỏ `prune`, thêm hook tick |
| `src/app/(staff)/staff/orders/orders.config.ts` | cột + nhãn + `NEXT_STATUS` mới |
| `src/app/(staff)/staff/orders/_components/OrderCard.tsx` | viền theo `paidStatus`, gỡ props chọn đơn |
| `src/app/(staff)/staff/orders/_components/KanbanColumn.tsx` | gỡ props chọn đơn / banner |
| `src/app/(staff)/staff/orders/page.tsx` | gỡ state gộp đơn |
| `src/services/order/order.types.ts` | `+ preparedQuantity` vào `OrderItemDto` |
| `src/services/order/order.api.ts` + `order.queries.ts` | `+ useSetItemPrepared()` optimistic |
| `src/hooks/useSSE.ts:8,17` | `+ "order_prep_progress"` vào `SSE_EVENT_TYPES` và `SSEPayload` |
| `src/stores/prep.store.ts` | **xoá** |
| `src/utils/batching.ts` | **xoá** |

### `orders.config.ts` mới

```ts
export const KANBAN_COLUMNS = [
  { status: "PENDING",   label: "Khách đặt",        emoji: "📋", ... },
  { status: "READY",     label: "Sẵn sàng phục vụ", emoji: "🔔", ... },
  { status: "COMPLETED", label: "Đã phục vụ",       emoji: "🍽️", ... },
];

export const LEFT_STATUSES: OrderStatus[] = ["PENDING", "READY", "COMPLETED"];

/** Đơn CONFIRMED cũ trong DB gom chung cột "Khách đặt" */
export const KHACH_DAT_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED"];

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PREPARING",
  CONFIRMED: "PREPARING",
  READY: "COMPLETED",
  // PREPARING → READY: KHÔNG có nút, tick đủ thì tự đẩy
};

export const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: "Bắt đầu pha",
  CONFIRMED: "Bắt đầu pha",
  READY: "Đã bê ra",
};
```

Cột "Đã phục vụ" lọc thêm `!paidStatus` — trả tiền xong là rời bảng.

---

## 7. Kiểm thử

### BE — `order.service.prep-tick.spec.ts`

- Tick đủ mọi item → đơn tự chuyển `READY`, bắn `order_status_changed`.
- Tick thiếu một ly → đơn vẫn `PREPARING`, bắn `order_prep_progress`.
- Gọi hai lần cùng `preparedQuantity` → không đếm đôi, kết quả không đổi (idempotent).
- `preparedQuantity > quantity` → `BadRequestException`.
- Tick đơn không ở `PREPARING` → `BadRequestException`.
- `READY → PREPARING` giữ nguyên `preparedQuantity`.

### BE — `getActiveQueue`

- Đơn tạo 23:59 hôm qua **không** lọt vào bảng; đơn tạo 00:01 hôm nay thì có (mốc theo +07:00).

### FE — `e2e/prep-grouping.unit.spec.ts` (hàm thuần, chạy node, không cần BE)

- 4 đơn cùng Cold Drip → 1 card, 4 ly.
- Một ly có ghi chú "ít đá" → tách thành 2 mẻ, số lượng đúng.
- Ghi chú khác hoa/thường/thừa khoảng trắng → cùng một mẻ.
- Bàn gọi 2 món khác nhau → xuất hiện ở 2 card, dải bàn báo `0/2`.
- Card sắp theo đơn cũ nhất chứa món đó.

### FE — e2e

- Tick ly cuối của một bàn → đơn tự nhảy từ khu pha chế sang cột "Sẵn sàng phục vụ".
- Bấm chip bàn → popup hiện đúng món của bàn đó; `Esc` đóng.
- Card đơn chưa trả tiền viền đỏ, đã trả viền xanh, kèm badge chữ.

### Giữ nguyên

`e2e/staff-prep.spec.ts` (split screen, resizer, mở rộng, tự thu khi chuyển menu) phải tiếp tục pass — thiết kế này không đụng vào bố cục chia đôi.

---

## 8. Rủi ro

| Rủi ro | Xử lý |
|---|---|
| Bảng gần như toàn viền đỏ | Đã nêu, người dùng chấp nhận. Badge chữ bù lại tín hiệu. |
| Đơn qua đêm chưa trả → bàn kẹt occupied | Đã nêu, người dùng chấp nhận. Admin xử lý ở màn Đơn hàng. |
| Hai máy cùng tick một ly | Giá trị tuyệt đối + khoá pessimistic ⇒ idempotent. |
| Tick nhầm đẩy đơn sang READY | `READY → PREPARING` giữ nguyên tick. |
| Đơn `CONFIRMED` cũ trong DB dùng chung | Giữ enum, gom vào cột "Khách đặt", vẫn đi tiếp được. |
| Migration trên DB dùng chung | `preparedQuantity` additive + default. `smartBatchingEnabled` chỉ nhánh này biết ⇒ drop an toàn. |
