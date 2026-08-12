import { CoffeeIcon } from "./icons";

export default function LoyaltyBalanceCard({
  balance,
  isLoading,
  isError,
  onRetry,
}: {
  balance?: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <section
      aria-labelledby="loyalty-heading"
      className="relative overflow-hidden rounded-[1.75rem] bg-linear-to-br from-brand-700 via-brand-600 to-brand-500 p-5 text-white shadow-[0_16px_40px_-24px_rgba(126,77,32,0.9)]"
    >
      <div
        aria-hidden="true"
        className="absolute -right-8 -top-12 size-40 rounded-full border-[26px] border-white/8"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p
            id="loyalty-heading"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-100"
          >
            Điểm Chalo
          </p>
          {isLoading ? (
            <div className="mt-3 h-10 w-32 animate-pulse rounded-xl bg-white/15" />
          ) : isError ? (
            <div className="mt-3">
              <p className="text-sm text-brand-50">Chưa tải được điểm.</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 min-h-11 rounded-xl bg-white/15 px-4 text-sm font-semibold hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <p className="mt-2 text-4xl font-bold tracking-tight">
              {(balance ?? 0).toLocaleString("vi-VN")} điểm
            </p>
          )}
          <p className="mt-2 max-w-[15rem] text-sm leading-6 text-brand-50/85">
            Mỗi 1.000đ đã thanh toán được cộng 1 điểm.
          </p>
        </div>

        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
          <CoffeeIcon className="size-6" />
        </div>
      </div>
    </section>
  );
}
