export interface AuditLogDto {
  id: string;
  actorUserId: number | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
