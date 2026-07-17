"use client";
// src/app/(staff)/staff/orders/_components/BatchSuggestion.tsx
// Suggestion Tag gợi ý gộp đơn thông minh — ghim đầu cột "Đã xác nhận".
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { BatchSuggestion as Suggestion } from "@/utils/batching";

export const BatchSuggestion = ({
  suggestion,
  onAccept,
  onDismiss,
  isBatching,
}: {
  suggestion: Suggestion;
  onAccept: (orderIds: string[]) => void;
  onDismiss: (signature: string) => void;
  isBatching: boolean;
}) => {
  const itemsLabel = suggestion.commonProducts
    .map((p) => `${p.productName} ×${p.totalQuantity}`)
    .join(", ");

  return (
    <div
      data-testid="batch-suggestion"
      className="rounded-xl border-2 border-dashed border-brand-400/70 bg-brand-50 dark:bg-brand-900/15 p-3 space-y-2"
    >
      <p className="text-xs font-bold text-brand-700 dark:text-brand-300">
        💡 {suggestion.orderIds.length} đơn kế tiếp trùng{" "}
        {suggestion.commonProducts.length} món
      </p>
      <p className="text-xs text-brand-600/90 dark:text-brand-400/90">
        {itemsLabel} — gộp pha chung một lượt cho nhanh?
      </p>
      <div className="flex items-center gap-2 pt-0.5">
        <button
          onClick={() => onAccept(suggestion.orderIds)}
          disabled={isBatching}
          className="flex items-center gap-1.5 rounded-lg bg-brand-400 hover:bg-brand-500 active:bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
        >
          {isBatching ? <SpinnerIcon className="size-3 animate-spin" /> : null}
          Gộp &amp; pha ngay
        </button>
        <button
          onClick={() => onDismiss(suggestion.signature)}
          className="rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Bỏ qua
        </button>
      </div>
    </div>
  );
};
