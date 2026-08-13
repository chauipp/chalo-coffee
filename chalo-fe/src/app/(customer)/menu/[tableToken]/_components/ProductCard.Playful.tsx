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
