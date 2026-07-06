// src/services/user/user.api.ts
import { API } from "@/constants";
import { request } from "@/lib/api-client";
import { PageResult } from "../types";
import {
  ChangePasswordPayload,
  CreateUserPayload,
  UpdateUserPayload,
  UserDto,
  UserPageParams,
} from "./user.types";

export const getUserPage = (
  params: UserPageParams,
): Promise<PageResult<UserDto>> => request.get(API.USER.PAGE, { params });

export const createUser = (data: CreateUserPayload): Promise<UserDto> =>
  request.post(API.USER.CREATE, data);

export const updateUser = (data: UpdateUserPayload): Promise<UserDto> =>
  request.put(API.USER.UPDATE, data);

export const changePassword = (data: ChangePasswordPayload): Promise<void> =>
  request.put(API.USER.CHANGE_PASSWORD, data);

export const deleteUser = (id: number): Promise<void> =>
  request.delete(API.USER.DELETE, { params: { id } });
