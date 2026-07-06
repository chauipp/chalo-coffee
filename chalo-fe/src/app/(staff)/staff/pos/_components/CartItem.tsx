// src/app/(staff)/staff/pos/_components/CartItem.tsx
import { useState } from "react";
import { POSCartItem } from "../page";

interface CartItemProps {
  item: POSCartItem;
  onRemoveFromCart: (productId: string) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onUpdateItemNote: (productId: string, note: string) => void; // Thêm prop này
}

export const CartItem = ({
  item,
  onRemoveFromCart,
  onUpdateQuantity,
  onUpdateItemNote,
}: CartItemProps) => {
  // Trạng thái mở ô input ghi chú
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Hiển thị input khi đang edit HOẶC khi đã có ghi chú từ trước
  const showNoteInput = isEditingNote || (item.note && item.note.length > 0);

  return (
    <div className="py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 flex flex-col gap-1.5 transition-all">
      {/* --- DÒNG 1: Tên món, Giá, Nút xoá, Tăng giảm số lượng --- */}
      <div className="flex items-start gap-2">
        <button
          onClick={() => onRemoveFromCart(item.productId)}
          title="Xoá món"
          className="size-6 mt-0.5 shrink-0 rounded-full text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center transition-colors focus:outline-none"
        >
          <span className="text-[10px] font-bold">✕</span>
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {item.productName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
              {item.price.toLocaleString("vi-VN")}đ
            </p>
            
            {/* Nút gọi UI thêm ghi chú (chỉ hiện khi chưa có ô input) */}
            {!showNoteInput && (
              <button
                onClick={() => setIsEditingNote(true)}
                className="text-[10px] px-1.5 py-0.5 rounded text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors flex items-center gap-1"
              >
                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Thêm ghi chú
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onUpdateQuantity(item.productId, -1)}
            className="size-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            -
          </button>
          <span className="w-6 text-center text-sm font-bold text-gray-900 dark:text-gray-100">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.productId, 1)}
            className="size-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* --- DÒNG 2: Ô nhập ghi chú (Trượt xuống mượt mà) --- */}
      {showNoteInput && (
        <div className="pl-8 pr-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="relative flex items-center">
            <input
              type="text"
              autoFocus={isEditingNote && !item.note} // Tự động focus để gõ ngay khi bấm "Thêm ghi chú"
              value={item.note || ""}
              onChange={(e) => onUpdateItemNote(item.productId, e.target.value)}
              onBlur={() => {
                // Khi click ra ngoài, nếu trống thì tự động giấu ô input đi cho gọn
                setIsEditingNote(false);
              }}
              placeholder="Ghi chú (ít đá, nhiều sữa, không hành...)"
              className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-xs px-2.5 py-1.5 rounded-md outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all text-gray-700 dark:text-gray-300 placeholder:text-gray-400 pr-7"
            />
            {/* Nút xoá nhanh ghi chú */}
            {item.note && (
              <button
                onClick={() => onUpdateItemNote(item.productId, "")}
                className="absolute right-1.5 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-[9px] font-bold block">✕</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};