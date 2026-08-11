export interface CashChangeResult {
  valid: boolean;
  change: number;
}

/**
 * Calculate cash change using integer VND amounts.
 * Invalid/insufficient input never produces a negative change.
 */
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
    return { valid: false, change: 0 };
  }

  return {
    valid: true,
    change: Math.round(parsedReceived - total),
  };
}
