"use client";

import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { parseCustomerTableToken } from "@/services/customer/customer-qr";
import { useScanTable } from "@/services/customer/customer.queries";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { CameraIcon, QrIcon, XIcon } from "./icons";

type BarcodeDetectorResult = { rawValue: string };
type BarcodeDetectorInstance = {
  detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResult[]>;
};
type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

const getBarcodeDetector = (): BarcodeDetectorConstructor | null =>
  (window as typeof window & { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector ?? null;

const scannerMessage = (error: unknown): string => {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Bạn chưa cấp quyền camera. Hãy cho phép camera hoặc nhập mã bàn bên dưới.";
  }
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "Không tìm thấy camera trên thiết bị này. Bạn vẫn có thể nhập mã bàn.";
  }
  return "Chưa thể mở camera. Bạn vẫn có thể nhập mã bàn hoặc liên kết QR.";
};

export default function TableQrScanner({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const scanTable = useScanTable();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const handlingResultRef = useRef(false);
  const [value, setValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraState, setCameraState] = useState<"idle" | "starting" | "scanning">("idle");

  const stopCamera = useCallback(() => {
    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState("idle");
  }, []);

  const submitValue = useCallback(
    async (rawValue: string) => {
      if (handlingResultRef.current) return;
      handlingResultRef.current = true;
      setFormError(null);
      try {
        const tableToken = parseCustomerTableToken(rawValue, window.location.origin);
        await scanTable.mutateAsync({ tableToken });
        stopCamera();
        router.push(`/menu/${encodeURIComponent(tableToken)}`);
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : "Chưa thể vào bàn. Vui lòng thử lại.",
        );
      } finally {
        handlingResultRef.current = false;
      }
    },
    [router, scanTable, stopCamera],
  );

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setCameraState("starting");

    const BarcodeDetector = getBarcodeDetector();
    if (!BarcodeDetector) {
      setCameraState("idle");
      setCameraError(
        "Trình duyệt này chưa hỗ trợ quét QR trực tiếp. Hãy nhập mã bàn hoặc liên kết QR.",
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("idle");
      setCameraError("Thiết bị không hỗ trợ camera trong trình duyệt này.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();
      setCameraState("scanning");
      const detector = new BarcodeDetector({ formats: ["qr_code"] });

      const detect = async () => {
        if (!streamRef.current || handlingResultRef.current) return;
        try {
          const results = await detector.detect(video);
          if (results[0]?.rawValue) {
            await submitValue(results[0].rawValue);
            return;
          }
        } catch {
          setCameraError("Camera đang gặp lỗi. Hãy nhập mã bàn bên dưới.");
          stopCamera();
          return;
        }
        animationRef.current = window.requestAnimationFrame(detect);
      };
      animationRef.current = window.requestAnimationFrame(detect);
    } catch (error) {
      stopCamera();
      setCameraError(scannerMessage(error));
    }
  }, [stopCamera, submitValue]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    setValue("");
    setFormError(null);
    setCameraError(null);
    return stopCamera;
  }, [isOpen, stopCamera]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitValue(value);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/55 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl dark:bg-stone-900 sm:rounded-[2rem]">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-stone-200 dark:bg-stone-700 sm:hidden" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="qr-scanner-title"
              className="text-xl font-bold text-stone-900 dark:text-white"
            >
              Quét mã bàn
            </h2>
            <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">
              Quét QR trên bàn hoặc nhập mã để vào thực đơn ngay.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng quét mã bàn"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        <div className="relative mt-5 flex aspect-4/3 overflow-hidden rounded-[1.5rem] bg-stone-950">
          <video
            ref={videoRef}
            muted
            playsInline
            className={`size-full object-cover ${cameraState === "scanning" ? "block" : "hidden"}`}
          />
          {cameraState !== "scanning" && (
            <div className="flex size-full flex-col items-center justify-center px-6 text-center text-white">
              <div className="flex size-16 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/15">
                {cameraState === "starting" ? (
                  <SpinnerIcon className="size-7 animate-spin" />
                ) : (
                  <CameraIcon className="size-7" />
                )}
              </div>
              <p className="mt-4 text-sm font-semibold">
                {cameraState === "starting"
                  ? "Đang mở camera..."
                  : "Đưa camera về phía mã QR trên bàn"}
              </p>
              {cameraState === "idle" && (
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="mt-4 min-h-11 rounded-xl bg-white px-5 text-sm font-bold text-stone-900"
                >
                  Mở camera
                </button>
              )}
            </div>
          )}
          {cameraState === "scanning" && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-[16%] rounded-3xl border-2 border-white/85 shadow-[0_0_0_999px_rgba(0,0,0,0.28)]" />
          )}
        </div>

        {cameraError && (
          <p
            role="status"
            className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-sm leading-5 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
          >
            {cameraError}
          </p>
        )}

        <div className="my-5 flex items-center gap-3 text-xs font-medium text-stone-400">
          <span className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
          hoặc nhập thủ công
          <span className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label
            htmlFor="customer-table-token"
            className="text-sm font-semibold text-stone-700 dark:text-stone-200"
          >
            Mã bàn hoặc liên kết QR
          </label>
          <div className="relative mt-2">
            <QrIcon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-stone-400" />
            <input
              id="customer-table-token"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setFormError(null);
              }}
              autoComplete="off"
              spellCheck={false}
              placeholder="Ví dụ: fixed-qr"
              className="min-h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-11 pr-4 text-base text-stone-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:ring-brand-950"
            />
          </div>
          {formError && (
            <p role="alert" className="mt-2 text-sm leading-5 text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}
          <button
            type="submit"
            disabled={scanTable.isPending}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-4 text-sm font-bold text-white transition hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-60"
          >
            {scanTable.isPending && <SpinnerIcon className="size-4 animate-spin" />}
            {scanTable.isPending ? "Đang vào bàn..." : "Vào bàn"}
          </button>
        </form>
      </section>
    </div>
  );
}
