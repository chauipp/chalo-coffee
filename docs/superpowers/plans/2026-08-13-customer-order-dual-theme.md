# Nâng cấp thị giác màn đặt món khách hàng (2 giao diện A/B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Toàn bộ luồng đặt món khách hàng (menu → chi tiết món → giỏ hàng/thanh
toán → theo dõi đơn) có 2 giao diện chuyển đổi được — Điện ảnh (Cinematic) và
Rực rỡ (Playful, mặc định) — mỗi giao diện tự hỗ trợ sáng/tối, không đụng vào
logic nghiệp vụ hiện có.

**Architecture:** Một store zustand persist mới (`orderTheme.store.ts`) giữ
`"cinematic" | "playful"`. Mỗi màn trong phạm vi tách thành 2 component trình
bày (`*.Cinematic.tsx` / `*.Playful.tsx`) dùng chung logic/state qua hook hoặc
component cha hiện có; một wrapper mỏng chọn đúng biến thể theo store. Mỗi biến
thể tự lo sáng/tối bằng `dark:` class như quy ước Tailwind sẵn có trong repo —
không tạo hệ token hoàn toàn mới, chỉ bổ sung 5 token màu mới (`pop-400/500/600`,
`carnival`, `carnival-raised`) cho phần Rực rỡ; phần Điện ảnh tái dùng nguyên
`brand-*`/`stone-*` đã có.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4
(`@theme` token), zustand (+ `persist` middleware), Playwright (e2e).

## Global Constraints

- Ngôn ngữ hiển thị: tiếng Việt, giữ nguyên copy hiện có ở mọi nơi không đổi
  chủ đích trong spec.
- Không đổi API/backend, không đổi field dữ liệu, không đổi hành vi giỏ hàng
  (`cart.store.ts`), truy vấn đơn (`order.queries.ts`), hay luồng VietQR.
- Mọi hiệu ứng chuyển động (nảy, confetti, số nhảy) phải tắt hoàn toàn dưới
  `prefers-reduced-motion: reduce` — dùng Tailwind `motion-safe:`/`motion-reduce:`
  đúng như `ThemeSwitch.tsx` đã làm, không viết `@media` tay trừ khi cần định
  nghĩa keyframe mới trong `globals.css`.
- **Không có bộ test component/RTL trong repo này** (không tìm thấy test nào
  cho `ProductCard.tsx`, `cart.store.ts`...). Unit test (`node --test`, file
  `*.test.mts`, chạy bằng `pnpm test:unit`) chỉ tồn tại cho hàm thuần tuý
  (`cart-modifiers.test.mts` kiểu vậy). Vì các task dưới đây chủ yếu là trình
  bày (JSX/Tailwind), "chu kỳ test" của mỗi task là: `pnpm lint` sạch (một lần,
  không đụng watcher) + xác minh bằng mắt qua Playwright ở Task 8 — không viết
  test RTL giả cho có.
- Máy dev cạn `fs.inotify.max_user_instances` — **không chạy `next dev`** để
  xem trực tiếp. Dùng `pnpm build` (one-shot) rồi chạy qua
  `.next/standalone/server.js` nếu cần xem giao diện thật (xem mục cuối file
  spec `2026-08-13-customer-order-dual-theme-design.md`).
- Giữ nguyên mọi `data-testid`/`aria-label` mà e2e hiện có phụ thuộc (liệt kê
  đầy đủ trong Task 2/3/8) — biến thể Rực rỡ là mặc định nên phần lớn e2e hiện
  có chạy qua nó và không được đứt.
- Mỗi file component mới chỉ chứa JSX + style của **đúng 1 biến thể** — không
  viết `if (theme === ...)` lồng trong 1 file lớn.

---

## File Structure

```
chalo-fe/src/
  stores/
    orderTheme.store.ts                          [Task 1 — mới]
  components/shared/
    OrderThemeSwitch.tsx                          [Task 1 — mới]
    ConfettiBurst.tsx                              [Task 1 — mới]
    ui/Modal.tsx                                   [Task 2 — sửa: thêm hideHeader]
  app/globals.css                                  [Task 1 — sửa: thêm token]
  app/(customer)/menu/[tableToken]/_components/
    useProductCardState.ts                         [Task 2 — mới]
    ProductCard.Cinematic.tsx                       [Task 2 — mới]
    ProductCard.Playful.tsx                         [Task 2 — mới]
    ProductCard.tsx                                 [Task 2 — sửa thành wrapper]
    CustomerMenuView.Cinematic.tsx                  [Task 3 — mới]
    CustomerMenuView.Playful.tsx                    [Task 3 — mới]
    CustomerMenuClient.tsx                          [Task 3 — sửa: rút JSX ra view]
  app/(customer)/menu/[tableToken]/cart/_components/
    CartView.Cinematic.tsx                          [Task 4 — mới]
    CartView.Playful.tsx                            [Task 4 — mới]
  app/(customer)/menu/[tableToken]/cart/page.tsx      [Task 4 — sửa: rút JSX ra view]
  app/(customer)/menu/[tableToken]/checkout/_components/
    CheckoutView.Cinematic.tsx                      [Task 5 — mới, thay CheckoutSummary/CheckoutSessionPanel khi render]
    CheckoutView.Playful.tsx                        [Task 5 — mới]
  app/(customer)/menu/[tableToken]/checkout/page.tsx  [Task 5 — sửa: chọn CheckoutView theo theme]
  app/(customer)/menu/[tableToken]/orders/_components/
    OrderCard.Cinematic.tsx                         [Task 6 — mới]
    OrderCard.Playful.tsx                           [Task 6 — mới]
    OrderCard.tsx                                    [Task 6 — sửa thành wrapper]
  app/(customer)/menu/[tableToken]/orders/[orderId]/_components/
    ServiceStepper.Cinematic.tsx                     [Task 7 — mới]
    ServiceStepper.Playful.tsx                       [Task 7 — mới]
  app/(customer)/menu/[tableToken]/orders/[orderId]/page.tsx  [Task 7 — sửa: dùng ServiceStepper theo theme]
  e2e/
    customer-order-theme.spec.ts                     [Task 8 — mới]
```

`CheckoutSummary.tsx`/`CheckoutSessionPanel.tsx` hiện có giữ nguyên logic tính
QR/đếm giờ không đổi (`checkout/page.tsx` gọi chúng để lấy dữ liệu — nhưng phần
trình bày cuối cùng chuyển qua `CheckoutView.*`, xem Task 5 để biết chi tiết
cách 2 file cũ được gấp vào view mới mà không sao chép logic tính QR/đếm giờ).

---

### Task 1: Nền tảng — store, token màu, công tắc A/B, hiệu ứng confetti dùng chung

**Files:**
- Create: `chalo-fe/src/stores/orderTheme.store.ts`
- Create: `chalo-fe/src/components/shared/OrderThemeSwitch.tsx`
- Create: `chalo-fe/src/components/shared/ConfettiBurst.tsx`
- Modify: `chalo-fe/src/app/globals.css`

**Interfaces:**
- Produces: `useOrderThemeStore(): { theme: "cinematic" | "playful"; setTheme: (t) => void; toggle: () => void }` — dùng bởi mọi wrapper từ Task 2 trở đi.
- Produces: `<OrderThemeSwitch />` — không nhận prop, tự đọc/ghi store.
- Produces: `<ConfettiBurst triggerKey={number} />` — tăng `triggerKey` (vd. đếm số lần bấm) để bắn 1 đợt hiệu ứng; `triggerKey={0}` (giá trị khởi tạo) không bắn gì.
- Produces token CSS mới dùng được như class Tailwind: `bg-pop-400/500/600`, `text-pop-400/500/600`, `bg-carnival`, `bg-carnival-raised`.

- [ ] **Step 1: Thêm token màu và keyframe confetti vào `globals.css`**

Mở `chalo-fe/src/app/globals.css`, thêm vào cuối khối `@theme { ... }` hiện có
(ngay sau dòng `--breakpoint-desktop: 1280px;`):

```css
  /* Playful — cam bừng dùng chung 2 chế độ + nền "chợ đêm" cho bản tối */
  --color-pop-400: #FFB27A;
  --color-pop-500: #FF8A3D;
  --color-pop-600: #C4590C;
  --color-carnival: #1B1330;
  --color-carnival-raised: #251A42;
```

Thêm keyframe mới (đặt cạnh `@keyframes badge-pop` hiện có, trước dòng
`/* ── Receipt printing ─── */`):

```css
@keyframes confetti-burst {
  from {
    opacity: 1;
    transform: rotate(var(--confetti-angle)) translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: rotate(var(--confetti-angle)) translateY(-42px) scale(0.4);
  }
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
```

- [ ] **Step 2: Tạo store `orderTheme.store.ts`**

Tạo `chalo-fe/src/stores/orderTheme.store.ts`:

```ts
// src/stores/orderTheme.store.ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type OrderTheme = "cinematic" | "playful";

interface OrderThemeState {
  theme: OrderTheme;
  setTheme: (theme: OrderTheme) => void;
  toggle: () => void;
}

export const useOrderThemeStore = create<OrderThemeState>()(
  persist(
    (set, get) => ({
      theme: "playful",
      setTheme: (theme) => set({ theme }),
      toggle: () =>
        set({ theme: get().theme === "playful" ? "cinematic" : "playful" }),
    }),
    {
      name: "chalo-order-theme",
      version: 1,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
    },
  ),
);
```

- [ ] **Step 3: Tạo `OrderThemeSwitch.tsx`**

Tạo `chalo-fe/src/components/shared/OrderThemeSwitch.tsx`:

```tsx
"use client";
// src/components/shared/OrderThemeSwitch.tsx — chuyển đổi Điện ảnh/Rực rỡ, độc lập với nút Sáng/Tối
import { useOrderThemeStore } from "@/stores/orderTheme.store";

export const OrderThemeSwitch = () => {
  const theme = useOrderThemeStore((s) => s.theme);
  const setTheme = useOrderThemeStore((s) => s.setTheme);
  const isPlayful = theme === "playful";

  const pillClass = (active: boolean) =>
    `rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
      active
        ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
        : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
    }`;

  return (
    <div
      role="group"
      aria-label="Chọn giao diện đặt món"
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-stone-200 bg-stone-100/80 p-0.5 dark:border-stone-800 dark:bg-stone-900/80"
    >
      <button
        type="button"
        role="switch"
        aria-checked={isPlayful}
        aria-label="Giao diện Rực rỡ"
        data-testid="order-theme-playful"
        onClick={() => setTheme("playful")}
        className={pillClass(isPlayful)}
      >
        Rực rỡ
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={!isPlayful}
        aria-label="Giao diện Điện ảnh"
        data-testid="order-theme-cinematic"
        onClick={() => setTheme("cinematic")}
        className={pillClass(!isPlayful)}
      >
        Điện ảnh
      </button>
    </div>
  );
};
```

- [ ] **Step 4: Tạo `ConfettiBurst.tsx`**

Tạo `chalo-fe/src/components/shared/ConfettiBurst.tsx`:

```tsx
"use client";
// src/components/shared/ConfettiBurst.tsx — hiệu ứng ăn mừng nhỏ, tắt hẳn khi prefers-reduced-motion
import { useEffect, useState } from "react";

const PARTICLE_COUNT = 8;
const COLORS = [
  "var(--color-pop-500)",
  "var(--color-pop-400)",
  "var(--color-brand-300)",
  "var(--color-pop-600)",
];

interface Particle {
  id: number;
  angle: number;
  color: string;
}

export const ConfettiBurst = ({ triggerKey }: { triggerKey: number }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (triggerKey === 0) return;
    setParticles(
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: triggerKey * 100 + i,
        angle: (360 / PARTICLE_COUNT) * i,
        color: COLORS[i % COLORS.length],
      })),
    );
    const timer = setTimeout(() => setParticles([]), 600);
    return () => clearTimeout(timer);
  }, [triggerKey]);

  if (particles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 motion-reduce:hidden"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute left-1/2 top-1/2 size-1.5 rounded-full motion-safe:animate-[confetti-burst_0.55s_ease-out_forwards]"
          style={
            {
              backgroundColor: p.color,
              "--confetti-angle": `${p.angle}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};
```

- [ ] **Step 5: Kiểm tra & commit**

Run: `pnpm --dir chalo-fe lint`
Expected: không lỗi mới liên quan các file vừa tạo/sửa.

```bash
git add chalo-fe/src/stores/orderTheme.store.ts \
  chalo-fe/src/components/shared/OrderThemeSwitch.tsx \
  chalo-fe/src/components/shared/ConfettiBurst.tsx \
  chalo-fe/src/app/globals.css
git commit -m "feat: add order theme store, toggle switch, and confetti burst"
```

---

### Task 2: Thẻ món & modal chi tiết (`ProductCard`) — 2 biến thể

**Files:**
- Modify: `chalo-fe/src/components/shared/ui/Modal.tsx:6-31` (thêm prop `hideHeader`)
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/useProductCardState.ts`
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.Cinematic.tsx`
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.Playful.tsx`
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.tsx` (thay toàn bộ nội dung bằng wrapper)

**Interfaces:**
- Consumes: `useOrderThemeStore` (Task 1), `ConfettiBurst` (Task 1), `isModifierSelectionValid`/`modifierPrice` từ `@/components/menu/ProductModifierPicker`, `canonicalModifierKey` từ `@/utils/cart-modifiers`, `MAX_ITEM_QUANTITY` từ `@/stores/cart.store`.
- Produces: `ProductCard` giữ nguyên chữ ký hiện tại — `{ product: ProductDto; onAddToCart: (quantity, note?, modifierOptionIds?, price?, cartKey?) => void }` — để `CustomerMenuClient`/`CustomerMenuView.*` (Task 3) không phải đổi cách gọi.
- Produces: `useProductCardState(product, onAddToCart)` — hook dùng chung cho cả 2 biến thể, trả về toàn bộ state + handler (xem Step 1).
- **Ràng buộc e2e bắt buộc giữ nguyên ở cả 2 biến thể** (theo `e2e/customer-product-detail-modal.spec.ts`):
  - `data-testid={`product-card-${product.id}`}` trên container thẻ món.
  - Nút mở modal có `aria-label={`Xem chi tiết ${product.name}`}`.
  - `Modal` nhận `panelTestId={`product-detail-modal-${product.id}`}`.
  - Tên món trong modal phải là heading thật (`<h2>`) với text đúng `product.name`.
  - `data-testid="product-detail-media"` bọc quanh ảnh/ảnh nền.
  - `<img alt={product.name}>` khi có `imageUrl`.
  - Mô tả (`product.description`) hiển thị dạng text thường trong modal.
  - Nút tăng số lượng trong modal có `aria-label="Tăng số lượng"`.
  - Nút thêm vào giỏ trong modal có text đúng `` `Thêm ${detailQuantity} vào giỏ` `` (không đổi câu chữ giữa 2 biến thể, chỉ đổi màu/hình).
  - `e2e/customer-menu-shortcut.spec.ts` bấm `getByRole("button", { name: "Thêm", exact: true }).first()` trên thẻ món không có modifier — **chỉ áp dụng cho biến thể Rực rỡ** (mặc định); biến thể Điện ảnh được phép đổi nút này thành icon "+" vì test đó chạy với theme mặc định.

- [ ] **Step 1: Tạo hook dùng chung `useProductCardState.ts`**

Tạo `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/useProductCardState.ts`:

```ts
// src/app/(customer)/menu/[tableToken]/_components/useProductCardState.ts
import { useState } from "react";
import { ProductDto } from "@/services/menu";
import { MAX_ITEM_QUANTITY } from "@/stores/cart.store";
import {
  isModifierSelectionValid,
  modifierPrice,
} from "@/components/menu/ProductModifierPicker";
import { canonicalModifierKey } from "@/utils/cart-modifiers";

export type AddToCartHandler = (
  quantity: number,
  note?: string,
  modifierOptionIds?: string[],
  price?: number,
  cartKey?: string,
) => void;

export function useProductCardState(
  product: ProductDto,
  onAddToCart: AddToCartHandler,
) {
  const [quantity, setQuantity] = useState<number>(1);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [detailQuantity, setDetailQuantity] = useState<number>(1);
  const [detailNote, setDetailNote] = useState<string>("");
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [imgError, setImgError] = useState<boolean>(false);

  const isUnavailable = product.status !== "AVAILABLE" || !product.isActive;
  const showImage = !!product.imageUrl && !imgError;
  const hasModifiers = (product.modifierGroups?.length ?? 0) > 0;

  const openDetail = () => {
    setDetailQuantity(1);
    setDetailNote("");
    setSelectedOptionIds([]);
    setDetailOpen(true);
  };

  const quickAdd = () => {
    onAddToCart(quantity, undefined, [], product.price, `${product.id}::`);
    setQuantity(1);
  };

  const handleDetailAdd = () => {
    if (!isModifierSelectionValid(product.modifierGroups, selectedOptionIds))
      return;
    const adjustment = modifierPrice(product.modifierGroups, selectedOptionIds);
    onAddToCart(
      detailQuantity,
      detailNote.trim() || undefined,
      selectedOptionIds,
      product.price + adjustment,
      `${product.id}:${canonicalModifierKey(selectedOptionIds)}:${detailNote.trim()}`,
    );
    setDetailQuantity(1);
    setDetailNote("");
    setDetailOpen(false);
  };

  const canAddDetail = isModifierSelectionValid(
    product.modifierGroups,
    selectedOptionIds,
  );
  const detailTotal =
    product.price + modifierPrice(product.modifierGroups, selectedOptionIds);

  return {
    quantity,
    setQuantity,
    detailOpen,
    setDetailOpen,
    detailQuantity,
    setDetailQuantity,
    detailNote,
    setDetailNote,
    selectedOptionIds,
    setSelectedOptionIds,
    imgError,
    setImgError,
    isUnavailable,
    showImage,
    hasModifiers,
    openDetail,
    quickAdd,
    handleDetailAdd,
    canAddDetail,
    detailTotal,
    MAX_ITEM_QUANTITY,
  };
}
```

- [ ] **Step 2: Thêm `hideHeader` vào `Modal.tsx`**

Trong `chalo-fe/src/components/shared/ui/Modal.tsx`, sửa interface (dòng 6-14)
thành:

```tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  panelTestId?: string;
  presentation?: "dialog" | "bottom-sheet";
  /** Ẩn thanh tiêu đề mặc định — dùng khi nội dung tự vẽ ảnh full-bleed đè lên tiêu đề (biến thể Điện ảnh) */
  hideHeader?: boolean;
}
```

Sửa chữ ký component (dòng 23-31) thêm `hideHeader = false`, rồi sửa phần
render header + content (dòng 84-112) thành:

```tsx
        {/* header */}
        {!hideHeader && (
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-6 sm:py-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            <button
              aria-label="Đóng"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 transition-colors"
              onClick={onClose}
            >
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        {/* content */}
        <div
          className={
            hideHeader
              ? "max-h-[calc(100dvh-8rem)] overflow-y-auto"
              : "max-h-[calc(100dvh-8rem)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5"
          }
        >
          {children}
        </div>
```

Mặc định `hideHeader=false` giữ nguyên hành vi mọi nơi khác đang dùng `Modal`
(admin, staff...) — không phá gì.

- [ ] **Step 3: Tạo `ProductCard.Playful.tsx`**

Tạo `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.Playful.tsx`:

```tsx
"use client";
// src/app/(customer)/menu/[tableToken]/_components/ProductCard.Playful.tsx
import { Modal } from "@/components/shared/ui/Modal";
import { ConfettiBurst } from "@/components/shared/ConfettiBurst";
import { ProductDto } from "@/services/menu";
import { ProductModifierPicker } from "@/components/menu/ProductModifierPicker";
import { useState } from "react";
import {
  AddToCartHandler,
  useProductCardState,
} from "./useProductCardState";

const stepperButtonClass =
  "flex size-8 items-center justify-center rounded-full border-2 border-stone-900 bg-white text-base text-stone-900 transition-colors hover:bg-pop-400/20 disabled:opacity-30 dark:border-brand-50 dark:bg-carnival-raised dark:text-brand-50";

export const ProductCardPlayful = ({
  product,
  onAddToCart,
}: {
  product: ProductDto;
  onAddToCart: AddToCartHandler;
}) => {
  const s = useProductCardState(product, onAddToCart);
  const [burstKey, setBurstKey] = useState<number>(0);

  return (
    <>
      <div
        data-testid={`product-card-${product.id}`}
        className={`flex min-h-32 gap-3 rounded-2xl border-2 border-stone-900 bg-white p-3 shadow-[4px_4px_0_var(--color-stone-900)] transition-opacity motion-safe:animate-[card-in_0.35s_cubic-bezier(0.34,1.56,0.64,1)_backwards] dark:border-brand-50 dark:bg-carnival-raised dark:shadow-[4px_4px_0_var(--color-pop-600)] sm:gap-4 sm:p-4 ${
          s.isUnavailable ? "opacity-50" : ""
        }`}
      >
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={s.openDetail}
            aria-label={`Xem chi tiết ${product.name}`}
            className="block rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-pop-500 focus:ring-offset-2"
          >
            {s.showImage ? (
              <img
                src={product.imageUrl!}
                alt={product.name}
                loading="lazy"
                onError={() => s.setImgError(true)}
                className="size-24 rounded-xl border-2 border-stone-900 object-cover dark:border-brand-50 sm:size-28"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-xl border-2 border-stone-900 bg-gradient-to-br from-pop-400 to-pop-500 text-sm font-black text-white dark:border-brand-50 sm:size-28">
                CH
              </div>
            )}
          </button>
          {s.isUnavailable && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-white/70 dark:bg-carnival/70">
              <span className="rounded-full border-2 border-stone-900 bg-white px-2 py-0.5 text-xs font-bold text-stone-900 dark:border-brand-50 dark:bg-carnival-raised dark:text-brand-50">
                {product.status === "OUT_OF_STOCK" ? "Hết hàng" : "Tạm ngưng"}
              </span>
            </div>
          )}
        </div>

        <div className="flex h-24 min-w-0 flex-1 items-stretch justify-between gap-3 sm:h-28">
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <p className="line-clamp-2 text-sm font-extrabold leading-snug text-stone-900 dark:text-brand-50 sm:text-base">
              {product.name}
            </p>
            <span className="text-sm font-bold text-pop-600 dark:text-pop-400 sm:text-base">
              {product.price.toLocaleString("vi-VN")}đ
            </span>
          </div>

          {!s.isUnavailable && (
            <div className="flex shrink-0 flex-col items-end justify-between gap-2">
              <div className="grid grid-cols-[2rem_1.75rem_2rem] items-center">
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  onClick={() => s.setQuantity((q) => q - 1)}
                  disabled={s.quantity <= 1}
                  className={stepperButtonClass}
                >
                  -
                </button>
                <span className="text-center text-sm font-bold text-stone-900 dark:text-brand-50">
                  {s.quantity}
                </span>
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  onClick={() => s.setQuantity((q) => q + 1)}
                  disabled={s.quantity >= s.MAX_ITEM_QUANTITY}
                  className={stepperButtonClass}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={
                  s.hasModifiers
                    ? s.openDetail
                    : () => {
                        s.quickAdd();
                        setBurstKey((k) => k + 1);
                      }
                }
                className="rounded-full border-2 border-stone-900 bg-pop-500 px-4 py-2 text-xs font-bold text-white shadow-[2px_2px_0_var(--color-stone-900)] transition-transform hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-brand-50 dark:shadow-[2px_2px_0_var(--color-pop-600)]"
              >
                Thêm
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={s.detailOpen}
        onClose={() => s.setDetailOpen(false)}
        title={product.name}
        size="md"
        panelTestId={`product-detail-modal-${product.id}`}
      >
        <div className="relative flex max-h-[78vh] flex-col">
          <div
            data-testid="product-detail-media"
            className="relative overflow-hidden rounded-2xl border-2 border-stone-900 bg-gradient-to-br from-pop-400 to-pop-500 dark:border-brand-50"
          >
            {s.showImage ? (
              <img
                src={product.imageUrl!}
                alt={product.name}
                loading="lazy"
                onError={() => s.setImgError(true)}
                className="h-64 w-full object-cover"
              />
            ) : (
              <div className="flex h-64 w-full items-center justify-center text-3xl font-black text-white">
                CH
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto py-4">
            <h2 className="text-lg font-extrabold text-stone-900 dark:text-brand-50">
              {product.name}
            </h2>
            <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-stone-300">
              {product.description || "Món này chưa có mô tả."}
            </p>

            <ProductModifierPicker
              groups={product.modifierGroups}
              selectedIds={s.selectedOptionIds}
              onChange={s.setSelectedOptionIds}
            />

            {!s.isUnavailable && (
              <div className="mt-4">
                <label
                  htmlFor={`note-${product.id}`}
                  className="mb-1.5 block text-xs font-bold text-stone-700 dark:text-stone-300"
                >
                  Ghi chú cho món này
                </label>
                <textarea
                  id={`note-${product.id}`}
                  value={s.detailNote}
                  onChange={(e) => s.setDetailNote(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="VD: Ít đường, không đá..."
                  className="w-full resize-none rounded-xl border-2 border-stone-200 bg-transparent px-3 py-2 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-pop-500 dark:border-stone-700 dark:text-stone-100 dark:placeholder:text-stone-600"
                />
              </div>
            )}
          </div>

          <div className="border-t-2 border-stone-900 pt-4 dark:border-brand-50">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-base font-extrabold text-pop-600 dark:text-pop-400">
                {s.detailTotal.toLocaleString("vi-VN")}đ
              </span>
              <div className="grid grid-cols-[2rem_1.75rem_2rem] items-center">
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  onClick={() => s.setDetailQuantity((q) => q - 1)}
                  disabled={s.detailQuantity <= 1}
                  className={stepperButtonClass}
                >
                  -
                </button>
                <span className="text-center text-sm font-bold text-stone-900 dark:text-brand-50">
                  {s.detailQuantity}
                </span>
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  onClick={() => s.setDetailQuantity((q) => q + 1)}
                  disabled={s.detailQuantity >= s.MAX_ITEM_QUANTITY}
                  className={stepperButtonClass}
                >
                  +
                </button>
              </div>
            </div>

            {s.isUnavailable ? (
              <button
                type="button"
                disabled
                className="w-full rounded-full border-2 border-stone-300 bg-stone-100 px-4 py-3 text-sm font-bold text-stone-400 dark:border-stone-700 dark:bg-carnival-raised dark:text-stone-500"
              >
                {product.status === "OUT_OF_STOCK" ? "Hết hàng" : "Tạm ngưng"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  s.handleDetailAdd();
                  setBurstKey((k) => k + 1);
                }}
                disabled={!s.canAddDetail}
                className="w-full rounded-full border-2 border-stone-900 bg-pop-500 px-4 py-3 text-sm font-bold text-white shadow-[3px_3px_0_var(--color-stone-900)] transition-transform hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-50 dark:shadow-[3px_3px_0_var(--color-pop-600)]"
              >
                Thêm {s.detailQuantity} vào giỏ
              </button>
            )}
          </div>
          <ConfettiBurst triggerKey={burstKey} />
        </div>
      </Modal>
    </>
  );
};
```

- [ ] **Step 4: Tạo `ProductCard.Cinematic.tsx`**

Tạo `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.Cinematic.tsx`:

```tsx
"use client";
// src/app/(customer)/menu/[tableToken]/_components/ProductCard.Cinematic.tsx
import { Modal } from "@/components/shared/ui/Modal";
import { ProductDto } from "@/services/menu";
import { ProductModifierPicker } from "@/components/menu/ProductModifierPicker";
import { AddToCartHandler, useProductCardState } from "./useProductCardState";

export const ProductCardCinematic = ({
  product,
  onAddToCart,
}: {
  product: ProductDto;
  onAddToCart: AddToCartHandler;
}) => {
  const s = useProductCardState(product, onAddToCart);

  return (
    <>
      <div
        data-testid={`product-card-${product.id}`}
        className={`relative flex h-40 items-end overflow-hidden rounded-2xl bg-[radial-gradient(120%_140%_at_20%_10%,var(--color-brand-300)_0%,var(--color-brand-500)_55%,var(--color-brand-800)_100%)] transition-opacity dark:bg-[radial-gradient(120%_140%_at_20%_10%,var(--color-brand-700)_0%,var(--color-brand-900)_55%,var(--color-stone-950)_100%)] ${
          s.isUnavailable ? "opacity-50" : ""
        }`}
      >
        {s.showImage && (
          <img
            src={product.imageUrl!}
            alt={product.name}
            loading="lazy"
            onError={() => s.setImgError(true)}
            className="absolute inset-0 size-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        <button
          type="button"
          onClick={s.openDetail}
          aria-label={`Xem chi tiết ${product.name}`}
          className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-inset"
        />

        <div className="relative flex w-full items-end justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate font-serif text-lg text-white">
              {product.name}
            </p>
            <p className="text-xs text-brand-200">
              {product.price.toLocaleString("vi-VN")}đ
            </p>
          </div>
          {!s.isUnavailable && (
            <button
              type="button"
              aria-label={`Thêm nhanh ${product.name}`}
              onClick={
                s.hasModifiers
                  ? (e) => {
                      e.stopPropagation();
                      s.openDetail();
                    }
                  : (e) => {
                      e.stopPropagation();
                      s.quickAdd();
                    }
              }
              className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-300 text-lg font-bold text-brand-950 shadow-[0_8px_18px_-6px_rgba(224,179,121,0.55)] transition-transform active:scale-90"
            >
              +
            </button>
          )}
        </div>

        {s.isUnavailable && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-stone-700">
              {product.status === "OUT_OF_STOCK" ? "Hết hàng" : "Tạm ngưng"}
            </span>
          </div>
        )}
      </div>

      <Modal
        open={s.detailOpen}
        onClose={() => s.setDetailOpen(false)}
        title={product.name}
        size="md"
        panelTestId={`product-detail-modal-${product.id}`}
        hideHeader
      >
        <div className="relative flex max-h-[78vh] flex-col">
          <div
            data-testid="product-detail-media"
            className="relative h-64 shrink-0 overflow-hidden bg-[radial-gradient(120%_140%_at_20%_10%,var(--color-brand-300)_0%,var(--color-brand-700)_100%)]"
          >
            {s.showImage && (
              <img
                src={product.imageUrl!}
                alt={product.name}
                loading="lazy"
                onError={() => s.setImgError(true)}
                className="absolute inset-0 size-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            <button
              type="button"
              aria-label="Đóng"
              onClick={() => s.setDetailOpen(false)}
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
            >
              ✕
            </button>
            <h2 className="absolute bottom-4 left-4 right-4 font-serif text-2xl text-white">
              {product.name}
            </h2>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">
              {product.description || "Món này chưa có mô tả."}
            </p>

            <ProductModifierPicker
              groups={product.modifierGroups}
              selectedIds={s.selectedOptionIds}
              onChange={s.setSelectedOptionIds}
            />

            {!s.isUnavailable && (
              <div className="mt-4">
                <label
                  htmlFor={`note-${product.id}`}
                  className="mb-1.5 block text-xs font-semibold text-stone-700 dark:text-stone-300"
                >
                  Ghi chú cho món này
                </label>
                <textarea
                  id={`note-${product.id}`}
                  value={s.detailNote}
                  onChange={(e) => s.setDetailNote(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="VD: Ít đường, không đá..."
                  className="w-full resize-none rounded-xl border border-stone-200 bg-transparent px-3 py-2 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-brand-400 dark:border-stone-700 dark:text-stone-100 dark:placeholder:text-stone-600"
                />
              </div>
            )}
          </div>

          <div className="border-t border-stone-100 px-5 pb-5 pt-4 dark:border-stone-800">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="font-serif text-lg text-brand-700 dark:text-brand-300">
                {s.detailTotal.toLocaleString("vi-VN")}đ
              </span>
              <div className="grid grid-cols-[2rem_1.75rem_2rem] items-center">
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  onClick={() => s.setDetailQuantity((q) => q - 1)}
                  disabled={s.detailQuantity <= 1}
                  className="flex size-8 items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  -
                </button>
                <span className="text-center text-sm font-semibold text-stone-900 dark:text-stone-50">
                  {s.detailQuantity}
                </span>
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  onClick={() => s.setDetailQuantity((q) => q + 1)}
                  disabled={s.detailQuantity >= s.MAX_ITEM_QUANTITY}
                  className="flex size-8 items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  +
                </button>
              </div>
            </div>

            {s.isUnavailable ? (
              <button
                type="button"
                disabled
                className="w-full rounded-full bg-stone-200 px-4 py-3 text-sm font-semibold text-stone-500 dark:bg-stone-800 dark:text-stone-400"
              >
                {product.status === "OUT_OF_STOCK" ? "Hết hàng" : "Tạm ngưng"}
              </button>
            ) : (
              <button
                type="button"
                onClick={s.handleDetailAdd}
                disabled={!s.canAddDetail}
                className="w-full rounded-full bg-brand-700 px-4 py-3 text-sm font-semibold text-brand-50 transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-300 dark:text-brand-950 dark:hover:bg-brand-200"
              >
                Thêm {s.detailQuantity} vào giỏ
              </button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
```

- [ ] **Step 5: Thay `ProductCard.tsx` thành wrapper chọn biến thể**

Thay **toàn bộ nội dung** `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.tsx`:

```tsx
"use client";
// src/app/(customer)/menu/[tableToken]/_components/ProductCard.tsx — chọn biến thể theo orderTheme
import { ProductDto } from "@/services/menu";
import { useOrderThemeStore } from "@/stores/orderTheme.store";
import { ProductCardCinematic } from "./ProductCard.Cinematic";
import { ProductCardPlayful } from "./ProductCard.Playful";
import { AddToCartHandler } from "./useProductCardState";

interface ProductCardProps {
  product: ProductDto;
  onAddToCart: AddToCartHandler;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const theme = useOrderThemeStore((s) => s.theme);
  return theme === "cinematic" ? (
    <ProductCardCinematic product={product} onAddToCart={onAddToCart} />
  ) : (
    <ProductCardPlayful product={product} onAddToCart={onAddToCart} />
  );
};
```

- [ ] **Step 6: Kiểm tra & commit**

Run: `pnpm --dir chalo-fe lint`
Expected: sạch lỗi (có thể có warning `no-img-element` sẵn có từ trước, không
phải lỗi mới do task này gây ra — so sánh với lint trước khi sửa nếu nghi ngờ).

```bash
git add chalo-fe/src/components/shared/ui/Modal.tsx \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/_components/useProductCardState.ts" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.Cinematic.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.Playful.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/_components/ProductCard.tsx"
git commit -m "feat: split ProductCard into Cinematic/Playful variants"
```

---

### Task 3: Khung màn menu chính (`CustomerMenuClient`) — 2 biến thể + đặt công tắc A/B

**Files:**
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuView.Playful.tsx`
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuView.Cinematic.tsx`
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuClient.tsx` (rút toàn bộ JSX hiện có ra 2 view, giữ nguyên mọi hook/state/effect)

**Interfaces:**
- Consumes: `ProductCard` (Task 2, đã tự chọn biến thể), `OrderThemeSwitch`
  (Task 1), `ThemeSwitch` (đã có), `OccupiedModal` (đã có, không đổi — vẫn
  render từ `CustomerMenuClient`, không phải từ view).
- Produces: chữ ký prop dùng chung cho cả 2 view:

```ts
interface CustomerMenuViewProps {
  tableName: string;
  categories: CategoryDto[];
  activeCateId: string | null;
  onSelectCategory: (id: string | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
  grouped: { category: CategoryDto; products: ProductDto[] }[] | null;
  filterProduct: ProductDto[];
  hasAnyProduct: boolean;
  isFiltering: boolean;
  onAddToCart: (
    product: ProductDto,
    quantity: number,
    itemNote?: string,
    modifierOptionIds?: string[],
    price?: number,
    cartKey?: string,
  ) => void;
  onCallStaff: () => void;
  callCooldown: boolean;
  callStaffPending: boolean;
  itemCount: number;
  onCartClick: () => void;
  onOrdersClick: () => void;
}
```

- **Ràng buộc e2e bắt buộc giữ nguyên ở cả 2 view:**
  - Logo: link `aria-label="Chalo Coffee - Trang chủ"`.
  - Ô tìm kiếm: `placeholder` phải khớp regex `/món/i` (giữ nguyên
    `"Tìm món..."`).
  - Chip `"Tất cả"` + 1 chip mỗi danh mục.
  - Nút giỏ hàng nổi: `aria-label="Xem giỏ hàng"`.
  - Badge số lượng hiển thị đúng số (`itemCount`), không đổi format.

- [x] **Step 1: Tạo `CustomerMenuView.Playful.tsx`**

Tạo file, chuyển gần nguyên JSX hiện có của `CustomerMenuClient.tsx` (phần
`return (...)`) vào đây, chỉ đổi từ đọc state cục bộ sang đọc từ props, và
tăng cường style comic (viền dày, đổ bóng cứng, FAB nảy):

```tsx
"use client";
// src/app/(customer)/menu/[tableToken]/_components/CustomerMenuView.Playful.tsx
import { ThemeSwitch } from "@/components/shared/ThemeSwitch";
import { OrderThemeSwitch } from "@/components/shared/OrderThemeSwitch";
import { CategoryDto, ProductDto } from "@/services/menu";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { CustomerMenuViewProps } from "./CustomerMenuView.types";

export const CustomerMenuViewPlayful = ({
  tableName,
  categories,
  activeCateId,
  onSelectCategory,
  search,
  onSearchChange,
  grouped,
  filterProduct,
  hasAnyProduct,
  isFiltering,
  onAddToCart,
  onCallStaff,
  callCooldown,
  callStaffPending,
  itemCount,
  onCartClick,
  onOrdersClick,
}: CustomerMenuViewProps) => {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-950 dark:bg-carnival dark:text-brand-50">
      <header className="sticky top-0 z-30 border-b-2 border-stone-900 bg-white px-4 py-3 dark:border-brand-50 dark:bg-carnival-raised">
        <div className="mx-auto flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                aria-label="Chalo Coffee - Trang chủ"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border-2 border-stone-900 bg-pop-500 text-xs font-black text-white dark:border-brand-50"
              >
                CH
              </Link>
              <div className="min-w-0">
                <p className="truncate text-sm font-black leading-none sm:text-base">
                  Chalo Coffee
                </p>
                <p className="mt-1 truncate text-xs text-stone-500 dark:text-stone-400">
                  {tableName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onCallStaff}
                disabled={callCooldown || callStaffPending}
                aria-label="Gọi nhân viên"
                title={
                  callCooldown ? "Đã gọi, nhân viên đang đến" : "Gọi nhân viên đến bàn"
                }
                className="flex size-8 items-center justify-center rounded-full border-2 border-stone-900 bg-white text-stone-700 disabled:opacity-40 dark:border-brand-50 dark:bg-carnival-raised dark:text-brand-100"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </button>
              <OrderThemeSwitch />
              <ThemeSwitch />
              <button
                onClick={onOrdersClick}
                className="rounded-full border-2 border-stone-900 bg-pop-500 px-3 py-2 text-xs font-bold text-white dark:border-brand-50"
              >
                Đơn của tôi
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(16rem,24rem)_1fr] md:items-center">
            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm món..."
                className="w-full rounded-full border-2 border-stone-900 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-pop-400/40 dark:border-brand-50 dark:bg-carnival-raised dark:text-brand-50"
              />
            </div>

            <div className="relative min-w-0">
              <div className="flex gap-2 overflow-x-auto rounded-full border-2 border-stone-900 bg-white p-1 dark:border-brand-50 dark:bg-carnival-raised md:justify-end">
                <button
                  onClick={() => onSelectCategory(null)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    !activeCateId
                      ? "bg-pop-500 text-white"
                      : "text-stone-600 hover:bg-pop-500/10 dark:text-stone-300"
                  }`}
                >
                  Tất cả
                </button>
                {categories.map((c: CategoryDto) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectCategory(activeCateId === c.id ? null : c.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                      activeCateId === c.id
                        ? "bg-pop-500 text-white"
                        : "text-stone-600 hover:bg-pop-500/10 dark:text-stone-300"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 pb-28 pt-4">
        {!hasAnyProduct ? (
          <div className="py-24 text-center text-stone-500 dark:text-stone-400">
            <p className="text-sm font-medium">Thực đơn đang được cập nhật</p>
            <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
              Vui lòng quay lại sau hoặc gọi nhân viên để được hỗ trợ.
            </p>
          </div>
        ) : isFiltering ? (
          filterProduct.length === 0 ? (
            <div className="py-20 text-center text-stone-500 dark:text-stone-400">
              <p className="text-sm">Không tìm thấy món phù hợp</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filterProduct.map((p: ProductDto) => (
                <ProductCard
                  product={p}
                  key={p.id}
                  onAddToCart={(quantity, itemNote, modifierOptionIds, price, cartKey) =>
                    onAddToCart(p, quantity, itemNote, modifierOptionIds, price, cartKey)
                  }
                />
              ))}
            </div>
          )
        ) : (
          <div className="space-y-8">
            {grouped?.map(({ category, products }) => (
              <section key={category.id}>
                <h2 className="mb-3 text-base font-black sm:text-lg">
                  {category.name}
                </h2>
                <div className="grid gap-3">
                  {products.map((p: ProductDto) => (
                    <ProductCard
                      product={p}
                      key={p.id}
                      onAddToCart={(quantity, itemNote, modifierOptionIds, price, cartKey) =>
                        onAddToCart(p, quantity, itemNote, modifierOptionIds, price, cartKey)
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <button
        onClick={onCartClick}
        disabled={itemCount === 0}
        aria-label="Xem giỏ hàng"
        className="motion-safe:animate-bounce fixed bottom-5 right-4 z-30 flex size-16 items-center justify-center rounded-full border-2 border-stone-900 bg-pop-500 text-white shadow-[4px_5px_0_var(--color-stone-900)] transition active:scale-95 disabled:animate-none disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none dark:border-brand-50 dark:shadow-[4px_5px_0_var(--color-pop-600)] dark:disabled:border-stone-700 dark:disabled:bg-stone-800 sm:bottom-7 sm:right-7"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.4 12.25a2 2 0 0 0 2 1.7h8.8a2 2 0 0 0 2-1.55l1.35-7.45H5.12" />
        </svg>
        <span
          key={itemCount}
          className="absolute -right-1 -top-1 flex min-w-6 items-center justify-center rounded-full border-2 border-stone-900 bg-stone-950 px-1.5 py-0.5 text-xs font-bold text-white motion-safe:animate-[badge-pop_0.25s_cubic-bezier(0.16,1,0.3,1)] dark:border-brand-50"
        >
          {itemCount}
        </span>
      </button>
    </div>
  );
};
```

- [x] **Step 2: Tạo file type dùng chung `CustomerMenuView.types.ts`**

Tạo `chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuView.types.ts`:

```ts
// src/app/(customer)/menu/[tableToken]/_components/CustomerMenuView.types.ts
import { CategoryDto, ProductDto } from "@/services/menu";

export interface CustomerMenuViewProps {
  tableName: string;
  categories: CategoryDto[];
  activeCateId: string | null;
  onSelectCategory: (id: string | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
  grouped: { category: CategoryDto; products: ProductDto[] }[] | null;
  filterProduct: ProductDto[];
  hasAnyProduct: boolean;
  isFiltering: boolean;
  onAddToCart: (
    product: ProductDto,
    quantity: number,
    itemNote?: string,
    modifierOptionIds?: string[],
    price?: number,
    cartKey?: string,
  ) => void;
  onCallStaff: () => void;
  callCooldown: boolean;
  callStaffPending: boolean;
  itemCount: number;
  onCartClick: () => void;
  onOrdersClick: () => void;
}
```

(Đây là file được `import type` ở Step 1 — tạo file này **trước** khi chạy
lint cho Step 1, thứ tự không quan trọng miễn cả hai tồn tại trước Step 6.)

- [x] **Step 3: Tạo `CustomerMenuView.Cinematic.tsx`**

Tạo file cùng thư mục, cấu trúc tương tự Step 1 nhưng theo bảng màu Điện ảnh —
nền tối mặc định (không theo `dark:` của app mà **luôn tối**, đúng như spec:
"Điện ảnh Sáng" vẫn giữ card ảnh phủ gradient trên nền kem, không phải đảo hẳn
sang trắng):

```tsx
"use client";
// src/app/(customer)/menu/[tableToken]/_components/CustomerMenuView.Cinematic.tsx
import { ThemeSwitch } from "@/components/shared/ThemeSwitch";
import { OrderThemeSwitch } from "@/components/shared/OrderThemeSwitch";
import { CategoryDto, ProductDto } from "@/services/menu";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { CustomerMenuViewProps } from "./CustomerMenuView.types";

export const CustomerMenuViewCinematic = ({
  tableName,
  categories,
  activeCateId,
  onSelectCategory,
  search,
  onSearchChange,
  grouped,
  filterProduct,
  hasAnyProduct,
  isFiltering,
  onAddToCart,
  onCallStaff,
  callCooldown,
  callStaffPending,
  itemCount,
  onCartClick,
  onOrdersClick,
}: CustomerMenuViewProps) => {
  return (
    <div className="min-h-screen bg-brand-50 text-brand-950 dark:bg-stone-950 dark:text-brand-50">
      <header className="sticky top-0 z-30 border-b border-brand-200/60 bg-brand-50/90 backdrop-blur-xl dark:border-stone-800/80 dark:bg-stone-950/90">
        <div className="mx-auto flex flex-col gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                aria-label="Chalo Coffee - Trang chủ"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-xs font-bold text-brand-50 dark:bg-brand-300 dark:text-brand-950"
              >
                CH
              </Link>
              <div className="min-w-0">
                <p className="truncate font-serif text-sm leading-none sm:text-base">
                  Chalo Coffee
                </p>
                <p className="mt-1 truncate text-xs text-brand-700/70 dark:text-brand-200/70">
                  {tableName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onCallStaff}
                disabled={callCooldown || callStaffPending}
                aria-label="Gọi nhân viên"
                title={
                  callCooldown ? "Đã gọi, nhân viên đang đến" : "Gọi nhân viên đến bàn"
                }
                className="flex size-8 items-center justify-center rounded-full border border-brand-200 text-brand-700 disabled:opacity-40 dark:border-stone-800 dark:text-brand-200"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </button>
              <OrderThemeSwitch />
              <ThemeSwitch />
              <button
                onClick={onOrdersClick}
                className="rounded-full bg-brand-700 px-3 py-2 text-xs font-semibold text-brand-50 dark:bg-brand-300 dark:text-brand-950"
              >
                Đơn của tôi
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(16rem,24rem)_1fr] md:items-center">
            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm món..."
                className="w-full rounded-full border border-brand-200 bg-white/70 py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 dark:border-stone-800 dark:bg-stone-900/70"
              />
            </div>

            <div className="relative min-w-0">
              <div className="flex gap-2 overflow-x-auto rounded-full border border-brand-200/60 bg-white/50 p-1 dark:border-stone-800 dark:bg-stone-900/50 md:justify-end">
                <button
                  onClick={() => onSelectCategory(null)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    !activeCateId
                      ? "bg-brand-700 text-brand-50 dark:bg-brand-300 dark:text-brand-950"
                      : "text-brand-700/70 hover:bg-white dark:text-brand-200/70 dark:hover:bg-stone-800"
                  }`}
                >
                  Tất cả
                </button>
                {categories.map((c: CategoryDto) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectCategory(activeCateId === c.id ? null : c.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                      activeCateId === c.id
                        ? "bg-brand-700 text-brand-50 dark:bg-brand-300 dark:text-brand-950"
                        : "text-brand-700/70 hover:bg-white dark:text-brand-200/70 dark:hover:bg-stone-800"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 pb-28 pt-4">
        {!hasAnyProduct ? (
          <div className="py-24 text-center text-brand-700/70 dark:text-brand-200/70">
            <p className="text-sm font-medium">Thực đơn đang được cập nhật</p>
            <p className="mt-1 text-xs text-brand-500/70 dark:text-brand-300/50">
              Vui lòng quay lại sau hoặc gọi nhân viên để được hỗ trợ.
            </p>
          </div>
        ) : isFiltering ? (
          filterProduct.length === 0 ? (
            <div className="py-20 text-center text-brand-700/70 dark:text-brand-200/70">
              <p className="text-sm">Không tìm thấy món phù hợp</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filterProduct.map((p: ProductDto) => (
                <ProductCard
                  product={p}
                  key={p.id}
                  onAddToCart={(quantity, itemNote, modifierOptionIds, price, cartKey) =>
                    onAddToCart(p, quantity, itemNote, modifierOptionIds, price, cartKey)
                  }
                />
              ))}
            </div>
          )
        ) : (
          <div className="space-y-8">
            {grouped?.map(({ category, products }) => (
              <section key={category.id}>
                <h2 className="mb-3 font-serif text-base sm:text-lg">
                  {category.name}
                </h2>
                <div className="grid gap-3">
                  {products.map((p: ProductDto) => (
                    <ProductCard
                      product={p}
                      key={p.id}
                      onAddToCart={(quantity, itemNote, modifierOptionIds, price, cartKey) =>
                        onAddToCart(p, quantity, itemNote, modifierOptionIds, price, cartKey)
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <button
        onClick={onCartClick}
        disabled={itemCount === 0}
        aria-label="Xem giỏ hàng"
        className="fixed bottom-5 right-4 z-30 flex size-16 items-center justify-center rounded-full bg-brand-700 text-brand-50 shadow-[0_18px_38px_rgba(126,77,32,0.38)] ring-4 ring-brand-50/90 transition active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 dark:bg-brand-300 dark:text-brand-950 dark:ring-stone-950/90 dark:disabled:bg-stone-800 sm:bottom-7 sm:right-7"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.4 12.25a2 2 0 0 0 2 1.7h8.8a2 2 0 0 0 2-1.55l1.35-7.45H5.12" />
        </svg>
        <span
          key={itemCount}
          className="absolute -right-1 -top-1 flex min-w-6 items-center justify-center rounded-full bg-brand-950 px-1.5 py-0.5 text-xs font-bold text-brand-50 motion-safe:animate-[badge-pop_0.25s_cubic-bezier(0.16,1,0.3,1)] dark:bg-brand-50 dark:text-brand-950"
        >
          {itemCount}
        </span>
      </button>
    </div>
  );
};
```

- [x] **Step 4: Sửa `CustomerMenuClient.tsx` để rút JSX ra view**

Trong `CustomerMenuClient.tsx`, xoá toàn bộ khối `return (...)` hiện có (dòng
149-362 gốc — header/main/FAB) và mọi import chỉ dùng cho JSX cũ
(`ThemeSwitch` không còn cần import trực tiếp ở đây — chuyển sang view; giữ
`OccupiedModal`). Thêm import view + store, thay `return` thành:

```tsx
import { useOrderThemeStore } from "@/stores/orderTheme.store";
import { CustomerMenuViewCinematic } from "./CustomerMenuView.Cinematic";
import { CustomerMenuViewPlayful } from "./CustomerMenuView.Playful";
// ... (giữ nguyên các import khác đã có: OccupiedModal, useScanTable, useCallStaff, ...)
```

Cuối hàm, thay phần return bằng:

```tsx
  const orderTheme = useOrderThemeStore((s) => s.theme);

  const viewProps = {
    tableName,
    categories,
    activeCateId,
    onSelectCategory: setActiveCateId,
    search,
    onSearchChange: setSearch,
    grouped,
    filterProduct,
    hasAnyProduct: initProducts.length > 0,
    isFiltering: !!activeCateId || !!search,
    onAddToCart: handleAddToCart,
    onCallStaff: handleCallStaff,
    callCooldown,
    callStaffPending: callStaffMutation.isPending,
    itemCount,
    onCartClick: () => router.push(`/menu/${tableToken}/cart`),
    onOrdersClick: () => router.push(`/menu/${tableToken}/orders`),
  };

  return (
    <>
      {showOccupiedModal && (
        <OccupiedModal
          onContinue={() => setShowOccupiedModal(false)}
          onGoBack={() => {
            setShowOccupiedModal(false);
            router.back();
          }}
          tableName={tableName}
        />
      )}
      {orderTheme === "cinematic" ? (
        <CustomerMenuViewCinematic {...viewProps} />
      ) : (
        <CustomerMenuViewPlayful {...viewProps} />
      )}
    </>
  );
};
```

Gọi `useCallStaff()` cần thêm biến `callCooldown` — đã có sẵn trong state hiện
tại (`const [callCooldown, setCallCooldown] = ...`), không cần đổi gì ở phần
logic phía trên, chỉ đổi phần `return`.

- [x] **Step 5: Kiểm tra & commit**

Run: `pnpm --dir chalo-fe lint`
Expected: sạch.

```bash
git add "chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuView.types.ts" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuView.Playful.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuView.Cinematic.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/_components/CustomerMenuClient.tsx"
git commit -m "feat: split customer menu shell into Cinematic/Playful views, wire theme switch"
```

---

### Task 4: Giỏ hàng (`cart/page.tsx`) — 2 biến thể

**Files:**
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/cart/_components/CartView.Playful.tsx`
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/cart/_components/CartView.Cinematic.tsx`
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/cart/page.tsx`

**Interfaces:**
- Consumes: `CartItem` (`@/services/order/order.types`), `modifierLabel` (`@/utils/cart-modifiers`), `MAX_ITEM_QUANTITY`... không cần vì cart không giới hạn hiển thị theo hằng số đó (chỉ dùng khi cộng thêm — giữ nguyên hành vi `updateQuantity` hiện có).
- Produces prop chung:

```ts
interface CartViewProps {
  items: CartItem[];
  totalAmount: number;
  note: string;
  onNoteChange: (v: string) => void;
  onUpdateQuantity: (cartKey: string, quantity: number) => void;
  onUpdateNote: (cartKey: string, note: string) => void;
  onRemoveItem: (cartKey: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  estimatedMinutes?: number;
  onBack: () => void;
}
```

Cả hai biến thể tự render 2 nhánh: giỏ rỗng và giỏ có món (giữ đúng copy hiện
có: `"Bàn của quý khách chưa có món"`, `"Tiếp tục chọn món"`).

- [ ] **Step 1: Tạo `CartView.Playful.tsx`**

Tạo file, dựa trên JSX hiện có của `cart/page.tsx` nhưng viền dày/đổ bóng cứng,
tổng tiền có hiệu ứng nhảy số khi đổi (tái dùng keyframe `badge-pop` có sẵn),
nút xoá "×" xoay nhẹ khi hover:

```tsx
"use client";
// src/app/(customer)/menu/[tableToken]/cart/_components/CartView.Playful.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { CartItem } from "@/services/order/order.types";
import { modifierLabel } from "@/utils/cart-modifiers";

export const CartViewPlayful = ({
  items,
  totalAmount,
  note,
  onNoteChange,
  onUpdateQuantity,
  onUpdateNote,
  onRemoveItem,
  onSubmit,
  isSubmitting,
  estimatedMinutes,
  onBack,
}: {
  items: CartItem[];
  totalAmount: number;
  note: string;
  onNoteChange: (v: string) => void;
  onUpdateQuantity: (cartKey: string, quantity: number) => void;
  onUpdateNote: (cartKey: string, note: string) => void;
  onRemoveItem: (cartKey: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  estimatedMinutes?: number;
  onBack: () => void;
}) => {
  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-carnival">
        <header className="flex items-center gap-3 border-b-2 border-stone-900 bg-white px-4 py-3 dark:border-brand-50 dark:bg-carnival-raised">
          <button onClick={onBack} className="text-stone-500 dark:text-stone-400">
            ← Quay lại
          </button>
          <h1 className="text-base font-black text-stone-900 dark:text-brand-50">
            Giỏ hàng
          </h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-stone-400 dark:text-stone-500">
          <div className="flex size-20 items-center justify-center rounded-full border-2 border-stone-900 bg-white dark:border-brand-50 dark:bg-carnival-raised">
            <span className="text-4xl">🛒</span>
          </div>
          <p className="text-sm font-bold">Bàn của quý khách chưa có món</p>
          <button
            onClick={onBack}
            className="mt-2 rounded-full border-2 border-stone-900 bg-pop-500 px-6 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_var(--color-stone-900)] dark:border-brand-50 dark:shadow-[3px_3px_0_var(--color-pop-600)]"
          >
            Tiếp tục chọn món
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-carnival">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b-2 border-stone-900 bg-white px-4 py-3 dark:border-brand-50 dark:bg-carnival-raised">
        <button onClick={onBack} className="text-stone-500 dark:text-stone-400">
          ← Quay lại
        </button>
        <h1 className="flex-1 text-base font-black text-stone-900 dark:text-brand-50">
          Giỏ hàng
        </h1>
        <span className="rounded-md border-2 border-stone-900 bg-white px-2 py-0.5 text-sm font-bold text-stone-500 dark:border-brand-50 dark:bg-carnival-raised dark:text-stone-300">
          {items.length} món
        </span>
      </header>

      <main className="space-y-4 p-4 pb-32">
        {!!estimatedMinutes && estimatedMinutes > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-stone-900 bg-pop-400/20 p-3.5 dark:border-brand-50">
            <span className="text-xl">⏱️</span>
            <p className="text-sm text-stone-800 dark:text-brand-100">
              Thời gian chờ dự kiến:{" "}
              <strong className="font-bold">~{estimatedMinutes} phút</strong>
            </p>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.cartKey}
              className="rounded-2xl border-2 border-stone-900 bg-white p-3 shadow-[3px_3px_0_var(--color-stone-900)] dark:border-brand-50 dark:bg-carnival-raised dark:shadow-[3px_3px_0_var(--color-pop-600)]"
            >
              <div className="relative flex gap-3">
                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-stone-900 bg-stone-50 text-3xl dark:border-brand-50 dark:bg-carnival">
                  {item.productImageUrl ? (
                    <img
                      src={item.productImageUrl}
                      alt={item.productName}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    "☕"
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                  <div>
                    <p className="truncate pr-8 text-sm font-bold text-stone-900 dark:text-brand-50">
                      {item.productName}
                    </p>
                    <p className="mt-1 text-sm font-bold text-pop-600 dark:text-pop-400">
                      {item.price.toLocaleString("vi-VN")}đ
                    </p>
                    {(item.selectedModifiers?.length ?? 0) > 0 && (
                      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                        {modifierLabel(item.selectedModifiers)}
                      </p>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => onUpdateQuantity(item.cartKey, item.quantity - 1)}
                      aria-label="Giảm số lượng"
                      className="flex size-8 items-center justify-center rounded-full border-2 border-stone-900 text-lg font-bold text-stone-600 active:scale-95 dark:border-brand-50 dark:text-brand-100"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-sm font-bold text-stone-900 dark:text-brand-50">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.cartKey, item.quantity + 1)}
                      aria-label="Tăng số lượng"
                      className="flex size-8 items-center justify-center rounded-full border-2 border-stone-900 text-lg font-bold text-stone-600 active:scale-95 dark:border-brand-50 dark:text-brand-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  className="absolute right-0 top-0 flex size-7 items-center justify-center rounded-full text-stone-400 transition-transform hover:rotate-12 hover:text-red-500 dark:text-stone-500"
                  onClick={() => onRemoveItem(item.cartKey)}
                  aria-label="Xoá món"
                >
                  ✕
                </button>
              </div>

              <input
                value={item.note ?? ""}
                onChange={(e) => onUpdateNote(item.cartKey, e.target.value)}
                maxLength={200}
                placeholder="Ghi chú cho món (VD: ít đường...)"
                className="mt-3 w-full rounded-xl border-2 border-dashed border-stone-300 bg-transparent px-3 py-1.5 text-xs text-stone-700 outline-none placeholder:text-stone-400 focus:border-solid focus:border-pop-500 dark:border-stone-700 dark:text-stone-300"
              />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border-2 border-stone-900 bg-white p-4 dark:border-brand-50 dark:bg-carnival-raised">
          <label className="mb-2 block text-sm font-bold text-stone-700 dark:text-stone-300">
            Ghi chú cho đơn hàng
          </label>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="VD: Ít đường, không đá..."
            className="w-full resize-none rounded-xl border-2 border-stone-200 bg-transparent px-3 py-2 text-sm text-stone-900 outline-none focus:border-pop-500 dark:border-stone-700 dark:text-stone-100"
          />
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-30 space-y-3 border-t-2 border-stone-900 bg-white px-4 py-4 dark:border-brand-50 dark:bg-carnival-raised">
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-stone-600 dark:text-stone-400">
            Tổng cộng
          </span>
          <span
            key={totalAmount}
            className="text-xl font-black text-stone-900 motion-safe:animate-[badge-pop_0.25s_cubic-bezier(0.16,1,0.3,1)] dark:text-brand-50"
          >
            {totalAmount.toLocaleString("vi-VN")}đ
          </span>
        </div>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-stone-900 bg-pop-500 py-3.5 text-base font-bold text-white shadow-[3px_3px_0_var(--color-stone-900)] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60 dark:border-brand-50 dark:shadow-[3px_3px_0_var(--color-pop-600)]"
        >
          {isSubmitting && <SpinnerIcon className="size-5 animate-spin" />}
          {isSubmitting ? "Đang gửi đơn..." : "Xác nhận đặt món"}
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Tạo `CartView.Cinematic.tsx`**

Tạo file cùng thư mục, cấu trúc giống hệt props/2 nhánh rỗng-có món ở Step 1
nhưng theo bảng màu Điện ảnh (nền `brand-50`/`stone-950`, đường kẻ mảnh thay
viền dày, tổng tiền `font-serif` lớn, nút xác nhận pill vàng đồng
`bg-brand-700 dark:bg-brand-300`):

```tsx
"use client";
// src/app/(customer)/menu/[tableToken]/cart/_components/CartView.Cinematic.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { CartItem } from "@/services/order/order.types";
import { modifierLabel } from "@/utils/cart-modifiers";

export const CartViewCinematic = ({
  items,
  totalAmount,
  note,
  onNoteChange,
  onUpdateQuantity,
  onUpdateNote,
  onRemoveItem,
  onSubmit,
  isSubmitting,
  estimatedMinutes,
  onBack,
}: {
  items: CartItem[];
  totalAmount: number;
  note: string;
  onNoteChange: (v: string) => void;
  onUpdateQuantity: (cartKey: string, quantity: number) => void;
  onUpdateNote: (cartKey: string, note: string) => void;
  onRemoveItem: (cartKey: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  estimatedMinutes?: number;
  onBack: () => void;
}) => {
  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-brand-50 dark:bg-stone-950">
        <header className="flex items-center gap-3 border-b border-brand-200/60 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
          <button onClick={onBack} className="text-brand-700/70 dark:text-brand-200/70">
            ← Quay lại
          </button>
          <h1 className="font-serif text-base text-brand-950 dark:text-brand-50">
            Giỏ hàng
          </h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-brand-700/60 dark:text-brand-200/50">
          <div className="flex size-20 items-center justify-center rounded-full bg-brand-100 dark:bg-stone-900">
            <span className="text-4xl">🛒</span>
          </div>
          <p className="text-sm font-medium">Bàn của quý khách chưa có món</p>
          <button
            onClick={onBack}
            className="mt-2 rounded-full bg-brand-700 px-6 py-2.5 text-sm font-medium text-brand-50 dark:bg-brand-300 dark:text-brand-950"
          >
            Tiếp tục chọn món
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-50 dark:bg-stone-950">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-brand-200/60 bg-brand-50/90 px-4 py-3 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/90">
        <button onClick={onBack} className="text-brand-700/70 dark:text-brand-200/70">
          ← Quay lại
        </button>
        <h1 className="flex-1 font-serif text-base text-brand-950 dark:text-brand-50">
          Giỏ hàng
        </h1>
        <span className="rounded-md bg-brand-100 px-2 py-0.5 text-sm text-brand-700 dark:bg-stone-900 dark:text-brand-300">
          {items.length} món
        </span>
      </header>

      <main className="space-y-1 p-4 pb-32">
        {!!estimatedMinutes && estimatedMinutes > 0 && (
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-brand-100/60 p-3.5 dark:bg-stone-900">
            <span className="text-xl">⏱️</span>
            <p className="text-sm text-brand-800 dark:text-brand-300">
              Thời gian chờ dự kiến:{" "}
              <strong className="font-semibold">~{estimatedMinutes} phút</strong>
            </p>
          </div>
        )}

        {items.map((item, idx) => (
          <div
            key={item.cartKey}
            className={`relative flex gap-3 py-4 ${
              idx > 0 ? "border-t border-brand-200/50 dark:border-stone-800" : ""
            }`}
          >
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl dark:bg-stone-900">
              {item.productImageUrl ? (
                <img
                  src={item.productImageUrl}
                  alt={item.productName}
                  loading="lazy"
                  className="size-full object-cover"
                />
              ) : (
                "☕"
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-serif text-sm text-brand-950 dark:text-brand-50">
                  {item.productName}
                </p>
                <span className="shrink-0 text-sm text-brand-700 dark:text-brand-300">
                  {item.price.toLocaleString("vi-VN")}đ
                </span>
              </div>
              {(item.selectedModifiers?.length ?? 0) > 0 && (
                <p className="mt-1 text-xs text-brand-600/70 dark:text-brand-300/70">
                  {modifierLabel(item.selectedModifiers)}
                </p>
              )}
              <input
                value={item.note ?? ""}
                onChange={(e) => onUpdateNote(item.cartKey, e.target.value)}
                maxLength={200}
                placeholder="Ghi chú cho món..."
                className="mt-2 w-full border-b border-dashed border-brand-200 bg-transparent py-1 text-xs text-brand-800 outline-none placeholder:text-brand-400 focus:border-brand-500 dark:border-stone-700 dark:text-brand-200"
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => onUpdateQuantity(item.cartKey, item.quantity - 1)}
                  aria-label="Giảm số lượng"
                  className="flex size-7 items-center justify-center rounded-full border border-brand-200 text-sm text-brand-700 dark:border-stone-700 dark:text-brand-200"
                >
                  -
                </button>
                <span className="w-5 text-center text-sm text-brand-900 dark:text-brand-50">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.cartKey, item.quantity + 1)}
                  aria-label="Tăng số lượng"
                  className="flex size-7 items-center justify-center rounded-full border border-brand-200 text-sm text-brand-700 dark:border-stone-700 dark:text-brand-200"
                >
                  +
                </button>
                <button
                  onClick={() => onRemoveItem(item.cartKey)}
                  aria-label="Xoá món"
                  className="ml-auto text-xs text-brand-500/70 underline-offset-2 hover:underline dark:text-brand-300/60"
                >
                  Xoá
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="mt-4 rounded-2xl bg-white/60 p-4 dark:bg-stone-900/60">
          <label className="mb-2 block text-sm text-brand-800 dark:text-brand-200">
            Ghi chú cho đơn hàng
          </label>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="VD: Ít đường, không đá..."
            className="w-full resize-none rounded-xl border border-brand-200 bg-transparent px-3 py-2 text-sm text-brand-950 outline-none focus:border-brand-500 dark:border-stone-700 dark:text-brand-50"
          />
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-30 space-y-3 border-t border-brand-200/60 bg-brand-50/95 px-4 py-4 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/95">
        <div className="flex items-center justify-between">
          <span className="text-base text-brand-700/80 dark:text-brand-200/70">
            Tổng cộng
          </span>
          <span className="font-serif text-2xl text-brand-900 dark:text-brand-50">
            {totalAmount.toLocaleString("vi-VN")}đ
          </span>
        </div>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-700 py-3.5 text-base font-semibold text-brand-50 transition-colors hover:bg-brand-800 disabled:opacity-60 dark:bg-brand-300 dark:text-brand-950 dark:hover:bg-brand-200"
        >
          {isSubmitting && <SpinnerIcon className="size-5 animate-spin" />}
          {isSubmitting ? "Đang gửi đơn..." : "Xác nhận đặt món"}
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Sửa `cart/page.tsx` để chọn view theo theme**

Thay nội dung `chalo-fe/src/app/(customer)/menu/[tableToken]/cart/page.tsx`
(giữ nguyên toàn bộ phần logic đầu hàm — `useParams`, `useCartStore`,
`useCreateOrder`, `useGetEstimatedWait`, `handleSubmitOrder`) chỉ thay phần
`return`:

```tsx
"use client";
import {
  useCreateOrder,
  useGetEstimatedWait,
} from "@/services/order/order.queries";
import { useCartStore } from "@/stores/cart.store";
import { useOrderThemeStore } from "@/stores/orderTheme.store";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CartViewCinematic } from "./_components/CartView.Cinematic";
import { CartViewPlayful } from "./_components/CartView.Playful";

export default function CartPage() {
  const { tableToken } = useParams<{ tableToken: string }>();
  const router = useRouter();
  const [note, setNote] = useState<string>("");

  const items = useCartStore((s) => s.items);
  const totalAmount = useCartStore((s) => s.getTotalAmount)();
  const clearCart = useCartStore((s) => s.clearCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updateNote = useCartStore((s) => s.updateNote);
  const removeItem = useCartStore((s) => s.removeItem);
  const orderTheme = useOrderThemeStore((s) => s.theme);

  const createOrderMutation = useCreateOrder();
  const { data: waitData } = useGetEstimatedWait();

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;
    const order = await createOrderMutation.mutateAsync({
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        note: item.note,
        modifierOptionIds: item.modifierOptionIds,
      })),
      note: note,
      tableToken: tableToken,
    });
    clearCart();
    router.push(`/menu/${tableToken}/orders/${order.id}`);
  };

  const viewProps = {
    items,
    totalAmount,
    note,
    onNoteChange: setNote,
    onUpdateQuantity: updateQuantity,
    onUpdateNote: updateNote,
    onRemoveItem: removeItem,
    onSubmit: handleSubmitOrder,
    isSubmitting: createOrderMutation.isPending,
    estimatedMinutes: waitData?.estimatedMinutes,
    onBack: () => router.back(),
  };

  return orderTheme === "cinematic" ? (
    <CartViewCinematic {...viewProps} />
  ) : (
    <CartViewPlayful {...viewProps} />
  );
}
```

**Lưu ý:** bản gốc gọi `useCartStore((s) => s.getTotalAmount)` rồi gọi
`totalAmount()` trong JSX (selector trả về hàm, gọi ở chỗ dùng) — ở đây gọi
luôn `()` ngay khi lấy ra `totalAmount` là số, để 2 view nhận `number` thay vì
phải tự gọi hàm; hành vi tính toán không đổi, chỉ đổi chỗ gọi.

- [ ] **Step 4: Kiểm tra & commit**

Run: `pnpm --dir chalo-fe lint`
Expected: sạch.

```bash
git add "chalo-fe/src/app/(customer)/menu/[tableToken]/cart/_components/CartView.Playful.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/cart/_components/CartView.Cinematic.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/cart/page.tsx"
git commit -m "feat: split cart page into Cinematic/Playful views"
```

---

### Task 5: Thanh toán (`checkout`) — 2 biến thể

**Files:**
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutView.Playful.tsx`
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutView.Cinematic.tsx`
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/checkout/page.tsx`

`CheckoutSummary.tsx`/`CheckoutSessionPanel.tsx` **không xoá** — chỉ không còn
được `checkout/page.tsx` gọi trực tiếp; giữ lại phòng khi nơi khác (không có
trong repo hiện tại, kiểm bằng `grep` trước khi xoá hẳn nếu muốn dọn dẹp sau
này — task này không yêu cầu xoá).

**Interfaces:**
- Consumes: `useGetSettings` (`@/services/settings`), `buildVietQR`
  (`@/lib/vietqr`), `QRCodeSVG` (`qrcode.react`) — logic tính QR/đếm giờ được
  **viết lại bên trong `CheckoutView.*`** (không import từ
  `CheckoutSessionPanel.tsx` vì component đó không export phần đếm giờ tách
  rời — xem Step 1 để copy đúng logic `remainingMs`/`qrPayload`).
- Produces prop chung:

```ts
interface CheckoutViewProps {
  step: "review" | "session" | "done" | "loading" | "empty";
  orders: OrderDto[];
  totalAmount: number;
  session: CheckoutSessionResult | null;
  onStart: () => void;
  isStarting: boolean;
  onConfirmPaid: () => void;
  isConfirming: boolean;
  onRestartSession: () => void;
  tableName?: string | null;
  onGoToOrders: () => void;
  onGoToMenu: () => void;
}
```

- [ ] **Step 1: Tạo `CheckoutView.Playful.tsx`**

```tsx
"use client";
// src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutView.Playful.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { buildVietQR } from "@/lib/vietqr";
import { useGetSettings } from "@/services/settings";
import { CheckoutSessionResult, OrderDto } from "@/services/order/order.types";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

interface CheckoutViewProps {
  step: "review" | "session" | "done" | "loading" | "empty";
  orders: OrderDto[];
  totalAmount: number;
  session: CheckoutSessionResult | null;
  onStart: () => void;
  isStarting: boolean;
  onConfirmPaid: () => void;
  isConfirming: boolean;
  onRestartSession: () => void;
  tableName?: string | null;
  onGoToOrders: () => void;
  onGoToMenu: () => void;
}

const SessionPanel = ({
  session,
  tableName,
  onConfirmPaid,
  isConfirming,
  onRestartSession,
}: Pick<
  CheckoutViewProps,
  "session" | "tableName" | "onConfirmPaid" | "isConfirming" | "onRestartSession"
>) => {
  const { data: settings } = useGetSettings();
  const [remainingMs, setRemainingMs] = useState<number>(
    () => new Date(session!.expiresAt).getTime() - Date.now(),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemainingMs(new Date(session!.expiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [session]);

  const expired = remainingMs <= 0;
  const mm = Math.max(0, Math.floor(remainingMs / 60000));
  const ss = Math.max(0, Math.floor((remainingMs % 60000) / 1000));
  const bankConfigured =
    !!settings?.bankBin && !!settings?.bankAccountNo && !!settings?.bankAccountName;
  const qrPayload = bankConfigured
    ? buildVietQR({
        bankBin: settings!.bankBin!,
        accountNo: settings!.bankAccountNo!,
        amount: session!.totalAmount,
        addInfo: `CHALO ${tableName ?? ""} ${session!.sessionId.slice(-6)}`,
      })
    : null;

  return (
    <div className="space-y-4 rounded-2xl border-2 border-stone-900 bg-white p-5 shadow-[4px_4px_0_var(--color-stone-900)] dark:border-brand-50 dark:bg-carnival-raised dark:shadow-[4px_4px_0_var(--color-pop-600)]">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
          Phiên thanh toán gộp
        </p>
        <p className="mt-2 text-3xl font-black text-pop-600 dark:text-pop-400">
          {session!.totalAmount.toLocaleString("vi-VN")}đ
        </p>
        <p
          className={`mt-2 text-sm font-bold ${
            expired ? "text-red-600 dark:text-red-400" : "text-stone-500 dark:text-stone-400"
          }`}
        >
          {expired ? "Phiên đã hết hạn" : `Hết hạn sau ${mm}:${ss.toString().padStart(2, "0")}`}
        </p>
      </div>

      {qrPayload && !expired && (
        <div className="flex flex-col items-center gap-3">
          <div
            data-testid="vietqr-code"
            className="rounded-2xl border-2 border-stone-900 bg-white p-3 dark:border-brand-50"
          >
            <QRCodeSVG value={qrPayload} size={208} marginSize={1} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-stone-900 dark:text-brand-50">
              {settings!.bankAccountName}
            </p>
            <p className="font-mono text-xs text-stone-500 dark:text-stone-400">
              {settings!.bankAccountNo}
            </p>
            <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
              Mở app ngân hàng bất kỳ, quét mã — số tiền và nội dung đã điền
              sẵn. Chuyển xong hãy bấm nút bên dưới.
            </p>
          </div>
        </div>
      )}

      {expired ? (
        <button
          onClick={onRestartSession}
          className="w-full rounded-2xl border-2 border-stone-900 bg-pop-500 py-3.5 text-sm font-bold text-white dark:border-brand-50"
        >
          Tạo lại phiên thanh toán
        </button>
      ) : (
        <button
          onClick={onConfirmPaid}
          disabled={isConfirming}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-stone-900 bg-green-500 py-3.5 text-base font-bold text-white disabled:opacity-60 dark:border-brand-50"
        >
          {isConfirming ? (
            <>
              <SpinnerIcon className="size-5 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            "✓ Tôi đã thanh toán"
          )}
        </button>
      )}
    </div>
  );
};

export const CheckoutViewPlayful = (props: CheckoutViewProps) => {
  const { step, orders, totalAmount, onStart, isStarting, onGoToOrders, onGoToMenu } = props;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-carnival">
      <header className="flex items-center gap-3 border-b-2 border-stone-900 bg-white px-4 py-3 dark:border-brand-50 dark:bg-carnival-raised">
        <button onClick={onGoToOrders} className="text-stone-500 dark:text-stone-400">
          ← Quay lại
        </button>
        <h1 className="text-base font-black text-stone-900 dark:text-brand-50">
          Thanh toán một lần
        </h1>
      </header>

      <main className="space-y-4 p-4 pb-32">
        {step === "done" ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex size-20 items-center justify-center rounded-full border-2 border-stone-900 bg-green-100 text-4xl dark:border-brand-50">
              🎉
            </div>
            <p className="text-lg font-black text-stone-900 dark:text-brand-50">
              Đã thanh toán tất cả đơn của bàn
            </p>
            <button
              onClick={onGoToOrders}
              className="rounded-2xl border-2 border-stone-900 bg-pop-500 px-8 py-3 text-sm font-bold text-white dark:border-brand-50"
            >
              Xem đơn hàng
            </button>
          </div>
        ) : step === "loading" ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon className="size-8 animate-spin text-pop-500" />
          </div>
        ) : step === "empty" ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center text-stone-400 dark:text-stone-500">
            <div className="flex size-20 items-center justify-center rounded-full border-2 border-stone-900 bg-white text-4xl dark:border-brand-50 dark:bg-carnival-raised">
              ✅
            </div>
            <p className="text-sm font-bold text-stone-600 dark:text-stone-400">
              Không có đơn nào cần thanh toán
            </p>
            <button
              onClick={onGoToMenu}
              className="rounded-full border-2 border-stone-900 bg-pop-500 px-6 py-2.5 text-sm font-bold text-white dark:border-brand-50"
            >
              Xem thực đơn
            </button>
          </div>
        ) : step === "session" ? (
          <SessionPanel {...props} />
        ) : (
          <div className="space-y-3 rounded-2xl border-2 border-stone-900 bg-white p-4 shadow-[4px_4px_0_var(--color-stone-900)] dark:border-brand-50 dark:bg-carnival-raised dark:shadow-[4px_4px_0_var(--color-pop-600)]">
            <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
              {orders.length} đơn sẽ được thanh toán
            </p>
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-stone-400 dark:text-stone-500">
                      Đơn #{o.id.slice(-6).toUpperCase()}
                    </p>
                    <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                      {o.items.reduce((s, i) => s + i.quantity, 0)} món
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-stone-900 dark:text-brand-50">
                    {o.totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t-2 border-stone-900 pt-3 dark:border-brand-50">
              <span className="text-sm font-bold text-stone-900 dark:text-brand-50">
                Tổng cần thanh toán
              </span>
              <span className="text-lg font-black text-pop-600 dark:text-pop-400">
                {totalAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>
        )}
      </main>

      {step === "review" && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t-2 border-stone-900 bg-white px-4 py-4 dark:border-brand-50 dark:bg-carnival-raised">
          <button
            onClick={onStart}
            disabled={isStarting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-stone-900 bg-green-500 py-3.5 text-base font-bold text-white shadow-[3px_3px_0_var(--color-stone-900)] disabled:opacity-60 dark:border-brand-50"
          >
            {isStarting && <SpinnerIcon className="size-5 animate-spin" />}
            Thanh toán {totalAmount.toLocaleString("vi-VN")}đ
          </button>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Tạo `CheckoutView.Cinematic.tsx`**

Tạo file cùng cấu trúc props/step ở Step 1, đổi màu sang bảng Điện ảnh
(`brand-*`, `font-serif` cho số tiền, QR vẫn nền trắng cố định như bản gốc để
app ngân hàng luôn quét được — không đổi phần này):

```tsx
"use client";
// src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutView.Cinematic.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { buildVietQR } from "@/lib/vietqr";
import { useGetSettings } from "@/services/settings";
import { CheckoutSessionResult, OrderDto } from "@/services/order/order.types";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

interface CheckoutViewProps {
  step: "review" | "session" | "done" | "loading" | "empty";
  orders: OrderDto[];
  totalAmount: number;
  session: CheckoutSessionResult | null;
  onStart: () => void;
  isStarting: boolean;
  onConfirmPaid: () => void;
  isConfirming: boolean;
  onRestartSession: () => void;
  tableName?: string | null;
  onGoToOrders: () => void;
  onGoToMenu: () => void;
}

const SessionPanel = ({
  session,
  tableName,
  onConfirmPaid,
  isConfirming,
  onRestartSession,
}: Pick<
  CheckoutViewProps,
  "session" | "tableName" | "onConfirmPaid" | "isConfirming" | "onRestartSession"
>) => {
  const { data: settings } = useGetSettings();
  const [remainingMs, setRemainingMs] = useState<number>(
    () => new Date(session!.expiresAt).getTime() - Date.now(),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemainingMs(new Date(session!.expiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [session]);

  const expired = remainingMs <= 0;
  const mm = Math.max(0, Math.floor(remainingMs / 60000));
  const ss = Math.max(0, Math.floor((remainingMs % 60000) / 1000));
  const bankConfigured =
    !!settings?.bankBin && !!settings?.bankAccountNo && !!settings?.bankAccountName;
  const qrPayload = bankConfigured
    ? buildVietQR({
        bankBin: settings!.bankBin!,
        accountNo: settings!.bankAccountNo!,
        amount: session!.totalAmount,
        addInfo: `CHALO ${tableName ?? ""} ${session!.sessionId.slice(-6)}`,
      })
    : null;

  return (
    <div className="space-y-4 rounded-2xl bg-white/70 p-5 dark:bg-stone-900/70">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider text-brand-600/70 dark:text-brand-300/60">
          Phiên thanh toán gộp
        </p>
        <p className="mt-2 font-serif text-3xl text-brand-800 dark:text-brand-300">
          {session!.totalAmount.toLocaleString("vi-VN")}đ
        </p>
        <p
          className={`mt-2 text-sm ${
            expired ? "text-red-600 dark:text-red-400" : "text-brand-700/70 dark:text-brand-200/60"
          }`}
        >
          {expired ? "Phiên đã hết hạn" : `Hết hạn sau ${mm}:${ss.toString().padStart(2, "0")}`}
        </p>
      </div>

      {qrPayload && !expired && (
        <div className="flex flex-col items-center gap-3">
          <div data-testid="vietqr-code" className="rounded-2xl border-2 border-brand-100 bg-white p-3">
            <QRCodeSVG value={qrPayload} size={208} marginSize={1} />
          </div>
          <div className="text-center">
            <p className="text-sm text-brand-900 dark:text-brand-100">
              {settings!.bankAccountName}
            </p>
            <p className="font-mono text-xs text-brand-600/70 dark:text-brand-300/60">
              {settings!.bankAccountNo}
            </p>
            <p className="mt-1 text-xs text-brand-500/70 dark:text-brand-300/50">
              Mở app ngân hàng bất kỳ, quét mã — số tiền và nội dung đã điền
              sẵn. Chuyển xong hãy bấm nút bên dưới.
            </p>
          </div>
        </div>
      )}

      {expired ? (
        <button
          onClick={onRestartSession}
          className="w-full rounded-full bg-brand-700 py-3.5 text-sm font-semibold text-brand-50 dark:bg-brand-300 dark:text-brand-950"
        >
          Tạo lại phiên thanh toán
        </button>
      ) : (
        <button
          onClick={onConfirmPaid}
          disabled={isConfirming}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 py-3.5 text-base font-semibold text-white disabled:opacity-60 dark:bg-green-500"
        >
          {isConfirming ? (
            <>
              <SpinnerIcon className="size-5 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            "✓ Tôi đã thanh toán"
          )}
        </button>
      )}
    </div>
  );
};

export const CheckoutViewCinematic = (props: CheckoutViewProps) => {
  const { step, orders, totalAmount, onStart, isStarting, onGoToOrders, onGoToMenu } = props;

  return (
    <div className="min-h-screen bg-brand-50 dark:bg-stone-950">
      <header className="flex items-center gap-3 border-b border-brand-200/60 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
        <button onClick={onGoToOrders} className="text-brand-700/70 dark:text-brand-200/70">
          ← Quay lại
        </button>
        <h1 className="font-serif text-base text-brand-950 dark:text-brand-50">
          Thanh toán một lần
        </h1>
      </header>

      <main className="space-y-4 p-4 pb-32">
        {step === "done" ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-green-50 text-4xl dark:bg-green-900/20">
              🎉
            </div>
            <p className="font-serif text-lg text-brand-950 dark:text-brand-50">
              Đã thanh toán tất cả đơn của bàn
            </p>
            <button
              onClick={onGoToOrders}
              className="rounded-full bg-brand-700 px-8 py-3 text-sm font-semibold text-brand-50 dark:bg-brand-300 dark:text-brand-950"
            >
              Xem đơn hàng
            </button>
          </div>
        ) : step === "loading" ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon className="size-8 animate-spin text-brand-400" />
          </div>
        ) : step === "empty" ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center text-brand-700/60 dark:text-brand-200/50">
            <div className="flex size-20 items-center justify-center rounded-full bg-brand-100 text-4xl dark:bg-stone-900">
              ✅
            </div>
            <p className="text-sm text-brand-700/80 dark:text-brand-200/70">
              Không có đơn nào cần thanh toán
            </p>
            <button
              onClick={onGoToMenu}
              className="rounded-full bg-brand-700 px-6 py-2.5 text-sm font-medium text-brand-50 dark:bg-brand-300 dark:text-brand-950"
            >
              Xem thực đơn
            </button>
          </div>
        ) : step === "session" ? (
          <SessionPanel {...props} />
        ) : (
          <div className="space-y-3 rounded-2xl bg-white/60 p-4 dark:bg-stone-900/60">
            <p className="text-sm text-brand-800 dark:text-brand-200">
              {orders.length} đơn sẽ được thanh toán
            </p>
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-brand-500/70 dark:text-brand-300/50">
                      Đơn #{o.id.slice(-6).toUpperCase()}
                    </p>
                    <p className="truncate text-xs text-brand-600/70 dark:text-brand-300/60">
                      {o.items.reduce((s, i) => s + i.quantity, 0)} món
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-brand-950 dark:text-brand-50">
                    {o.totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-brand-200/60 pt-3 dark:border-stone-800">
              <span className="text-sm text-brand-950 dark:text-brand-50">
                Tổng cần thanh toán
              </span>
              <span className="font-serif text-lg text-brand-700 dark:text-brand-300">
                {totalAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>
        )}
      </main>

      {step === "review" && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-brand-200/60 bg-brand-50/95 px-4 py-4 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/95">
          <button
            onClick={onStart}
            disabled={isStarting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-green-700 py-3.5 text-base font-semibold text-brand-50 disabled:opacity-60 dark:bg-green-500"
          >
            {isStarting && <SpinnerIcon className="size-5 animate-spin" />}
            Thanh toán {totalAmount.toLocaleString("vi-VN")}đ
          </button>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Sửa `checkout/page.tsx` để chọn view theo theme**

Giữ nguyên toàn bộ state/hook (`useCheckoutPreview`, `useCheckoutStart`,
`useCheckoutComplete`, `useCustomerOrderEvents`, `session`, `done`), chỉ thay
import + phần return:

```tsx
"use client";
import {
  useCheckoutPreview,
  useCheckoutStart,
  useCheckoutComplete,
} from "@/services/order/order.queries";
import { CheckoutSessionResult } from "@/services/order/order.types";
import { useCustomerOrderEvents } from "@/hooks/useCustomerOrderEvents";
import { useOrderThemeStore } from "@/stores/orderTheme.store";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CheckoutViewCinematic } from "./_components/CheckoutView.Cinematic";
import { CheckoutViewPlayful } from "./_components/CheckoutView.Playful";

export default function CheckoutPage() {
  const { tableToken } = useParams<{ tableToken: string }>();
  const router = useRouter();

  const { data: preview, isLoading, isError } = useCheckoutPreview(tableToken);
  useCustomerOrderEvents(tableToken);
  const startMutation = useCheckoutStart();
  const completeMutation = useCheckoutComplete(tableToken);
  const orderTheme = useOrderThemeStore((s) => s.theme);

  const [session, setSession] = useState<CheckoutSessionResult | null>(null);
  const [done, setDone] = useState<boolean>(false);

  const handleStart = async () => {
    const s = await startMutation.mutateAsync({ tableToken });
    setSession(s);
  };

  const handleComplete = async () => {
    if (!session) return;
    await completeMutation.mutateAsync({
      sessionId: session.sessionId,
      tableToken: session.tableToken,
      clientSecret: session.clientSecret,
    });
    setSession(null);
    setDone(true);
  };

  const step = done
    ? "done"
    : isLoading
      ? "loading"
      : isError || !preview || preview.orders.length === 0
        ? "empty"
        : session
          ? "session"
          : "review";

  const viewProps = {
    step: step as "review" | "session" | "done" | "loading" | "empty",
    orders: preview?.orders ?? [],
    totalAmount: preview?.totalAmount ?? 0,
    session,
    onStart: handleStart,
    isStarting: startMutation.isPending,
    onConfirmPaid: handleComplete,
    isConfirming: completeMutation.isPending,
    onRestartSession: () => setSession(null),
    tableName: preview?.tableName,
    onGoToOrders: () => router.push(`/menu/${tableToken}/orders`),
    onGoToMenu: () => router.push(`/menu/${tableToken}`),
  };

  return orderTheme === "cinematic" ? (
    <CheckoutViewCinematic {...viewProps} />
  ) : (
    <CheckoutViewPlayful {...viewProps} />
  );
}
```

- [ ] **Step 4: Kiểm tra & commit**

Run: `pnpm --dir chalo-fe lint`
Expected: sạch.

```bash
git add "chalo-fe/src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutView.Playful.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/checkout/_components/CheckoutView.Cinematic.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/checkout/page.tsx"
git commit -m "feat: split checkout page into Cinematic/Playful views"
```

---

### Task 6: Danh sách đơn (`OrderCard`) — 2 biến thể

**Files:**
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.Cinematic.tsx`
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.Playful.tsx`
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.tsx`

**Interfaces:**
- Consumes: `STATUS_META` (`./status-meta.ts`, không đổi), `OrderDto`.
- Produces: `OrderCard` giữ nguyên chữ ký `{ order: OrderDto; onClick: () => void }`.

- [ ] **Step 1: Tạo `OrderCard.Playful.tsx`**

```tsx
// src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.Playful.tsx
import { OrderDto } from "@/services/order/order.types";
import { STATUS_META } from "./status-meta";

export const OrderCardPlayful = ({
  order,
  onClick,
}: {
  order: OrderDto;
  onClick: () => void;
}) => {
  const meta = STATUS_META[order.status];

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border-2 border-stone-900 bg-white p-4 text-left shadow-[3px_3px_0_var(--color-stone-900)] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-brand-50 dark:bg-carnival-raised dark:shadow-[3px_3px_0_var(--color-pop-600)]"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-stone-400 dark:text-stone-500">
            Đơn #{order.id.slice(-6).toUpperCase()}
          </p>
          <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
            {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full border-2 border-stone-900 px-2.5 py-0.5 text-xs font-bold dark:border-brand-50 ${meta.bgColor} ${meta.textColor}`}
          >
            <span>{meta.emoji}</span>
            {meta.label}
          </span>
          {order.paidStatus ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
              ✓ Đã thanh toán
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400">
              Chưa thanh toán
            </span>
          )}
        </div>
      </div>

      <div className="mb-3 space-y-1">
        {order.items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <span className="truncate pr-4 text-sm text-stone-700 dark:text-stone-300">
              {item.productName}
              <span className="text-stone-400">x{item.quantity}</span>
              {(item.selectedModifiers?.length ?? 0) > 0 && (
                <span className="block text-xs text-pop-600 dark:text-pop-400">
                  {item.selectedModifiers!
                    .map((m) => `${m.groupName}: ${m.optionName}`)
                    .join(" · ")}
                </span>
              )}
            </span>
            <span className="shrink-0 text-sm font-bold text-stone-900 dark:text-brand-50">
              {item.subtotal.toLocaleString("vi-VN")}đ
            </span>
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="text-xs text-stone-400 dark:text-stone-500">
            +{order.items.length - 3} món khác ...
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t-2 border-stone-900 pt-3 dark:border-brand-50">
        <span className="text-sm text-stone-500 dark:text-stone-400">
          Tổng: {order.items.reduce((sum, i) => sum + i.quantity, 0)} món
        </span>
        <span className="text-base font-black text-pop-600 dark:text-pop-400">
          {order.totalAmount.toLocaleString("vi-VN")}đ
        </span>
      </div>

      <div className="mt-2 flex justify-end">
        <span className="text-xs font-bold text-stone-400 dark:text-stone-600">
          Xem chi tiết →
        </span>
      </div>
    </button>
  );
};
```

- [ ] **Step 2: Tạo `OrderCard.Cinematic.tsx`**

```tsx
// src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.Cinematic.tsx
import { OrderDto } from "@/services/order/order.types";
import { STATUS_META } from "./status-meta";

export const OrderCardCinematic = ({
  order,
  onClick,
}: {
  order: OrderDto;
  onClick: () => void;
}) => {
  const meta = STATUS_META[order.status];

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl bg-white/70 p-4 text-left transition-colors hover:bg-white dark:bg-stone-900/60 dark:hover:bg-stone-900"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-brand-500/70 dark:text-brand-300/50">
            Đơn #{order.id.slice(-6).toUpperCase()}
          </p>
          <p className="mt-0.5 text-xs text-brand-500/70 dark:text-brand-300/50">
            {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.bgColor} ${meta.textColor}`}
          >
            <span>{meta.emoji}</span>
            {meta.label}
          </span>
          {order.paidStatus ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              ✓ Đã thanh toán
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
              Chưa thanh toán
            </span>
          )}
        </div>
      </div>

      <div className="mb-3 space-y-1">
        {order.items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <span className="truncate pr-4 text-sm text-brand-900 dark:text-brand-100">
              {item.productName}
              <span className="text-brand-500/60">x{item.quantity}</span>
              {(item.selectedModifiers?.length ?? 0) > 0 && (
                <span className="block text-xs text-brand-600 dark:text-brand-300">
                  {item.selectedModifiers!
                    .map((m) => `${m.groupName}: ${m.optionName}`)
                    .join(" · ")}
                </span>
              )}
            </span>
            <span className="shrink-0 text-sm text-brand-950 dark:text-brand-50">
              {item.subtotal.toLocaleString("vi-VN")}đ
            </span>
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="text-xs text-brand-500/60 dark:text-brand-300/50">
            +{order.items.length - 3} món khác ...
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-brand-200/50 pt-3 dark:border-stone-800">
        <span className="text-sm text-brand-700/70 dark:text-brand-200/60">
          Tổng: {order.items.reduce((sum, i) => sum + i.quantity, 0)} món
        </span>
        <span className="font-serif text-base text-brand-700 dark:text-brand-300">
          {order.totalAmount.toLocaleString("vi-VN")}đ
        </span>
      </div>

      <div className="mt-2 flex justify-end">
        <span className="text-xs text-brand-400/70 dark:text-brand-300/40">
          Xem chi tiết →
        </span>
      </div>
    </button>
  );
};
```

- [ ] **Step 3: Sửa `OrderCard.tsx` thành wrapper**

Thay toàn bộ nội dung `OrderCard.tsx`:

```tsx
// src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.tsx — chọn biến thể theo orderTheme
"use client";
import { OrderDto } from "@/services/order/order.types";
import { useOrderThemeStore } from "@/stores/orderTheme.store";
import { OrderCardCinematic } from "./OrderCard.Cinematic";
import { OrderCardPlayful } from "./OrderCard.Playful";

export const OrderCard = ({
  order,
  onClick,
}: {
  order: OrderDto;
  onClick: () => void;
}) => {
  const theme = useOrderThemeStore((s) => s.theme);
  return theme === "cinematic" ? (
    <OrderCardCinematic order={order} onClick={onClick} />
  ) : (
    <OrderCardPlayful order={order} onClick={onClick} />
  );
};
```

(`OrderCard.tsx` gốc không có `"use client"` — nay bắt buộc thêm vì đọc
zustand store dùng hook, phải chạy phía client.)

- [ ] **Step 4: Kiểm tra & commit**

Run: `pnpm --dir chalo-fe lint`
Expected: sạch.

```bash
git add "chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.Playful.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.Cinematic.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.tsx"
git commit -m "feat: split order list card into Cinematic/Playful variants"
```

---

### Task 7: Theo dõi đơn (tiến trình phục vụ) — 2 biến thể

**Files:**
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/ServiceStepper.Playful.tsx`
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/ServiceStepper.Cinematic.tsx`
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/page.tsx:16-21,174-229`

Chỉ tách phần "Stepper Phục vụ" (dòng 174-229 hiện tại) — phần còn lại của
trang (banner, chi tiết món, action dock) giữ nguyên như spec đã chốt (chỉ
timeline trạng thái là điểm khác biệt rõ giữa 2 biến thể).

**Interfaces:**
- Consumes: `OrderStatus` (`@/services/order/order.types`).
- Produces prop chung:

```ts
interface ServiceStepperProps {
  steps: { statuses: OrderStatus[]; label: string; emoji: string }[];
  currentStepIndex: number;
  isServed: boolean;
}
```

- [ ] **Step 1: Tạo `ServiceStepper.Playful.tsx`**

Thanh tiến độ ngang kiểu "level" — mốc active nảy nhẹ, hiệu ứng ăn mừng khi
tới bước cuối (dùng lại `ConfettiBurst` từ Task 1):

```tsx
"use client";
// src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/ServiceStepper.Playful.tsx
import { ConfettiBurst } from "@/components/shared/ConfettiBurst";
import { OrderStatus } from "@/services/order/order.types";
import { useEffect, useRef, useState } from "react";

interface ServiceStepperProps {
  steps: { statuses: OrderStatus[]; label: string; emoji: string }[];
  currentStepIndex: number;
  isServed: boolean;
}

export const ServiceStepperPlayful = ({
  steps,
  currentStepIndex,
  isServed,
}: ServiceStepperProps) => {
  const [burstKey, setBurstKey] = useState<number>(0);
  const prevStepRef = useRef<number>(currentStepIndex);

  useEffect(() => {
    if (currentStepIndex > prevStepRef.current && currentStepIndex === steps.length - 1) {
      setBurstKey((k) => k + 1);
    }
    prevStepRef.current = currentStepIndex;
  }, [currentStepIndex, steps.length]);

  return (
    <div className="relative rounded-3xl border-2 border-stone-900 bg-white p-5 shadow-[4px_4px_0_var(--color-stone-900)] dark:border-brand-50 dark:bg-carnival-raised dark:shadow-[4px_4px_0_var(--color-pop-600)]">
      <h2 className="mb-5 text-sm font-black text-stone-900 dark:text-brand-50">
        Tiến trình phục vụ
      </h2>
      <div className="flex items-start justify-between gap-1">
        {steps.map((step, stepIdx) => {
          const isDone = currentStepIndex > stepIdx;
          const isCurrent = currentStepIndex === stepIdx;
          return (
            <div key={step.statuses.join("-")} className="flex flex-1 flex-col items-center gap-2 text-center">
              <div
                className={`flex size-10 items-center justify-center rounded-full border-2 border-stone-900 text-base transition-transform dark:border-brand-50 ${
                  isDone
                    ? "bg-pop-500 text-white"
                    : isCurrent
                      ? "motion-safe:animate-bounce bg-pop-500 text-white"
                      : "bg-stone-100 text-stone-400 dark:bg-carnival dark:text-stone-500"
                }`}
              >
                {isDone ? "✓" : step.emoji}
              </div>
              <p
                className={`text-xs font-bold ${
                  isCurrent
                    ? "text-pop-600 dark:text-pop-400"
                    : isDone
                      ? "text-stone-900 dark:text-brand-50"
                      : "text-stone-400 dark:text-stone-600"
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
      {isServed && <ConfettiBurst triggerKey={burstKey} />}
    </div>
  );
};
```

- [ ] **Step 2: Tạo `ServiceStepper.Cinematic.tsx`**

Timeline dọc tối giản, chấm vàng đồng sáng dần:

```tsx
// src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/ServiceStepper.Cinematic.tsx
import { OrderStatus } from "@/services/order/order.types";

interface ServiceStepperProps {
  steps: { statuses: OrderStatus[]; label: string; emoji: string }[];
  currentStepIndex: number;
  isServed: boolean;
}

export const ServiceStepperCinematic = ({
  steps,
  currentStepIndex,
  isServed,
}: ServiceStepperProps) => {
  return (
    <div className="rounded-3xl bg-white/70 p-5 dark:bg-stone-900/60">
      <h2 className="mb-5 font-serif text-base text-brand-950 dark:text-brand-50">
        Tiến trình phục vụ
      </h2>
      <div className="relative pl-2">
        <div className="absolute bottom-4 left-[1.35rem] top-4 w-px bg-brand-200 dark:bg-stone-800" />
        <div className="space-y-6">
          {steps.map((step, stepIdx) => {
            const isDone = currentStepIndex > stepIdx;
            const isCurrent = currentStepIndex === stepIdx;
            return (
              <div key={step.statuses.join("-")} className="relative flex items-start gap-4">
                <div
                  className={`relative z-10 mt-[-2px] flex size-8 shrink-0 items-center justify-center rounded-full text-sm transition-all duration-500 ${
                    isDone
                      ? "bg-brand-700 text-brand-50 dark:bg-brand-300 dark:text-brand-950"
                      : isCurrent
                        ? "bg-brand-700 text-brand-50 ring-4 ring-brand-200 dark:bg-brand-300 dark:text-brand-950 dark:ring-brand-900/40"
                        : "bg-brand-100 text-brand-400 dark:bg-stone-900 dark:text-stone-600"
                  }`}
                >
                  {isDone ? "✓" : step.emoji}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-serif text-sm ${
                      isCurrent
                        ? "text-brand-700 dark:text-brand-300"
                        : isDone
                          ? "text-brand-950 dark:text-brand-100"
                          : "text-brand-400 dark:text-stone-600"
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && !isServed && (
                    <p className="motion-safe:animate-pulse mt-1 text-xs text-brand-500/80 dark:text-brand-300/70">
                      Đang tiến hành...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Sửa `orders/[orderId]/page.tsx` để dùng ServiceStepper theo theme**

Thêm import ở đầu file:

```tsx
import { useOrderThemeStore } from "@/stores/orderTheme.store";
import { ServiceStepperCinematic } from "./_components/ServiceStepper.Cinematic";
import { ServiceStepperPlayful } from "./_components/ServiceStepper.Playful";
```

Trong hàm component, thêm dòng lấy theme (cạnh `const payOrderMutation = ...`):

```tsx
  const orderTheme = useOrderThemeStore((s) => s.theme);
```

Thay toàn bộ khối "Stepper Phục vụ" (từ `{/* Stepper Phục vụ */}` tới hết
`</div>` đóng khối đó, dòng 174-229 gốc) bằng:

```tsx
          {/* Stepper Phục vụ */}
          {!isCancelled &&
            (orderTheme === "cinematic" ? (
              <ServiceStepperCinematic
                steps={SERVICE_STEPS}
                currentStepIndex={currentStepIndex}
                isServed={isServed}
              />
            ) : (
              <ServiceStepperPlayful
                steps={SERVICE_STEPS}
                currentStepIndex={currentStepIndex}
                isServed={isServed}
              />
            ))}
```

Phần còn lại của file (banner huỷ/hoàn tất, chi tiết món, action dock) không
đổi.

- [ ] **Step 4: Kiểm tra & commit**

Run: `pnpm --dir chalo-fe lint`
Expected: sạch.

```bash
git add "chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/ServiceStepper.Playful.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/ServiceStepper.Cinematic.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/page.tsx"
git commit -m "feat: split order tracking stepper into Cinematic/Playful variants"
```

---

### Task 8: E2E cho công tắc A/B + xác minh trực quan toàn bộ luồng

**Files:**
- Create: `chalo-fe/e2e/customer-order-theme.spec.ts`

**Interfaces:**
- Consumes: mọi route/testid tạo ở Task 1-7 (`order-theme-playful`,
  `order-theme-cinematic`, `product-card-*`, `product-detail-modal-*`,
  `vietqr-code`).

- [ ] **Step 1: Viết `customer-order-theme.spec.ts`**

```ts
// chalo-fe/e2e/customer-order-theme.spec.ts
import { expect, test } from "@playwright/test";

const BE = "http://localhost:8080/api";

async function getFirstFreeTableToken(request: import("@playwright/test").APIRequestContext) {
  const login = await request.post(`${BE}/auth/login`, {
    data: { username: "admin", password: "admin" },
  });
  const adminToken = (await login.json()).data.accessToken;
  const auth = { Authorization: `Bearer ${adminToken}` };
  const tablesRes = await request.get(`${BE}/table/list`, { headers: auth });
  const tables = (await tablesRes.json()).data as Array<{
    qrToken: string;
    status?: string;
  }>;
  return (
    tables.find((table) => table.status !== "OCCUPIED")?.qrToken ??
    tables[0]?.qrToken
  );
}

test("mặc định vào menu là biến thể Rực rỡ", async ({ page, request }) => {
  const tableToken = await getFirstFreeTableToken(request);
  test.skip(!tableToken, "Cần ít nhất 1 bàn");

  await page.goto(`/menu/${tableToken}`);
  const occupiedContinue = page.locator("div.fixed.inset-0.z-50 button").first();
  const occupiedVisible = await occupiedContinue
    .waitFor({ state: "visible", timeout: 1000 })
    .then(() => true)
    .catch(() => false);
  if (occupiedVisible) await occupiedContinue.click();

  await expect(page.getByTestId("order-theme-playful")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByTestId("order-theme-cinematic")).toHaveAttribute(
    "aria-checked",
    "false",
  );
});

test("chuyển sang Điện ảnh và giữ lại sau khi tải lại trang", async ({
  page,
  request,
}) => {
  const tableToken = await getFirstFreeTableToken(request);
  test.skip(!tableToken, "Cần ít nhất 1 bàn");

  await page.goto(`/menu/${tableToken}`);
  const occupiedContinue = page.locator("div.fixed.inset-0.z-50 button").first();
  const occupiedVisible = await occupiedContinue
    .waitFor({ state: "visible", timeout: 1000 })
    .then(() => true)
    .catch(() => false);
  if (occupiedVisible) await occupiedContinue.click();

  await page.getByTestId("order-theme-cinematic").click();
  await expect(page.getByTestId("order-theme-cinematic")).toHaveAttribute(
    "aria-checked",
    "true",
  );

  await page.reload();
  const occupiedAgain = page.locator("div.fixed.inset-0.z-50 button").first();
  const occupiedVisibleAgain = await occupiedAgain
    .waitFor({ state: "visible", timeout: 1000 })
    .then(() => true)
    .catch(() => false);
  if (occupiedVisibleAgain) await occupiedAgain.click();

  await expect(page.getByTestId("order-theme-cinematic")).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("toggle A/B độc lập với toggle Sáng/Tối — cả 4 tổ hợp không lỗi", async ({
  page,
  request,
}) => {
  const tableToken = await getFirstFreeTableToken(request);
  test.skip(!tableToken, "Cần ít nhất 1 bàn");

  await page.goto(`/menu/${tableToken}`);
  const occupiedContinue = page.locator("div.fixed.inset-0.z-50 button").first();
  const occupiedVisible = await occupiedContinue
    .waitFor({ state: "visible", timeout: 1000 })
    .then(() => true)
    .catch(() => false);
  if (occupiedVisible) await occupiedContinue.click();

  for (const orderTheme of ["playful", "cinematic"] as const) {
    await page.getByTestId(`order-theme-${orderTheme}`).click();
    for (const uiTheme of ["light", "dark"] as const) {
      await page.getByTestId("theme-switch").evaluate(
        (el, targetDark) => {
          const isDark = el.getAttribute("aria-checked") === "true";
          if (isDark !== targetDark) el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        },
        uiTheme === "dark",
      );
      await expect(page.getByTestId(`order-theme-${orderTheme}`)).toHaveAttribute(
        "aria-checked",
        "true",
      );
      // không có lỗi console nghiêm trọng khi đổi tổ hợp
      await expect(page.locator("body")).toBeVisible();
    }
  }
});
```

- [ ] **Step 2: Chạy thử bộ e2e liên quan**

Run: `pnpm --dir chalo-fe exec playwright test customer-order-theme customer-product-detail-modal customer-menu-shortcut`
Expected: toàn bộ PASS. Nếu BE chưa chạy, khởi động theo hướng dẫn README của
`chalo-be` trước khi chạy Playwright (Playwright config đã trỏ base URL —
kiểm `playwright.config.ts` nếu cần đổi).

- [ ] **Step 3: Build one-shot để bắt lỗi type/build (không dùng `next dev`)**

Run: `pnpm --dir chalo-fe build`
Expected: build thành công, không lỗi TypeScript ở các file vừa tạo/sửa.

- [ ] **Step 4: Xác minh bằng mắt qua Playwright MCP (bắt buộc theo `verifying-ui-with-playwright`)**

Dựng app qua `.next/standalone` (không dùng `next dev`/`next start` — xem
Global Constraints), mở trình duyệt thật, với từng bàn/QR hợp lệ:

1. Vào `/menu/<tableToken>` — xác nhận mặc định hiện biến thể Rực rỡ (viền
   dày, FAB giỏ hàng nảy).
2. Bấm nút "Điện ảnh" — xác nhận toàn bộ menu chuyển sang ảnh full-bleed +
   serif, chip/nút giỏ hàng đổi màu vàng đồng.
3. Mở modal chi tiết 1 món có mô tả — kiểm ảnh phủ kín đầu modal, nút đóng nổi
   trên ảnh, thêm được vào giỏ.
4. Bật Sáng/Tối ở cả 2 biến thể — xác nhận cả 4 tổ hợp đọc được chữ, không vỡ
   layout (đặc biệt cam-trên-tím-than và vàng đồng-trên-kem).
5. Thêm món vào giỏ (biến thể Rực rỡ) — xác nhận có confetti khi thêm món có
   modifier.
6. Vào giỏ hàng, đặt món, mở theo dõi đơn — xác nhận stepper hiển thị đúng
   theo biến thể đang chọn.
7. Test với `prefers-reduced-motion: reduce` (DevTools → Rendering → Emulate
   CSS media) — xác nhận không còn hiệu ứng nảy/confetti/số nhảy nhưng mọi
   thông tin (badge, trạng thái) vẫn hiển thị đúng.

Nếu bất kỳ bước nào lỗi, quay lại task tương ứng để sửa trước khi báo hoàn
thành — không được báo xong chỉ dựa vào lint/build xanh.

- [ ] **Step 5: Commit**

```bash
git add chalo-fe/e2e/customer-order-theme.spec.ts
git commit -m "test: add e2e coverage for order theme toggle and persistence"
```

---

### Task 9: Theme vỏ 2 trang đơn hàng (danh sách + chi tiết)

**Bổ sung sau final review:** Task 6/7 chỉ theme `OrderCard` và `ServiceStepper`
— phần khung trang (`orders/page.tsx`, `orders/[orderId]/page.tsx`: header,
banner, khối chi tiết món, thanh hành động dưới) vẫn giữ nguyên `bg-stone-50`/
`bg-white` trung tính, gây đứt mạch thị giác khi khách đi từ giỏ hàng/thanh
toán (đã theme) sang xem đơn (chưa theme). Task này theme nốt phần khung còn
lại, theo đúng pattern wrapper mỏng + 2 view trình bày đã dùng ở Task 3-6.

**Files:**
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/OrdersListView.Playful.tsx`
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/OrdersListView.Cinematic.tsx`
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/page.tsx`
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/OrderDetailView.Playful.tsx`
- Create: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/OrderDetailView.Cinematic.tsx`
- Modify: `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/page.tsx`

`OrderCard` (Task 6) và `ServiceStepperPlayful`/`ServiceStepperCinematic`
(Task 7) không đổi — 2 view mới ở task này chỉ bọc quanh chúng.
`PayConfirmModal` (modal xác nhận thanh toán) **giữ nguyên, không theme** —
đây là dialog xác nhận dùng chung, ngoài phạm vi 2 "ngôn ngữ hình ảnh".

**Interfaces:**

```ts
// dùng cho OrdersListView.*
interface OrdersListViewProps {
  orders: OrderDto[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  totalAllItems: number | undefined;
  unpaidOrders: OrderDto[];
  unpaidTotal: number;
  onOrderClick: (orderId: string) => void;
  onGoToMenu: () => void;
  onCheckout: () => void;
}

// dùng cho OrderDetailView.*
interface OrderDetailViewProps {
  order: OrderDto;
  isCancelled: boolean;
  isServed: boolean;
  isPaid: boolean;
  canPay: boolean;
  currentStepIndex: number;
  steps: { statuses: OrderStatus[]; label: string; emoji: string }[];
  onPayClick: () => void;
  onBackToOrders: () => void;
  onBackToMenu: () => void;
}
```

- [ ] **Step 1: Tạo `OrdersListView.Playful.tsx`**

Tạo `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/OrdersListView.Playful.tsx`:

```tsx
"use client";
// src/app/(customer)/menu/[tableToken]/orders/_components/OrdersListView.Playful.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { OrderDto } from "@/services/order/order.types";
import { OrderCard } from "./OrderCard";

interface OrdersListViewProps {
  orders: OrderDto[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  totalAllItems: number | undefined;
  unpaidOrders: OrderDto[];
  unpaidTotal: number;
  onOrderClick: (orderId: string) => void;
  onGoToMenu: () => void;
  onCheckout: () => void;
}

export const OrdersListViewPlayful = ({
  orders,
  isLoading,
  isError,
  onRetry,
  totalAllItems,
  unpaidOrders,
  unpaidTotal,
  onOrderClick,
  onGoToMenu,
  onCheckout,
}: OrdersListViewProps) => {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-carnival">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b-2 border-stone-900 bg-white px-4 py-3 dark:border-brand-50 dark:bg-carnival-raised">
        <button onClick={onGoToMenu} className="text-stone-500 dark:text-stone-400">
          ← Quay lại
        </button>
        <div className="flex-1">
          <h1 className="text-base font-black text-stone-900 dark:text-brand-50">
            Đơn hàng của bàn
          </h1>
          {orders && orders.length > 1 && (
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {orders.length} lần đặt · {totalAllItems} món
            </p>
          )}
        </div>
      </header>

      <main className="space-y-4 p-4 pb-32">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon className="size-8 animate-spin text-pop-500" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-stone-400 dark:text-stone-500">
            <p className="text-sm font-bold text-stone-600 dark:text-stone-400">
              Không tải được danh sách đơn
            </p>
            <button
              onClick={onRetry}
              className="rounded-full border-2 border-stone-900 bg-pop-500 px-6 py-2.5 text-sm font-bold text-white dark:border-brand-50"
            >
              Thử lại
            </button>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-stone-400 dark:text-stone-500">
            <div className="flex size-20 items-center justify-center rounded-full border-2 border-stone-900 bg-white dark:border-brand-50 dark:bg-carnival-raised">
              <span className="text-4xl">📋</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-stone-600 dark:text-stone-400">
                Chưa có đơn hàng nào
              </p>
              <p className="mt-1 text-xs text-stone-400 dark:text-stone-600">
                Hãy chọn món từ thực đơn để bắt đầu
              </p>
            </div>
            <button
              onClick={onGoToMenu}
              className="rounded-full border-2 border-stone-900 bg-pop-500 px-6 py-2.5 text-sm font-bold text-white dark:border-brand-50"
            >
              Xem thực đơn
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {orders.map((o) => (
                <OrderCard key={o.id} order={o} onClick={() => onOrderClick(o.id)} />
              ))}
            </div>

            {orders.length > 1 && (
              <div className="space-y-2 rounded-2xl border-2 border-stone-900 bg-white p-4 dark:border-brand-50 dark:bg-carnival-raised">
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                  Tổng kết
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500 dark:text-stone-400">
                    Tổng tất cả ({orders.length} đơn)
                  </span>
                  <span className="font-bold text-stone-900 dark:text-brand-50">
                    {orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString("vi-VN")}đ
                  </span>
                </div>
                {orders.some((o) => o.paidStatus) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400">
                      Đã thanh toán {orders.filter((o) => o.paidStatus).length} đơn
                    </span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      - {orders.filter((o) => o.paidStatus).reduce((s, o) => s + o.totalAmount, 0).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-stone-900 pt-2 dark:border-brand-50">
                  <span className="text-sm font-bold text-stone-900 dark:text-brand-50">
                    Còn cần thanh toán
                  </span>
                  <span className="text-base font-black text-pop-600 dark:text-pop-400">
                    {unpaidTotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 space-y-2.5 border-t-2 border-stone-900 bg-white px-4 py-4 dark:border-brand-50 dark:bg-carnival-raised">
        {unpaidOrders.length > 0 && (
          <button
            onClick={onCheckout}
            className="w-full rounded-2xl border-2 border-stone-900 bg-green-500 py-3.5 text-base font-bold text-white shadow-[3px_3px_0_var(--color-stone-900)] dark:border-brand-50"
          >
            Thanh toán tất cả · {unpaidTotal.toLocaleString("vi-VN")}đ
          </button>
        )}
        <button
          onClick={onGoToMenu}
          className="w-full rounded-2xl border-2 border-stone-900 bg-pop-500 py-3 text-sm font-bold text-white dark:border-brand-50"
        >
          ☕ Đặt thêm món
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Tạo `OrdersListView.Cinematic.tsx`**

Tạo file cùng thư mục, cùng props/nhánh như Step 1, đổi sang bảng Điện ảnh
(`brand-*`/`stone-950`, `font-serif`, không viền dày/đổ bóng cứng):

```tsx
"use client";
// src/app/(customer)/menu/[tableToken]/orders/_components/OrdersListView.Cinematic.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { OrderDto } from "@/services/order/order.types";
import { OrderCard } from "./OrderCard";

interface OrdersListViewProps {
  orders: OrderDto[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  totalAllItems: number | undefined;
  unpaidOrders: OrderDto[];
  unpaidTotal: number;
  onOrderClick: (orderId: string) => void;
  onGoToMenu: () => void;
  onCheckout: () => void;
}

export const OrdersListViewCinematic = ({
  orders,
  isLoading,
  isError,
  onRetry,
  totalAllItems,
  unpaidOrders,
  unpaidTotal,
  onOrderClick,
  onGoToMenu,
  onCheckout,
}: OrdersListViewProps) => {
  return (
    <div className="min-h-screen bg-brand-50 dark:bg-stone-950">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-brand-200/60 bg-brand-50/90 px-4 py-3 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/90">
        <button onClick={onGoToMenu} className="text-brand-700/70 dark:text-brand-200/70">
          ← Quay lại
        </button>
        <div className="flex-1">
          <h1 className="font-serif text-base text-brand-950 dark:text-brand-50">
            Đơn hàng của bàn
          </h1>
          {orders && orders.length > 1 && (
            <p className="text-xs text-brand-500/70 dark:text-brand-300/50">
              {orders.length} lần đặt · {totalAllItems} món
            </p>
          )}
        </div>
      </header>

      <main className="space-y-4 p-4 pb-32">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon className="size-8 animate-spin text-brand-400" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-brand-700/60 dark:text-brand-200/50">
            <p className="text-sm text-brand-700/80 dark:text-brand-200/70">
              Không tải được danh sách đơn
            </p>
            <button
              onClick={onRetry}
              className="rounded-full bg-brand-700 px-6 py-2.5 text-sm font-medium text-brand-50 dark:bg-brand-300 dark:text-brand-950"
            >
              Thử lại
            </button>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-brand-700/60 dark:text-brand-200/50">
            <div className="flex size-20 items-center justify-center rounded-full bg-brand-100 dark:bg-stone-900">
              <span className="text-4xl">📋</span>
            </div>
            <div className="text-center">
              <p className="text-sm text-brand-700/80 dark:text-brand-200/70">
                Chưa có đơn hàng nào
              </p>
              <p className="mt-1 text-xs text-brand-500/60 dark:text-brand-300/40">
                Hãy chọn món từ thực đơn để bắt đầu
              </p>
            </div>
            <button
              onClick={onGoToMenu}
              className="rounded-full bg-brand-700 px-6 py-2.5 text-sm font-medium text-brand-50 dark:bg-brand-300 dark:text-brand-950"
            >
              Xem thực đơn
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {orders.map((o) => (
                <OrderCard key={o.id} order={o} onClick={() => onOrderClick(o.id)} />
              ))}
            </div>

            {orders.length > 1 && (
              <div className="space-y-2 rounded-2xl bg-white/60 p-4 dark:bg-stone-900/60">
                <p className="text-sm text-brand-800 dark:text-brand-200">Tổng kết</p>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-600/70 dark:text-brand-300/60">
                    Tổng tất cả ({orders.length} đơn)
                  </span>
                  <span className="text-brand-950 dark:text-brand-50">
                    {orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString("vi-VN")}đ
                  </span>
                </div>
                {orders.some((o) => o.paidStatus) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400">
                      Đã thanh toán {orders.filter((o) => o.paidStatus).length} đơn
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      - {orders.filter((o) => o.paidStatus).reduce((s, o) => s + o.totalAmount, 0).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-brand-200/60 pt-2 dark:border-stone-800">
                  <span className="text-sm text-brand-950 dark:text-brand-50">
                    Còn cần thanh toán
                  </span>
                  <span className="font-serif text-base text-brand-700 dark:text-brand-300">
                    {unpaidTotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 space-y-2.5 border-t border-brand-200/60 bg-brand-50/95 px-4 py-4 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/95">
        {unpaidOrders.length > 0 && (
          <button
            onClick={onCheckout}
            className="w-full rounded-2xl bg-green-700 py-3.5 text-base font-semibold text-brand-50 dark:bg-green-500"
          >
            Thanh toán tất cả · {unpaidTotal.toLocaleString("vi-VN")}đ
          </button>
        )}
        <button
          onClick={onGoToMenu}
          className="w-full rounded-2xl bg-brand-700 py-3 text-sm font-semibold text-brand-50 dark:bg-brand-300 dark:text-brand-950"
        >
          ☕ Đặt thêm món
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Sửa `orders/page.tsx` để chọn view theo theme**

Giữ nguyên toàn bộ logic đầu hàm (`useGetOrderByToken`, `useCustomerOrderEvents`,
tính `unpaidOrders`/`unpaidTotal`/`totalAllItems`), thay import + phần
`return`:

```tsx
"use client";
import { useCustomerOrderEvents } from "@/hooks/useCustomerOrderEvents";
import { useGetOrderByToken } from "@/services/order/order.queries";
import { useOrderThemeStore } from "@/stores/orderTheme.store";
import { useParams, useRouter } from "next/navigation";
import { OrdersListViewCinematic } from "./_components/OrdersListView.Cinematic";
import { OrdersListViewPlayful } from "./_components/OrdersListView.Playful";

export default function OrdersPage() {
  const { tableToken } = useParams<{ tableToken: string }>();
  const router = useRouter();

  const {
    data: orders,
    isLoading,
    isError,
    refetch,
  } = useGetOrderByToken(tableToken);
  useCustomerOrderEvents(tableToken);
  const orderTheme = useOrderThemeStore((s) => s.theme);

  const unpaidOrders = orders?.filter((o) => !o.paidStatus) ?? [];
  const unpaidTotal = unpaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalAllItems = orders
    ?.flatMap((o) => o.items)
    .reduce((sum, i) => sum + i.quantity, 0);

  const viewProps = {
    orders,
    isLoading,
    isError,
    onRetry: () => refetch(),
    totalAllItems,
    unpaidOrders,
    unpaidTotal,
    onOrderClick: (orderId: string) => router.push(`/menu/${tableToken}/orders/${orderId}`),
    onGoToMenu: () => router.push(`/menu/${tableToken}`),
    onCheckout: () => router.push(`/menu/${tableToken}/checkout`),
  };

  return orderTheme === "cinematic" ? (
    <OrdersListViewCinematic {...viewProps} />
  ) : (
    <OrdersListViewPlayful {...viewProps} />
  );
}
```

- [ ] **Step 4: Tạo `OrderDetailView.Playful.tsx`**

Tạo `chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/OrderDetailView.Playful.tsx`:

```tsx
"use client";
// src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/OrderDetailView.Playful.tsx
import { OrderDto, OrderStatus } from "@/services/order/order.types";
import { ServiceStepperPlayful } from "./ServiceStepper.Playful";

interface OrderDetailViewProps {
  order: OrderDto;
  isCancelled: boolean;
  isServed: boolean;
  isPaid: boolean;
  canPay: boolean;
  currentStepIndex: number;
  steps: { statuses: OrderStatus[]; label: string; emoji: string }[];
  onPayClick: () => void;
  onBackToOrders: () => void;
  onBackToMenu: () => void;
}

export const OrderDetailViewPlayful = ({
  order,
  isCancelled,
  isServed,
  isPaid,
  canPay,
  currentStepIndex,
  steps,
  onPayClick,
  onBackToOrders,
  onBackToMenu,
}: OrderDetailViewProps) => {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-carnival">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b-2 border-stone-900 bg-white px-4 py-3 dark:border-brand-50 dark:bg-carnival-raised">
        <button onClick={onBackToOrders} className="shrink-0 text-stone-500 dark:text-stone-400">
          ← Quay lại
        </button>
        <div className="flex-1 overflow-hidden">
          <h1 className="truncate text-base font-black text-stone-900 dark:text-brand-50">
            Chi tiết đơn
          </h1>
          <p className="font-mono text-xs text-stone-400 dark:text-stone-500">
            #{order.id.slice(-6).toUpperCase()} · {order.tableName}
          </p>
        </div>
        <div className="shrink-0">
          {isPaid ? (
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-stone-900 bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-700 dark:border-brand-50 dark:bg-green-900/30 dark:text-green-400 sm:text-xs">
              ✓ Đã thanh toán
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-stone-900 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600 dark:border-brand-50 dark:bg-red-900/20 dark:text-red-400 sm:text-xs">
              Chưa thanh toán
            </span>
          )}
        </div>
      </header>

      <main className="space-y-5 p-4 pb-52">
        {isCancelled && (
          <div className="flex flex-col items-center rounded-2xl border-2 border-red-600 bg-red-50 p-5 text-center dark:bg-red-900/10">
            <span className="mb-2 text-3xl">❌</span>
            <p className="text-base font-bold text-red-700 dark:text-red-400">
              Đơn hàng đã bị huỷ
            </p>
            <p className="mt-1 text-sm text-red-600/80 dark:text-red-400/80">
              Vui lòng liên hệ nhân viên nếu có thắc mắc.
            </p>
          </div>
        )}

        {isPaid && isServed && !isCancelled && (
          <div className="flex items-center gap-4 rounded-2xl border-2 border-stone-900 bg-green-50 p-5 dark:border-brand-50 dark:bg-green-900/10">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-2xl dark:bg-green-800/50">
              🎉
            </div>
            <div>
              <p className="text-base font-bold text-green-800 dark:text-green-400">
                Hoàn tất tuyệt vời!
              </p>
              <p className="mt-0.5 text-sm text-green-600 dark:text-green-500/80">
                Cảm ơn bạn đã thưởng thức tại quán.
              </p>
            </div>
          </div>
        )}

        {order.estimateWaitMinutes !== null && order.estimateWaitMinutes > 0 && !isServed && !isCancelled && (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-stone-900 bg-pop-400/20 p-4 dark:border-brand-50">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-lg dark:bg-carnival-raised">
              ⏱️
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-pop-600 dark:text-pop-400">
                Thời gian chờ dự kiến
              </p>
              <p className="text-lg font-black text-stone-900 dark:text-brand-50">
                Khoảng {order.estimateWaitMinutes} phút
              </p>
            </div>
          </div>
        )}

        {!isCancelled && (
          <ServiceStepperPlayful steps={steps} currentStepIndex={currentStepIndex} isServed={isServed} />
        )}

        <div className="rounded-3xl border-2 border-stone-900 bg-white p-5 dark:border-brand-50 dark:bg-carnival-raised">
          <h2 className="mb-4 text-sm font-black text-stone-900 dark:text-brand-50">
            Chi tiết món ({order.items.reduce((s, i) => s + i.quantity, 0)} món)
          </h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-stone-900 bg-stone-50 text-2xl dark:border-brand-50 dark:bg-carnival">
                  {item.productImageUrl ? (
                    <img src={item.productImageUrl} alt={item.productName} className="size-full object-cover" />
                  ) : (
                    "☕"
                  )}
                </div>
                <div className="flex min-w-0 flex-1 justify-between">
                  <div className="pr-2">
                    <p className="truncate text-sm font-bold text-stone-900 dark:text-brand-50">
                      {item.productName}
                    </p>
                    {(item.selectedModifiers?.length ?? 0) > 0 && (
                      <p className="mt-1 text-xs text-pop-600 dark:text-pop-400">
                        {item.selectedModifiers!.map((m) => `${m.groupName}: ${m.optionName}`).join(" · ")}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                      {item.price.toLocaleString("vi-VN")}đ <span className="mx-1">×</span> {item.quantity}
                    </p>
                    {item.note && (
                      <p className="mt-1 inline-block max-w-full truncate rounded bg-pop-400/20 px-2 py-0.5 text-xs text-pop-600 dark:text-pop-400">
                        📝 {item.note}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-bold text-stone-900 dark:text-brand-50">
                    {item.subtotal.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t-2 border-dashed border-stone-300 pt-4 dark:border-stone-700">
            <span className="text-sm font-bold text-stone-500 dark:text-stone-400">Tổng cộng</span>
            <span className="text-xl font-black text-pop-600 dark:text-pop-400">
              {order.totalAmount.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>

        {order.note && (
          <div className="rounded-2xl border-2 border-sky-300 bg-sky-50/50 p-4 dark:border-sky-800 dark:bg-sky-900/10">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-base">📌</span>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-500">
                Ghi chú cho quán
              </p>
            </div>
            <p className="pl-6 text-sm text-stone-700 dark:text-stone-300">{order.note}</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 space-y-3 border-t-2 border-stone-900 bg-white px-4 py-4 dark:border-brand-50 dark:bg-carnival-raised">
        {canPay && (
          <button
            onClick={onPayClick}
            className="w-full rounded-2xl border-2 border-stone-900 bg-green-500 py-4 text-base font-black text-white shadow-[3px_4px_0_var(--color-stone-900)] dark:border-brand-50"
          >
            Thanh toán · {order.totalAmount.toLocaleString("vi-VN")}đ
          </button>
        )}
        <div className="flex gap-3">
          <button
            onClick={onBackToOrders}
            className="flex-1 rounded-2xl border-2 border-stone-900 bg-white py-3.5 text-sm font-bold text-stone-700 dark:border-brand-50 dark:bg-carnival-raised dark:text-brand-100"
          >
            Tất cả đơn
          </button>
          <button
            onClick={onBackToMenu}
            className="flex-1 rounded-2xl border-2 border-stone-900 bg-pop-500 py-3.5 text-sm font-black text-white dark:border-brand-50"
          >
            ☕ Đặt thêm
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Tạo `OrderDetailView.Cinematic.tsx`**

Tạo file cùng thư mục, cùng props/nhánh như Step 4, bảng màu Điện ảnh:

```tsx
"use client";
// src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/OrderDetailView.Cinematic.tsx
import { OrderDto, OrderStatus } from "@/services/order/order.types";
import { ServiceStepperCinematic } from "./ServiceStepper.Cinematic";

interface OrderDetailViewProps {
  order: OrderDto;
  isCancelled: boolean;
  isServed: boolean;
  isPaid: boolean;
  canPay: boolean;
  currentStepIndex: number;
  steps: { statuses: OrderStatus[]; label: string; emoji: string }[];
  onPayClick: () => void;
  onBackToOrders: () => void;
  onBackToMenu: () => void;
}

export const OrderDetailViewCinematic = ({
  order,
  isCancelled,
  isServed,
  isPaid,
  canPay,
  currentStepIndex,
  steps,
  onPayClick,
  onBackToOrders,
  onBackToMenu,
}: OrderDetailViewProps) => {
  return (
    <div className="min-h-screen bg-brand-50 dark:bg-stone-950">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-brand-200/60 bg-brand-50/90 px-4 py-3 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/90">
        <button onClick={onBackToOrders} className="shrink-0 text-brand-700/70 dark:text-brand-200/70">
          ← Quay lại
        </button>
        <div className="flex-1 overflow-hidden">
          <h1 className="truncate font-serif text-base text-brand-950 dark:text-brand-50">
            Chi tiết đơn
          </h1>
          <p className="font-mono text-xs text-brand-500/70 dark:text-brand-300/50">
            #{order.id.slice(-6).toUpperCase()} · {order.tableName}
          </p>
        </div>
        <div className="shrink-0">
          {isPaid ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400 sm:text-xs">
              ✓ Đã thanh toán
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400 sm:text-xs">
              Chưa thanh toán
            </span>
          )}
        </div>
      </header>

      <main className="space-y-5 p-4 pb-52">
        {isCancelled && (
          <div className="flex flex-col items-center rounded-2xl bg-red-50 p-5 text-center dark:bg-red-900/10">
            <span className="mb-2 text-3xl">❌</span>
            <p className="text-base font-bold text-red-700 dark:text-red-400">
              Đơn hàng đã bị huỷ
            </p>
            <p className="mt-1 text-sm text-red-600/80 dark:text-red-400/80">
              Vui lòng liên hệ nhân viên nếu có thắc mắc.
            </p>
          </div>
        )}

        {isPaid && isServed && !isCancelled && (
          <div className="flex items-center gap-4 rounded-2xl bg-green-50 p-5 dark:bg-green-900/10">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-2xl dark:bg-green-800/50">
              🎉
            </div>
            <div>
              <p className="text-base font-serif text-green-800 dark:text-green-400">
                Hoàn tất tuyệt vời!
              </p>
              <p className="mt-0.5 text-sm text-green-600 dark:text-green-500/80">
                Cảm ơn bạn đã thưởng thức tại quán.
              </p>
            </div>
          </div>
        )}

        {order.estimateWaitMinutes !== null && order.estimateWaitMinutes > 0 && !isServed && !isCancelled && (
          <div className="flex items-center gap-3 rounded-2xl bg-brand-100/60 p-4 dark:bg-stone-900">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-lg dark:bg-brand-900/50">
              ⏱️
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-brand-600/70 dark:text-brand-300/60">
                Thời gian chờ dự kiến
              </p>
              <p className="text-lg font-serif text-brand-800 dark:text-brand-300">
                Khoảng {order.estimateWaitMinutes} phút
              </p>
            </div>
          </div>
        )}

        {!isCancelled && (
          <ServiceStepperCinematic steps={steps} currentStepIndex={currentStepIndex} isServed={isServed} />
        )}

        <div className="rounded-3xl bg-white/70 p-5 dark:bg-stone-900/60">
          <h2 className="mb-4 font-serif text-sm text-brand-950 dark:text-brand-50">
            Chi tiết món ({order.items.reduce((s, i) => s + i.quantity, 0)} món)
          </h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl dark:bg-stone-900">
                  {item.productImageUrl ? (
                    <img src={item.productImageUrl} alt={item.productName} className="size-full object-cover" />
                  ) : (
                    "☕"
                  )}
                </div>
                <div className="flex min-w-0 flex-1 justify-between">
                  <div className="pr-2">
                    <p className="truncate text-sm text-brand-950 dark:text-brand-100">
                      {item.productName}
                    </p>
                    {(item.selectedModifiers?.length ?? 0) > 0 && (
                      <p className="mt-1 text-xs text-brand-600 dark:text-brand-300">
                        {item.selectedModifiers!.map((m) => `${m.groupName}: ${m.optionName}`).join(" · ")}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-brand-600/70 dark:text-brand-300/60">
                      {item.price.toLocaleString("vi-VN")}đ <span className="mx-1">×</span> {item.quantity}
                    </p>
                    {item.note && (
                      <p className="mt-1 inline-block max-w-full truncate rounded bg-brand-100/60 px-2 py-0.5 text-xs text-brand-700 dark:bg-stone-800 dark:text-brand-300">
                        📝 {item.note}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm text-brand-950 dark:text-brand-50">
                    {item.subtotal.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-dashed border-brand-200 pt-4 dark:border-stone-800">
            <span className="text-sm text-brand-600/70 dark:text-brand-300/60">Tổng cộng</span>
            <span className="font-serif text-xl text-brand-700 dark:text-brand-300">
              {order.totalAmount.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>

        {order.note && (
          <div className="rounded-2xl bg-sky-50/50 p-4 dark:bg-sky-900/10">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-base">📌</span>
              <p className="text-xs uppercase tracking-wider text-sky-800 dark:text-sky-500">
                Ghi chú cho quán
              </p>
            </div>
            <p className="pl-6 text-sm text-brand-800 dark:text-brand-200">{order.note}</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 space-y-3 border-t border-brand-200/60 bg-brand-50/95 px-4 py-4 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/95">
        {canPay && (
          <button
            onClick={onPayClick}
            className="w-full rounded-full bg-green-700 py-4 text-base font-semibold text-brand-50 dark:bg-green-500"
          >
            Thanh toán · {order.totalAmount.toLocaleString("vi-VN")}đ
          </button>
        )}
        <div className="flex gap-3">
          <button
            onClick={onBackToOrders}
            className="flex-1 rounded-2xl border border-brand-200 bg-brand-50/60 py-3.5 text-sm text-brand-700 dark:border-stone-700 dark:bg-stone-900/60 dark:text-brand-300"
          >
            Tất cả đơn
          </button>
          <button
            onClick={onBackToMenu}
            className="flex-1 rounded-2xl bg-brand-700 py-3.5 text-sm font-semibold text-brand-50 dark:bg-brand-300 dark:text-brand-950"
          >
            ☕ Đặt thêm
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 6: Sửa `orders/[orderId]/page.tsx` để chọn view theo theme**

Giữ nguyên `SERVICE_STEPS`, toàn bộ hook đầu hàm (`useGetOrderByToken`,
`useCustomerOrderEvents`, `usePayOrder`, `showPayConfirm` state,
`handlePay`), và `PayConfirmModal` (không theme, giữ nguyên cách gọi hiện
tại). Thêm import view + store, thay phần `return` (giữ `PayConfirmModal`
render riêng, không đưa vào view):

```tsx
import { useOrderThemeStore } from "@/stores/orderTheme.store";
import { OrderDetailViewCinematic } from "./_components/OrderDetailView.Cinematic";
import { OrderDetailViewPlayful } from "./_components/OrderDetailView.Playful";
// ... giữ nguyên các import khác đã có (SpinnerIcon, useCustomerOrderEvents, ...)
```

```tsx
  const orderTheme = useOrderThemeStore((s) => s.theme);
  // ... giữ nguyên isCancelled/isServed/isPaid/currentStepIndex/canPay/handlePay đã có

  const viewProps = {
    order,
    isCancelled,
    isServed,
    isPaid,
    canPay,
    currentStepIndex,
    steps: SERVICE_STEPS,
    onPayClick: () => setShowPayConfirm(true),
    onBackToOrders: () => router.push(`/menu/${tableToken}/orders`),
    onBackToMenu: () => router.push(`/menu/${tableToken}`),
  };

  return (
    <>
      {showPayConfirm && (
        <PayConfirmModal
          isPending={payOrderMutation.isPending}
          onCancel={() => setShowPayConfirm(false)}
          onConfirm={handlePay}
          total={order.totalAmount}
          addInfo={`CHALO ${order.tableName ?? ""} DON ${order.id.slice(-6)}`}
        />
      )}
      {orderTheme === "cinematic" ? (
        <OrderDetailViewCinematic {...viewProps} />
      ) : (
        <OrderDetailViewPlayful {...viewProps} />
      )}
    </>
  );
}
```

Các nhánh sớm của hàm (`isLoading` → spinner, `!order` → "Đơn không còn hoạt
động") giữ nguyên JSX trung tính như hiện tại — không cần theme vì đây là
trạng thái tạm/chuyển tiếp, không phải nội dung chính của trang.

- [ ] **Step 7: Kiểm tra & commit**

Run: `pnpm --dir chalo-fe lint`
Expected: sạch.

```bash
git add "chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/OrdersListView.Playful.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/orders/_components/OrdersListView.Cinematic.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/orders/page.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/OrderDetailView.Playful.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/OrderDetailView.Cinematic.tsx" \
  "chalo-fe/src/app/(customer)/menu/[tableToken]/orders/[orderId]/page.tsx"
git commit -m "feat: theme orders list and order detail page shells"
```

---

## Self-Review

**1. Spec coverage:**
- Kiến trúc & cơ chế chuyển đổi (2 công tắc độc lập, lưu theo thiết bị, tách
  file theo biến thể) → Task 1, 2 (wrapper), 3 (đặt công tắc).
- Bảng màu 4 tổ hợp → Task 1 (token) + áp dụng xuyên suốt Task 2-7 qua
  `dark:` class trong từng biến thể.
- Hành vi Menu chính → Task 3. Chi tiết món → Task 2. Giỏ hàng/thanh toán →
  Task 4, 5. Theo dõi đơn (danh sách + timeline) → Task 6, 7.
- Chuyển động & khả năng tiếp cận → `motion-safe:`/`motion-reduce:` rải trong
  Task 1, 3, 4, 7; xác minh cuối ở Task 8 Step 4.
- Kiểm thử → Task 8.
- Rủi ro inotify/build → nhắc trong Global Constraints và Task 8 Step 3-4.

**2. Placeholder scan:** không còn "TBD"/"tương tự Task N" — mọi step đều có
code đầy đủ để dán vào file tương ứng.

**3. Type consistency:** `AddToCartHandler` định nghĩa 1 lần ở
`useProductCardState.ts` (Task 2), dùng lại nguyên tên ở `ProductCard.tsx`
wrapper — không đổi tên giữa các task. `CustomerMenuViewProps` định nghĩa 1
lần ở `CustomerMenuView.types.ts` (Task 3), dùng lại ở cả 2 view. `CartItem`,
`OrderDto`, `OrderStatus`, `CheckoutSessionResult` đều import thẳng từ
`order.types.ts` có sẵn, không định nghĩa lại.

## Kết quả

_(Điền sau khi hoàn thành toàn bộ task — xem hướng dẫn ghi summary trong
CLAUDE.md dự án.)_
