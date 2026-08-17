import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import { AuditAction, AuditLog } from './entities/audit-log.entity';

export type AuditInput = { actorUserId?: number | null; action: AuditAction; entityType: string; entityId?: string | null; metadata?: Record<string, unknown> | null };

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>) {}

  async record(input: AuditInput, manager?: EntityManager) {
    const repo = manager?.getRepository(AuditLog) ?? this.auditRepo;
    return repo.save(repo.create({
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? null,
    }));
  }

  list(filters: { entityType?: string; entityId?: string; limit?: number }) {
    const where: FindOptionsWhere<AuditLog> = {};
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    return this.auditRepo.find({ where, order: { createdAt: 'DESC' }, take: Math.min(Math.max(filters.limit ?? 50, 1), 200) });
  }
}
