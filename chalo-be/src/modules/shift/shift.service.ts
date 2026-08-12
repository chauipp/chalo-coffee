import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, Repository } from 'typeorm';
import { CashShift, CashShiftStatus } from './entities/cash-shift.entity';
import { PaymentMethod, PaymentSource, PaymentTransaction } from '../payment/entities/payment-transaction.entity';
import { PaymentAllocation } from '../payment/entities/payment-allocation.entity';
import { Order } from '../order/entities/order.entity';

@Injectable()
export class ShiftService {
  constructor(
    @InjectRepository(CashShift) private readonly shiftRepo: Repository<CashShift>,
    @InjectRepository(PaymentTransaction) private readonly transactionRepo: Repository<PaymentTransaction>,
    @InjectRepository(PaymentAllocation) private readonly allocationRepo: Repository<PaymentAllocation>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  private dto(shift: CashShift | null) {
    if (!shift) return null;
    return { ...shift, expectedCash: shift.expectedCash ?? null, variance: shift.variance ?? null };
  }

  async current() { return this.dto(await this.shiftRepo.findOne({ where: { status: CashShiftStatus.OPEN } })); }

  async open(userId: number, openingCash = 0) {
    const active = await this.current();
    if (active) throw new ConflictException('Đã có một ca đang mở');
    const shift = this.shiftRepo.create({ status: CashShiftStatus.OPEN, openingCash, openedByUserId: userId, openedAt: new Date() });
    return this.dto(await this.shiftRepo.save(shift));
  }

  async close(userId: number, countedCash: number, note?: string) {
    return this.dataSource.transaction(async (manager) => {
      const shiftRepo = manager.getRepository(CashShift);
      const shift = await shiftRepo.findOne({ where: { status: CashShiftStatus.OPEN }, lock: { mode: 'pessimistic_write' } });
      if (!shift) throw new NotFoundException('Không có ca đang mở');
      const cash = await manager.getRepository(PaymentTransaction).createQueryBuilder('p')
        .select('COALESCE(SUM(p.totalAmount), 0)', 'total')
        .where('p.cashShiftId = :shiftId', { shiftId: shift.id })
        .andWhere('p.method = :method', { method: PaymentMethod.CASH })
        .getRawOne<{ total: string }>();
      const expectedCash = shift.openingCash + Number(cash?.total ?? 0);
      const variance = countedCash - expectedCash;
      if (variance !== 0 && !note?.trim()) throw new BadRequestException('Cần ghi chú khi tiền thực đếm lệch');
      Object.assign(shift, { status: CashShiftStatus.CLOSED, closedByUserId: userId, closedAt: new Date(), countedCash, expectedCash, variance, note: note?.trim() || null });
      return this.dto(await shiftRepo.save(shift));
    });
  }

  async history(limit = 30) { return (await this.shiftRepo.find({ order: { openedAt: 'DESC' }, take: Math.min(limit, 100) })).map((s) => this.dto(s)); }

  async report(params: { from?: string; to?: string; shiftId?: string }) {
    const shift = params.shiftId ? await this.shiftRepo.findOne({ where: { id: params.shiftId } }) : null;
    if (params.shiftId && !shift) throw new NotFoundException('Ca không tồn tại');
    const from = shift?.openedAt ?? (params.from ? new Date(params.from) : new Date(new Date().setHours(0, 0, 0, 0)));
    const to = shift?.closedAt ?? (params.to ? new Date(params.to) : new Date());
    const rows = await this.transactionRepo.find({ where: shift ? { cashShiftId: shift.id } : { paidAt: Between(from, to) }, order: { paidAt: 'DESC' } });
    const summary = { cash: 0, bankTransfer: 0, customerConfirmation: 0, legacy: 0, paidOrders: 0, paidRevenue: 0 };
    for (const row of rows) {
      summary.paidRevenue += row.totalAmount;
      if (row.method === PaymentMethod.CASH) summary.cash += row.totalAmount;
      else if (row.method === PaymentMethod.BANK_TRANSFER && row.source === PaymentSource.STAFF) summary.bankTransfer += row.totalAmount;
      else if (row.source === PaymentSource.CUSTOMER_CONFIRMATION) summary.customerConfirmation += row.totalAmount;
      else summary.legacy += row.totalAmount;
    }
    summary.paidOrders = rows.length
      ? await this.allocationRepo.count({
          where: rows.map((row) => ({ paymentTransactionId: row.id })),
        })
      : 0;
    const unpaidOrders = await this.orderRepo.count({ where: { paidStatus: false } });
    const cancelledOrders = await this.orderRepo.count({ where: { status: 'CANCELLED' as never, createdAt: Between(from, to) } });
    return { from, to, shift: this.dto(shift), summary: { ...summary, averageOrderValue: summary.paidOrders ? Math.round(summary.paidRevenue / summary.paidOrders) : 0, unpaidOrders, cancelledOrders }, transactions: rows };
  }
}
