import type { CustomerShortcut } from "@/services/customer/customer.types";
import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon, MapPinIcon } from "./icons";

export default function AccountShortcutCard({
  shortcut,
  isLoading,
  isError,
  isLeaving,
  onLeave,
  onRetry,
}: {
  shortcut?: CustomerShortcut | null;
  isLoading: boolean;
  isError: boolean;
  isLeaving: boolean;
  onLeave: () => Promise<void>;
  onRetry: () => void;
}) {
  const [confirmLeave, setConfirmLeave] = useState(false);

  if (isLoading) {
    return (
      <section className="rounded-[1.5rem] border border-stone-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="h-5 w-28 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
        <div className="mt-4 h-16 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800" />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/20">
        <h2 className="font-bold text-stone-900 dark:text-stone-100">Bàn hiện tại</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
          Chưa thể xác nhận bàn từ máy chủ. Chalo sẽ không tự đưa bạn về bàn cũ.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-11 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white dark:bg-white dark:text-stone-900"
        >
          Thử lại
        </button>
      </section>
    );
  }

  if (!shortcut) {
    return (
      <section className="rounded-[1.5rem] border border-stone-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <h2 className="font-bold text-stone-900 dark:text-stone-100">Chưa có bàn đang dùng</h2>
        <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">
          Quét mã QR đặt tại bàn để mở thực đơn và bắt đầu gọi món.
        </p>
      </section>
    );
  }

  const tableName = shortcut.table?.name ?? "Bàn của bạn";
  const tableArea = shortcut.table?.area;

  return (
    <section className="rounded-[1.5rem] border border-brand-100 bg-white p-5 shadow-sm dark:border-brand-900/50 dark:bg-stone-900">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
          <MapPinIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
            Bàn đang kết nối
          </p>
          <h2 className="mt-1 truncate text-lg font-bold text-stone-900 dark:text-white">
            {tableName}
          </h2>
          {tableArea && (
            <p className="mt-0.5 truncate text-sm text-stone-500 dark:text-stone-400">
              {tableArea}
            </p>
          )}
        </div>
      </div>

      <Link
        href={`/menu/${encodeURIComponent(shortcut.tableToken)}`}
        className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 active:scale-[0.99]"
      >
        Tiếp tục gọi món
        <ArrowRightIcon className="size-4" />
      </Link>

      {confirmLeave ? (
        <div className="mt-3 rounded-2xl bg-stone-50 p-3 dark:bg-stone-800/70">
          <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
            Xóa lối tắt tới {tableName}?
          </p>
          <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
            Việc này không đóng bàn và không ảnh hưởng khách khác.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setConfirmLeave(false)}
              className="min-h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
            >
              Giữ lại
            </button>
            <button
              type="button"
              disabled={isLeaving}
              onClick={async () => {
                await onLeave();
                setConfirmLeave(false);
              }}
              className="min-h-11 rounded-xl bg-red-50 px-3 text-sm font-semibold text-red-700 disabled:opacity-60 dark:bg-red-950/30 dark:text-red-300"
            >
              {isLeaving ? "Đang rời..." : "Rời bàn"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmLeave(true)}
          className="mt-2 min-h-11 w-full rounded-xl px-4 text-sm font-semibold text-stone-500 transition hover:bg-stone-50 hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
        >
          Tôi đã rời bàn
        </button>
      )}
    </section>
  );
}
