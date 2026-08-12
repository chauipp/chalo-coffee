"use client";

import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { startGoogleLogin } from "@/services/auth/google-oauth";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const isGoogleConfigured =
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";

const GoogleMark = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0">
    <path
      fill="#4285F4"
      d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.7 0 4.98-.9 6.63-2.37l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
    />
    <path
      fill="#FBBC05"
      d="M6.39 13.92A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.92V7.46H3.04A10 10 0 0 0 2 12c0 1.62.39 3.15 1.04 4.54l3.35-2.62Z"
    />
    <path
      fill="#EA4335"
      d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.71 9.39 5.95 12 5.95Z"
    />
  </svg>
);

export default function GoogleSignInButton() {
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleClick = () => {
    if (!isGoogleConfigured || isRedirecting) return;
    setIsRedirecting(true);
    startGoogleLogin(searchParams.get("redirect"));
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={!isGoogleConfigured || isRedirecting}
        aria-describedby={!isGoogleConfigured ? "google-login-config" : undefined}
        className="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
      >
        {isRedirecting ? (
          <SpinnerIcon className="size-5 animate-spin" />
        ) : (
          <GoogleMark />
        )}
        {isRedirecting ? "Đang chuyển tới Google" : "Tiếp tục với Google"}
      </button>

      {!isGoogleConfigured && (
        <p
          id="google-login-config"
          className="text-center text-xs leading-5 text-amber-700 dark:text-amber-400"
        >
          Đăng nhập Google chưa được cấu hình. Vui lòng dùng tài khoản nội bộ.
        </p>
      )}
    </div>
  );
}
