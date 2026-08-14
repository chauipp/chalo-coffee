export const ADMIN_PREP_VISIBLE_STORAGE_KEY = "admin-orders-prep-visible:v1";

export const readAdminPrepVisible = (storage: Pick<Storage, "getItem"> | null) =>
  storage?.getItem(ADMIN_PREP_VISIBLE_STORAGE_KEY) === "true";
