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
            className="mt-2 rounded-full border-2 border-stone-900 bg-pop-500 px-6 py-2.5 text-sm font-bold text-stone-950 shadow-[3px_3px_0_var(--color-stone-900)] dark:border-brand-50 dark:shadow-[3px_3px_0_var(--color-pop-600)]"
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
                    <p className="mt-1 text-sm font-bold text-pop-700 dark:text-pop-400">
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-stone-900 bg-pop-500 py-3.5 text-base font-bold text-stone-950 shadow-[3px_3px_0_var(--color-stone-900)] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60 dark:border-brand-50 dark:shadow-[3px_3px_0_var(--color-pop-600)]"
        >
          {isSubmitting && <SpinnerIcon className="size-5 animate-spin" />}
          {isSubmitting ? "Đang gửi đơn..." : "Xác nhận đặt món"}
        </button>
      </div>
    </div>
  );
};
