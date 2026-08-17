import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Order } from '../order/entities/order.entity';
import { CashShift, CashShiftStatus } from '../shift/entities/cash-shift.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { PaymentMethod, PaymentSource, PaymentTransaction } from './entities/payment-transaction.entity';
import { RefundTransaction } from './entities/refund-transaction.entity';
import { CreateRefundDto } from './dto/create-refund.dto';
import { calculateRefundableAmount, validateRefundAmount } from './refund.utils';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { AuditService } from '../audit/audit.service';

export type PaymentInput = { method: PaymentMethod; source: PaymentSource; collectedByUserId?: number | null; receivedAmount?: number };

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentTransaction) private readonly transactionRepo: Repository<PaymentTransaction>,
    @InjectRepository(PaymentAllocation) private readonly allocationRepo: Repository<PaymentAllocation>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(CashShift) private readonly shiftRepo: Repository<CashShift>,
    private readonly auditService: AuditService,
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

  private refundDto(refund: RefundTransaction) {
    return {
      id: refund.id,
      paymentTransactionId: refund.paymentTransactionId,
      amount: refund.amount,
      method: refund.method,
      reason: refund.reason,
      processedByUserId: refund.processedByUserId,
      createdAt: refund.createdAt,
    };
  }

  async listRefunds(paymentTransactionId: string) {
    const payment = await this.transactionRepo.findOneBy({ id: paymentTransactionId });
    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    const refunds = await this.transactionRepo.manager.getRepository(RefundTransaction).find({
      where: { paymentTransactionId }, order: { createdAt: 'DESC' },
    });
    const refundedAmount = refunds.reduce((sum, refund) => sum + refund.amount, 0);
    return {
      paymentTransactionId,
      totalAmount: payment.totalAmount,
      refundedAmount,
      refundableAmount: calculateRefundableAmount(payment.totalAmount, refunds.map((refund) => refund.amount)),
      refunds: refunds.map((refund) => this.refundDto(refund)),
    };
  }

  async refund(paymentTransactionId: string, dto: CreateRefundDto, processedByUserId: number) {
    return this.transactionRepo.manager.transaction(async (manager) => {
      const payment = await manager.findOne(PaymentTransaction, {
        where: { id: paymentTransactionId }, lock: { mode: 'pessimistic_write' },
      });
      if (!payment) throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
      if (payment.method === PaymentMethod.LEGACY) throw new BadRequestException('Không thể hoàn tiền cho giao dịch cũ chưa đối soát');

      const refundRepo = manager.getRepository(RefundTransaction);
      const existing = await refundRepo.find({ where: { paymentTransactionId } });
      const refundableAmount = calculateRefundableAmount(payment.totalAmount, existing.map((refund) => refund.amount));
      const amount = validateRefundAmount(dto.amount, refundableAmount);
      const refund = await refundRepo.save(refundRepo.create({
        paymentTransactionId,
        amount,
        method: dto.method,
        reason: dto.reason.trim(),
        processedByUserId,
      }));
      await this.auditService.record({
        actorUserId: processedByUserId,
        action: AuditAction.REFUND_CREATED,
        entityType: 'payment_transaction',
        entityId: paymentTransactionId,
        metadata: { refundId: refund.id, amount, method: dto.method, reason: dto.reason.trim() },
      }, manager);
      return {
        refund: this.refundDto(refund),
        refundedAmount: payment.totalAmount - (refundableAmount - amount),
        refundableAmount: refundableAmount - amount,
      };
    });
  }
}
