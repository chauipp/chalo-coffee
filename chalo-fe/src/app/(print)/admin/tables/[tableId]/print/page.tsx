"use client";
// src/app/(print)/admin/tables/[tableId]/print/page.tsx
// Trang in QR khổ A6 (105×148mm) — nằm ngoài route group (admin) để không
// dính sidebar/header admin, nhưng URL vẫn /admin/... nên middleware vẫn
// bắt đăng nhập ADMIN như thường.
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { ROUTES } from "@/constants";
import { TableDto, useGetTableList } from "@/services/table";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { use, useSyncExternalStore } from "react";

/* ── Copy giới thiệu quán (tĩnh — sau này có thể chuyển vào Settings) ── */
const SHOP_NAME = "Chalo Coffee";
const SHOP_TAGLINE = "Chậm một nhịp, đậm một vị";
const SHOP_INTRO =
  "Cà phê rang xay mỗi sáng, trà trái cây tươi và bánh nhà làm. Gọi món tại bàn, đồ uống mang đến tận nơi.";

/* Tách "Bàn 5" → prefix "Bàn" + số "05" để đánh số thật to, thật rõ */
const splitTableName = (name: string) => {
  const m = name.trim().match(/^(.*?)(\d+)$/);
  if (!m) return { prefix: null as string | null, num: null as string | null };
  return { prefix: m[1].trim() || null, num: m[2].padStart(2, "0") };
};

const CoffeeCupIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path
      d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5c-.8.9-.8 1.9 0 2.8M12 3.5c-.8.9-.8 1.9 0 2.8"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const ScanArrow = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 48 24" fill="none" className={className} aria-hidden>
    <path
      d="M2 12h40m0 0-7-7m7 7-7 7"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ── Tấm A6 — mọi kích thước dùng mm để in ra đúng tỉ lệ tuyệt đối ── */
const QrA6Sheet = ({ table, menuUrl }: { table: TableDto; menuUrl: string }) => {
  const { prefix, num } = splitTableName(table.name);
  const showPrefix = prefix && prefix.toLowerCase() !== "bàn";

  return (
    <div className="qr-sheet bg-white" id="qr-a6-sheet">
      <div className="qr-grid">
        <div className="qr-row qr-row-top">
        {/* ── Ô 1: SỐ BÀN ───────────────────────────────────── */}
        <section className="cell cell-table relative overflow-hidden text-white">
          {/* vòng tròn trang trí chìm */}
          <div className="deco-ring deco-ring-1" />
          <div className="deco-ring deco-ring-2" />
          <p className="cell-label text-white/85">Số bàn</p>
          <div className="flex-1 flex flex-col items-center justify-center leading-none">
            {num ? (
              <>
                {showPrefix && (
                  <span className="table-prefix">{prefix}</span>
                )}
                <span className="table-num">{num}</span>
              </>
            ) : (
              <span className="table-name-full">{table.name}</span>
            )}
          </div>
          {table.area && <span className="area-chip">{table.area}</span>}
        </section>

        {/* ── Ô 2: GIỚI THIỆU QUÁN ─────────────────────────── */}
        <section className="cell cell-intro">
          <CoffeeCupIcon className="intro-icon text-brand-500" />
          <h2 className="intro-name text-coffee-dark">{SHOP_NAME}</h2>
          <p className="intro-tagline text-brand-600">{SHOP_TAGLINE}</p>
          <div className="intro-divider bg-brand-300" />
          <p className="intro-body">{SHOP_INTRO}</p>
        </section>
        </div>

        <div className="qr-row qr-row-bottom">
        {/* ── Ô 3: QUÉT MÃ Ở ĐÂY ĐỂ GỌI MÓN ────────────────── */}
        <section className="cell cell-cta">
          <h3 className="cta-title text-coffee-dark">
            Quét mã ở đây
            <br />
            <span className="text-brand-500">để gọi món</span>
          </h3>
          <ol className="cta-steps">
            <li>Mở camera</li>
            <li>Quét mã QR</li>
            <li>Chọn món &amp; gọi</li>
          </ol>
          <ScanArrow className="cta-arrow text-brand-400" />
        </section>

        {/* ── Ô 4: MÃ QR ───────────────────────────────────── */}
        <section className="cell cell-qr text-white">
          <div className="qr-card">
            <QRCodeSVG
              value={menuUrl}
              size={512}
              level="Q"
              marginSize={0}
              fgColor="#2E1602"
              bgColor="#FFFFFF"
              className="qr-svg"
            />
          </div>
          <p className="qr-caption">CHALO COFFEE · MENU</p>
        </section>
        </div>
      </div>
    </div>
  );
};

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

      {/* CSS in ấn — style cục bộ của route này */}
      <style>{`
        @page { size: 105mm 148mm; margin: 0; }

        /* Tấm A6: kích thước vật lý cố định */
        .qr-sheet {
          width: 105mm;
          height: 148mm;
          padding: 6mm;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        /* 2 hàng flex ĐỘC LẬP — mỗi hàng chia cột khác nhau (bố cục so le
           như mẫu), grid 1 bộ cột chung không làm được */
        .qr-grid {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          gap: 3mm;
        }
        .qr-row { display: flex; gap: 3mm; min-height: 0; }
        .qr-row-top { height: 69mm; }
        .qr-row-bottom { flex: 1; }
        .qr-row-top .cell-table { width: 46mm; }
        .qr-row-top .cell-intro { flex: 1; min-width: 0; }
        .qr-row-bottom .cell-cta { width: 37mm; }
        .qr-row-bottom .cell-qr { flex: 1; min-width: 0; }
        .cell {
          border-radius: 4mm;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Ô 1 — số bàn */
        .cell-table {
          background: linear-gradient(160deg, #f8921a 0%, #e67e0f 100%);
          padding: 5mm;
          align-items: center;
        }
        .cell-label {
          font-size: 3.2mm;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          align-self: flex-start;
        }
        .table-prefix {
          font-size: 6.5mm;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 1.5mm;
        }
        .table-num { font-size: 24mm; font-weight: 700; letter-spacing: -0.02em; }
        .table-name-full {
          font-size: 10mm;
          font-weight: 700;
          text-align: center;
          line-height: 1.15;
          word-break: break-word;
        }
        .area-chip {
          background: rgba(255, 255, 255, 0.22);
          border-radius: 10mm;
          padding: 1.2mm 4mm;
          font-size: 3.2mm;
          font-weight: 500;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .deco-ring {
          position: absolute;
          border: 0.8mm solid rgba(255, 255, 255, 0.14);
          border-radius: 50%;
          pointer-events: none;
        }
        .deco-ring-1 { width: 34mm; height: 34mm; top: -12mm; right: -12mm; }
        .deco-ring-2 { width: 22mm; height: 22mm; bottom: -8mm; left: -8mm; }

        /* Ô 2 — giới thiệu quán */
        .cell-intro {
          background: #fff8ee;
          border: 0.4mm solid #feecd0;
          padding: 5mm 4.5mm;
        }
        .intro-icon { width: 7mm; height: 7mm; margin-bottom: 1.8mm; }
        .intro-name {
          font-size: 4.8mm;
          font-weight: 700;
          line-height: 1.2;
          white-space: nowrap;
        }
        .intro-tagline { font-size: 2.9mm; font-style: italic; margin-top: 0.8mm; }
        .intro-divider { width: 8mm; height: 0.7mm; border-radius: 1mm; margin: 2.4mm 0; }
        .intro-body { font-size: 3mm; line-height: 1.55; color: #57534e; }

        /* Ô 3 — CTA quét mã */
        .cell-cta {
          background: #ffffff;
          border: 0.5mm dashed #fbb060;
          padding: 4mm 3.5mm;
        }
        .cta-title { font-size: 4mm; font-weight: 700; line-height: 1.3; }
        .cta-steps {
          margin-top: 3mm;
          padding-left: 4mm;
          list-style: decimal;
          font-size: 2.85mm;
          line-height: 1.85;
          color: #57534e;
        }
        .cta-arrow { width: 13mm; margin-top: auto; align-self: flex-end; }

        /* Ô 4 — QR */
        .cell-qr {
          background: #4a2c17;
          align-items: center;
          justify-content: center;
          padding: 4mm;
          gap: 3mm;
        }
        .qr-card {
          background: #ffffff;
          border-radius: 3mm;
          padding: 3mm;
          line-height: 0;
        }
        .qr-svg { width: 36mm; height: 36mm; }
        .qr-caption {
          font-size: 2.7mm;
          font-weight: 600;
          letter-spacing: 0.2em;
          color: rgba(255, 255, 255, 0.85);
          text-align: center;
          white-space: nowrap;
        }

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
