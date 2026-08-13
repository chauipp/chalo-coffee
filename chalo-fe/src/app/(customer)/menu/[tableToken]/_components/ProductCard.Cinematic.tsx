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
        className={`relative flex min-h-36 items-center gap-4 overflow-hidden rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition-opacity dark:border-stone-700 dark:bg-stone-900 ${
          s.isUnavailable ? "opacity-50" : ""
        }`}
      >
        {s.showImage && (
          <img
            src={product.imageUrl!}
            alt={product.name}
            loading="lazy"
            onError={() => s.setImgError(true)}
            className="size-28 shrink-0 rounded-xl object-cover"
          />
        )}
        <button
          type="button"
          onClick={s.openDetail}
          aria-label={`Xem chi tiết ${product.name}`}
          className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-inset"
        />

        {!s.showImage && <div className="flex size-28 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">CH</div>}
        <div className="relative flex min-w-0 flex-1 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-stone-900 dark:text-stone-50">
              {product.name}
            </p>
            <p className="mt-1 text-sm font-medium text-brand-700 dark:text-brand-300">
              {product.price.toLocaleString("vi-VN")}đ
            </p>
          </div>
          {!s.isUnavailable && s.hasModifiers && (
            <button
              type="button"
              aria-label={`Chọn tuỳ chọn ${product.name}`}
              onClick={(e) => {
                e.stopPropagation();
                s.openDetail();
              }}
              className="relative z-10 shrink-0 rounded-xl bg-brand-700 px-3 py-2 text-xs font-semibold text-brand-50 transition-transform active:scale-95 dark:bg-brand-300 dark:text-brand-950"
            >
              Tuỳ chọn
            </button>
          )}
          {!s.isUnavailable && !s.hasModifiers && (
            <div className="relative z-10 flex shrink-0 flex-col items-end gap-2">
              <div className="inline-flex items-center rounded-xl border border-stone-200 bg-stone-50 p-0.5 dark:border-stone-700 dark:bg-stone-800">
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  onClick={(e) => {
                    e.stopPropagation();
                    s.setQuantity((q) => q - 1);
                  }}
                  disabled={s.quantity <= 1}
                  className="flex size-8 items-center justify-center rounded-lg text-base font-semibold text-stone-600 hover:bg-white disabled:opacity-30 dark:text-stone-300 dark:hover:bg-stone-700"
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-semibold text-stone-900 dark:text-stone-50">
                  {s.quantity}
                </span>
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  onClick={(e) => {
                    e.stopPropagation();
                    s.setQuantity((q) => q + 1);
                  }}
                  disabled={s.quantity >= s.MAX_ITEM_QUANTITY}
                  className="flex size-8 items-center justify-center rounded-lg text-base font-semibold text-stone-600 hover:bg-white disabled:opacity-30 dark:text-stone-300 dark:hover:bg-stone-700"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                aria-label={`Thêm ${s.quantity} ${product.name} vào giỏ`}
                onClick={(e) => {
                  e.stopPropagation();
                  s.quickAdd();
                }}
                className="rounded-xl bg-brand-700 px-3 py-2 text-xs font-semibold text-brand-50 transition-transform active:scale-95 dark:bg-brand-300 dark:text-brand-950"
              >
                Thêm
              </button>
            </div>
          )}
        </div>

        {s.isUnavailable && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-stone-950/70">
            <span className="rounded-full bg-stone-900 px-2 py-0.5 text-xs font-semibold text-white dark:bg-stone-50 dark:text-stone-900">
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
            className="relative h-56 shrink-0 overflow-hidden bg-stone-100 dark:bg-stone-800"
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
            <button
              type="button"
              aria-label="Đóng"
              onClick={() => s.setDetailOpen(false)}
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm dark:bg-stone-900/90 dark:text-stone-200"
            >
              ✕
            </button>
            <h2 className="absolute bottom-4 left-4 right-4 text-xl font-semibold text-stone-900 dark:text-stone-50">
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

          <div className="border-t border-stone-100 px-5 pb-5 pt-4 dark:border-stone-700">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-lg font-semibold text-brand-700 dark:text-brand-300">
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
