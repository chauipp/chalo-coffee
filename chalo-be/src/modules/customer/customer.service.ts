import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { Order } from '../order/entities/order.entity';
import { Table } from '../table/entities/table.entity';
import { User } from '../user/entities/user.entity';
import { ScanTableDto } from './dto/scan-table.dto';
import {
  CustomerTableSession,
  CustomerTableSessionStatus,
} from './entities/customer-table-session.entity';
import {
  LoyaltyPointTransaction,
  LoyaltyPointTransactionType,
} from './entities/loyalty-point-transaction.entity';

const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1_000;
const PAID_SHORTCUT_IDLE_MS = 30 * 60 * 1_000;

export type CustomerShortcutEndedReason =
  | 'DAY_ENDED'
  | 'IDLE_AFTER_PAID'
  | 'CUSTOMER_LEFT';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(CustomerTableSession)
    private readonly sessionRepo: Repository<CustomerTableSession>,
    @InjectRepository(LoyaltyPointTransaction)
    private readonly loyaltyRepo: Repository<LoyaltyPointTransaction>,
    @InjectRepository(Table)
    private readonly tableRepo: Repository<Table>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async getMe(customerId: number) {
    const user = await this.userRepo.findOneBy({ id: customerId });
    if (!user) throw new NotFoundException('Khách hàng không tồn tại');

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      email: user.email,
      role: user.role,
    };
  }

  async getActiveShortcut(
    customerId: number,
    now = new Date(),
  ): Promise<CustomerTableSession | null> {
    const session = await this.sessionRepo.findOne({
      where: {
        customerId,
        status: CustomerTableSessionStatus.ACTIVE,
      },
      relations: { table: true },
      order: { updatedAt: 'DESC' },
    });
    if (!session) return null;

    if (session.businessDate !== this.businessDateVN(now)) {
      await this.endSession(session, 'DAY_ENDED', now);
      return null;
    }

    if (session.paidAt) {
      const idleSince = new Date(
        Math.max(session.paidAt.getTime(), session.lastActivityAt.getTime()),
      );
      if (now.getTime() >= idleSince.getTime() + PAID_SHORTCUT_IDLE_MS) {
        await this.endSession(session, 'IDLE_AFTER_PAID', now);
        return null;
      }
    }

    return session;
  }

  async scanTable(
    customerId: number,
    dto: ScanTableDto,
    now = new Date(),
  ): Promise<CustomerTableSession> {
    const tableToken = dto.tableToken.trim();
    const table = await this.tableRepo.findOneBy({ qrToken: tableToken });
    if (!table) {
      throw new NotFoundException('Mã QR bàn không hợp lệ');
    }

    const activeSession = await this.getActiveShortcut(customerId, now);
    if (!activeSession) {
      const newSession = this.sessionRepo.create({
        customerId,
        tableId: table.id,
        tableToken: table.qrToken,
        status: CustomerTableSessionStatus.ACTIVE,
        startedAt: now,
        lastActivityAt: now,
        paidAt: null,
        endedAt: null,
        businessDate: this.businessDateVN(now),
        endedReason: null,
      });
      return this.sessionRepo.save(newSession);
    }

    const changedTable = activeSession.tableId !== table.id;
    activeSession.tableId = table.id;
    activeSession.tableToken = table.qrToken;
    activeSession.table = table;
    activeSession.lastActivityAt = now;
    if (changedTable) {
      activeSession.startedAt = now;
      activeSession.businessDate = this.businessDateVN(now);
      activeSession.paidAt = null;
    }
    return this.sessionRepo.save(activeSession);
  }

  async touchShortcut(
    customerId: number,
    tableToken?: string,
    now = new Date(),
  ): Promise<CustomerTableSession | null> {
    const session = await this.getActiveShortcut(customerId, now);
    if (!session || (tableToken && session.tableToken !== tableToken)) {
      return null;
    }

    session.lastActivityAt = now;
    return this.sessionRepo.save(session);
  }

  async leaveTable(customerId: number, now = new Date()): Promise<null> {
    const session = await this.getActiveShortcut(customerId, now);
    if (session) {
      await this.endSession(session, 'CUSTOMER_LEFT', now);
    }
    return null;
  }

  async getLoyalty(customerId: number) {
    const result = await this.loyaltyRepo
      .createQueryBuilder('transaction')
      .select('COALESCE(SUM(transaction.points), 0)', 'balance')
      .where('transaction.customerId = :customerId', { customerId })
      .getRawOne<{ balance: string | number | null }>();

    return { balance: Number(result?.balance ?? 0) };
  }

  async getLoyaltyHistory(
    customerId: number,
    query: { pageNo?: number; pageSize?: number } = {},
  ) {
    const pageNo = Math.max(1, query.pageNo ?? 1);
    const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 10));
    const [transactions, total] = await this.loyaltyRepo.findAndCount({
      where: { customerId },
      relations: { order: true },
      order: { createdAt: 'DESC' },
      skip: (pageNo - 1) * pageSize,
      take: pageSize,
    });
    return {
      list: transactions.map((transaction) => ({
        id: transaction.id,
        orderId: transaction.orderId,
        points: transaction.points,
        type: transaction.type,
        createdAt: transaction.createdAt,
        orderTotalAmount: transaction.order?.totalAmount ?? null,
      })),
      total,
      pageNo,
      pageSize,
    };
  }

  async getOrders(
    customerId: number,
    query: { pageNo?: number; pageSize?: number } = {},
  ) {
    const pageNo = Math.max(1, query.pageNo ?? 1);
    const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 10));
    const [orders, total] = await this.orderRepo.findAndCount({
      where: { customerId },
      relations: { items: true, table: true },
      order: { createdAt: 'DESC' },
      skip: (pageNo - 1) * pageSize,
      take: pageSize,
    });

    return { list: orders, total, pageNo, pageSize };
  }

  async awardPointsForOrder(
    manager: EntityManager,
    order: Order,
    paidAt = new Date(),
  ): Promise<number> {
    if (
      !order.customerId ||
      !order.paidStatus ||
      order.status === OrderStatus.CANCELLED
    ) {
      return 0;
    }

    const points = Math.floor(order.totalAmount / 1_000);
    if (points > 0) {
      await manager.getRepository(LoyaltyPointTransaction).upsert(
        {
          customerId: order.customerId,
          orderId: order.id,
          points,
          type: LoyaltyPointTransactionType.EARN,
        },
        ['orderId'],
      );
    }

    const remainingUnpaidOrders = await manager
      .getRepository(Order)
      .createQueryBuilder('order')
      .where('order.customerId = :customerId', {
        customerId: order.customerId,
      })
      .andWhere('order.tableToken = :tableToken', {
        tableToken: order.tableToken,
      })
      .andWhere('order.status != :cancelledStatus', {
        cancelledStatus: OrderStatus.CANCELLED,
      })
      .andWhere('order.paidStatus = :isUnpaid', { isUnpaid: false })
      .getCount();

    if (remainingUnpaidOrders === 0) {
      const sessionRepo = manager.getRepository(CustomerTableSession);
      const session = await sessionRepo.findOne({
        where: {
          customerId: order.customerId,
          tableToken: order.tableToken,
          status: CustomerTableSessionStatus.ACTIVE,
        },
        order: { updatedAt: 'DESC' },
        lock: { mode: 'pessimistic_write' },
      });
      if (session) {
        session.paidAt = paidAt;
        await sessionRepo.save(session);
      }
    }

    return points;
  }

  private businessDateVN(now: Date): string {
    return new Date(now.getTime() + VIETNAM_UTC_OFFSET_MS)
      .toISOString()
      .slice(0, 10);
  }

  private async endSession(
    session: CustomerTableSession,
    reason: CustomerShortcutEndedReason,
    now: Date,
  ): Promise<void> {
    session.status =
      reason === 'CUSTOMER_LEFT'
        ? CustomerTableSessionStatus.CLOSED
        : CustomerTableSessionStatus.EXPIRED;
    session.endedAt = now;
    session.endedReason = reason;
    await this.sessionRepo.save(session);
  }
}
