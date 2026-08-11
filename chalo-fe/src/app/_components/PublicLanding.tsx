"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LandingCategory } from "./landing-data";
import { formatVnd } from "./landing-data";

const MAPS_URL = "https://maps.app.goo.gl/miDX5WUrMF9vxkia8?g_st=ac";
const ZALO_URL = "https://zalo.me/0913017988";

function ArrowUpRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function CoffeeIllustration() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-64 w-64 sm:h-80 sm:w-80">
      <div className="absolute inset-4 rounded-full border border-brand-200/70 bg-brand-100/45" />
      <div className="absolute inset-11 rounded-full border border-dashed border-brand-300/80" />
      <div className="absolute left-12 top-9 text-4xl text-brand-400/70">✦</div>
      <div className="absolute bottom-8 right-7 text-2xl text-brand-300">✦</div>
      <div className="absolute left-[31%] top-[28%] h-32 w-28 rounded-b-[2.7rem] rounded-t-xl bg-brand-600 shadow-[12px_14px_0_#e0b379] sm:h-40 sm:w-32">
        <div className="absolute inset-x-2 top-2 h-7 rounded-[50%] bg-brand-100" />
        <div className="absolute -right-9 top-9 h-16 w-12 rounded-r-full border-[13px] border-l-0 border-brand-600" />
        <div className="absolute left-4 right-4 top-5 h-3 rounded-full bg-brand-200/90" />
      </div>
      <div className="absolute left-[42%] top-[12%] h-12 w-1 rounded-full bg-brand-300/80 blur-[1px]" />
      <div className="absolute left-[53%] top-[8%] h-14 w-1 rounded-full bg-brand-300/60 blur-[1px]" />
    </div>
  );
}

function ProductImage({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        loading="lazy"
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
    );
  }

  return (
    <div aria-hidden="true" className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_30%,#f8e5c8,transparent_34%),linear-gradient(145deg,#ecd0a5,#c17e39)]">
      <span className="rounded-full border border-brand-100/75 bg-brand-600 p-5 text-3xl shadow-[8px_9px_0_rgba(86,52,21,.17)]">☕</span>
    </div>
  );
}

export default function PublicLanding({ menu }: { menu: LandingCategory[] }) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all">("all");
  const visibleGroups = useMemo(
    () => menu.filter((group) => activeCategoryId === "all" || group.id === activeCategoryId),
    [activeCategoryId, menu],
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-brand-50 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-brand-100/80 bg-brand-50/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="Chalo Coffee về trang chủ" className="shrink-0 font-serif text-lg font-bold tracking-[0.14em] text-brand-800 transition hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500">
            CHALO<span className="text-brand-500">.</span>
          </Link>
          <nav aria-label="Điều hướng trang chủ" className="flex items-center gap-1 text-sm font-medium sm:gap-3">
            <a href="#menu" className="rounded-full px-3 py-2 text-stone-600 transition hover:bg-brand-100 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500">Thực đơn</a>
            <a href={MAPS_URL} target="_blank" rel="noreferrer" className="hidden rounded-full px-3 py-2 text-stone-600 transition hover:bg-brand-100 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:inline-flex">Tìm đường</a>
            <Link href="/login" className="rounded-full bg-brand-700 px-3.5 py-2 text-white shadow-sm transition hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500">Đăng nhập</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="absolute -left-24 top-8 -z-10 size-64 rounded-full bg-brand-200/45 blur-3xl" />
          <div aria-hidden="true" className="absolute -right-24 bottom-0 -z-10 size-72 rounded-full bg-brand-100 blur-3xl" />
          <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
            <div className="max-w-xl">
              <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-600"><span className="size-2 rounded-full bg-brand-500" />Chalo Coffee</p>
              <h1 className="font-serif text-5xl font-bold leading-[.98] tracking-tight text-brand-900 sm:text-6xl lg:text-7xl">Một ly ngon.<br />Một khoảng chậm.</h1>
              <p className="mt-6 max-w-md text-base leading-7 text-stone-600 sm:text-lg">Ghé Chalo để thưởng thức cà phê, trà và những món nhỏ vừa vặn cho một ngày nhẹ nhàng hơn.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#menu" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-700/20 transition hover:-translate-y-0.5 hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-500">Xem thực đơn <ArrowUpRightIcon className="size-4" /></a>
                <a href={MAPS_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-brand-300 bg-white/65 px-5 py-3 text-sm font-bold text-brand-800 transition hover:-translate-y-0.5 hover:border-brand-500 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-500"><PinIcon className="size-4" />Tìm đường tới quán</a>
              </div>
            </div>
            <CoffeeIllustration />
          </div>
        </section>

        <section id="menu" aria-labelledby="menu-heading" className="scroll-mt-20 border-y border-brand-100 bg-white/65 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Thực đơn</p>
                <h2 id="menu-heading" className="mt-2 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">Chọn món bạn thích</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-stone-500">Thực đơn được cập nhật trực tiếp từ quán.</p>
            </div>

            {menu.length > 0 ? (
              <>
                <div className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" role="tablist" aria-label="Danh mục thực đơn">
                  <button type="button" role="tab" aria-selected={activeCategoryId === "all"} aria-current={activeCategoryId === "all" ? "true" : undefined} onClick={() => setActiveCategoryId("all")} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${activeCategoryId === "all" ? "bg-brand-700 text-white" : "bg-brand-100 text-brand-800 hover:bg-brand-200"}`}>Tất cả</button>
                  {menu.map((category) => (
                    <button key={category.id} type="button" role="tab" aria-selected={activeCategoryId === category.id} aria-current={activeCategoryId === category.id ? "true" : undefined} onClick={() => setActiveCategoryId(category.id)} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${activeCategoryId === category.id ? "bg-brand-700 text-white" : "bg-brand-100 text-brand-800 hover:bg-brand-200"}`}>{category.name}</button>
                  ))}
                </div>

                <div className="mt-8 space-y-10">
                  {visibleGroups.map((group) => (
                    <div key={group.id}>
                      <div className="mb-4 flex items-baseline justify-between gap-3"><h3 className="font-serif text-xl font-bold text-brand-900">{group.name}</h3>{group.description ? <p className="hidden text-sm text-stone-500 sm:block">{group.description}</p> : null}</div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {group.products.map((product) => (
                          <article key={product.id} className="group overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-200/35">
                            <div className="aspect-[16/10] overflow-hidden"><ProductImage name={product.name} imageUrl={product.imageUrl} /></div>
                            <div className="p-4"><div className="flex items-start justify-between gap-3"><h4 className="font-semibold text-stone-900">{product.name}</h4><span className="shrink-0 text-sm font-bold text-brand-700">{formatVnd(product.price)}</span></div>{product.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-500">{product.description}</p> : <p className="mt-2 text-sm leading-6 text-stone-400">Pha chế tại Chalo Coffee</p>}</div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-brand-300 bg-brand-50 p-8 text-center"><p className="font-serif text-xl font-bold text-brand-900">Thực đơn đang được cập nhật</p><p className="mt-2 text-sm text-stone-600">Bạn có thể ghé quán hoặc nhắn Zalo để biết thêm thông tin.</p></div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="rounded-3xl bg-brand-800 px-6 py-10 text-brand-50 shadow-xl shadow-brand-900/15 sm:px-10 sm:py-14"><p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-200">Ghé Chalo hôm nay</p><div className="mt-4 flex flex-col justify-between gap-7 lg:flex-row lg:items-end"><div><h2 className="font-serif text-3xl font-bold leading-tight sm:text-4xl">Khi bạn cần một ly<br />cà phê ngon.</h2><p className="mt-3 max-w-md text-sm leading-6 text-brand-100">Tìm đường tới quán hoặc nhắn cho Chalo để được hỗ trợ nhanh.</p></div><div className="flex flex-col gap-3 sm:flex-row"><a href={MAPS_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-100 px-5 py-3 text-sm font-bold text-brand-900 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-200"><PinIcon className="size-4" />Tìm đường</a><a href={ZALO_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-brand-400 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-200">Nhắn Zalo <ArrowUpRightIcon className="size-4" /></a></div></div></div>
        </section>
      </main>

      <footer className="border-t border-brand-100 bg-white/55"><div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="font-serif font-bold tracking-[0.08em] text-brand-800">CHALO COFFEE</p><div className="flex gap-4"><a href={MAPS_URL} target="_blank" rel="noreferrer" className="hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500">Bản đồ</a><a href={ZALO_URL} target="_blank" rel="noreferrer" className="hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500">Zalo</a><Link href="/login" className="hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500">Đăng nhập</Link></div></div></footer>
    </div>
  );
}
