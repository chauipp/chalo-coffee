// src/services/table/table.server.ts

import { API } from "@/constants";
import { INTERNAL_API } from "@/constants/server";
import { TablePublicDto } from "./table.types";

export const getTableByTokenServer = async (
  token: string,
): Promise<TablePublicDto | null> => {
  try {
    const res = await fetch(`${INTERNAL_API}${API.TABLE.BY_TOKEN}/${token}`, {
      cache: "no-cache",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (error) {
    return null;
  }
};
