export type InventoryState = "empty" | "low" | "healthy";

/** Converts a staff-entered quantity to a safe API value without rounding it. */
export function parseInventoryQuantity(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,3})?$/.test(normalized)) return null;

  const quantity = Number(normalized);
  return Number.isFinite(quantity) && quantity >= 0 ? quantity : null;
}

export function inventoryState(onHand: number, reorderLevel: number): InventoryState {
  if (onHand <= 0) return "empty";
  if (onHand <= reorderLevel) return "low";
  return "healthy";
}
