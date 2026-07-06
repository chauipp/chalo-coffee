"use client";
// src/services/menu/queries.ts
import { QUERY_KEYS } from "@/constants";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getCategoryById,
  getCategoryList,
  getProduct,
  getProductPage,
  getProductSimpleList,
  revalidateMenuCache,
  updateCategory,
  updateProduct,
  updateProductStatus,
} from "./menu.api";
import {
  CreateCategoryPayload,
  CreateProductPayload,
  ProductPageParam,
  UpdateCategoryPayload,
  UpdateProductPayload,
} from "./menu.types";
import { toast } from "sonner";

const refreshCustomerMenuCache = async () => {
  try {
    await revalidateMenuCache();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to refresh menu cache";
    toast.error(message);
  }
};

// =========Category==================
export const useGetCategoryList = () => {
  return useQuery({
    queryKey: QUERY_KEYS.MENU.CATEGORIES,
    queryFn: getCategoryList,
    staleTime: 5 * 60_000,
  });
};

export const useGetCategoryById = (id: string | null) => {
  return useQuery({
    queryKey: QUERY_KEYS.MENU.CATEGORY(id!),
    queryFn: () => getCategoryById(id!),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
};

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryPayload) => createCategory(data),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.MENU.CATEGORIES });
      await refreshCustomerMenuCache();
      toast.success("Thêm danh mục hàng thành công");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCategoryPayload) => updateCategory(data),
    onSuccess: async (_, data) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.MENU.CATEGORIES });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.MENU.CATEGORY(data.id) });
      await refreshCustomerMenuCache();
      toast.success("Cập nhật danh mục hàng thành công");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.MENU.CATEGORIES });
      await refreshCustomerMenuCache();
      toast.success("Xoá danh mục hàng thành công");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

// =========Product==================
export const useGetProductPage = (params: ProductPageParam) => {
  return useQuery({
    queryKey: QUERY_KEYS.MENU.PRODUCT_PAGE(params),
    queryFn: () => getProductPage(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
};

export const useGetProductByid = (id: string | null) => {
  return useQuery({
    queryKey: QUERY_KEYS.MENU.PRODUCT(id!),
    queryFn: () => getProduct(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
};

export const useGetProductSimpleList = (categoryId?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.MENU.SIMPLE_LIST(categoryId!),
    queryFn: () => getProductSimpleList(categoryId!),
    staleTime: 5 * 60_000,
  });
};

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductPayload) => createProduct(data),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.MENU.PRODUCTS });
      await refreshCustomerMenuCache();
      toast.success("Thêm sản phẩm mới thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProductPayload) => updateProduct(data),
    onSuccess: async (_, data) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.MENU.PRODUCTS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.MENU.PRODUCT(data.id) });
      await refreshCustomerMenuCache();
      toast.success("Sửa sản phẩm thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateProductStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: Parameters<typeof updateProductStatus>[1];
    }) => updateProductStatus(id, status),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.MENU.PRODUCTS });
      await refreshCustomerMenuCache();
      toast.success("Sửa sản phẩm thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.MENU.PRODUCTS });
      await refreshCustomerMenuCache();
      toast.success("Xoá sản phẩm thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
