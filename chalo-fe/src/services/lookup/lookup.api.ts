import { API } from "@/constants"
import { request } from "@/lib/api-client"
import { SimpleOptions } from "./lookup.types"

export const getCategorySimpleList = (): Promise<SimpleOptions[]> => {
  return request.get(API.CATEGORY.SIMPLE_LIST)
}

export const getTableAreas = (): Promise<SimpleOptions[]> => {
  return request.get(API.TABLE.AREAS)
}
