"use client";

import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { ROUTES } from "@/constants";
import { exchangeGoogleCode } from "@/services/auth/auth.api";
import { resolveGoogleDestination } from "@/services/auth/google-oauth";
import { useAuthStore } from "@/stores/auth.store";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

type CallbackState = "loading" | "error";

function CallbackCard({ state, message }: { state: CallbackState; message?: string }) {
  const isLoading = state === "loading";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-50 px-4 py-10 dark:bg-stone-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(210,149,78,0.2),transparent_45%)]"
      />
      <section className="relative w-full max-w-sm rounded-2xl border border-stone-100 bg-white p-7 text-center shadow-xl shadow-brand-100/60 dark:border-stone-800 dark:bg-stone-900 dark:shadow-none">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          {isLoading ? (
            <SpinnerIcon className="size-6 animate-spin" />
          ) : (
            <span className="text-2xl" aria-hidden="true">!</span>
          )}
        </div>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          {isLoading ? "Đang hoàn tất đăng nhập" : "Không thể đăng nhập"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">
          {isLoading
            ? "Chalo đang xác nhận tài khoản Google của bạn."
            : message ?? "Liên kết đăng nhập không hợp lệ hoặc đã hết hạn."}
        </p>
        {!isLoading && (
          <Link
            href={ROUTES.LOGIN}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          >
            Quay lại đăng nhập
          </Link>
        )}
      </section>
    </main>
  );
}

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exchangeStarted = useRef(false);
  const [state, setState] = useState<CallbackState>("loading");
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    if (exchangeStarted.current) return;
    exchangeStarted.current = true;

    const code = searchParams.get("code");
    const returnTo = searchParams.get("returnTo");
    window.history.replaceState(null, "", "/oauth/google/callback");

    if (!code) {
      setState("error");
      setMessage("Liên kết đăng nhập thiếu mã xác nhận. Vui lòng thử lại.");
      return;
    }

    exchangeGoogleCode(code)
      .then((response) => {
        const { setUser } = useAuthStore.getState();
        setUser(response.user);
        router.replace(resolveGoogleDestination(returnTo, response.user.role));
      })
      .catch((error: unknown) => {
        const apiMessage =
          error instanceof Error && error.message
            ? error.message
            : "Phiên đăng nhập đã hết hạn. Vui lòng thử lại.";
        setMessage(apiMessage);
        setState("error");
      });
  }, [router, searchParams]);

  return <CallbackCard state={state} message={message} />;
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<CallbackCard state="loading" />}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
