"use client";
// src/services/customer-admin/customer-admin.queries.ts
import { QUERY_KEYS } from "@/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCustomerLoyalty, setCustomerActive } from "./customer-admin.api";

export const useGetCustomerLoyalty = (id: number) =>
  useQuery({
    queryKey: QUERY_KEYS.CUSTOMERS.LOYALTY(id),
    queryFn: () => getCustomerLoyalty(id),
    staleTime: 30_000,
  });

export const useSetCustomerActive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      setCustomerActive(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMERS.ALL });
      toast.success("Cập nhật trạng thái khách hàng thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
