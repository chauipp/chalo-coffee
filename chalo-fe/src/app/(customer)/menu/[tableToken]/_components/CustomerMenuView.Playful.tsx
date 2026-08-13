"use client";
// src/app/(customer)/menu/[tableToken]/_components/CustomerMenuView.Playful.tsx
import { ThemeSwitch } from "@/components/shared/ThemeSwitch";
import { OrderThemeSwitch } from "@/components/shared/OrderThemeSwitch";
import { CategoryDto, ProductDto } from "@/services/menu";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { CustomerMenuViewProps } from "./CustomerMenuView.types";

export const CustomerMenuViewPlayful = ({
  tableName,
  categories,
  activeCateId,
  onSelectCategory,
  search,
  onSearchChange,
  grouped,
  filterProduct,
  hasAnyProduct,
  isFiltering,
  onAddToCart,
  onCallStaff,
  callCooldown,
  callStaffPending,
  itemCount,
  onCartClick,
  onOrdersClick,
}: CustomerMenuViewProps) => {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-950 dark:bg-carnival dark:text-brand-50">
      <header className="sticky top-0 z-30 border-b-2 border-stone-900 bg-white px-4 py-3 dark:border-brand-50 dark:bg-carnival-raised">
        <div className="mx-auto flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                aria-label="Chalo Coffee - Trang chủ"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border-2 border-stone-900 bg-pop-500 text-xs font-black text-stone-950 dark:border-brand-50"
              >
                CH
              </Link>
              <div className="min-w-0">
                <p className="truncate text-sm font-black leading-none sm:text-base">
                  Chalo Coffee
                </p>
                <p className="mt-1 truncate text-xs text-stone-500 dark:text-stone-400">
                  {tableName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onCallStaff}
                disabled={callCooldown || callStaffPending}
                aria-label="Gọi nhân viên"
                title={
                  callCooldown ? "Đã gọi, nhân viên đang đến" : "Gọi nhân viên đến bàn"
                }
                className="flex size-8 items-center justify-center rounded-full border-2 border-stone-900 bg-white text-stone-700 disabled:opacity-40 dark:border-brand-50 dark:bg-carnival-raised dark:text-brand-100"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </button>
              <OrderThemeSwitch />
              <ThemeSwitch />
              <button
                onClick={onOrdersClick}
                className="rounded-full border-2 border-stone-900 bg-pop-500 px-3 py-2 text-xs font-bold text-stone-950 dark:border-brand-50"
              >
                Đơn của tôi
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(16rem,24rem)_1fr] md:items-center">
            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm món..."
                className="w-full rounded-full border-2 border-stone-900 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-pop-400/40 dark:border-brand-50 dark:bg-carnival-raised dark:text-brand-50"
              />
            </div>

            <div className="relative min-w-0">
              <div className="flex gap-2 overflow-x-auto rounded-full border-2 border-stone-900 bg-white p-1 dark:border-brand-50 dark:bg-carnival-raised md:justify-end">
                <button
                  onClick={() => onSelectCategory(null)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    !activeCateId
                      ? "bg-pop-500 text-stone-950"
                      : "text-stone-600 hover:bg-pop-500/10 dark:text-stone-300"
                  }`}
                >
                  Tất cả
                </button>
                {categories.map((c: CategoryDto) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectCategory(activeCateId === c.id ? null : c.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                      activeCateId === c.id
                        ? "bg-pop-500 text-stone-950"
                        : "text-stone-600 hover:bg-pop-500/10 dark:text-stone-300"
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

      <main className="mx-auto px-4 pb-28 pt-4">
        {!hasAnyProduct ? (
          <div className="py-24 text-center text-stone-500 dark:text-stone-400">
            <p className="text-sm font-medium">Thực đơn đang được cập nhật</p>
            <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
              Vui lòng quay lại sau hoặc gọi nhân viên để được hỗ trợ.
            </p>
          </div>
        ) : isFiltering ? (
          filterProduct.length === 0 ? (
            <div className="py-20 text-center text-stone-500 dark:text-stone-400">
              <p className="text-sm">Không tìm thấy món phù hợp</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filterProduct.map((p: ProductDto) => (
                <ProductCard
                  product={p}
                  key={p.id}
                  onAddToCart={(quantity, itemNote, modifierOptionIds, price, cartKey) =>
                    onAddToCart(p, quantity, itemNote, modifierOptionIds, price, cartKey)
                  }
                />
              ))}
            </div>
          )
        ) : (
          <div className="space-y-8">
            {grouped?.map(({ category, products }) => (
              <section key={category.id}>
                <h2 className="mb-3 text-base font-black sm:text-lg">
                  {category.name}
                </h2>
                <div className="grid gap-3">
                  {products.map((p: ProductDto) => (
                    <ProductCard
                      product={p}
                      key={p.id}
                      onAddToCart={(quantity, itemNote, modifierOptionIds, price, cartKey) =>
                        onAddToCart(p, quantity, itemNote, modifierOptionIds, price, cartKey)
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <button
        onClick={onCartClick}
        disabled={itemCount === 0}
        aria-label="Xem giỏ hàng"
        className="motion-safe:enabled:animate-bounce fixed bottom-5 right-4 z-30 flex size-16 items-center justify-center rounded-full border-2 border-stone-900 bg-pop-500 text-stone-950 shadow-[4px_5px_0_var(--color-stone-900)] transition active:scale-95 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none dark:border-brand-50 dark:shadow-[4px_5px_0_var(--color-pop-600)] dark:disabled:border-stone-700 dark:disabled:bg-stone-800 sm:bottom-7 sm:right-7"
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
        <span
          key={itemCount}
          className="absolute -right-1 -top-1 flex min-w-6 items-center justify-center rounded-full border-2 border-stone-900 bg-stone-950 px-1.5 py-0.5 text-xs font-bold text-white motion-safe:animate-[badge-pop_0.25s_cubic-bezier(0.16,1,0.3,1)] dark:border-brand-50"
        >
          {itemCount}
        </span>
      </button>
    </div>
  );
};
