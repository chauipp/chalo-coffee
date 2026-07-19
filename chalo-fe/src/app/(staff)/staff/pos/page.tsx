// src/app/(staff)/staff/pos/page.tsx
"use client";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { QUERY_KEYS } from "@/constants";
import { useInfinitePagination } from "@/hooks/useInfinitePagination";
import { useGetCategorySimpleList } from "@/services/lookup/lookup.queries";
import { getProductPage, ProductDto, ProductPageParam } from "@/services/menu";
import { useCreateOrder } from "@/services/order/order.queries";
import { useGetTableList } from "@/services/table";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CartItem } from "./_components/CartItem";
import { PagerBoard } from "./_components/PagerBoard";
import { ProductCard } from "./_components/ProductCard";
import { useCart } from "./_hooks/useCart";

export interface POSCartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  note?: string;
}

export default function StaffPOSPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedTableToken, setSelectedTableToken] = useState<string>("");
  const [pagerNumber, setPagerNumber] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [note, setNote] = useState<string>("");
  const [showConfirmCreateOrder, setShowConfirmCreateOrder] =
    useState<boolean>(false);
  const [showConfirmRemoveCart, setShowConfirmRemoveCart] =
    useState<boolean>(false);
  const [showPagerBoard, setShowPagerBoard] = useState(false);

  const { data: categories } = useGetCategorySimpleList();

  // Tìm món theo tên — debounce 300ms để không spam API theo từng phím
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const productFilter = useMemo<ProductPageParam>(
    () => ({
      pageNo: 1,
      pageSize: 50,
      categoryId: selectedCategoryId || undefined,
      name: debouncedSearch || undefined,
      status: "AVAILABLE",
    }),
    [selectedCategoryId, debouncedSearch],
  );
  const productPage = useInfinitePagination<ProductDto, ProductPageParam>({
    initialFilter: productFilter,
    queryFn: getProductPage,
    queryKey: QUERY_KEYS.MENU.PRODUCTS,
  });

  const { data: tables } = useGetTableList();
  const createOrderMutation = useCreateOrder();

  const products = productPage.data;

  const {
    cart,
    addToCart,
    clearCart,
    removeFromCart,
    totalAmount,
    totalItems,
    updateItemNote,
    updateQuantity,
  } = useCart();

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }
    if (!selectedTableToken) {
      toast.error("Vui lòng chọn bàn");
      return;
    }

    setIsSubmitting(true);
    try {
      const pagerNo = Number(pagerNumber.trim());
      const hasPager =
        pagerNumber.trim() !== "" && Number.isInteger(pagerNo) && pagerNo > 0;

      const order = await createOrderMutation.mutateAsync({
        tableToken: selectedTableToken,
        note: note.trim() || undefined,
        pagerNumber: hasPager ? pagerNo : undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          note: item.note?.trim() || undefined,
        })),
      });

      if (order.pagerNumber != null) {
        toast.success(`Đã gán thẻ bàn #${order.pagerNumber}`);
      }
      toast.success(
        `Tạo đơn thành công - #${order.id.slice(-6).toUpperCase()}`,
      );
      clearCart();
      setSelectedTableToken("");
      setPagerNumber("");
      setNote("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-0 overflow-hidden">
      {/* Left — Product Grid */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 border-b md:border-r md:border-b-0 border-gray-200 dark:border-gray-800">
        {/* Search + Category tabs */}
        <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-800 overflow-x-auto shrink-0 bg-white dark:bg-gray-900">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm món..."
            aria-label="Tìm món"
            className="w-44 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 placeholder:text-gray-400"
          />
          <button
            onClick={() => setSelectedCategoryId("")}
            className={`shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors
              ${
                selectedCategoryId === ""
                  ? "bg-brand-400 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
          >
            Tất cả
          </button>
          {(categories ?? []).map((cate) => (
            <button
              key={cate.id}
              onClick={() => setSelectedCategoryId(cate.id)}
              className={`shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors
              ${
                selectedCategoryId === cate.id
                  ? "bg-brand-400 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {cate.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {productPage.isLoading ? (
            <div className="flex items-center justify-center h-40">
              <SpinnerIcon className="size-8 animate-spin text-brand-400" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-1 text-gray-400">
              <p className="text-sm">Không tìm thấy món phù hợp</p>
              <p className="text-xs">Thử đổi từ khoá hoặc danh mục khác</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] gap-2">
              {products.map((p) => {
                const inCart = cart.find((i) => i.productId === p.id);
                return (
                  <ProductCard
                    key={p.id}
                    inCart={inCart}
                    onAddToCart={addToCart}
                    product={p}
                  />
                );
              })}
            </div>
          )}
          <div ref={productPage.loadMoreRef} className="flex justify-center py-4">
            {productPage.isFetchingNextPage ? (
              <span className="text-sm text-gray-400">Đang tải thêm...</span>
            ) : productPage.hasNextPage ? (
              <span className="text-xs text-gray-400">Cuộn để tải thêm</span>
            ) : products.length > 0 ? (
              <span className="text-xs text-gray-400">Đã hiển thị tất cả</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Right — Order Panel (mobile: xuống dưới, chiếm ~45% chiều cao) */}
      <div className="w-72 shrink-0 flex flex-col bg-white dark:bg-gray-900 overflow-hidden max-md:w-full max-md:basis-[45%] max-md:min-h-0">
        {/* header */}
        <div className="px-4 py-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">
              Đơn tại quầy
            </h2>
            {totalItems > 0 && (
              <p className="text-xs text-gray-400">{totalItems} món</p>
            )}
          </div>
          <button
            onClick={() => setShowPagerBoard(true)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            🔔 Thẻ bàn
          </button>
        </div>

        {/* table & pager selector */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 space-y-2.5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Bàn *
            </label>
            <select
              value={selectedTableToken}
              onChange={(e) => setSelectedTableToken(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-900 dark:text-gray-100 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            >
              <option value="">- Chọn bàn -</option>
              {(tables ?? []).map((t) => (
                <option key={t.id} value={t.qrToken}>
                  {t.name}
                  {t.area ? ` · ${t.area}` : ""}
                  {t.status === "OCCUPIED" ? " (có khách)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Thẻ bàn (số)
            </label>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={pagerNumber}
              onChange={(e) => setPagerNumber(e.target.value)}
              placeholder="VD: 12"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-900 dark:text-gray-100 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Ghi chú cho bàn
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú"
              rows={2}
              className="w-full resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-900 dark:text-gray-100 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
              <span className="text-3xl">🛒</span>
              <p className="text-sm">Chưa có món nào</p>
            </div>
          ) : (
            cart.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onRemoveFromCart={removeFromCart}
                onUpdateQuantity={updateQuantity}
                onUpdateItemNote={updateItemNote}
              />
            ))
          )}
        </div>

        {/* footer */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
          {cart.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Tổng cộng</span>
              <span className="text-base font-bold text-brand-600 dark:text-brand-400">
                {totalAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>
          )}

          <div className="flex gap-2">
            {cart.length > 0 && (
              <button
                onClick={() => setShowConfirmRemoveCart(true)}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Xoá tất cả
              </button>
            )}
            <button
              onClick={() => setShowConfirmCreateOrder(true)}
              disabled={isSubmitting || cart.length === 0}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-400 hover:bg-brand-500 py-3 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              Tạo đơn
            </button>
          </div>
        </div>
      </div>

      {/* confirm create order */}
      <ConfirmDialog
        message="Xác nhận tạo đơn ?"
        onClose={() => setShowConfirmCreateOrder(false)}
        onConfirm={handleSubmit}
        open={showConfirmCreateOrder}
        title="Xác nhận tạo đơn ?"
        isLoading={createOrderMutation.isPending}
        confirmLabel="Tạo đơn"
      />

      {/* confirm delete cart */}
      <ConfirmDialog
        message="Xác nhận xoá giỏ hàng này ?"
        onClose={() => setShowConfirmRemoveCart(false)}
        onConfirm={clearCart}
        open={showConfirmRemoveCart}
        title="Xác nhận xoá giỏ hàng này ?"
        confirmLabel="Xoá"
      />

      {/* active pager board */}
      <PagerBoard
        open={showPagerBoard}
        onClose={() => setShowPagerBoard(false)}
      />
    </div>
  );
}
