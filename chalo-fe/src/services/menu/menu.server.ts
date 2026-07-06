// src/services/menu/menu.server.ts
import { API, CACHE_TAGS } from "@/constants";
import { CategoryDto, ProductDto } from "./menu.types";
import { INTERNAL_API } from "@/constants/server";

export const getMenuCategoriesServer = async (): Promise<CategoryDto[]> => {
  try {
    const res = await fetch(`${INTERNAL_API}${API.CATEGORY.LIST}`, {
      next: { revalidate: 3600, tags: [CACHE_TAGS.MENU.CATEGORIES] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data as CategoryDto[]).filter((d) => d.isActive);
  } catch (error) {
    return [];
  }
};

export const getMenuProductsServer = async (): Promise<ProductDto[]> => {
  try {
    const res = await fetch(`${INTERNAL_API}${API.PRODUCT.LIST}`, {
      next: { revalidate: 3600, tags: [CACHE_TAGS.MENU.PRODUCTS] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data as ProductDto[];
  } catch (error) {
    return [];
  }
};
