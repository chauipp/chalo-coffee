// src/app/(customer)/menu/[tableToken]/cart/page.tsx
"use client";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import {
  useCreateOrder,
  useGetEstimatedWait,
} from "@/services/order/order.queries";
import { useCartStore } from "@/stores/cart.store";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function CartPage() {
  const { tableToken } = useParams<{ tableToken: string }>();
  const router = useRouter();
  const [note, setNote] = useState<string>("");

  const items = useCartStore((s) => s.items);
  const totalAmount = useCartStore((s) => s.getTotalAmount);
  const clearCart = useCartStore((s) => s.clearCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const createOrderMutation = useCreateOrder();
  const { data: waitData } = useGetEstimatedWait();

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;
    const order = await createOrderMutation.mutateAsync({
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        note: item.note,
      })),
      note: note,
      tableToken: tableToken,
    });
    clearCart();
    router.push(`/menu/${tableToken}/orders/${order.id}`);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-200">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            ← Quay lại
          </button>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            Giỏ hàng
          </h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 dark:text-gray-500">
          <div className="size-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <span className="text-4xl">🛒</span>
          </div>
          <p className="text-sm font-medium">Bàn của quý khách chưa có món</p>
          <button
            onClick={() => router.back()}
            className="mt-2 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors shadow-sm"
          >
            Tiếp tục chọn món
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col w-screen transition-colors duration-200">
      {/* header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button
          onClick={() => router.back()}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          ← Quay lại
        </button>
        <h1 className="text-base font-bold text-gray-900 dark:text-white flex-1">
          Giỏ hàng
        </h1>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
          {items.length} món
        </span>
      </header>
      {/* content */}
      <main className="p-4 space-y-4 pb-32">
        {/* Wait time */}
        {waitData && waitData.estimatedMinutes > 0 && (
          <div className="rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 p-3.5 flex items-center gap-3 shadow-sm">
            <span className="text-xl">⏱️</span>
            <p className="text-sm text-orange-800 dark:text-orange-300">
              Thời gian chờ dự kiến:{" "}
              <strong className="font-semibold">
                ~{waitData.estimatedMinutes} phút
              </strong>
            </p>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="relative flex gap-3 rounded-2xl bg-white dark:bg-gray-900 p-3 shadow-sm border border-gray-100 dark:border-gray-800 transition-colors"
            >
              {/* Product Image */}
              <div className="size-20 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-3xl shrink-0 overflow-hidden border border-gray-100 dark:border-gray-700">
                {item.productImageUrl ? (
                  <img
                    src={item.productImageUrl}
                    alt={item.productName}
                    className="size-full object-cover"
                  />
                ) : (
                  "☕"
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate pr-6">
                    {item.productName}
                  </p>
                  <p className="text-sm font-bold text-brand-600 dark:text-brand-400 mt-1">
                    {item.price.toLocaleString("vi-VN")}đ
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="flex size-7 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all text-lg font-medium"
                  >
                    -
                  </button>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white w-5 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    className="flex size-7 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all text-lg font-medium"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Remove Button - Căn góc trên bên phải thẻ */}
              <button
                className="absolute right-6 mt-1 size-6 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-500/10"
                onClick={() => removeItem(item.productId)}
                aria-label="Xoá món"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Note Textarea */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 shadow-sm transition-colors">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ghi chú cho đơn hàng
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="VD: Ít đường, không đá..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:focus:ring-brand-400/20 resize-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
          ></textarea>
        </div>
      </main>

      {/* summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-4 space-y-3 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-gray-600 dark:text-gray-400">
            Tổng cộng
          </span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {totalAmount().toLocaleString("vi-VN")}đ
          </span>
        </div>
        <button
          onClick={handleSubmitOrder}
          disabled={createOrderMutation.isPending}
          className="w-full rounded-2xl bg-brand-500 dark:bg-brand-600 py-3.5 text-base font-semibold text-white
            hover:bg-brand-600 dark:hover:bg-brand-500 active:scale-[0.98] transition-all
            disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
            flex items-center justify-center gap-2 shadow-sm"
        >
          {createOrderMutation.isPending && (
            <SpinnerIcon className="size-5 animate-spin" />
          )}
          {createOrderMutation.isPending
            ? "Đang gửi đơn..."
            : "Xác nhận đặt món"}
        </button>
      </div>
    </div>
  );
}
