"use client";

import { ProductDto } from "@/services/menu";
import { AddToCartHandler } from "./useProductCardState";
import { ProductCardCinematic } from "./ProductCard.Cinematic";

export const ProductCardPlayful = (props: {
  product: ProductDto;
  onAddToCart: AddToCartHandler;
}) => <ProductCardCinematic {...props} />;
