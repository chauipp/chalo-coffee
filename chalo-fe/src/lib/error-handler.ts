// src\lib\error-handler.ts
import type { AxiosError } from "axios";
import { toast } from "sonner";
import {
  BUSINESS_ERROR_MAP,
  DEFAULT_ERROR_MESSAGE,
  HTTP_ERROR_MAP,
  SILENT_ERROR_MESSAGES,
  type ErrorTier,
} from "./error-config";
import { showCriticalError } from "@/stores/critical-error.store";
import { ROUTES, TOKEN_KEYS } from "@/constants";

interface ApiErrorBody {
  message: string;
  code: number;
  data: unknown;
}

const resolveConfig = (
  serverMessage: string | undefined,
  errorCode: number | undefined,
  isHttpError: boolean,
): { message: string; tier: ErrorTier } => {
  const mapped = isHttpError
    ? HTTP_ERROR_MAP[errorCode ?? 0]
    : BUSINESS_ERROR_MAP[errorCode ?? 0];
  return {
    message: serverMessage || mapped?.message || DEFAULT_ERROR_MESSAGE,
    tier: mapped?.tier ?? "toast",
  };
};

const dispatchError = (message: string, tier: ErrorTier) => {
  switch (tier) {
    case "toast": {
      toast.error(message, { duration: 4000 });
      break;
    }
    case "notification": {
      toast.error(message, { duration: 8000, closeButton: true });
      break;
    }
    case "modal": {
      showCriticalError({ title: "Thông báo quan trọng", message });
      break;
    }
  }
};

export const handleApiError = (error: AxiosError<ApiErrorBody>): void => {
  const serverMessage = error.response?.data?.message;
  const businessErrorCode = error.response?.data?.code;
  const httpStatus = error.response?.status;
  const isHttpError = !error.response || error.response.status !== 200;

  if (serverMessage && SILENT_ERROR_MESSAGES.includes(serverMessage)) return;

  if (!error.response) {
    toast.error("Lỗi kết nối mạng. Vui lòng kiểm tra internet.", {
      duration: 4000,
    });
    return;
  }

  const errorCode = isHttpError ? httpStatus : businessErrorCode;

  const { message, tier } = resolveConfig(
    serverMessage,
    errorCode,
    isHttpError,
  );
  dispatchError(message, tier);
};

export const triggerSessionExpired = () => {
  showCriticalError({
    title: "Phiên làm việc đã hết hạn",
    message: "Vui lòng đăng nhập lại",
    confirmLabel: "Đăng nhập lại",
    onConfirm: () => {
      localStorage.removeItem(TOKEN_KEYS.ACCESS);
      localStorage.removeItem(TOKEN_KEYS.REFRESH);

      const expired = "path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = `${TOKEN_KEYS.ACCESS}=; ${expired}`;
      document.cookie = `${TOKEN_KEYS.REFRESH}=; ${expired}`;
      document.cookie = `${TOKEN_KEYS.ROLE}=; ${expired}`;

      window.location.href = `${ROUTES.LOGIN}?redirect=${encodeURIComponent(window.location.pathname)}`;
    },
  });
};
