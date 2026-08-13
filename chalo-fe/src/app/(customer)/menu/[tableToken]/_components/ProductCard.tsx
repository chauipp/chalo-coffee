"use client";
// src/app/(customer)/menu/[tableToken]/_components/ProductCard.tsx
import { ProductDto } from "@/services/menu";
import { ProductCardCinematic } from "./ProductCard.Cinematic";
import { AddToCartHandler } from "./useProductCardState";

interface ProductCardProps {
  product: ProductDto;
  onAddToCart: AddToCartHandler;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => (
  <ProductCardCinematic product={product} onAddToCart={onAddToCart} />
);
