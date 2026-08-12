"use client";

import { QUERY_KEYS } from "@/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCustomerLoyalty,
  getCustomerOrders,
  getCustomerProfile,
  getCustomerShortcut,
  leaveCustomerTable,
  scanCustomerTable,
} from "./customer.api";
import type { CustomerOrderParams } from "./customer.types";

export const useCustomerProfile = () =>
  useQuery({
    queryKey: QUERY_KEYS.CUSTOMER.PROFILE,
    queryFn: getCustomerProfile,
  });

export const useCustomerShortcut = () =>
  useQuery({
    queryKey: QUERY_KEYS.CUSTOMER.SHORTCUT,
    queryFn: getCustomerShortcut,
    staleTime: 30_000,
  });

export const useCustomerLoyalty = () =>
  useQuery({
    queryKey: QUERY_KEYS.CUSTOMER.LOYALTY,
    queryFn: getCustomerLoyalty,
    staleTime: 30_000,
  });

export const useCustomerOrders = (params: CustomerOrderParams = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.CUSTOMER.ORDERS(params),
    queryFn: () => getCustomerOrders(params),
    staleTime: 30_000,
  });

export const useScanTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: scanCustomerTable,
    onSuccess: (shortcut) => {
      queryClient.setQueryData(QUERY_KEYS.CUSTOMER.SHORTCUT, shortcut);
    },
  });
};

export const useLeaveTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveCustomerTable,
    onSuccess: () => {
      queryClient.setQueryData(QUERY_KEYS.CUSTOMER.SHORTCUT, null);
    },
  });
};
