"use client";
// src/app/(print)/admin/tables/print-sheet/page.tsx
// In hàng loạt: mỗi tờ A4 = 4 thẻ A6 (2×2), có mặt trước + mặt sau đảo để cắt khớp.
import { A6_PRINT_CSS } from "../[tableId]/print/QrA6Sheet";
import { useGetTableList } from "@/services/table";
import {
  backOrder,
  chunkSheets,
  needsRotate180,
  type FlipMode,
} from "@/utils/qr-sheet-layout";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useSyncExternalStore } from "react";
import { A4Face, A4_FACE_CSS, type SheetCell } from "./A4Face";

function PrintSheetInner() {
  const searchParams = useSearchParams();
  const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const { data: tables, isLoading } = useGetTableList();
  const [flip, setFlip] = useState<FlipMode>("long");

  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );

  // giữ đúng thứ tự ids đã chọn
  const chosen = ids
    .map((id) => tables?.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const selected: SheetCell[] = chosen.map((table) => ({
    table,
    menuUrl: origin ? `${origin}/menu/${table.qrToken}` : "",
  }));

  const sheets = chunkSheets(selected, 4);
  const order = backOrder(flip);
  const rotate = needsRotate180(flip);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Toolbar — chỉ màn hình */}
      <header className="qr-screen-only sticky top-0 z-10 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              In QR hàng loạt — {selected.length} bàn · {sheets.length} tờ A4 (2
              mặt)
            </p>
            <p className="text-xs text-gray-400">
              Bật “In tràn lề/Borderless”, tỉ lệ 100% (không “fit to page”). Nên
              in thử 1 tờ trước.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              Kiểu lật:
              <select
                value={flip}
                onChange={(e) => setFlip(e.target.value as FlipMode)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="long">Cạnh dài (mặc định)</option>
                <option value="short">Cạnh ngắn</option>
              </select>
            </label>
            <button
              onClick={() => window.print()}
              disabled={selected.length === 0}
              className="rounded-xl bg-brand-400 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
            >
              🖨️ In
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center gap-8 px-4 py-8">
        {isLoading ? (
          <p className="qr-screen-only py-20 text-gray-500">Đang tải…</p>
        ) : selected.length === 0 ? (
          <p className="qr-screen-only py-20 text-gray-500">
            Không có bàn để in. Hãy chọn bàn ở trang Bàn &amp; QR.
          </p>
        ) : (
          sheets.map((frontCells, s) => {
            const backCells = order.map((i) => frontCells[i]);
            return (
              <div key={s} className="flex flex-col items-center gap-6">
                <div className="sheet-block">
                  <p className="qr-screen-only mb-2 text-xs font-medium text-gray-500">
                    Tờ {s + 1} — Mặt trước
                  </p>
                  <div className="a4-zoom drop-shadow-xl">
                    <A4Face cells={frontCells} rotate180={false} />
                  </div>
                </div>
                <div className="sheet-block">
                  <p className="qr-screen-only mb-2 text-xs font-medium text-gray-500">
                    Tờ {s + 1} — Mặt sau (đã đảo)
                  </p>
                  <div className="a4-zoom drop-shadow-xl">
                    <A4Face cells={backCells} rotate180={rotate} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      <style>{A6_PRINT_CSS}</style>
      <style>{A4_FACE_CSS}</style>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media screen {
          .a4-zoom { zoom: 0.5; }
        }
        @media print {
          .qr-screen-only { display: none !important; }
          body * { visibility: visible !important; }
          main { padding: 0 !important; gap: 0 !important; }
          .a4-zoom { zoom: 1; filter: none; }
          .sheet-block { margin: 0 !important; }
          .a4-sheet { page-break-after: always; break-after: page; }
        }
      `}</style>
    </div>
  );
}

export default function PrintSheetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950" />
      }
    >
      <PrintSheetInner />
    </Suspense>
  );
}
