// src/app/(staff)/staff/print-station/_lib/print-log.ts
// Nhật ký ORDER đã in, lưu localStorage theo NGÀY (giờ máy quầy) — sang ngày là log mới.
// Ghi theo từng orderId (không theo session) để "in bù" sau khi mở lại tab
// đối chiếu được với danh sách đơn đã thanh toán trong ngày.

const key = () => `chalo-print-log:${new Date().toLocaleDateString("sv-SE")}`;

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(key()) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function markPrinted(orderIds: string[]): void {
  const log = load();
  const at = new Date().toISOString();
  for (const id of orderIds) log[id] = at;
  localStorage.setItem(key(), JSON.stringify(log));
}

/** Đã in khi MỌI đơn trong nhóm đều có trong log hôm nay */
export function isPrinted(orderIds: string[]): boolean {
  const log = load();
  return orderIds.length > 0 && orderIds.every((id) => log[id]);
}
