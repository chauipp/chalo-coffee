"use client";
// src/app/(customer)/menu/[tableToken]/_components/CustomerMenuClient.tsx
import { useTheme } from "@/providers/ThemeProvider";
import { CategoryDto, ProductDto } from "@/services/menu";
import { useCartStore } from "@/stores/cart.store";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { OccupiedModal } from "./OccupiedModal";
import { ProductCard } from "./ProductCard";

interface CustomerMenuClientProps {
  tableName: string;
  categories: CategoryDto[];
  initProducts: ProductDto[];
  isOccupied: boolean;
}

const themeOptions = [
  { value: "light" as const, label: "Sáng" },
  { value: "dark" as const, label: "Tối" },
  { value: "system" as const, label: "Hệ thống" },
];

export const CustomerMenuClient = ({
  categories,
  initProducts,
  tableName,
  isOccupied,
}: CustomerMenuClientProps) => {
  const { tableToken } = useParams<{ tableToken: string }>();
  const router = useRouter();
  const { theme, changeTheme } = useTheme();
  const [activeCateId, setActiveCateId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [showOccupiedModal, setShowOccupiedModal] = useState<boolean>(() => {
    if (typeof window === "undefined" || !isOccupied) return false;

    const storageKey = `occupied_modal_${tableName}`;
    const hasShownModal = sessionStorage.getItem(storageKey);
    if (hasShownModal) return false;

    sessionStorage.setItem(storageKey, "true");
    return true;
  });

  const itemCount = useCartStore((s) => s.getItemCount());
  const addItem = useCartStore((s) => s.addItem);

  const filterProduct = useMemo(() => {
    let list = initProducts;
    if (activeCateId) list = list.filter((p) => p.categoryId === activeCateId);
    if (search) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return list;
  }, [initProducts, activeCateId, search]);

  const grouped = useMemo(() => {
    if (activeCateId || search) return null;
    return categories
      .map((cat) => ({
        category: cat,
        products: initProducts.filter((p) => p.categoryId === cat.id),
      }))
      .filter((g) => g.products.length > 0);
  }, [search, activeCateId, initProducts, categories]);

  const handleAddToCart = (product: ProductDto, quantity: number) => {
    addItem(
      {
        productId: product.id,
        price: product.price,
        productImageUrl: product.imageUrl,
        productName: product.name,
      },
      quantity,
    );
  };

  return (
    <>
      {showOccupiedModal && (
        <OccupiedModal
          onContinue={() => setShowOccupiedModal(false)}
          onGoBack={() => {
            setShowOccupiedModal(false);
            router.back();
          }}
          tableName={tableName}
        />
      )}

      <div className="min-h-screen bg-gray-50 text-gray-950 dark:bg-gray-950 dark:text-gray-50">
        <header className="sticky top-0 z-30 border-b border-gray-100/80 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-950/90 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white shadow-sm">
                  CH
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold leading-none text-gray-950 dark:text-gray-50 sm:text-base">
                    Chalo Coffee
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                    {tableName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-full border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-800 dark:bg-gray-900">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => changeTheme(option.value)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors sm:px-3 ${
                        theme === option.value
                          ? "bg-white text-gray-950 shadow-sm dark:bg-gray-800 dark:text-gray-50"
                          : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => router.push(`/menu/${tableToken}/orders`)}
                  className="rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-200 dark:hover:bg-brand-900/50"
                >
                  Đơn của tôi
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(16rem,24rem)_1fr] md:items-center">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                  Tìm
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm món..."
                  className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-12 pr-4 text-sm text-gray-950 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50 dark:placeholder:text-gray-500"
                />
              </div>

              <div className="relative min-w-0">
                <div className="pointer-events-none absolute inset-y-1 left-0 z-10 w-6 bg-gradient-to-r from-white/90 to-transparent dark:from-gray-950/90 md:hidden" />
                <div className="pointer-events-none absolute inset-y-1 right-0 z-10 w-6 bg-gradient-to-l from-white/90 to-transparent dark:from-gray-950/90 md:hidden" />
                <div className="flex gap-2 overflow-x-auto rounded-full border border-gray-200 bg-gray-100/80 p-1 shadow-inner dark:border-gray-800 dark:bg-gray-900/80 md:justify-end">
                  <button
                    onClick={() => setActiveCateId(null)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                      !activeCateId
                        ? "bg-white text-brand-700 shadow-sm ring-1 ring-brand-200 dark:bg-gray-800 dark:text-brand-200 dark:ring-brand-800"
                        : "text-gray-600 hover:bg-white/70 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-100"
                    }`}
                  >
                    Tất cả
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() =>
                        setActiveCateId(activeCateId === c.id ? null : c.id)
                      }
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                        activeCateId === c.id
                          ? "bg-white text-brand-700 shadow-sm ring-1 ring-brand-200 dark:bg-gray-800 dark:text-brand-200 dark:ring-brand-800"
                          : "text-gray-600 hover:bg-white/70 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-100"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 sm:px-6 lg:px-8">
          {activeCateId || search ? (
            <>
              {filterProduct.length === 0 ? (
                <div className="py-20 text-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">Không tìm thấy món phù hợp</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filterProduct.map((p) => (
                    <ProductCard
                      product={p}
                      key={p.id}
                      onAddToCart={(quantity) => handleAddToCart(p, quantity)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-8">
              {grouped?.map(({ category, products }) => (
                <section key={category.id}>
                  <h2 className="mb-3 text-base font-bold text-gray-950 dark:text-gray-50 sm:text-lg">
                    {category.name}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {products.map((p) => (
                      <ProductCard
                        product={p}
                        key={p.id}
                        onAddToCart={(quantity) => handleAddToCart(p, quantity)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>

        <button
          onClick={() => router.push(`/menu/${tableToken}/cart`)}
          disabled={itemCount === 0}
          aria-label="Xem giỏ hàng"
          className="fixed bottom-5 right-4 z-30 flex size-16 items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_18px_38px_rgba(248,146,26,0.38)] ring-4 ring-white/90 transition hover:bg-brand-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-lg disabled:ring-white/80 dark:ring-gray-950/90 dark:disabled:bg-gray-800 dark:disabled:text-gray-500 sm:bottom-7 sm:right-7"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.4 12.25a2 2 0 0 0 2 1.7h8.8a2 2 0 0 0 2-1.55l1.35-7.45H5.12" />
          </svg>
          <span className="absolute -right-1 -top-1 flex min-w-6 items-center justify-center rounded-full bg-gray-950 px-1.5 py-0.5 text-xs font-bold text-white shadow-sm ring-2 ring-white dark:bg-white dark:text-gray-950 dark:ring-gray-950">
            {itemCount}
          </span>
        </button>
      </div>
    </>
  );
};
