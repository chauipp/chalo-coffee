export function parseRefundVnd(raw: string, refundableAmount: number): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const amount = Number(raw);
  return Number.isSafeInteger(amount) && amount >= 1 && amount <= refundableAmount ? amount : null;
}
