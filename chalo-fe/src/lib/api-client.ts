import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { handleApiError, triggerSessionExpired } from "./error-handler";

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

export const tokenStore = {
  clearTokens: (): void => {
    // Dọn persistence cũ sau khi migrate từ localStorage sang HttpOnly cookie.
    localStorage.removeItem('chalo-auth');
  },
};

let isRefreshing = false;

let reqQueue: Array<{
  resolve: () => void;
  reject: (err: Error) => void;
}> = [];

const drainQueue = () => {
  reqQueue.forEach((req) => req.resolve());
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
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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
          resolve: () => {
              resolve(apiClient(original));
            },
            reject,
          });
        });
      }
      isRefreshing = true;

      try {
        await axios.post<ApiResponse<unknown>>(
          `${API_BASE}/auth/refresh-token`,
          undefined,
          { skipAuth: true, withCredentials: true } as AxiosRequestConfig,
        );
        drainQueue();
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
    return apiClient.get<ApiResponse<T>, T>(url, config) as unknown as Promise<T>;
  },
  post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return apiClient.post<ApiResponse<T>, T>(url, data, config) as unknown as Promise<T>;
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.put<ApiResponse<T>, T>(url, data, config) as unknown as Promise<T>;
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.delete<ApiResponse<T>, T>(url, config) as unknown as Promise<T>;
  },
  download(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    return apiClient.get<Blob, Blob>(url, { ...config, responseType: "blob" }) as unknown as Promise<Blob>;
  },
  upload<T>(
    url: string,
    formData?: FormData,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return apiClient.post<ApiResponse<T>, T>(url, formData, {
      ...config,
      headers: { "Content-Type": "multipart/form-data" },
    }) as unknown as Promise<T>;
  },
};
