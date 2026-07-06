"use client";
// src/hooks/useTablePagination.ts

import { PageParam, PageResult } from "@/services/types";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

export interface BaseFilter extends PageParam {}

export interface PaginationState {
  pageNo: number;
  pageSize: number;
  total: number;
  totalPage: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}
export interface UseTablePaginationProps<T, F extends BaseFilter> {
  queryKey: readonly unknown[];
  queryFn: (params: F) => Promise<PageResult<T>>;
  initialFilter: F;
  staleTime?: number;
}

export interface UseTablePaginationReturn<T, F extends BaseFilter> {
  data: T[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  pagination: PaginationState;
  filter: F;
  updateFilter: (f: Partial<Omit<F, "pageNo" | "pageSize">>) => void;
  changePage: (page: number) => void;
  changePageSize: (pageSize: number) => void;
  resetFilter: () => void;
  refresh: () => void;
}

export function useTablePagination<T, F extends BaseFilter>({
  queryKey,
  queryFn,
  initialFilter,
  staleTime = 30_000,
}: UseTablePaginationProps<T, F>): UseTablePaginationReturn<T, F> {
  const [filter, setFilter] = useState<F>(initialFilter);
  const qc = useQueryClient();

  const qkFull = useMemo(() => {
    return [...queryKey, filter];
  }, [queryKey, filter]);

  const {
    data: res,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: qkFull,
    queryFn: () => queryFn(filter),
    staleTime,
    placeholderData: keepPreviousData,
  });

  const total = res?.total ?? 0;

  const pagination = useMemo<PaginationState>(() => {
    const pageNo = filter.pageNo;
    const pageSize = filter.pageSize;
    const totalPage = Math.ceil(total / pageSize) || 1;
    return {
      pageNo,
      pageSize,
      total,
      totalPage,
      hasPrevPage: pageNo > 1,
      hasNextPage: totalPage > pageNo,
    };
  }, [filter.pageNo, filter.pageSize, total]);

  const updateFilter = useCallback(
    (params: Partial<Omit<F, "pageNo" | "pageSize">>) => {
      setFilter((prev) => ({ ...prev, ...params, pageNo: 1 }));
    },
    [],
  );

  const changePage = useCallback((pageNo: number) => {
    setFilter((prev) => ({ ...prev, pageNo }));
  }, []);

  const changePageSize = useCallback((pageSize: number) => {
    setFilter((prev) => ({ ...prev, pageSize, pageNo: 1 }));
  }, []);

  const resetFilter = useCallback(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKey });
  }, [queryKey, qc]);

  return {
    data: res?.list ?? [],
    total: total,
    isLoading,
    isFetching,
    isError,
    error: error as Error | null,
    pagination,
    filter,
    updateFilter,
    changePage,
    changePageSize,
    resetFilter,
    refresh,
  };
}
