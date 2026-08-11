// src/app/(print)/admin/tables/print-sheet/A4Face.tsx
import { TableDto } from "@/services/table";
import { QrA6Sheet } from "../[tableId]/print/QrA6Sheet";

export type SheetCell = { table: TableDto; menuUrl: string } | null;

/** Một mặt giấy A4 = lưới 2×2 thẻ A6 (mỗi ô 105×148mm). */
export const A4Face = ({
  cells,
  rotate180,
  showCutMarks = true,
}: {
  cells: SheetCell[];
  rotate180: boolean;
  showCutMarks?: boolean;
}) => (
  <div className="a4-sheet bg-white">
    <div className="a4-grid">
      {cells.map((cell, i) => (
        <div className="a4-cell" key={i}>
          {cell ? (
            rotate180 ? (
              <div className="rot180">
                <QrA6Sheet table={cell.table} menuUrl={cell.menuUrl} />
              </div>
            ) : (
              <QrA6Sheet table={cell.table} menuUrl={cell.menuUrl} />
            )
          ) : null}
        </div>
      ))}
    </div>
    {showCutMarks && (
      <>
        <div className="cut-line cut-v" />
        <div className="cut-line cut-h" />
      </>
    )}
  </div>
);

export const A4_FACE_CSS = `
  .a4-sheet {
    position: relative;
    width: 210mm;
    height: 297mm;
    overflow: hidden;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .a4-grid {
    display: grid;
    grid-template-columns: 105mm 105mm;
    grid-template-rows: 148mm 148mm;
    width: 210mm;
    height: 296mm;
  }
  .a4-cell { width: 105mm; height: 148mm; overflow: hidden; }
  .a4-cell .rot180 { transform: rotate(180deg); width: 105mm; height: 148mm; }
  /* Vạch cắt: chữ thập mảnh giữa tờ, trùng nhau cả 2 mặt (trục tâm bất biến khi lật) */
  .cut-line { position: absolute; background: rgba(120,120,120,0.5); }
  .cut-v { top: 0; left: 105mm; width: 0.2mm; height: 296mm; transform: translateX(-0.1mm); }
  .cut-h { left: 0; top: 148mm; height: 0.2mm; width: 210mm; transform: translateY(-0.1mm); }
`;
