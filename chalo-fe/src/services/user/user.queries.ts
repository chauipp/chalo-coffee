"use client";
// src/services/user/user.queries.ts
import { QUERY_KEYS } from "@/constants";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  changePassword,
  createUser,
  deleteUser,
  getUserPage,
  updateUser,
} from "./user.api";
import {
  ChangePasswordPayload,
  CreateUserPayload,
  UpdateUserPayload,
  UserPageParams,
} from "./user.types";

export const useGetUserPage = (params: UserPageParams) =>
  useQuery({
    queryKey: QUERY_KEYS.USERS.PAGE(params),
    queryFn: () => getUserPage(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserPayload) => createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      toast.success("Thêm nhân viên thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserPayload) => updateUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      toast.success("Cập nhật nhân viên thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: (data: ChangePasswordPayload) => changePassword(data),
    onSuccess: () => toast.success("Đổi mật khẩu thành công"),
    onError: (e: Error) => toast.error(e.message),
  });

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      toast.success("Xoá nhân viên thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
