// src/services/menu/api.ts

import { request } from "@/lib/api-client";
import { CategoryDto, CreateCategoryPayload, CreateProductPayload, ProductDto, ProductPageParam, ProductSimpleDto, UpdateCategoryPayload, UpdateProductPayload } from "./menu.types";
import { API } from "@/constants";
import { PageResult } from "../types";

//============CATEGORY=============
export const getCategoryList = (): Promise<CategoryDto[]> => {
  return request.get(API.CATEGORY.LIST)
}
export const getCategoryById = (id: string): Promise<CategoryDto> => {
  return request.get(API.CATEGORY.DETAIL, { params: { id } })
}
export const createCategory = (data: CreateCategoryPayload) => {
  return request.post(API.CATEGORY.CREATE, data)
}
export const updateCategory = (data: UpdateCategoryPayload) => {
  return request.put(API.CATEGORY.UPDATE, data)
}
export const deleteCategory = (id: string) => {
  return request.delete(API.CATEGORY.DELETE, { params: { id } })
}
export const revalidateMenuCache = async (): Promise<void> => {
  const res = await fetch("/api/cache/revalidate-menu", {
    method: "POST",
    credentials: "same-origin",
  });

  if (!res.ok) {
    throw new Error("Không thể làm mới cache thực đơn");
  }
}

//================PRODUCT====================
export const getProductPage = (params: ProductPageParam): Promise<PageResult<ProductDto>> => {
  return request.get(API.PRODUCT.PAGE, { params })
}
export const getProduct = (id: string): Promise<ProductDto> => {
  return request.get(API.PRODUCT.DETAIL, { params: { id } })
}
export const getProductSimpleList = (categoryId: string): Promise<ProductSimpleDto[]> => {
  return request.get(API.PRODUCT.SIMPLE_LIST, { params: { categoryId } })
}
export const createProduct = (data: CreateProductPayload) => {
  return request.post(API.PRODUCT.CREATE, data)
}
export const updateProduct = (data: UpdateProductPayload) => {
  return request.put(API.PRODUCT.UPDATE, data)
}
export const updateProductStatus = (id: string, status: ProductDto['status']) => {
  return request.put(API.PRODUCT.UPDATE_STATUS, { id, status })
}
export const deleteProduct = (id: string) => {
  return request.delete(API.PRODUCT.DELETE, { params: { id } })
}
