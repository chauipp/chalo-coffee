// src/app/(print)/admin/tables/[tableId]/print/QrA6Sheet.tsx
// Thẻ QR khổ A6 (105×148mm) — tách riêng để dùng lại được (trang in thật +
// trang preview). CSS in ấn đi kèm ở A6_PRINT_CSS ngay dưới.
import { TableDto } from "@/services/table";
import { QRCodeSVG } from "qrcode.react";

/* ── Thông tin quán (tĩnh — sau này có thể chuyển vào Settings) ── */
const SHOP_NAME = "Chalo Coffee";
const WIFI_NAME = "chalocoffee";
const WIFI_PASS = "chalocoffee";

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

const WifiIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path
      d="M2.5 9.5a15 15 0 0 1 19 0M5.5 13a10 10 0 0 1 13 0M8.6 16.4a5.3 5.3 0 0 1 6.8 0"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="12" cy="19.6" r="1.5" fill="currentColor" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <rect
      x="5"
      y="10.5"
      width="14"
      height="9.5"
      rx="2.5"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="12" cy="15.2" r="1.4" fill="currentColor" />
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
export const QrA6Sheet = ({
  table,
  menuUrl,
}: {
  table: TableDto;
  menuUrl: string;
}) => {
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

          {/* ── Ô 2: GIỚI THIỆU QUÁN + WIFI ──────────────────── */}
          <section className="cell cell-intro">
            <CoffeeCupIcon className="intro-icon text-brand-500" />
            <h2 className="intro-name text-coffee-dark">{SHOP_NAME}</h2>
            {/* Tagline giới thiệu — ngay dưới tên quán */}
            <div className="intro-tagline">
              <span className="tagline-highlight text-brand-600">
                Cà phê mộc Cầu Đất Đà Lạt
              </span>
              <span className="tagline-slogan text-coffee-default">
                Thưởng thức để cảm nhận sự khác biệt
              </span>
            </div>
            <div className="intro-divider bg-brand-300" />
            <div className="wifi-row">
              <WifiIcon className="wifi-row-icon text-brand-500" />
              <div>
                <p className="wifi-label">Wi-Fi</p>
                <p className="wifi-value text-coffee-dark">{WIFI_NAME}</p>
              </div>
            </div>
            <div className="wifi-row">
              <LockIcon className="wifi-row-icon text-brand-500" />
              <div>
                <p className="wifi-label">Mật khẩu</p>
                <p className="wifi-value text-coffee-dark">{WIFI_PASS}</p>
              </div>
            </div>
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

/* ── CSS in ấn — dùng chung cho trang in thật lẫn trang preview ── */
export const A6_PRINT_CSS = `
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
  .cell-intro { justify-content: center; }
  .intro-icon { width: 8mm; height: 8mm; margin-bottom: 2mm; }
  .intro-name {
    font-size: 4.8mm;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
  }
  /* Tagline giới thiệu — ngay dưới tên quán, trên đường kẻ */
  .intro-tagline {
    display: flex;
    flex-direction: column;
    gap: 0.6mm;
    margin-top: 1.4mm;
  }
  .tagline-highlight {
    font-size: 2.9mm;
    font-weight: 600;
    line-height: 1.25;
  }
  .tagline-slogan {
    font-size: 2.6mm;
    font-weight: 400;
    font-style: italic;
    line-height: 1.3;
  }
  .intro-divider { width: 8mm; height: 0.7mm; border-radius: 1mm; margin: 3mm 0 1.5mm; }
  .wifi-row {
    display: flex;
    align-items: center;
    gap: 2.2mm;
    margin-top: 3mm;
  }
  .wifi-row-icon { width: 5.5mm; height: 5.5mm; flex-shrink: 0; }
  .wifi-label {
    font-size: 2.6mm;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #a8a29e;
  }
  .wifi-value {
    font-size: 4mm;
    font-weight: 700;
    line-height: 1.25;
    word-break: break-all;
  }

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
`;
