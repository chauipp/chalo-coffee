"use client";

import { PageParam, PageResult } from "@/services/types";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type BaseInfiniteFilter = PageParam;

export interface UseInfinitePaginationProps<T, F extends BaseInfiniteFilter> {
  queryKey: readonly unknown[];
  queryFn: (params: F) => Promise<PageResult<T>>;
  initialFilter: F;
  staleTime?: number;
}

export interface UseInfinitePaginationReturn<T, F extends BaseInfiniteFilter> {
  data: T[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  filter: F;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  fetchNextPage: () => void;
  updateFilter: (f: Partial<Omit<F, "pageNo" | "pageSize">>) => void;
  resetFilter: () => void;
  refresh: () => void;
}

export function useInfinitePagination<T, F extends BaseInfiniteFilter>({
  queryKey,
  queryFn,
  initialFilter,
  staleTime = 30_000,
}: UseInfinitePaginationProps<T, F>): UseInfinitePaginationReturn<T, F> {
  const [filter, setFilter] = useState<F>(initialFilter);
  const qc = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const queryFilter = useMemo(() => {
    const next = { ...filter } as Partial<F>;
    delete next.pageNo;
    return next;
  }, [filter]);

  const {
    data: res,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [...queryKey, queryFilter],
    queryFn: ({ pageParam }) =>
      queryFn({ ...filter, pageNo: pageParam } as F),
    initialPageParam: 1,
    staleTime,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const loaded = allPages.reduce((sum, page) => sum + page.list.length, 0);
      return loaded < lastPage.total ? lastPageParam + 1 : undefined;
    },
  });

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage();
      },
      { rootMargin: "240px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const data = useMemo(
    () => res?.pages.flatMap((page) => page.list) ?? [],
    [res],
  );
  const total = res?.pages.at(-1)?.total ?? 0;

  const updateFilter = useCallback(
    (params: Partial<Omit<F, "pageNo" | "pageSize">>) => {
      setFilter((prev) => ({ ...prev, ...params, pageNo: 1 }));
    },
    [],
  );

  const resetFilter = useCallback(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey });
  }, [queryKey, qc]);

  return {
    data,
    total,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isError,
    error: error as Error | null,
    hasNextPage,
    filter,
    loadMoreRef,
    fetchNextPage: () => fetchNextPage(),
    updateFilter,
    resetFilter,
    refresh,
  };
}
