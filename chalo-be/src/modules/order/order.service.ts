import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In } from 'typeorm';
import { randomBytes } from 'crypto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CheckoutSession, CheckoutSessionStatus } from './entities/checkout-session.entity';
import { Table } from '../table/entities/table.entity';
import { Product } from '../product/entities/product.entity';
import { ModifierSelectionType } from '../product/entities/product-modifier-group.entity';
import { PagerToken } from '../pager/entities/pager-token.entity';
import { PagerStatus } from '../../common/enums/pager-status.enum';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateItemPreparedDto } from './dto/update-item-prepared.dto';
import {
  UpdateOrderStatusDto,
  RequestPaymentDto,
  PaySingleOrderDto,
  PayUnpaidOrdersByTableDto,
  CallStaffDto,
} from './dto/update-order-status.dto';
import {
  CheckoutPreviewDto,
  CheckoutStartDto,
  CheckoutCompleteDto,
  CheckoutCompleteStaffDto,
  CheckoutRequestBatchPaymentDto,
} from './dto/checkout.dto';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { OrderSource } from '../../common/enums/order-source.enum';
import { TableStatus } from '../../common/enums/table-status.enum';
import { ProductStatus } from '../../common/enums/product-status.enum';
import {
  ESTIMATED_WAIT_BARISTAS,
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_MAX_PAGE_SIZE,
} from '../../common/constants';
import { SseService } from '../sse/sse.service';
import { SettingsService } from '../settings/settings.service';
import { CustomerService } from '../customer/customer.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { PaymentMethod, PaymentSource } from '../payment/entities/payment-transaction.entity';
import { PaymentTransaction } from '../payment/entities/payment-transaction.entity';
import { PaymentAllocation } from '../payment/entities/payment-allocation.entity';
import { LoyaltyPointTransaction } from '../customer/entities/loyalty-point-transaction.entity';
import { PaymentService } from '../payment/payment.service';
import { Optional } from '@nestjs/common';

export type OptionalOrderCustomer = {
  id: number;
  username: string;
  role: UserRole;
};

const STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  // Khách đặt -> kéo thẳng vào pha, bỏ bước xác nhận
  [OrderStatus.PENDING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  // CONFIRMED đã gỡ khỏi luồng nhưng đơn cũ trong DB vẫn phải đi tiếp được
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  // READY -> PREPARING: đường lùi khi tick nhầm ly cuối làm đơn tự nhảy sang READY
  [OrderStatus.READY]: [
    OrderStatus.COMPLETED,
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,
  ],
};

export const MAX_PAGE_SIZE = PAGINATION_MAX_PAGE_SIZE;

export function normalizePageSize(pageSize?: number): number {
  if (!Number.isFinite(pageSize) || !pageSize || pageSize < 0) {
    return PAGINATION_DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(pageSize), MAX_PAGE_SIZE);
}

type EstimatedWaitQueueRow = {
  id: string;
  createdAt: string;
  prepMinutes: string;
};

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Table)
    private readonly tableRepo: Repository<Table>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
    private readonly sseService: SseService,
    private readonly settingsService: SettingsService,
    private readonly customerService: CustomerService,
    @Optional() private readonly paymentService?: PaymentService,
  ) {}

  private buildDto(order: Order, includeStaffContext = false) {
    const dto = {
      id: order.id,
      tableId: order.tableId,
      tableName: order.table?.name ?? null,
      tableToken: order.tableToken,
      customerId: order.customerId ?? null,
      status: order.status,
      orderSource: order.orderSource,
      paidStatus: order.paidStatus,
      items: (order.items || []).map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productImageUrl: item.productImageUrl,
        price: item.price,
        quantity: item.quantity,
        preparedQuantity: item.preparedQuantity,
        subtotal: item.subtotal,
        note: item.note,
        selectedModifiers: item.selectedModifiers ?? [],
      })),
      totalAmount: order.totalAmount,
      estimateWaitMinutes: order.estimatedWaitMinutes,
      note: order.note,
      paymentRequested: order.paymentRequested,
      pagerId: order.pagerId ?? null,
      pagerNumber: order.pager?.number ?? null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    if (!includeStaffContext) return dto;

    return {
      ...dto,
      customerDisplayName: order.customer?.fullName ?? null,
      loyaltyPointsEarned: (order.loyaltyTransactions ?? []).reduce(
        (sum, transaction) => sum + transaction.points,
        0,
      ),
    };
  }

  /**
   * 0h00 hôm nay theo giờ VN (+07:00). Bảng staff reset theo mốc này mỗi đêm.
   * Không cần cron — chỉ là điều kiện truy vấn, tự đúng khi đồng hồ qua nửa đêm.
   */
  private startOfTodayVN(): Date {
    const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const y = nowVN.getUTCFullYear();
    const m = String(nowVN.getUTCMonth() + 1).padStart(2, '0');
    const d = String(nowVN.getUTCDate()).padStart(2, '0');
    return new Date(`${y}-${m}-${d}T00:00:00.000+07:00`);
  }

  async getActiveQueue() {
    const orders = await this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('o.table', 'table')
      .leftJoinAndSelect('o.customer', 'customer')
      .leftJoinAndSelect('o.loyaltyTransactions', 'loyaltyTransactions')
      // Đang xử lý = (PENDING/CONFIRMED/PREPARING/READY) HOẶC (COMPLETED nhưng
      // chưa thanh toán). Đơn đã phục vụ mà chưa thu tiền vẫn phải đứng trong
      // bảng staff (cột "Đã phục vụ") để thu ngân biết mà đi thu; chỉ rời bảng
      // khi COMPLETED + đã trả tiền.
      .where(
        '(o.status IN (:...statuses) OR (o.status = :completedStatus AND o.paidStatus = :isUnpaid))',
        {
          statuses: [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.READY,
          ],
          completedStatus: OrderStatus.COMPLETED,
          isUnpaid: false,
        },
      )
      // Bảng staff reset lúc 0h00 mỗi đêm — đơn hôm qua không còn là "đang xử lý"
      .andWhere('o.createdAt >= :cutoff', { cutoff: this.startOfTodayVN() })
      // Đơn hàng cũ nhất xếp lên đầu (First In - First Out)
      .orderBy('o.createdAt', 'ASC')
      .getMany();

    return orders.map((o) => this.buildDto(o, true));
  }

  private async resolvePayableOrders(
    manager: EntityManager | undefined,
    tableToken: string,
    orderIds?: string[],
  ): Promise<{ table: Table; orders: Order[] }> {
    const tableRepo = manager ? manager.getRepository(Table) : this.tableRepo;
    const orderRepo = manager ? manager.getRepository(Order) : this.orderRepo;

    const table = await tableRepo.findOne({ where: { qrToken: tableToken } });
    if (!table) throw new NotFoundException('Bàn không tồn tại');

    const qb = orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('o.table', 'table')
      .where('o.tableToken = :tableToken', { tableToken })
      .andWhere('o.status != :cancelledStatus', { cancelledStatus: OrderStatus.CANCELLED })
      .andWhere('o.paidStatus = :paidStatus', { paidStatus: false })
      .orderBy('o.createdAt', 'ASC');

    let orders = await qb.getMany();

    if (orderIds?.length) {
      const uniqueIds = [...new Set(orderIds)];
      const map = new Map(orders.map((o) => [o.id, o]));
      orders = [];
      for (const id of uniqueIds) {
        const o = map.get(id);
        if (!o) {
          throw new BadRequestException(
            'Một số đơn không thuộc bàn hoặc đã kết thúc',
          );
        }
        orders.push(o);
      }
    }

    if (!orders.length) {
      throw new BadRequestException('Không có đơn nào để thanh toán gộp');
    }

    return { table, orders };
  }

  private async syncTableOccupancyAfterOrderChange(
    manager: EntityManager,
    tableId: string,
  ): Promise<void> {
    const tableRepo = manager.getRepository(Table);
    const orderRepo = manager.getRepository(Order);
    const remaining = await orderRepo
      .createQueryBuilder('o')
      .where('o.tableId = :tableId', { tableId })
      .andWhere('o.status != :cancelledStatus', { cancelledStatus: OrderStatus.CANCELLED })
      .andWhere('(o.paidStatus = :isUnpaid OR o.status != :completedStatus)', {
        isUnpaid: false,
        completedStatus: OrderStatus.COMPLETED,
      })
      .getCount();

    const table = await tableRepo.findOne({
      where: { id: tableId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!table) return;

    if (remaining === 0) {
      table.status = TableStatus.AVAILABLE;
    } else {
      table.status = TableStatus.OCCUPIED;
      // Không cần query latest order nữa
    }


    await tableRepo.save(table);
  }

  async computeEstimatedWait(): Promise<number | null> {
    const settings = await this.settingsService.get();
    // Toggle off -> không tính, không hiển thị.
    if (!settings.waitTimeEnabled) return null;
    const baristas = settings.baristaCount || ESTIMATED_WAIT_BARISTAS; // guard chia cho 0

    // Tính tổng (quantity × prepTime) của tất cả item thuộc đơn CONFIRMED/PREPARING
    const result = await this.orderItemRepo
      .createQueryBuilder('oi')
      .select('SUM(oi.quantity * p.prepTime)', 'totalMinutes')
      .innerJoin('oi.order', 'o')
      .innerJoin('oi.product', 'p')
      .where('o.status IN (:...statuses)', {
        statuses: [OrderStatus.CONFIRMED, OrderStatus.PREPARING],
      })
      .getRawOne<{ totalMinutes: string }>();

    const totalMinutes = parseFloat(result?.totalMinutes ?? '0');
    if (!totalMinutes) return 0;
    return Math.ceil(totalMinutes / baristas);
  }

  private async loadEstimatedWaitQueue(): Promise<EstimatedWaitQueueRow[]> {
    const queueStatuses = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
    ];

    return this.orderRepo
      .createQueryBuilder('o')
      .select('o.id', 'id')
      .addSelect('o.createdAt', 'createdAt')
      .addSelect('COALESCE(SUM(oi.quantity * p.prepTime), 0)', 'prepMinutes')
      .leftJoin('o.items', 'oi')
      .leftJoin('oi.product', 'p')
      .where('o.status IN (:...statuses)', { statuses: queueStatuses })
      .groupBy('o.id')
      .addGroupBy('o.createdAt')
      .orderBy('o.createdAt', 'ASC')
      .addOrderBy('o.id', 'ASC')
      .getRawMany<EstimatedWaitQueueRow>();
  }

  private estimatedWaitFromQueue(
    orderId: string,
    status: OrderStatus,
    baristaCount: number,
    rows: EstimatedWaitQueueRow[],
  ) {
    const baristas = baristaCount || ESTIMATED_WAIT_BARISTAS;
    if (
      status === OrderStatus.COMPLETED ||
      status === OrderStatus.CANCELLED ||
      status === OrderStatus.READY
    ) {
      return {
        mode: 'order' as const,
        orderId,
        status,
        estimatedMinutes: 0,
        orderPrepMinutes: 0,
        estimatedCompletionMinutes: 0,
      };
    }

    const targetIndex = rows.findIndex((r) => r.id === orderId);
    if (targetIndex < 0) {
      // Trường hợp trạng thái đơn vừa chuyển trong lúc đang tính
      return {
        mode: 'order' as const,
        orderId,
        status,
        estimatedMinutes: 0,
        orderPrepMinutes: 0,
        estimatedCompletionMinutes: 0,
      };
    }

    const queueBeforeMinutes = rows
      .slice(0, targetIndex)
      .reduce((sum, r) => sum + parseFloat(r.prepMinutes || '0'), 0);
    const ownPrepMinutes = parseFloat(rows[targetIndex]?.prepMinutes || '0');

    return {
      mode: 'order' as const,
      orderId,
      status,
      // Thời gian chờ để order này bắt đầu được xử lý
      estimatedMinutes: Math.ceil(queueBeforeMinutes / baristas),
      // Thời gian prep riêng của order (chưa chia barista)
      orderPrepMinutes: Math.ceil(ownPrepMinutes),
      // ETA hoàn thành order này (chờ + prep)
      estimatedCompletionMinutes: Math.ceil(
        (queueBeforeMinutes + ownPrepMinutes) / baristas,
      ),
    };
  }

  private async computeEstimatedWaitForOrder(orderId: string, baristaCount: number) {
    const targetOrder = await this.orderRepo.findOne({
      where: { id: orderId },
      select: { id: true, status: true },
    });
    if (!targetOrder) throw new NotFoundException('Đơn hàng không tồn tại');

    return this.estimatedWaitFromQueue(
      orderId,
      targetOrder.status,
      baristaCount,
      await this.loadEstimatedWaitQueue(),
    );
  }

  async create(
    dto: CreateOrderDto,
    authenticatedUser: OptionalOrderCustomer | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const table = await manager.findOne(Table, {
        where: { qrToken: dto.tableToken },
        lock: { mode: 'pessimistic_write' },
      });
      if (!table) throw new NotFoundException('Bàn không tồn tại');

      const orderItems: Partial<OrderItem>[] = [];
      let totalAmount = 0;

      for (const itemDto of dto.items) {
        const product = await manager.findOne(Product, {
          where: { id: itemDto.productId },
          relations: { modifierGroups: { options: true } },
        });
        if (!product) {
          throw new NotFoundException(`Sản phẩm không tồn tại`);
        }
        if (product.status !== ProductStatus.AVAILABLE) {
          throw new BadRequestException(
            `Sản phẩm ${product.name} hiện không còn hàng`,
          );
        }
        const requestedIds = itemDto.modifierOptionIds ?? [];
        if (new Set(requestedIds).size !== requestedIds.length) {
          throw new BadRequestException('Không được chọn trùng tùy chọn món');
        }
        const groups = product.modifierGroups ?? [];
        const optionById = new Map(groups.flatMap((group) => (group.options ?? []).map((option) => [option.id, { group, option }] as const)));
        const selected = requestedIds.map((id) => optionById.get(id));
        if (selected.some((entry) => !entry)) {
          throw new BadRequestException(`Tùy chọn không thuộc món ${product.name}`);
        }
        const selectedByGroup = new Map<string, number>();
        for (const entry of selected) selectedByGroup.set(entry!.group.id, (selectedByGroup.get(entry!.group.id) ?? 0) + 1);
        for (const group of groups) {
          const count = selectedByGroup.get(group.id) ?? 0;
          if (group.isRequired && count === 0) throw new BadRequestException(`Vui lòng chọn ${group.name}`);
          if (group.selectionType === ModifierSelectionType.SINGLE && count > 1) throw new BadRequestException(`Chỉ được chọn một lựa chọn trong ${group.name}`);
        }
        const selectedModifiers = selected.map((entry) => {
          const { group, option } = entry!;
          return { groupName: group.name, optionName: option.name, priceAdjustment: option.priceAdjustment };
        });
        const unitPrice = product.price + selectedModifiers.reduce((sum, modifier) => sum + modifier.priceAdjustment, 0);
        const subtotal = unitPrice * itemDto.quantity;
        totalAmount += subtotal;
        orderItems.push({
          productId: product.id,
          productName: product.name,
          productImageUrl: product.imageUrl,
          price: unitPrice,
          quantity: itemDto.quantity,
          subtotal,
          note: itemDto.note ?? null,
          selectedModifiers,
        });
      }

      // computeEstimatedWait dùng connection ngoài transaction — intentional.
      // Nó tính trên các đơn CONFIRMED/PREPARING đã commit, không liên quan
      // đến đơn đang được tạo. Hoạt động đúng với PostgreSQL Read Committed (mặc định).
      const estimatedWaitMinutes = await this.computeEstimatedWait();

      let customerId: number | null = null;
      if (authenticatedUser?.role === UserRole.CUSTOMER) {
        const shortcut = await this.customerService.getActiveShortcut(
          authenticatedUser.id,
        );
        if (shortcut?.tableToken === dto.tableToken) {
          customerId = authenticatedUser.id;
          await this.customerService.touchShortcut(
            authenticatedUser.id,
            dto.tableToken,
          );
        }
      }

      const orderSource =
        authenticatedUser?.role === UserRole.ADMIN ||
        authenticatedUser?.role === UserRole.MODERATOR
          ? OrderSource.POS
          : OrderSource.QR;

      const order = manager.create(Order, {
        tableId: table.id,
        tableToken: dto.tableToken,
        customerId,
        status: OrderStatus.PENDING,
        orderSource,
        totalAmount,
        estimatedWaitMinutes,
        note: dto.note ?? null,
        items: orderItems as OrderItem[],
      });
      const saved = await manager.save(Order, order);

      if (dto.pagerNumber != null) {
        const activePager = await manager
          .getRepository(PagerToken)
          .createQueryBuilder('p')
          .where('p.number = :number', { number: dto.pagerNumber })
          .andWhere('p.status != :completed', { completed: PagerStatus.COMPLETED })
          .getOne();
        if (activePager) {
          throw new BadRequestException(`Thẻ bàn #${dto.pagerNumber} đang được sử dụng`);
        }
        const pager = manager.create(PagerToken, {
          number: dto.pagerNumber,
          status: PagerStatus.ASSIGNED,
          orderId: saved.id,
        });
        const savedPager = await manager.save(PagerToken, pager);
        saved.pagerId = savedPager.id;
        await manager.save(Order, saved);
      }

      table.status = TableStatus.OCCUPIED;
      await manager.save(Table, table);

      const full = await manager.findOne(Order, {
        where: { id: saved.id },
        relations: ['items', 'table', 'pager'],
      });
      const result = this.buildDto(full!);

      this.sseService.emit({
        type: 'new_order',
        data: {
          orderId: result.id,
          tableId: result.tableId,
          tableName: result.tableName,
          tableToken: result.tableToken,
        },
      });

      return result;
    });
  }

  async page(query: {
    pageNo?: number;
    pageSize?: number;
    status?: OrderStatus;
    tableId?: string;
    date?: string;
  }) {
    const { pageNo = 1, pageSize, status, tableId, date } = query;
    const normalizedPageSize = normalizePageSize(pageSize);
    const skip = (pageNo - 1) * normalizedPageSize;

    let dateStart: Date | undefined;
    let dateEnd: Date | undefined;
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new BadRequestException('Tham số date phải có định dạng YYYY-MM-DD');
      }
      dateStart = new Date(`${date}T00:00:00.000+07:00`);
      dateEnd = new Date(`${date}T23:59:59.999+07:00`);
      if (Number.isNaN(dateStart.getTime()) || Number.isNaN(dateEnd.getTime())) {
        throw new BadRequestException('Tham số date không hợp lệ');
      }
    }

    const applyFilters = (qb: ReturnType<typeof this.orderRepo.createQueryBuilder>) => {
      if (status) qb.andWhere('o.status = :status', { status });
      if (tableId) qb.andWhere('o.tableId = :tableId', { tableId });
      if (dateStart && dateEnd) {
        qb.andWhere('o.createdAt >= :dateStart AND o.createdAt <= :dateEnd', { dateStart, dateEnd });
      }
      return qb;
    };

    // Count riêng để tránh Cartesian product khi JOIN 1-to-many
    const total = await applyFilters(
      this.orderRepo.createQueryBuilder('o'),
    ).getCount();

    const orders = await applyFilters(
      this.orderRepo
        .createQueryBuilder('o')
        .leftJoinAndSelect('o.items', 'items')
        .leftJoinAndSelect('o.table', 'table')
        .leftJoinAndSelect('o.customer', 'customer')
        .leftJoinAndSelect('o.loyaltyTransactions', 'loyaltyTransactions'),
    )
      .orderBy('o.createdAt', 'DESC')
      .skip(skip)
      .take(normalizedPageSize)
      .getMany();

    return { list: orders.map((o) => this.buildDto(o, true)), total };
  }

  async detail(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'table', 'customer', 'loyaltyTransactions'],
    });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    return this.buildDto(order, true);
  }

  /**
   * Dọn đơn test từ màn Admin. Xóa thật theo yêu cầu: loyalty, payment
   * allocation, item và order. Với thanh toán gộp, transaction được giữ lại
   * cho những order còn lại và giảm đúng phần tiền allocation vừa xóa.
   */
  async deleteByAdmin(id: string): Promise<{ id: string }> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

      const allocations = await manager.find(PaymentAllocation, {
        where: { orderId: id },
        relations: ['paymentTransaction'],
      });

      await manager.delete(LoyaltyPointTransaction, { orderId: id });

      for (const allocation of allocations) {
        const transaction = allocation.paymentTransaction;
        await manager.delete(PaymentAllocation, { id: allocation.id });
        if (!transaction) continue;

        const remainingAllocations = await manager.count(PaymentAllocation, {
          where: { paymentTransactionId: transaction.id },
        });
        if (remainingAllocations === 0) {
          await manager.delete(PaymentTransaction, { id: transaction.id });
          continue;
        }

        transaction.totalAmount = Math.max(0, transaction.totalAmount - allocation.amount);
        if (transaction.receivedAmount !== null) {
          transaction.changeAmount = Math.max(
            0,
            transaction.receivedAmount - transaction.totalAmount,
          );
        }
        await manager.save(PaymentTransaction, transaction);
      }

      if (order.pagerId) {
        const pager = await manager.findOne(PagerToken, {
          where: { id: order.pagerId },
          lock: { mode: 'pessimistic_write' },
        });
        if (pager) {
          pager.status = PagerStatus.COMPLETED;
          pager.orderId = null;
          await manager.save(PagerToken, pager);
        }
      }

      await manager.delete(OrderItem, { orderId: id });
      await manager.delete(Order, { id });
      await this.syncTableOccupancyAfterOrderChange(manager, order.tableId);

      this.sseService.emit({
        type: 'order_deleted',
        data: { orderId: id, tableId: order.tableId, tableToken: order.tableToken },
      });
      return { id };
    });
  }

  async byToken(token: string) {
    const orders = await this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('o.table', 'table')
      .where('o.tableToken = :token', { token })
      .andWhere('o.status != :cancelledStatus', { cancelledStatus: OrderStatus.CANCELLED })
      .andWhere('(o.paidStatus = :isUnpaid OR o.status != :completedStatus)', {
        isUnpaid: false,
        completedStatus: OrderStatus.COMPLETED,
      })
      .orderBy('o.createdAt', 'DESC')
      .getMany();
    const settings = await this.settingsService.get();
    const needsEstimatedWait = (order: Order) =>
      settings.waitTimeEnabled &&
      order.estimatedWaitMinutes == null &&
      order.status !== OrderStatus.READY &&
      order.status !== OrderStatus.COMPLETED &&
      order.status !== OrderStatus.CANCELLED;
    const queue = orders.some(needsEstimatedWait)
      ? await this.loadEstimatedWaitQueue()
      : [];

    return orders.map((order) => {
      const dto = this.buildDto(order);
      // Các đơn cũ có thể chưa lưu ETA lúc tạo. Dùng một queue snapshot cho cả
      // response để giữ nguyên công thức ETA mà không phát sinh N+1 truy vấn.
      if (needsEstimatedWait(order)) {
        const wait = this.estimatedWaitFromQueue(
          dto.id,
          dto.status,
          settings.baristaCount,
          queue,
        );
        return { ...dto, estimateWaitMinutes: wait.estimatedCompletionMinutes };
      }
      return dto;
    });
  }

  async estimatedWait(orderId?: string) {
    const settings = await this.settingsService.get();
    if (!settings.waitTimeEnabled) {
      // Toggle off -> FE ẩn badge dựa vào enabled:false
      return { mode: orderId ? 'order' : 'system', enabled: false, estimatedMinutes: null };
    }
    if (orderId) {
      return this.computeEstimatedWaitForOrder(orderId, settings.baristaCount);
    }
    return {
      mode: 'system',
      enabled: true,
      estimatedMinutes: await this.computeEstimatedWait(),
    };
  }

  async updateStatus(dto: UpdateOrderStatusDto) {
    return this.dataSource.transaction(async (manager) => {
      const lockedOrder = await manager.findOne(Order, {
        where: { id: dto.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedOrder) throw new NotFoundException('Đơn hàng không tồn tại');

      const allowed = STATUS_TRANSITIONS[lockedOrder.status];
      if (!allowed || !allowed.includes(dto.status)) {
        throw new BadRequestException('Không thể chuyển trạng thái đơn hàng');
      }

      lockedOrder.status = dto.status;
      await manager.save(Order, lockedOrder);

      if (
        dto.status === OrderStatus.COMPLETED ||
        dto.status === OrderStatus.CANCELLED
      ) {
        await this.syncTableOccupancyAfterOrderChange(manager, lockedOrder.tableId);
      }

      const full = await manager.findOne(Order, {
        where: { id: lockedOrder.id },
        relations: ['items', 'table'],
      });
      const result = this.buildDto(full!);

      this.sseService.emit({
        type: 'order_status_changed',
        data: {
          orderId: result.id,
          status: result.status,
          tableId: result.tableId,
          tableName: result.tableName,
          tableToken: result.tableToken,
        },
      });

      return result;
    });
  }

  /**
   * Tick số ly đã pha của một item. Nhận GIÁ TRỊ TUYỆT ĐỐI (không phải +1) nên
   * hai máy cùng tick một ly không bị đếm đôi, và gọi lại cùng request không đổi kết quả.
   * Tick đủ mọi item của đơn -> đơn tự chuyển READY.
   */
  async setItemPrepared(itemId: string, dto: UpdateItemPreparedDto) {
    return this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(OrderItem, { where: { id: itemId } });
      if (!item) throw new NotFoundException('Món trong đơn không tồn tại');

      const lockedOrder = await manager.findOne(Order, {
        where: { id: item.orderId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedOrder) throw new NotFoundException('Đơn hàng không tồn tại');

      if (lockedOrder.status !== OrderStatus.PREPARING) {
        throw new BadRequestException('Chỉ tick được đơn đang pha chế');
      }
      if (dto.preparedQuantity > item.quantity) {
        throw new BadRequestException('Số ly đã pha vượt quá số lượng đặt');
      }

      item.preparedQuantity = dto.preparedQuantity;
      await manager.save(OrderItem, item);

      const items = await manager.find(OrderItem, {
        where: { orderId: lockedOrder.id },
      });
      const allDone = items.every((i) => i.preparedQuantity >= i.quantity);
      if (allDone) {
        lockedOrder.status = OrderStatus.READY;
        await manager.save(Order, lockedOrder);
      }

      const full = await manager.findOne(Order, {
        where: { id: lockedOrder.id },
        relations: ['items', 'table'],
      });
      const result = this.buildDto(full!);

      this.sseService.emit(
        allDone
          ? {
              type: 'order_status_changed',
              data: {
                orderId: result.id,
                status: result.status,
                tableId: result.tableId,
                tableName: result.tableName,
                tableToken: result.tableToken,
              },
            }
          : {
              type: 'order_prep_progress',
              data: {
                orderId: result.id,
                tableId: result.tableId,
                tableName: result.tableName,
              },
            },
      );

      return result;
    });
  }

  private parseDateRange(from?: string, to?: string): { start: Date; end: Date } | null {
    if (!from && !to) return null;
    const start = from ? new Date(`${from}T00:00:00.000+07:00`) : new Date(0);
    const end = to ? new Date(`${to}T23:59:59.999+07:00`) : new Date();
    return { start, end };
  }

  async statsRevenue(query: { period?: 'day' | 'week' | 'month'; from?: string; to?: string }) {
    const { period = 'day', from, to } = query;

    const formatMap: Record<string, string> = {
      day: 'YYYY-MM-DD',
      week: 'IYYY-IW',
      month: 'YYYY-MM',
    };
    const groupFmt = formatMap[period] ?? 'YYYY-MM-DD';

    // groupFmt đến từ enum lookup nội bộ (không từ user) nên an toàn khi inline
    const dateTrunc = `TO_CHAR(o."createdAt" AT TIME ZONE 'Asia/Ho_Chi_Minh', '${groupFmt}')`;

    const qb = this.orderRepo
      .createQueryBuilder('o')
      .select(dateTrunc, 'date')
      .addSelect('SUM(o.totalAmount)', 'revenue')
      .addSelect('COUNT(o.id)', 'orderCount')
      .where('o.paidStatus = :paidStatus', { paidStatus: true })
      .andWhere('o.status != :cancelledStatus', { cancelledStatus: OrderStatus.CANCELLED })
      .groupBy(dateTrunc)
      .orderBy('date', 'ASC');

    const range = this.parseDateRange(from, to);
    if (range) {
      qb.andWhere('o.createdAt >= :start AND o.createdAt <= :end', range);
    }

    const rows = await qb.getRawMany<{ date: string; revenue: string; orderCount: string }>();

    const data = rows.map((r) => ({
      date: r.date,
      revenue: parseInt(r.revenue ?? '0', 10),
      orderCount: parseInt(r.orderCount ?? '0', 10),
    }));

    return {
      totalRevenue: data.reduce((s, r) => s + r.revenue, 0),
      totalOrders: data.reduce((s, r) => s + r.orderCount, 0),
      data,
    };
  }

  async statsTopProducts(query: { limit?: number; from?: string; to?: string }) {
    const { limit = 10, from, to } = query;

    const qb = this.orderItemRepo
      .createQueryBuilder('oi')
      .select('oi.productId', 'productId')
      .addSelect('oi.productName', 'productName')
      .addSelect('SUM(oi.quantity)', 'totalQuantity')
      .addSelect('SUM(oi.subtotal)', 'totalRevenue')
      .innerJoin('oi.order', 'o')
      .where('o.paidStatus = :paidStatus', { paidStatus: true })
      .andWhere('o.status != :cancelledStatus', { cancelledStatus: OrderStatus.CANCELLED })
      .groupBy('oi.productId')
      .addGroupBy('oi.productName')
      .orderBy('"totalQuantity"', 'DESC')
      .limit(limit);

    const range = this.parseDateRange(from, to);
    if (range) {
      qb.andWhere('o.createdAt >= :start AND o.createdAt <= :end', range);
    }

    const rows = await qb.getRawMany<{
      productId: string;
      productName: string;
      totalQuantity: string;
      totalRevenue: string;
    }>();

    return rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      totalQuantity: parseInt(r.totalQuantity ?? '0', 10),
      totalRevenue: parseInt(r.totalRevenue ?? '0', 10),
    }));
  }

  async requestPayment(dto: RequestPaymentDto) {
    const order = await this.orderRepo.findOneBy({ id: dto.orderId });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.paidStatus || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Đơn hàng đã kết thúc');
    }
    if (order.paymentRequested) {
      return { message: 'Đã gửi yêu cầu thanh toán' };
    }
    order.paymentRequested = true;
    await this.orderRepo.save(order);

    const table = await this.tableRepo.findOneBy({ id: order.tableId });
    this.sseService.emit({
      type: 'payment_request',
      data: {
        orderId: order.id,
        tableId: order.tableId,
        tableName: table?.name ?? null,
        tableToken: order.tableToken,
      },
    });

    return { message: 'Đã gửi yêu cầu thanh toán' };
  }

  async callStaff(dto: CallStaffDto) {
    const table = await this.tableRepo.findOneBy({ qrToken: dto.tableToken });
    if (!table) throw new NotFoundException('Bàn không tồn tại');

    this.sseService.emit({
      type: 'staff_call',
      data: {
        tableId: table.id,
        tableName: table.name,
        tableToken: dto.tableToken,
        reason: dto.reason ?? null,
      },
    });

    return { message: 'Đã gọi nhân viên' };
  }

  async paySingleOrder(dto: PaySingleOrderDto, cashierId?: number) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: dto.orderId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
      if (order.tableToken !== dto.tableToken) {
        throw new BadRequestException('Đơn hàng không thuộc bàn này');
      }
      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('Đơn hàng đã huỷ, không thể thanh toán');
      }

      if (order.paidStatus) {
        return {
          orderId: order.id,
          paidStatus: true,
          message: 'Đơn hàng đã được thanh toán trước đó',
        };
      }

      if (this.paymentService) {
        await this.paymentService.record(manager, [order], {
          method: dto.method ?? PaymentMethod.BANK_TRANSFER,
          source: cashierId ? PaymentSource.STAFF : PaymentSource.CUSTOMER_CONFIRMATION,
          collectedByUserId: cashierId ?? null,
          receivedAmount: dto.receivedAmount,
        });
      }

      order.paidStatus = true;
      order.paymentRequested = false;
      await manager.save(Order, order);
      await this.customerService.awardPointsForOrder(manager, order);
      await this.syncTableOccupancyAfterOrderChange(manager, order.tableId);

      this.sseService.emit({
        type: 'payment_completed',
        data: {
          orderIds: [order.id],
          tableId: order.tableId,
          tableToken: order.tableToken,
          totalAmount: order.totalAmount,
        },
      });

      return {
        orderId: order.id,
        paidStatus: true,
        message: 'Đã ghi nhận thanh toán đơn hàng',
      };
    });
  }

  async payUnpaidOrdersByTable(dto: PayUnpaidOrdersByTableDto, cashierId?: number) {
    return this.dataSource.transaction(async (manager) => {
      const table = await manager.findOne(Table, {
        where: { qrToken: dto.tableToken },
        lock: { mode: 'pessimistic_write' },
      });
      if (!table) throw new NotFoundException('Bàn không tồn tại');

      const orders = await manager
        .getRepository(Order)
        .createQueryBuilder('o')
        .where('o.tableId = :tableId', { tableId: table.id })
        .andWhere('o.status != :cancelledStatus', { cancelledStatus: OrderStatus.CANCELLED })
        .andWhere('o.paidStatus = :isUnpaid', { isUnpaid: false })
        .getMany();

      for (const order of orders) {
        order.paidStatus = true;
        order.paymentRequested = false;
      }
      if (orders.length) {
        if (this.paymentService) {
          await this.paymentService.record(manager, orders, {
            method: dto.method ?? PaymentMethod.BANK_TRANSFER,
            source: cashierId ? PaymentSource.STAFF : PaymentSource.CUSTOMER_CONFIRMATION,
            collectedByUserId: cashierId ?? null,
            receivedAmount: dto.receivedAmount,
          });
        }
        await manager.save(Order, orders);
        for (const order of orders) {
          await this.customerService.awardPointsForOrder(manager, order);
        }
      }

      await this.syncTableOccupancyAfterOrderChange(manager, table.id);

      if (orders.length) {
        this.sseService.emit({
          type: 'payment_completed',
          data: {
            orderIds: orders.map((o) => o.id),
            tableId: table.id,
            tableToken: dto.tableToken,
            totalAmount: orders.reduce((s, o) => s + o.totalAmount, 0),
          },
        });
      }

      return {
        tableToken: dto.tableToken,
        paidOrderCount: orders.length,
        orderIds: orders.map((o) => o.id),
        message: 'Đã ghi nhận thanh toán gộp theo bàn',
      };
    });
  }

  async checkoutPreview(dto: CheckoutPreviewDto) {
    const { table, orders } = await this.resolvePayableOrders(
      undefined,
      dto.tableToken,
      dto.orderIds,
    );
    const totalAmount = orders.reduce((s, o) => s + o.totalAmount, 0);
    return {
      tableId: table.id,
      tableName: table.name,
      tableToken: dto.tableToken,
      orderIds: orders.map((o) => o.id),
      totalAmount,
      orders: orders.map((o) => this.buildDto(o)),
    };
  }

  async checkoutStart(dto: CheckoutStartDto) {
    return this.dataSource.transaction(async (manager) => {
      const { table, orders } = await this.resolvePayableOrders(
        manager,
        dto.tableToken,
        dto.orderIds,
      );
      const totalAmount = orders.reduce((s, o) => s + o.totalAmount, 0);
      const ttlMinutes = dto.ttlMinutes ?? 15;
      const clientSecret = randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      const session = manager.create(CheckoutSession, {
        tableToken: dto.tableToken,
        tableId: table.id,
        orderIds: orders.map((o) => o.id),
        totalAmount,
        status: CheckoutSessionStatus.PENDING,
        clientSecret,
        expiresAt,
      });
      const saved = await manager.save(CheckoutSession, session);

      return {
        sessionId: saved.id,
        clientSecret: saved.clientSecret,
        tableToken: saved.tableToken,
        tableId: saved.tableId,
        orderIds: saved.orderIds,
        totalAmount: saved.totalAmount,
        expiresAt: saved.expiresAt,
        orders: orders.map((o) => this.buildDto(o)),
      };
    });
  }

  private async finalizeCheckoutSessionLocked(
    manager: EntityManager,
    session: CheckoutSession,
    paymentInput?: { method?: PaymentMethod; receivedAmount?: number; cashierId?: number },
  ) {
    const orderRepo = manager.getRepository(Order);
    const orders: Order[] = [];

    for (const id of session.orderIds) {
      // Lock the order row only — no relations. A pessimistic_write with
      // relations emits `... LEFT JOIN ... FOR UPDATE`, which Postgres rejects
      // ("FOR UPDATE cannot be applied to the nullable side of an outer join").
      // The fully-related orders are re-loaded (unlocked) below for the DTO.
      const order = await orderRepo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new BadRequestException(`Đơn ${id} không tồn tại`);
      }
      if (order.tableToken !== session.tableToken) {
        throw new BadRequestException('Đơn không khớp bàn');
      }
      if (
        order.paidStatus ||
        order.status === OrderStatus.CANCELLED
      ) {
        throw new BadRequestException(
          `Đơn ${id} đã kết thúc, không thể thanh toán gộp`,
        );
      }
      orders.push(order);
    }

    if (this.paymentService) {
      await this.paymentService.record(manager, orders, {
        method: paymentInput?.method ?? PaymentMethod.BANK_TRANSFER,
        source: paymentInput?.cashierId ? PaymentSource.STAFF : PaymentSource.CUSTOMER_CONFIRMATION,
        collectedByUserId: paymentInput?.cashierId ?? null,
        receivedAmount: paymentInput?.receivedAmount,
      });
    }
    for (const order of orders) {
      order.paidStatus = true;
      order.paymentRequested = false;
      await manager.save(Order, order);
      await this.customerService.awardPointsForOrder(manager, order);
    }

    session.status = CheckoutSessionStatus.COMPLETED;
    await manager.save(CheckoutSession, session);

    await this.syncTableOccupancyAfterOrderChange(manager, session.tableId);

    const fullOrders = await orderRepo.find({
      where: { id: In(session.orderIds) },
      relations: ['items', 'table'],
    });
    const byId = new Map(fullOrders.map((o) => [o.id, o]));
    const ordered = session.orderIds.map((id) => byId.get(id)!).filter(Boolean);

    return {
      idempotent: false as const,
      sessionId: session.id,
      orderIds: session.orderIds,
      totalAmount: session.totalAmount,
      orders: ordered.map((o) => this.buildDto(o)),
    };
  }

  async checkoutComplete(dto: CheckoutCompleteDto) {
    return this.dataSource.transaction(async (manager) => {
      const sessRepo = manager.getRepository(CheckoutSession);
      const session = await sessRepo.findOne({
        where: { id: dto.sessionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!session) throw new NotFoundException('Phiên thanh toán không tồn tại');

      if (session.status === CheckoutSessionStatus.COMPLETED) {
        const orderRepo = manager.getRepository(Order);
        const fullOrders = await orderRepo.find({
          where: { id: In(session.orderIds) },
          relations: ['items', 'table'],
        });
        const byId = new Map(fullOrders.map((o) => [o.id, o]));
        const ordered = session.orderIds.map((id) => byId.get(id)!).filter(Boolean);
        return {
          idempotent: true as const,
          sessionId: session.id,
          orderIds: session.orderIds,
          totalAmount: session.totalAmount,
          orders: ordered.map((o) => this.buildDto(o)),
        };
      }

      if (new Date() > session.expiresAt) {
        throw new BadRequestException('Phiên thanh toán đã hết hạn');
      }
      if (
        session.tableToken !== dto.tableToken ||
        session.clientSecret !== dto.clientSecret
      ) {
        throw new BadRequestException('Thông tin phiên thanh toán không hợp lệ');
      }

      const result = await this.finalizeCheckoutSessionLocked(manager, session);

      this.sseService.emit({
        type: 'payment_completed',
        data: {
          sessionId: result.sessionId,
          tableId: session.tableId,
          tableToken: session.tableToken,
          orderIds: result.orderIds,
          totalAmount: result.totalAmount,
        },
      });

      for (const o of result.orders) {
        this.sseService.emit({
          type: 'order_status_changed',
          data: {
            orderId: o.id,
            status: o.status,
            tableId: o.tableId,
            tableName: o.tableName,
            tableToken: o.tableToken,
          },
        });
      }

      return result;
    });
  }

  async checkoutCompleteStaff(dto: CheckoutCompleteStaffDto, cashierId?: number) {
    return this.dataSource.transaction(async (manager) => {
      const sessRepo = manager.getRepository(CheckoutSession);
      const session = await sessRepo.findOne({
        where: { id: dto.sessionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!session) throw new NotFoundException('Phiên thanh toán không tồn tại');

      if (session.status === CheckoutSessionStatus.COMPLETED) {
        const orderRepo = manager.getRepository(Order);
        const fullOrders = await orderRepo.find({
          where: { id: In(session.orderIds) },
          relations: ['items', 'table'],
        });
        const byId = new Map(fullOrders.map((o) => [o.id, o]));
        const ordered = session.orderIds.map((id) => byId.get(id)!).filter(Boolean);
        return {
          idempotent: true as const,
          sessionId: session.id,
          orderIds: session.orderIds,
          totalAmount: session.totalAmount,
          orders: ordered.map((o) => this.buildDto(o)),
        };
      }

      if (new Date() > session.expiresAt) {
        throw new BadRequestException('Phiên thanh toán đã hết hạn');
      }

      const result = await this.finalizeCheckoutSessionLocked(manager, session, { method: dto.method, receivedAmount: dto.receivedAmount, cashierId });

      this.sseService.emit({
        type: 'payment_completed',
        data: {
          sessionId: result.sessionId,
          tableId: session.tableId,
          tableToken: session.tableToken,
          orderIds: result.orderIds,
          totalAmount: result.totalAmount,
        },
      });

      for (const o of result.orders) {
        this.sseService.emit({
          type: 'order_status_changed',
          data: {
            orderId: o.id,
            status: o.status,
            tableId: o.tableId,
            tableName: o.tableName,
            tableToken: o.tableToken,
          },
        });
      }

      return result;
    });
  }

  async requestPaymentBatch(dto: CheckoutRequestBatchPaymentDto) {
    const { orders } = await this.resolvePayableOrders(
      undefined,
      dto.tableToken,
      dto.orderIds,
    );
    const table = await this.tableRepo.findOne({
      where: { qrToken: dto.tableToken },
    });
    const totalAmount = orders.reduce((s, o) => s + o.totalAmount, 0);

    for (const order of orders) {
      if (!order.paymentRequested) {
        order.paymentRequested = true;
        await this.orderRepo.save(order);
      }
    }

    this.sseService.emit({
      type: 'payment_request_batch',
      data: {
        orderIds: orders.map((o) => o.id),
        tableId: table?.id ?? null,
        tableName: table?.name ?? null,
        totalAmount,
      },
    });

    return {
      message: 'Đã gửi yêu cầu thanh toán gộp',
      orderIds: orders.map((o) => o.id),
      totalAmount,
    };
  }
}
