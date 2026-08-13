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
  const storeTheme = useOrderThemeStore((s) => s.theme);
  const isHydrated = useOrderThemeStore((s) => s.isHydrated);
  const theme = isHydrated ? storeTheme : "playful";
  return theme === "cinematic" ? (
    <ProductCardCinematic product={product} onAddToCart={onAddToCart} />
  ) : (
    <ProductCardPlayful product={product} onAddToCart={onAddToCart} />
  );
};
