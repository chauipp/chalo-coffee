import { BadRequestException, ConflictException } from '@nestjs/common';
import { ShiftService } from './shift.service';
import { CashShiftStatus } from './entities/cash-shift.entity';

describe('ShiftService operations', () => {
  const shift = { id: 'shift-1', status: CashShiftStatus.OPEN, openingCash: 50_000, openedByUserId: 1, openedAt: new Date() } as any;
  const repo = { findOne: jest.fn(), create: jest.fn((x) => x), save: jest.fn(async (x) => x), find: jest.fn() };
  const build = () => new ShiftService(repo as any, {} as any, {} as any, {} as any, {} as any, {} as any);

  it('allows only one open cash drawer', async () => {
    repo.findOne.mockResolvedValue(shift);
    await expect(build().open(2, 0)).rejects.toThrow(ConflictException);
  });

  it('requires a variance note when cash count is not expected', async () => {
    const query = { select: () => query, innerJoin: () => query, where: () => query, andWhere: () => query, getRawOne: async () => ({ total: '25' }) };
    const manager = { getRepository: jest.fn((entity: any) => entity.name === 'CashShift' ? { findOne: jest.fn().mockResolvedValue(shift), save: jest.fn() } : { createQueryBuilder: () => query }) };
    const service = new ShiftService(repo as any, {} as any, {} as any, {} as any, {} as any, { transaction: async (fn: any) => fn(manager) } as any);
    await expect(service.close(2, 1)).rejects.toThrow(BadRequestException);
  });

  it('returns a zero paid-order count without querying UUID allocations when the period has no payments', async () => {
    const transactionRepo = { find: jest.fn().mockResolvedValue([]) };
    const allocationRepo = { count: jest.fn() };
    const orderRepo = { count: jest.fn().mockResolvedValue(0) };
    const refundRepo = { find: jest.fn().mockResolvedValue([]) };
    const service = new ShiftService(repo as any, transactionRepo as any, allocationRepo as any, refundRepo as any, orderRepo as any, {} as any);

    const result = await service.report({});

    expect(result.summary.paidOrders).toBe(0);
    expect(allocationRepo.count).not.toHaveBeenCalled();
  });

  it('reports gross collections, refunds and net cash separately', async () => {
    const transactionRepo = { find: jest.fn().mockResolvedValue([{ id: 'payment-1', totalAmount: 100_000, method: 'CASH', source: 'STAFF' }]) };
    const refundRepo = { find: jest.fn().mockResolvedValue([{ paymentTransactionId: 'payment-1', amount: 30_000 }]) };
    const allocationRepo = { count: jest.fn().mockResolvedValue(1) };
    const orderRepo = { count: jest.fn().mockResolvedValue(0) };
    const result = await new ShiftService(repo as any, transactionRepo as any, allocationRepo as any, refundRepo as any, orderRepo as any, {} as any).report({});

    expect(result.summary).toMatchObject({ paidRevenue: 100_000, refunds: 30_000, netRevenue: 70_000, cash: 70_000 });
  });
});
