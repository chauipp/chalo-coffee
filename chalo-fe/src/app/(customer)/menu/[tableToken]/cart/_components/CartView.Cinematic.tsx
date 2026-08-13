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
      <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950">
        <header className="flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
          <button onClick={onBack} className="text-stone-600 dark:text-stone-300">
            ← Quay lại
          </button>
          <h1 className="text-base font-semibold text-stone-900 dark:text-stone-50">
            Giỏ hàng
          </h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-stone-600 dark:text-stone-400">
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
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-stone-200 bg-stone-50/90 px-4 py-3 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/90">
        <button onClick={onBack} className="text-stone-600 dark:text-stone-300">
          ← Quay lại
        </button>
        <h1 className="flex-1 text-base font-semibold text-stone-900 dark:text-stone-50">
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
            <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-50">
                  {item.productName}
                </p>
                <span className="shrink-0 text-sm text-brand-700 dark:text-brand-300">
                  {item.price.toLocaleString("vi-VN")}đ
                </span>
              </div>
              {(item.selectedModifiers?.length ?? 0) > 0 && (
                <p className="mt-1 text-xs text-brand-600 dark:text-brand-300/70">
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
                  className="ml-auto text-xs text-brand-500 underline-offset-2 hover:underline dark:text-brand-300/60"
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
          <span className="text-base text-brand-700 dark:text-brand-200/70">
            Tổng cộng
          </span>
          <span className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
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
