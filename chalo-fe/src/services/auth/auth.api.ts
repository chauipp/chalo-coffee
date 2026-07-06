import { API } from "@/constants";
import { request } from "@/lib/api-client";
import { AuthUser } from "@/stores/auth.store";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser
}

export const userLogin = (data: LoginPayload): Promise<LoginResponse> => {
  return request.post(API.AUTH.LOGIN, data, { skipAuth: true } as never)
}

export interface RegisterPayload {
  username: string;
  password: string;
  fullName: string;
}

export const userRegister = (data: RegisterPayload): Promise<LoginResponse> => {
  return request.post(API.AUTH.REGISTER, data, { skipAuth: true } as never);
}

export const userLogout = (): Promise<void> => {
  return request.post(API.AUTH.LOGOUT)
}

export const getCurrentUser = (): Promise<AuthUser> => {
  return request.get(API.AUTH.ME)
}