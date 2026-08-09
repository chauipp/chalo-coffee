export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

const ROUTE_PREFIX = "chalo-admin-route:v1";
const DRAFT_PREFIX = "chalo-admin-product-draft:v1";
const PRODUCT_LIST_PREFIX = "chalo-admin-product-list:v1";

export interface AdminRouteState {
  pathname: string;
  search: string;
}

interface ProductDraftEnvelope<T> {
  values: T;
  savedAt: number;
}

export function adminRouteKey(userId: string): string {
  return `${ROUTE_PREFIX}:${encodeURIComponent(userId)}`;
}

export function productDraftKey(userId: string, productId: string): string {
  return `${DRAFT_PREFIX}:${encodeURIComponent(userId)}:${encodeURIComponent(productId)}`;
}

export function productListStateKey(userId: string): string {
  return `${PRODUCT_LIST_PREFIX}:${encodeURIComponent(userId)}`;
}

function remove(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Storage can be unavailable in private browsing or when quota is disabled.
  }
}

export function saveAdminRoute(
  storage: Storage,
  userId: string,
  pathname: string,
  search = "",
): void {
  if (!userId || !pathname.startsWith("/admin")) return;

  try {
    storage.setItem(
      adminRouteKey(userId),
      JSON.stringify({ pathname, search: search || "" } satisfies AdminRouteState),
    );
  } catch {
    // Navigation must keep working when persistence is blocked.
  }
}

export function readAdminRoute(
  storage: Storage,
  userId: string,
): AdminRouteState | null {
  if (!userId) return null;

  const key = adminRouteKey(userId);
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;

    const value: unknown = JSON.parse(raw);
    if (
      !value ||
      typeof value !== "object" ||
      typeof (value as AdminRouteState).pathname !== "string" ||
      !(value as AdminRouteState).pathname.startsWith("/admin") ||
      typeof (value as AdminRouteState).search !== "string"
    ) {
      remove(storage, key);
      return null;
    }

    return value as AdminRouteState;
  } catch {
    remove(storage, key);
    return null;
  }
}

export function clearAdminRoute(storage: Storage, userId: string): void {
  if (userId) remove(storage, adminRouteKey(userId));
}

export function saveProductDraft<T>(
  storage: Storage,
  userId: string,
  productId: string,
  values: T,
  savedAt = Date.now(),
): void {
  if (!userId || !productId) return;

  try {
    storage.setItem(
      productDraftKey(userId, productId),
      JSON.stringify({ values, savedAt } satisfies ProductDraftEnvelope<T>),
    );
  } catch {
    // Draft persistence is best-effort and never blocks editing.
  }
}

export function readProductDraft<T>(
  storage: Storage,
  userId: string,
  productId: string,
  now = Date.now(),
): T | null {
  if (!userId || !productId) return null;

  const key = productDraftKey(userId, productId);
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;

    const value: unknown = JSON.parse(raw);
    if (
      !value ||
      typeof value !== "object" ||
      typeof (value as ProductDraftEnvelope<T>).savedAt !== "number" ||
      !Number.isFinite((value as ProductDraftEnvelope<T>).savedAt) ||
      now - (value as ProductDraftEnvelope<T>).savedAt > DRAFT_TTL_MS ||
      now < (value as ProductDraftEnvelope<T>).savedAt ||
      !("values" in value)
    ) {
      remove(storage, key);
      return null;
    }

    return (value as ProductDraftEnvelope<T>).values;
  } catch {
    remove(storage, key);
    return null;
  }
}

export function clearProductDraft(
  storage: Storage,
  userId: string,
  productId: string,
): void {
  if (userId && productId) remove(storage, productDraftKey(userId, productId));
}

export function saveProductListState<T>(
  storage: Storage,
  userId: string,
  state: T,
): void {
  if (!userId) return;

  try {
    storage.setItem(productListStateKey(userId), JSON.stringify(state));
  } catch {
    // List restoration is best-effort.
  }
}

export function readProductListState<T>(
  storage: Storage,
  userId: string,
): T | null {
  if (!userId) return null;

  const key = productListStateKey(userId);
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    remove(storage, key);
    return null;
  }
}

export function clearProductListState(storage: Storage, userId: string): void {
  if (userId) remove(storage, productListStateKey(userId));
}
