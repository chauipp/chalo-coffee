import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Order } from '../order/entities/order.entity';
import { CashShift, CashShiftStatus } from '../shift/entities/cash-shift.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { PaymentMethod, PaymentSource, PaymentTransaction } from './entities/payment-transaction.entity';

export type PaymentInput = { method: PaymentMethod; source: PaymentSource; collectedByUserId?: number | null; receivedAmount?: number };

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentTransaction) private readonly transactionRepo: Repository<PaymentTransaction>,
    @InjectRepository(PaymentAllocation) private readonly allocationRepo: Repository<PaymentAllocation>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(CashShift) private readonly shiftRepo: Repository<CashShift>,
  ) {}

  async record(manager: EntityManager, orders: Order[], input: PaymentInput): Promise<PaymentTransaction> {
    if (!orders.length) throw new BadRequestException('Không có đơn để thanh toán');
    const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const receivedAmount = input.method === PaymentMethod.CASH ? input.receivedAmount : undefined;
    if (input.method === PaymentMethod.CASH && (!Number.isInteger(receivedAmount) || receivedAmount! < totalAmount)) {
      throw new BadRequestException('Tiền khách đưa phải lớn hơn hoặc bằng tổng thanh toán');
    }
    if (input.method !== PaymentMethod.CASH && input.receivedAmount !== undefined) {
      throw new BadRequestException('Chuyển khoản không nhận tiền khách đưa');
    }
    const allocationRepo = manager.getRepository(PaymentAllocation);
    const existing = await allocationRepo.findOne({ where: { orderId: orders[0].id }, relations: ['paymentTransaction'] });
    if (existing?.paymentTransaction) return existing.paymentTransaction;
    const shift = input.source === PaymentSource.STAFF
      ? await manager.getRepository(CashShift).findOne({ where: { status: CashShiftStatus.OPEN } }) : null;
    const transaction = manager.create(PaymentTransaction, {
      tableId: orders[0].tableId,
      method: input.method,
      source: input.source,
      totalAmount,
      receivedAmount: receivedAmount ?? null,
      changeAmount: receivedAmount === undefined ? null : receivedAmount - totalAmount,
      collectedByUserId: input.collectedByUserId ?? null,
      cashShiftId: shift?.id ?? null,
      paidAt: new Date(),
    });
    const saved = await manager.save(PaymentTransaction, transaction);
    await manager.save(PaymentAllocation, orders.map((order) => manager.create(PaymentAllocation, { orderId: order.id, paymentTransactionId: saved.id, amount: order.totalAmount })));
    return saved;
  }
}
