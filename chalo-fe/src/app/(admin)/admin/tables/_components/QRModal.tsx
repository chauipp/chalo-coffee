"use client";
// src/app/(admin)/admin/tables/_components/QRModal.tsx
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { Modal } from "@/components/shared/ui/Modal";
import { TableDto, useRegenerateQr } from "@/services/table";

interface QRModalProps {
  table: TableDto | null;
  onClose: () => void;
}

export const QRModal = ({ table, onClose }: QRModalProps) => {
  const regenerateQrMutation = useRegenerateQr();

  if (!table) return;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>QR ${table.name}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; padding: 40px; }
            img { width: 280px; height: 280px; }
            h2 { margin-top: 16px; font-size: 20px; }
            p { color: #666; font-size: 14px; margin-top: 4px; }
          </style>
        </head>
        <body>
          <img src="${table.qrCodeUrl}" />
          <h2>${table.name}</h2>
          <p>Khu vực: ${table.area}</p>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal title={`Mã QR - ${table.name}`} onClose={onClose} open={!!table}>
      <div className="flex flex-col items-center gap-4">
        {/* QR Image */}
        <div className="rounded-2xl border-2 border-gray-100 dark:border-gray-800 p-4 bg-white">
          <img
            src={table.qrCodeUrl}
            alt={`QR code - ${table.name}`}
            className="size-52"
          />
        </div>

        {/* Table info */}
        <div className="text-center">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {table.name}
          </p>
          <p className="text-sm text-gray-500">{table.area}</p>
          <p className="mt-1 text-xs text-gray-400 font-mono break-all">
            {table.qrToken}
          </p>
        </div>

        {/* Actions */}
        <div className="flex w-full gap-3">
          <button
            onClick={() => regenerateQrMutation.mutate(table.id)}
            disabled={regenerateQrMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {regenerateQrMutation.isPending && (
              <SpinnerIcon className="size-4 animate-spin" />
            )}
            🔄 Tạo QR mới
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors"
          >
            🖨️ In QR
          </button>
        </div>
      </div>
    </Modal>
  );
};
