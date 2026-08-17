"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  getPwaPromptKind,
  isIOSDevice,
  isStandaloneDisplay,
  shouldRegisterServiceWorker,
  type PwaPromptKind,
} from "./pwa-install";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "chalo-pwa-install-dismissed";
const mobileUserAgent = /Android|iPhone|iPad|iPod/i;
const NOTICE_HEADER_GAP = 8;

function getSessionDismissal(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

function saveSessionDismissal(): void {
  try {
    window.sessionStorage.setItem(DISMISS_KEY, "true");
  } catch {
    // Session storage can be unavailable in privacy-restricted contexts.
  }
}

export default function PwaInstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const dismissedRef = useRef(false);
  const [promptKind, setPromptKind] = useState<PwaPromptKind>("none");
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [headerBottom, setHeaderBottom] = useState(0);

  useEffect(() => {
    let animationFrame: number | undefined;
    const resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(scheduleMeasurement);

    function scheduleMeasurement() {
      if (animationFrame !== undefined) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = undefined;
        const visibleHeaderBottom = [...document.querySelectorAll("header")].reduce(
          (maxBottom, header) => {
            const rect = header.getBoundingClientRect();
            const style = window.getComputedStyle(header);
            const isVisible =
              rect.width > 0 &&
              rect.height > 0 &&
              rect.bottom > 0 &&
              style.display !== "none" &&
              style.visibility !== "hidden";

            return isVisible ? Math.max(maxBottom, rect.bottom) : maxBottom;
          },
          0,
        );
        setHeaderBottom((currentBottom) => {
          const nextBottom = Math.ceil(visibleHeaderBottom);
          return currentBottom === nextBottom ? currentBottom : nextBottom;
        });
      });
    }

    function observeCurrentHeaders() {
      resizeObserver?.disconnect();
      document.querySelectorAll("header").forEach((header) => resizeObserver?.observe(header));
      scheduleMeasurement();
    }

    const mutationObserver = new MutationObserver(observeCurrentHeaders);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden"],
    });
    window.addEventListener("resize", scheduleMeasurement);
    window.addEventListener("orientationchange", scheduleMeasurement);
    observeCurrentHeaders();

    return () => {
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", scheduleMeasurement);
      window.removeEventListener("orientationchange", scheduleMeasurement);
    };
  }, []);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const ios = isIOSDevice(userAgent, navigator.maxTouchPoints);
    const mobile = mobileUserAgent.test(userAgent) || ios;
    const standalone = isStandaloneDisplay(
      window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches,
      (navigator as Navigator & { standalone?: boolean }).standalone,
    );
    const wasDismissed = getSessionDismissal();

    dismissedRef.current = wasDismissed;
    setDismissed(wasDismissed);

    if (shouldRegisterServiceWorker("serviceWorker" in navigator, process.env.NODE_ENV)) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    if (wasDismissed) return;

    setPromptKind(
      getPwaPromptKind({
        standalone,
        mobile,
        ios,
        installAvailable: false,
      }),
    );

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as BeforeInstallPromptEvent;

      if (dismissedRef.current) return;

      setPromptKind(
        getPwaPromptKind({
          standalone,
          mobile,
          ios,
          installAvailable: true,
        }),
      );
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  const dismiss = () => {
    dismissedRef.current = true;
    deferredPrompt.current = null;
    saveSessionDismissal();
    setDismissed(true);
  };

  const install = async () => {
    const installPrompt = deferredPrompt.current;
    if (!installPrompt || installing) return;

    deferredPrompt.current = null;
    setInstalling(true);

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "dismissed") {
        dismissedRef.current = true;
        saveSessionDismissal();
        setDismissed(true);
      }
    } catch {
      // Browser prompt failures should not surface as app errors or toasts.
    } finally {
      setInstalling(false);
      setPromptKind("none");
    }
  };

  if (dismissed || promptKind === "none") return null;

  const noticeStyle = {
    "--pwa-notice-top": `${headerBottom + NOTICE_HEADER_GAP}px`,
  } as CSSProperties & { "--pwa-notice-top": string };

  return (
    <aside
      data-testid="pwa-install-prompt"
      className="fixed inset-x-4 top-[calc(var(--pwa-notice-top)+env(safe-area-inset-top))] z-50 mx-auto max-w-sm rounded-2xl border border-stone-200 bg-white p-4 shadow-xl dark:border-stone-700 dark:bg-stone-900"
      aria-label="Cài ứng dụng Chalo Coffee"
      style={noticeStyle}
    >
      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
        Cài ứng dụng Chalo Coffee
      </p>
      <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-stone-300">
        {promptKind === "ios-guide"
          ? "Mở menu Chia sẻ, rồi chọn Thêm vào Màn hình chính."
          : "Cài ứng dụng để mở Chalo Coffee nhanh hơn."}
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="min-h-11 rounded-lg px-3 text-sm font-medium text-stone-700 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Để sau
        </button>
        {promptKind === "install" && (
          <button
            type="button"
            onClick={() => void install()}
            disabled={installing}
            aria-busy={installing}
            className="min-h-11 rounded-lg bg-brand-500 px-3 text-sm font-semibold text-white hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {installing ? "Đang mở…" : "Cài ứng dụng"}
          </button>
        )}
      </div>
    </aside>
  );
}
