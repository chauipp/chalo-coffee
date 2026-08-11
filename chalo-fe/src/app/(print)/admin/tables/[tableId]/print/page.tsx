"use client";
// src/app/(print)/admin/tables/[tableId]/print/page.tsx
// Trang in QR khổ A6 (105×148mm) — nằm ngoài route group (admin) để không
// dính sidebar/header admin, nhưng URL vẫn /admin/... nên middleware vẫn
// bắt đăng nhập ADMIN như thường.
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { ROUTES } from "@/constants";
import { useGetTableList } from "@/services/table";
import Link from "next/link";
import { use, useSyncExternalStore } from "react";
import { A6_PRINT_CSS, QrA6Sheet } from "./QrA6Sheet";

export default function TableQrPrintPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = use(params);
  const { data: tables, isLoading } = useGetTableList();
  const table = tables?.find((t) => t.id === tableId);

  // origin chỉ có ở client — server snapshot trả "" để khỏi mismatch khi hydrate
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const menuUrl = table && origin ? `${origin}/menu/${table.qrToken}` : "";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Toolbar — chỉ hiện trên màn hình, ẩn khi in */}
      <header className="qr-screen-only sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href={ROUTES.ADMIN.TABLES}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            ← Quay lại
          </Link>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              In QR {table ? `— ${table.name}` : ""}
            </p>
            <p className="text-xs text-gray-400">
              Khổ A6 · 105×148mm · in màu, không lề
            </p>
          </div>
          <button
            onClick={() => window.print()}
            disabled={!table || !menuUrl}
            className="rounded-xl bg-brand-400 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors disabled:opacity-50"
          >
            🖨️ In trang này
          </button>
        </div>
      </header>

      {/* Vùng preview */}
      <main className="flex justify-center px-4 py-8">
        {isLoading ? (
          <div className="qr-screen-only flex items-center gap-2 py-20 text-gray-500">
            <SpinnerIcon className="size-5 animate-spin" />
            Đang tải thông tin bàn…
          </div>
        ) : !table ? (
          <div className="qr-screen-only py-20 text-center">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              Không tìm thấy bàn
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Bàn có thể đã bị xóa.{" "}
              <Link
                href={ROUTES.ADMIN.TABLES}
                className="text-brand-500 underline"
              >
                Về danh sách bàn
              </Link>
            </p>
          </div>
        ) : (
          <div className="qr-sheet-zoom drop-shadow-xl">
            {menuUrl && <QrA6Sheet table={table} menuUrl={menuUrl} />}
          </div>
        )}
      </main>

      {/* CSS thẻ A6 (dùng chung) */}
      <style>{A6_PRINT_CSS}</style>

      {/* CSS riêng của trang: phóng to preview + neo tấm khi in */}
      <style>{`
        @page { size: 105mm 148mm; margin: 0; }

        /* Preview trên màn hình: phóng to cho dễ xem */
        @media screen {
          .qr-sheet-zoom { zoom: 1.35; }
        }

        /* Khi in: globals.css ẩn body* (dành cho hóa đơn 80mm) — bật lại ở
           route này, chỉ giữ tấm A6, neo về góc giấy */
        @media print {
          .qr-screen-only { display: none !important; }
          body * { visibility: visible !important; }
          main { padding: 0 !important; }
          .qr-sheet-zoom { zoom: 1; filter: none; }
          .qr-sheet {
            position: fixed;
            top: 0;
            left: 0;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
