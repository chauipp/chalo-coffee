// src/services/table/table.api.ts
import { API } from "@/constants";
import { request } from "@/lib/api-client";
import {
  CreateTablePayload,
  TableDto,
  TablePageParams,
  TablePublicDto,
  UpdateTablePayload,
} from "./table.types";
import { PageResult } from "../types";

export const getTablePage = (
  params: TablePageParams,
): Promise<PageResult<TableDto>> => {
  return request.get(API.TABLE.PAGE, { params });
};

export const getTableList = (): Promise<TableDto[]> =>
  request.get(API.TABLE.LIST);

export const getTableByToken = (token: string): Promise<TablePublicDto> =>
  request.get(`${API.TABLE.BY_TOKEN}/${token}`);

export const createTable = (data: CreateTablePayload): Promise<TableDto> =>
  request.post(API.TABLE.CREATE, data);

export const updateTable = (data: UpdateTablePayload): Promise<TableDto> =>
  request.put(API.TABLE.UPDATE, data);

export const regenerateQr = (id: string): Promise<TableDto> =>
  request.put(API.TABLE.REGENERATE_QR, { id });

export const deleteTable = (id: string): Promise<void> =>
  request.delete(API.TABLE.DELETE, { params: { id } });
