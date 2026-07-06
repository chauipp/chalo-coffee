// src/constants/routes.ts
export const ROUTES = {
  //public
  LOGIN: "/login",
  REGISTER: "/register",

  //public (customer)
  MENU: "/menu",

  DASHBOARD: "/dashboard",

  //staff - authen
  STAFF: {
    ROOT: "/staff",
    ORDERS: "/staff/orders",
    POS: "/staff/pos",
    TABLES: "/staff/tables",
  },

  //admin
  ADMIN: {
    ROOT: "/admin",
    DASHBOARD: "/admin/dashboard",
    MENU: "/admin/menu",
    MENU_CATEGORIES: "/admin/menu/categories",
    MENU_PRODUCTS: "/admin/menu/products",
    TABLES: "/admin/tables",
    ORDERS: "/admin/orders",
    STAFF: "/admin/staff",
    SETTINGS: "/admin/settings",
  },
} as const;

export const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.MENU,
] as const;

export const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  ADMIN: ROUTES.ADMIN.DASHBOARD,
  MODERATOR: ROUTES.STAFF.ORDERS,
  CUSTOMER: ROUTES.MENU,
};
