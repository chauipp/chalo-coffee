import { PaymentMethod, PaymentSource, PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { PaymentService } from './payment.service';
import { RefundTransaction } from './entities/refund-transaction.entity';
import { AuditAction } from '../audit/entities/audit-log.entity';

describe('Payment reconciliation ledger contract', () => {
  it('keeps a cash collection as one transaction with separate order allocations', () => {
    const transaction = { method: PaymentMethod.CASH, source: PaymentSource.STAFF, totalAmount: 70_000, receivedAmount: 100_000, changeAmount: 30_000 } as PaymentTransaction;
    const allocations = [{ orderId: 'one', amount: 35_000 }, { orderId: 'two', amount: 35_000 }] as PaymentAllocation[];
    expect(allocations.reduce((sum, allocation) => sum + allocation.amount, 0)).toBe(transaction.totalAmount);
    expect(transaction.changeAmount).toBe(transaction.receivedAmount! - transaction.totalAmount);
  });

  it('has an explicit legacy method rather than pretending old paid orders were cash', () => {
    expect(PaymentMethod.LEGACY).toBe('LEGACY');
    expect(PaymentSource.LEGACY).toBe('LEGACY');
  });

  it('locks a payment, records one refund and writes an audit record', async () => {
    const refunds: Array<Partial<RefundTransaction>> = [{ amount: 25_000 }];
    const refundRepo = {
      find: jest.fn().mockResolvedValue(refunds),
      create: jest.fn((value) => ({ id: 'refund-2', ...value })),
      save: jest.fn(async (value) => value),
    };
    const manager = {
      findOne: jest.fn().mockResolvedValue({ id: 'payment-1', totalAmount: 100_000, method: PaymentMethod.CASH }),
      getRepository: jest.fn((entity) => entity === RefundTransaction ? refundRepo : undefined),
    };
    const transactionRepo = { manager: { transaction: async (fn) => fn(manager) } };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const service = new PaymentService(transactionRepo as never, {} as never, {} as never, {} as never, audit as never);

    const result = await service.refund('payment-1', {
      amount: 50_000,
      method: PaymentMethod.CASH,
      reason: 'Khách đổi ý',
    }, 9);

    expect(manager.findOne).toHaveBeenCalledWith(
      PaymentTransaction,
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
    expect(result).toMatchObject({ refundedAmount: 75_000, refundableAmount: 25_000 });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.REFUND_CREATED, actorUserId: 9 }),
      manager,
    );
  });
});
