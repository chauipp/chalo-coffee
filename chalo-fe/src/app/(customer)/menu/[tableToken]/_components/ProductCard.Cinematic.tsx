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
