// src/services/user/user.types.ts
import { PageParam } from "../types";

export const USER_ROLE = ["ADMIN", "MODERATOR"] as const;
export type UserRole = (typeof USER_ROLE)[number];

export interface UserDto {
  id: number;
  username: string;
  fullName: string;
  avatar: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export interface UpdateUserPayload {
  id: number;
  fullName: string;
  avatar: string | null;
  role: UserRole;
  isActive: boolean;
}

export interface ChangePasswordPayload {
  id: number;
  oldPassword?: string;
  newPassword: string;
}

export interface UserPageParams extends PageParam {
  keyword?: string;
  role?: UserRole;
  isActive?: boolean;
}
