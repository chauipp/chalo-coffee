export interface CashChangeResult {
  valid: boolean;
  change: number;
  received: number | null;
}

export function calculateCashChange(
  total: number,
  received: number | string,
): CashChangeResult {
  const parsedReceived =
    typeof received === "string" ? Number(received.replace(/,/g, "")) : received;

  if (
    !Number.isFinite(total) ||
    total <= 0 ||
    !Number.isFinite(parsedReceived) ||
    parsedReceived < total
  ) {
    return { valid: false, change: 0, received: null };
  }

  return { valid: true, change: Math.round(parsedReceived - total), received: Math.round(parsedReceived) };
}
