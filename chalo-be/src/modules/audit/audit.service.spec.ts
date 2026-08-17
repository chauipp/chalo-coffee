import { AuditService } from './audit.service';
import { AuditAction } from './entities/audit-log.entity';

describe('AuditService append-only log', () => {
  it('creates a durable entry and exposes no mutation operation', async () => {
    const repo = {
      create: jest.fn((value) => ({ id: 'audit-1', ...value })),
      save: jest.fn(async (value) => value),
      find: jest.fn(),
    };
    const service = new AuditService(repo as never);
    const entry = await service.record({
      actorUserId: 7,
      action: AuditAction.REFUND_CREATED,
      entityType: 'payment_transaction',
      entityId: 'payment-1',
    });

    expect(entry).toMatchObject({ action: AuditAction.REFUND_CREATED, actorUserId: 7 });
    expect(repo).not.toHaveProperty('update');
    expect(repo).not.toHaveProperty('delete');
  });
});
