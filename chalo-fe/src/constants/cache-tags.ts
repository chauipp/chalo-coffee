// src/constants/cache-tags.ts

export const CACHE_TAGS = {
  MENU: {
    CATEGORIES: "menu-categories",
    PRODUCTS: "menu-products",
  },
  TABLE: {
    AREAS: "table-areas",
    TOKEN: (token: string) => `table-token-${token}`,
  },
};
