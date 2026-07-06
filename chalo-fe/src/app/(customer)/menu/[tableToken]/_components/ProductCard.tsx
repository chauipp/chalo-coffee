import { ProductDto } from "@/services/menu";
import { useState } from "react";

interface ProductCardProps {
  product: ProductDto;
  onAddToCart: (quantity: number) => void;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const [quantity, setQuantity] = useState<number>(1);
  const isUnavailable = product.status !== "AVAILABLE" || !product.isActive;

  return (
    <div
      className={`flex min-h-32 gap-3 rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition-opacity dark:border-gray-800 dark:bg-gray-900 sm:gap-4 sm:p-4 ${
        isUnavailable ? "opacity-50" : ""
      }`}
    >
      <div className="relative shrink-0">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="size-24 rounded-lg object-cover sm:size-28"
          />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-200 sm:size-28">
            CH
          </div>
        )}
        {isUnavailable && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 dark:bg-gray-950/70">
            <span className="rounded-full bg-white/95 px-2 py-0.5 text-xs font-semibold text-gray-600 shadow-sm dark:bg-gray-900/95 dark:text-gray-200">
              {product.status === "OUT_OF_STOCK" ? "Hết hàng" : "Tạm ngưng"}
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-gray-50 sm:text-base">
          {product.name}
        </p>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            {product.description}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <span className="text-sm font-bold text-brand-700 dark:text-brand-300 sm:text-base">
            {product.price.toLocaleString("vi-VN")}đ
          </span>
          {!isUnavailable && (
            <div className="flex shrink-0 flex-col items-end gap-2">
              <div className="grid grid-cols-[1.75rem_1.75rem_1.75rem] items-center">
                <button
                  onClick={() => setQuantity((q) => q - 1)}
                  disabled={quantity <= 1}
                  className="flex size-7 items-center justify-center rounded-full border border-gray-200 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-30 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  -
                </button>
                <span className="text-center text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex size-7 items-center justify-center rounded-full border border-gray-200 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  +
                </button>
              </div>
              <button
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
    </div>
  );
};
