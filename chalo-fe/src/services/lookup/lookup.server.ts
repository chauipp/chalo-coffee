// src/services/lookup/server.ts

import { API, CACHE_TAGS } from "@/constants"
import { SimpleOptions } from "./lookup.types"

export const getCachedCategorySimpleList = async (): Promise<SimpleOptions[]> => {
  const res = await fetch(
    `${process.env.INTERNAL_API_BASE_URL}${API.CATEGORY.SIMPLE_LIST}`,
    {
      next: {
        tags: [CACHE_TAGS.MENU.CATEGORIES],
        revalidate: 3600
      },
    },
  )
  if (!res.ok) { return [] }
  const json = await res.json()
  return json.data ?? []
}

export const getCachedTableAreaList = async (): Promise<string[]> => {
  const res = await fetch(
    `${process.env.INTERNAL_API_BASE_URL}${API.TABLE.AREAS}`,
    {
      next: {
        tags: [CACHE_TAGS.TABLE.AREAS],
        revalidate: 3600
      }
    }
  )
  if (!res.ok) return []
  const json = await res.json()
  return json.data ?? []
}
