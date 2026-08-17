// src/constants/routes.ts
export const ROUTES = {
  //public
  LOGIN: "/login",
  REGISTER: "/register",
  PWA_LAUNCH: "/pwa-launch",

  //public (customer)
  MENU: "/menu",
  ACCOUNT: "/account",

  DASHBOARD: "/dashboard",

  //staff - authen
  STAFF: {
    ROOT: "/staff",
    ORDERS: "/staff/orders",
    POS: "/staff/pos",
    TABLES: "/staff/tables",
    PREP: "/staff/prep",
    SHIFT: "/staff/shift",
    PRINT_STATION: "/staff/print-station",
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
    PREP: "/admin/prep",
    USERS: "/admin/users",
    SETTINGS: "/admin/settings",
    SHIFT: "/admin/shift",
    INVENTORY: "/admin/inventory",
    AUDIT: "/admin/audit",
  },
} as const;

export const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.MENU,
] as const;

export const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  ADMIN: ROUTES.ADMIN.DASHBOARD,
  MODERATOR: ROUTES.STAFF.POS,
  CUSTOMER: ROUTES.ACCOUNT,
};
