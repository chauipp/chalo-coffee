import { QUERY_KEYS } from "@/constants";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CreateTablePayload,
  TablePageParams,
  UpdateTablePayload,
} from "./table.types";
import {
  createTable,
  deleteTable,
  getTableByToken,
  getTableList,
  getTablePage,
  regenerateQr,
  updateTable,
} from "./table.api";
import { toast } from "sonner";

// src/services/table/table.queries.ts
const invalidateTables = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: QUERY_KEYS.TABLES.ALL });
  qc.invalidateQueries({ queryKey: QUERY_KEYS.TABLES.LIST });
};

export const useGetTablePage = (params: TablePageParams) => {
  return useQuery({
    queryKey: QUERY_KEYS.TABLES.PAGE(params),
    queryFn: () => getTablePage(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
};

export const useGetTableList = () =>
  useQuery({
    queryKey: QUERY_KEYS.TABLES.LIST,
    queryFn: getTableList,
    // Nhân viên sàn cần trạng thái bàn tương đối tươi
    refetchInterval: 15_000,
  });

export const useGetTableByToken = (token: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.TABLES.TOKEN(token),
    queryFn: () => getTableByToken(token),
    staleTime: 60 * 1000,
  });
};
export const useCreateTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTablePayload) => createTable(data),
    onSuccess: () => {
      invalidateTables(qc);
      toast.success("Thêm bàn thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
export const useUpdateTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTablePayload) => updateTable(data),
    onSuccess: () => {
      invalidateTables(qc);
      toast.success("Cập nhật bàn thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTable(id),
    onSuccess: () => {
      invalidateTables(qc);
      toast.success("Xoá bàn thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useRegenerateQr = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => regenerateQr(id),
    onSuccess: () => {
      invalidateTables(qc);
      toast.success("Đã tạo mã QR mới");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
