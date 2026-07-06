// src/services/menu/types.ts

import type { PageParam } from "@/services/types";

//==============Category=====================
export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive: boolean;
}

export interface UpdateCategoryPayload extends CreateCategoryPayload {
  id: string;
}

//===============Product=====================
export const PRODUCT_STATUS = [
  "AVAILABLE",
  "UNAVAILABLE",
  "OUT_OF_STOCK",
] as const;
export type ProductStatus = (typeof PRODUCT_STATUS)[number];

export interface ProductDto {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  status: ProductStatus;
  sortOrder: number;
  isActive: boolean;
  prepTime: number;
  createdAt: string;
}

export interface ProductSimpleDto {
  id: string;
  name: string;
  price: number;
}

export interface CreateProductPayload {
  name: string;
  categoryId: string;
  description?: string;
  imageUrl?: string;
  price: number;
  sortOrder?: number;
  prepTime: number;
  status: ProductStatus;
  isActive: boolean;
}

export interface UpdateProductPayload extends CreateProductPayload {
  id: string;
}

export interface ProductPageParam extends PageParam {
  name?: string;
  categoryId?: string;
  status?: ProductStatus;
  isActive?: boolean;
}
