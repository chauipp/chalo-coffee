'use client'
// src/services/lookup/queries.ts

import { QUERY_KEYS } from "@/constants"
import { getCategorySimpleList, getTableAreas } from "./lookup.api"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export const useGetCategorySimpleList = () =>
  useQuery({
    queryKey: QUERY_KEYS.LOOKUP.CATEGORIES,
    queryFn: getCategorySimpleList,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000
  })


export const useGetTableAreas = () =>
  useQuery({
    queryKey: QUERY_KEYS.LOOKUP.TABLE_AREAS,
    queryFn: getTableAreas,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000
  })


export const useInvalidateLookup = () => {
  const qc = useQueryClient()
  return {
    categories: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.LOOKUP.CATEGORIES }),
    tableAreas: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.LOOKUP.TABLE_AREAS }),
    all: () => qc.invalidateQueries({ queryKey: ['lookup'] })
  }
}