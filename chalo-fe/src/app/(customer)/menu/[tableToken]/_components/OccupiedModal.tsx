// src/app/(customer)/menu/[tableToken]/_components/OccupiedModal.tsx

export const OccupiedModal = ({
  tableName,
  onContinue,
  onGoBack,
}: {
  tableName: string;
  onContinue: () => void;
  onGoBack: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4">
      <div className="w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pb-8 sm:pb-6">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="size-16 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-3xl">
            ☕
          </div>
        </div>

        <h2 className="text-center text-base font-bold text-gray-900 dark:text-white mb-2">
          {tableName} đang được sử dụng
        </h2>

        {/* description */}
        <p>
          Bàn này đang có đơn chưa được thanh toán.
          <br />
          Nếu quý khách chung nhóm, hãy chọn{" "}
          <strong>"Chung nhóm, tiếp tục"</strong>.
        </p>

        {/* actions */}
        <div>
          <button
            onClick={onContinue}
            className="w-full rounded-2xl bg-brand-500 dark:bg-brand-600 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 dark:hover:bg-brand-500 active:scale-[0.98] transition-all"
          >
            🍽️ Ăn chung, tiếp tục đặt món
          </button>
          <button
            onClick={onGoBack}
            className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 py-3.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.98] transition-all"
          >
            ← Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};
