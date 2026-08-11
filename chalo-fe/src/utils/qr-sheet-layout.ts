// src/utils/qr-sheet-layout.ts
// Logic thuần dàn thẻ A6 lên tờ A4 và đảo vị trí mặt sau để in 2 mặt cắt khớp.
export type FlipMode = "long" | "short";

/** Chia items thành từng tờ `size` ô; đệm null cho ô trống ở tờ cuối. */
export function chunkSheets<T>(items: T[], size = 4): (T | null)[][] {
  const sheets: (T | null)[][] = [];
  for (let i = 0; i < items.length; i += size) {
    const cells: (T | null)[] = items.slice(i, i + size);
    while (cells.length < size) cells.push(null);
    sheets.push(cells);
  }
  return sheets;
}

/**
 * Hoán vị chỉ số ô cho MẶT SAU (mặt trước luôn [0,1,2,3] = TL,TR,BL,BR).
 * - long  (lật cạnh dài):  đảo cột  -> [1,0,3,2]
 * - short (lật cạnh ngắn): đảo hàng -> [2,3,0,1]
 */
export function backOrder(mode: FlipMode): number[] {
  return mode === "long" ? [1, 0, 3, 2] : [2, 3, 0, 1];
}

/** Lật cạnh ngắn cần xoay 180° từng thẻ mặt sau để lật lên đọc xuôi. */
export function needsRotate180(mode: FlipMode): boolean {
  return mode === "short";
}
