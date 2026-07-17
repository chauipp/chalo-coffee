import { Modal } from "@/components/shared/ui/Modal";
import { ProductDto } from "@/services/menu";
import { MAX_ITEM_QUANTITY } from "@/stores/cart.store";
import { useState } from "react";

interface ProductCardProps {
  product: ProductDto;
  onAddToCart: (quantity: number, note?: string) => void;
}

const stepperButtonClass =
  "flex size-8 items-center justify-center rounded-full border border-gray-200 text-base text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-30 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800";

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [detailQuantity, setDetailQuantity] = useState<number>(1);
  const [detailNote, setDetailNote] = useState<string>("");
  const [imgError, setImgError] = useState<boolean>(false);
  const isUnavailable = product.status !== "AVAILABLE" || !product.isActive;
  const showImage = !!product.imageUrl && !imgError;

  const openDetail = () => {
    setDetailQuantity(1);
    setDetailNote("");
    setDetailOpen(true);
  };

  const handleDetailAdd = () => {
    onAddToCart(detailQuantity, detailNote.trim() || undefined);
    setDetailQuantity(1);
    setDetailNote("");
    setDetailOpen(false);
  };

  return (
    <>
      <div
        data-testid={`product-card-${product.id}`}
        className={`flex min-h-32 gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-opacity dark:border-gray-800 dark:bg-gray-900 sm:gap-4 sm:p-4 ${
          isUnavailable ? "opacity-50" : ""
        }`}
      >
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={openDetail}
            aria-label={`Xem chi tiết ${product.name}`}
            className="block rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            {showImage ? (
              <img
                src={product.imageUrl!}
                alt={product.name}
                loading="lazy"
                onError={() => setImgError(true)}
                className="size-24 rounded-xl object-cover sm:size-28"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-200 sm:size-28">
                CH
              </div>
            )}
          </button>
          {isUnavailable && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-white/70 dark:bg-gray-950/70">
              <span className="rounded-full bg-white/95 px-2 py-0.5 text-xs font-semibold text-gray-600 shadow-sm dark:bg-gray-900/95 dark:text-gray-200">
                {product.status === "OUT_OF_STOCK" ? "Hết hàng" : "Tạm ngưng"}
              </span>
            </div>
          )}
        </div>

        <div className="flex h-24 min-w-0 flex-1 items-stretch justify-between gap-3 sm:h-28">
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-gray-50 sm:text-base">
                {product.name}
              </p>
            </div>

            <span className="text-sm font-bold text-brand-700 dark:text-brand-300 sm:text-base">
              {product.price.toLocaleString("vi-VN")}đ
            </span>
          </div>

          {!isUnavailable && (
            <div className="flex shrink-0 flex-col items-end justify-between gap-2">
              <div className="grid grid-cols-[2rem_1.75rem_2rem] items-center">
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  onClick={() => setQuantity((q) => q - 1)}
                  disabled={quantity <= 1}
                  className={stepperButtonClass}
                >
                  -
                </button>
                <span className="text-center text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  onClick={() => setQuantity((q) => q + 1)}
                  disabled={quantity >= MAX_ITEM_QUANTITY}
                  className={stepperButtonClass}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  onAddToCart(quantity);
                  setQuantity(1);
                }}
                className="rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-brand-400/30 transition-colors hover:bg-brand-600 active:bg-brand-700"
              >
                Thêm
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={product.name}
        size="md"
        panelTestId={`product-detail-modal-${product.id}`}
      >
        <div className="flex max-h-[78vh] flex-col">
          <div
            data-testid="product-detail-media"
            className="relative overflow-hidden rounded-xl bg-brand-50 dark:bg-brand-900/30"
          >
            {showImage ? (
              <img
                src={product.imageUrl!}
                alt={product.name}
                loading="lazy"
                onError={() => setImgError(true)}
                className="h-64 w-full object-cover"
              />
            ) : (
              <div className="flex h-64 w-full items-center justify-center text-3xl font-bold text-brand-700 dark:text-brand-200">
                CH
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto py-4">
            <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
              {product.description || "Món này chưa có mô tả."}
            </p>

            {!isUnavailable && (
              <div className="mt-4">
                <label
                  htmlFor={`note-${product.id}`}
                  className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Ghi chú cho món này
                </label>
                <textarea
                  id={`note-${product.id}`}
                  value={detailNote}
                  onChange={(e) => setDetailNote(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="VD: Ít đường, không đá..."
                  className="w-full resize-none rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-600"
                />
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-base font-bold text-brand-700 dark:text-brand-300">
                {product.price.toLocaleString("vi-VN")}đ
              </span>
              <div className="grid grid-cols-[2rem_1.75rem_2rem] items-center">
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  onClick={() => setDetailQuantity((q) => q - 1)}
                  disabled={detailQuantity <= 1}
                  className={stepperButtonClass}
                >
                  -
                </button>
                <span className="text-center text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {detailQuantity}
                </span>
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  onClick={() => setDetailQuantity((q) => q + 1)}
                  disabled={detailQuantity >= MAX_ITEM_QUANTITY}
                  className={stepperButtonClass}
                >
                  +
                </button>
              </div>
            </div>

            {isUnavailable ? (
              <button
                type="button"
                disabled
                className="w-full rounded-full bg-gray-200 px-4 py-3 text-sm font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              >
                {product.status === "OUT_OF_STOCK" ? "Hết hàng" : "Tạm ngưng"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDetailAdd}
                className="w-full rounded-full bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-400/30 transition-colors hover:bg-brand-600 active:bg-brand-700"
              >
                Thêm {detailQuantity} vào giỏ
              </button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
