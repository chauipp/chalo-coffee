"use client";
// src/app/(print)/qr-preview/page.tsx
// ⚠️ TRANG PREVIEW TẠM — chỉ để xem thẻ QR A6 + dàn 4-up 2 mặt mà không cần
// backend/đăng nhập. XÓA FILE NÀY TRƯỚC KHI MERGE.
import { TableDto } from "@/services/table";
import {
  A6_PRINT_CSS,
  QrA6Sheet,
} from "@/app/(print)/admin/tables/[tableId]/print/QrA6Sheet";
import {
  A4Face,
  A4_FACE_CSS,
  type SheetCell,
} from "@/app/(print)/admin/tables/print-sheet/A4Face";
import { backOrder, chunkSheets, needsRotate180 } from "@/utils/qr-sheet-layout";

const mkTable = (n: number): TableDto => ({
  id: `preview-${n}`,
  name: `Bàn ${n}`,
  status: "AVAILABLE",
  qrToken: `demo-token-${n}`,
  qrCodeUrl: "",
  activeOrders: [],
  createdAt: "2026-01-01T00:00:00.000Z",
});

const MOCK_TABLE = mkTable(1);
const MENU_URL = "https://chalocoffee.com/menu/demo-token";

const MOCK_CELLS: SheetCell[] = [1, 2, 3, 4].map((n) => ({
  table: mkTable(n),
  menuUrl: `https://chalocoffee.com/menu/demo-token-${n}`,
}));

export default function QrPreviewPage() {
  const front = chunkSheets(MOCK_CELLS, 4)[0];
  const mode = "long" as const;
  const back = backOrder(mode).map((i) => front[i]);

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-gray-100 px-4 py-8 dark:bg-gray-950">
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
        ⚠️ Trang <b>preview tạm</b> để duyệt thẻ QR A6 + dàn 4-up 2 mặt (dữ liệu
        mẫu). Sẽ xóa trước khi merge.
      </div>

      {/* 1 thẻ đơn */}
      <section className="flex flex-col items-center gap-2">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          Thẻ A6 đơn
        </h2>
        <div className="qr-sheet-zoom drop-shadow-xl">
          <QrA6Sheet table={MOCK_TABLE} menuUrl={MENU_URL} />
        </div>
      </section>

      {/* Dàn 4-up 2 mặt (kiểu lật cạnh dài) */}
      <section className="flex flex-col items-center gap-4">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          4 thẻ/tờ A4 · 2 mặt (lật cạnh dài) — mặt trước 1,2,3,4 → mặt sau
          2,1,4,3
        </h2>
        <div className="flex flex-wrap items-start justify-center gap-8">
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-gray-500">Mặt trước</p>
            <div className="a4-zoom drop-shadow-xl">
              <A4Face cells={front} rotate180={false} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-gray-500">Mặt sau (đã đảo)</p>
            <div className="a4-zoom drop-shadow-xl">
              <A4Face cells={back} rotate180={needsRotate180(mode)} />
            </div>
          </div>
        </div>
      </section>

      <style>{A6_PRINT_CSS}</style>
      <style>{A4_FACE_CSS}</style>
      <style>{`
        @media screen {
          .qr-sheet-zoom { zoom: 1.35; }
          .a4-zoom { zoom: 0.42; }
        }
      `}</style>
    </div>
  );
}
