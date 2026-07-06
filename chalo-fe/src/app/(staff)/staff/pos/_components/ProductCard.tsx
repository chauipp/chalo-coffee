// src/app/(staff)/staff/pos/_components/ProductCard.tsx
import { ProductDto } from "@/services/menu";
import { POSCartItem } from "../page";

interface ProductCardProps {
  product: ProductDto;
  inCart?: POSCartItem;
  onAddToCart: (product: ProductDto) => void
}

export const ProductCard = ({ product, inCart, onAddToCart }: ProductCardProps) => (
  <button
    onClick={() => onAddToCart(product)}
    disabled={product.status !== "AVAILABLE"}
    className={`relative rounded-xl border p-3 text-left transition-all hover:shadow-md active:scale-[0.97]
    ${
      product.status !== "AVAILABLE"
        ? "opacity-40 cursor-not-allowed border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800"
        : inCart
          ? "border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/20"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-brand-300"
    }`}
  >
    {inCart && (
      <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-brand-400 text-white text-xs font-bold flex items-center justify-center shadow-sm">
        {inCart.quantity}
      </span>
    )}
    <div className="size-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl mb-2">
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="size-full object-cover rounded-lg"
        />
      ) : (
        "☕"
      )}
    </div>
    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 leading-tight mb-1 line-clamp-2">
      {product.name}
    </p>
    <p className="text-xs font-bold text-brand-600 dark:text-brand-400">
      {product.price.toLocaleString("vi-VN")}đ
    </p>
  </button>
);
