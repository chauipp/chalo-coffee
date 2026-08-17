import { QUERY_KEYS } from "@/constants";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "./audit.api";

export const useAuditLogs = (params: { entityType?: string; entityId?: string; limit?: number }, enabled = true) => useQuery({ queryKey: QUERY_KEYS.AUDIT.LOGS(params), queryFn: () => getAuditLogs(params), enabled, staleTime: 10_000 });
