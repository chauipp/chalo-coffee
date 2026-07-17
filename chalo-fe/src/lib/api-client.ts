import { TOKEN_KEYS } from "@/constants";
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { handleApiError, triggerSessionExpired } from "./error-handler";
import { useAuthStore } from "@/stores/auth.store";

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const isClient = typeof window !== "undefined";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

export const tokenStore = {
  clearTokens: (): void => {
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
    const expired = "path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = `${TOKEN_KEYS.ACCESS}=; ${expired}`;
    document.cookie = `${TOKEN_KEYS.REFRESH}=; ${expired}`;
    document.cookie = `${TOKEN_KEYS.ROLE}=; ${expired}`;
  },
};

let isRefreshing = false;

let reqQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: Error) => void;
}> = [];

const drainQueue = (token: string) => {
  reqQueue.forEach((req) => req.resolve(token));
  reqQueue = [];
};

const rejectQueue = (err: Error) => {
  reqQueue.forEach((req) => req.reject(err));
  reqQueue = [];
};

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
    skipAuth?: boolean;
  }
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accToken = useAuthStore.getState().accessToken;
    if (accToken && !config.skipAuth) {
      config.headers.Authorization = `Bearer ${accToken}`;
    }
    if (config.method) {
      config.headers["Cache-Control"] = "no-cache";
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    const { code, message, data } = response.data;

    // Unwrap the whole 2xx success range — POST creates (e.g. /auth/register,
    // /order/create) return code 201, not just 200.
    if (code >= 200 && code < 300) return data;

    const err = new axios.AxiosError(
      message,
      String(code),
      response.config,
      response.request,
      { ...response, data: response.data },
    );
    return Promise.reject(err);
  },
  async (error: AxiosError) => {
    const original = error.config!;
    const status = error.status;

    const backendMessage = (error.response?.data as ApiResponse)?.message ?? "";
    if (backendMessage) error.message = backendMessage;

    if (status === 401 && !original._retry && !original.skipAuth) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          reqQueue.push({
            resolve: (newToken) => {
              original.headers.Authorization = `Bearer ${newToken}`;
              resolve(apiClient(original));
            },
            reject,
          });
        });
      }
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error("No refresh token");
        const { data: responseData } = await axios.post<ApiResponse<TokenPair>>(
          `${API_BASE}/auth/refresh-token`,
          { refreshToken },
          { skipAuth: true } as AxiosRequestConfig,
        );
        const newTokens = responseData.data;
        useAuthStore
          .getState()
          .setTokens(newTokens.accessToken, newTokens.refreshToken);
        drainQueue(newTokens.accessToken);
        original.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return apiClient(original);
      } catch (error) {
        rejectQueue(error as Error);
        triggerSessionExpired();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    handleApiError(
      error as AxiosError<{ message: string; code: number; data: unknown }>,
    );

    return Promise.reject(error);
  },
);

export const request = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.get<ApiResponse<T>, T>(url, config);
  },
  post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return apiClient.post<ApiResponse<T>, T>(url, data, config);
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.put<ApiResponse<T>, T>(url, data, config);
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.delete<ApiResponse<T>, T>(url, config);
  },
  download(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    return apiClient.get<Blob, Blob>(url, { ...config, responseType: "blob" });
  },
  upload<T>(
    url: string,
    formData?: FormData,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return apiClient.post<ApiResponse<T>, T>(url, formData, {
      ...config,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
