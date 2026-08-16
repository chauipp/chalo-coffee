export const ADMIN_PREP_VISIBLE_STORAGE_KEY = "admin-prep-visible:v1";

/**
 * Read the persisted visibility of the admin prep dock.
 *
 * A missing value (and every value other than the literal string "true")
 * keeps the dock closed by default. Keeping this helper storage-agnostic
 * makes the persistence rule easy to test without a browser environment.
 */
export function readAdminPrepVisible(
  storage: Pick<Storage, "getItem">,
): boolean {
  return storage.getItem(ADMIN_PREP_VISIBLE_STORAGE_KEY) === "true";
}

export function isAdminPrepDockEnabled(
  isDesktop: boolean,
  visible: boolean,
): boolean {
  return isDesktop && visible;
}
