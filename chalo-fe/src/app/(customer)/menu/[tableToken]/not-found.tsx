// src/app/(customer)/menu/[tableToken]/not-found.tsx

export default function TableNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-3xl bg-brand-50 text-4xl">
          ☕
        </div>
        <h1 className="text-xl font-bold text-gray-900">Mã QR không hợp lệ</h1>
        <p className="mt-2 text-sm text-gray-500">
          Mã QR này đã hết hạn hoặc không tồn tại.
          <br />
          Vui lòng quét lại mã QR tại bàn.
        </p>
      </div>
    </div>
  );
}
