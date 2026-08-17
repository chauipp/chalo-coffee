import { API } from "@/constants";
import { request } from "@/lib/api-client";
import type { AuditLogDto } from "./audit.types";

export const getAuditLogs = (params: { entityType?: string; entityId?: string; limit?: number }): Promise<AuditLogDto[]> => request.get(API.AUDIT.LOGS, { params });
