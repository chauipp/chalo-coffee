import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { CustomerService } from '../customer/customer.service';
import {
  CustomerTableSession,
  CustomerTableSessionStatus,
} from '../customer/entities/customer-table-session.entity';
import {
  LoyaltyPointTransaction,
  LoyaltyPointTransactionType,
} from '../customer/entities/loyalty-point-transaction.entity';
import { Product } from '../product/entities/product.entity';
import { SettingsService } from '../settings/settings.service';
import { SseService } from '../sse/sse.service';
import { Table } from '../table/entities/table.entity';
import {
  CheckoutSession,
  CheckoutSessionStatus,
} from './entities/checkout-session.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { OrderService } from './order.service';

const TABLE_ID = '10000000-0000-4000-8000-000000000001';
const TABLE_TOKEN = 'fixed-print-qr';
const ORDER_ONE_ID = '20000000-0000-4000-8000-000000000001';
const ORDER_TWO_ID = '20000000-0000-4000-8000-000000000002';
const SESSION_ID = '30000000-0000-4000-8000-000000000001';

type PaymentHarness = {
  service: OrderService;
  customerService: CustomerService;
  orders: Order[];
  loyaltyTransactions: LoyaltyPointTransaction[];
  sessions: Array<{
    id: string;
    customerId: number;
    tableId: string;
    tableToken: string;
    status: CustomerTableSessionStatus;
    paidAt: Date | null;
  }>;
  checkoutSession: CheckoutSession;
};

afterEach(() => {
  jest.useRealTimers();
});

function order(id: string, overrides: Partial<Order> = {}): Order {
  return {
    id,
    tableId: TABLE_ID,
    tableToken: TABLE_TOKEN,
    customerId: 7,
    status: OrderStatus.COMPLETED,
    paidStatus: false,
    totalAmount: 100_999,
    estimatedWaitMinutes: 0,
    note: null,
    paymentRequested: true,
    pagerId: null,
    pager: null,
    createdAt: new Date('2026-08-12T01:00:00.000Z'),
    updatedAt: new Date('2026-08-12T01:00:00.000Z'),
    table: { id: TABLE_ID, name: 'Bàn A' } as Table,
    customer: null,
    items: [],
    ...overrides,
  } as Order;
}

async function buildPaymentHarness(
  initialOrders: Order[],
): Promise<PaymentHarness> {
  const orders = initialOrders;
  const loyaltyTransactions: LoyaltyPointTransaction[] = [];
  const sessions = [
    {
      id: '40000000-0000-4000-8000-000000000001',
      customerId: 7,
      tableId: TABLE_ID,
      tableToken: TABLE_TOKEN,
      status: CustomerTableSessionStatus.ACTIVE,
      paidAt: null,
    },
    {
      id: '40000000-0000-4000-8000-000000000002',
      customerId: 8,
      tableId: TABLE_ID,
      tableToken: TABLE_TOKEN,
      status: CustomerTableSessionStatus.ACTIVE,
      paidAt: null,
    },
  ];
  const table = {
    id: TABLE_ID,
    name: 'Bàn A',
    area: null,
    status: 'OCCUPIED',
    qrToken: TABLE_TOKEN,
  } as Table;
  const checkoutSession = {
    id: SESSION_ID,
    tableToken: TABLE_TOKEN,
    tableId: TABLE_ID,
    orderIds: initialOrders.map(({ id }) => id),
    totalAmount: initialOrders.reduce(
      (sum, value) => sum + value.totalAmount,
      0,
    ),
    status: CheckoutSessionStatus.PENDING,
    clientSecret: 'client-secret',
    expiresAt: new Date('2099-08-12T02:00:00.000Z'),
  } as CheckoutSession;

  const orderRepository = {
    findOne: jest.fn(
      async ({ where }: { where: { id: string } }) =>
        orders.find((value) => value.id === where.id) ?? null,
    ),
    find: jest.fn(async ({ where }: { where: { id: unknown } }) => {
      const values = (where.id as { _value: string[] })._value;
      return orders.filter((value) => values.includes(value.id));
    }),
    createQueryBuilder: jest.fn(() => {
      const parameters: Record<string, unknown> = {};
      const queryBuilder = {
        where: jest.fn((_sql: string, values?: Record<string, unknown>) => {
          Object.assign(parameters, values);
          return queryBuilder;
        }),
        andWhere: jest.fn((_sql: string, values: Record<string, unknown>) => {
          Object.assign(parameters, values);
          return queryBuilder;
        }),
        getCount: jest.fn(async () => {
          if ('customerId' in parameters) {
            return orders.filter(
              (value) =>
                value.customerId === parameters.customerId &&
                value.tableToken === parameters.tableToken &&
                value.status !== OrderStatus.CANCELLED &&
                !value.paidStatus,
            ).length;
          }
          return 0;
        }),
        getMany: jest.fn(async () =>
          orders.filter((value) => !value.paidStatus),
        ),
      };
      return queryBuilder;
    }),
  };
  const tableRepository = {
    findOne: jest.fn(async () => table),
    save: jest.fn(async (value: Table) => value),
  };
  const loyaltyRepository = {
    upsert: jest.fn(async (value: Partial<LoyaltyPointTransaction>) => {
      if (
        !loyaltyTransactions.some(({ orderId }) => orderId === value.orderId)
      ) {
        loyaltyTransactions.push(value as LoyaltyPointTransaction);
      }
    }),
  };
  const sessionRepository = {
    findOne: jest.fn(
      async ({ where }: { where: Record<string, unknown> }) =>
        sessions.find((session) =>
          Object.entries(where).every(
            ([key, value]) => session[key as keyof typeof session] === value,
          ),
        ) ?? null,
    ),
    save: jest.fn(async (value: (typeof sessions)[number]) => value),
  };
  const checkoutRepository = {
    findOne: jest.fn(async ({ where }: { where: { id: string } }) =>
      where.id === checkoutSession.id ? checkoutSession : null,
    ),
  };
  const manager = {
    findOne: jest.fn(
      async (entity: unknown, options: { where: Record<string, unknown> }) => {
        if (entity === Order) {
          return orders.find((value) => value.id === options.where.id) ?? null;
        }
        if (entity === Table) return table;
        return null;
      },
    ),
    save: jest.fn(async (entity: unknown, value: unknown) => value),
    getRepository: jest.fn((entity: unknown) => {
      if (entity === Order) return orderRepository;
      if (entity === Table) return tableRepository;
      if (entity === LoyaltyPointTransaction) return loyaltyRepository;
      if (entity === CustomerTableSession) return sessionRepository;
      if (entity === CheckoutSession) return checkoutRepository;
      throw new Error(
        `Repository chưa được giả lập: ${(entity as { name?: string }).name}`,
      );
    }),
  } as unknown as EntityManager;

  const customerService = new CustomerService(
    {} as Repository<any>,
    {} as Repository<LoyaltyPointTransaction>,
    {} as Repository<Table>,
    {} as Repository<any>,
    {} as Repository<Order>,
  );

  const moduleRef = await Test.createTestingModule({
    providers: [
      OrderService,
      { provide: getRepositoryToken(Order), useValue: {} },
      { provide: getRepositoryToken(OrderItem), useValue: {} },
      { provide: getRepositoryToken(Table), useValue: {} },
      { provide: getRepositoryToken(Product), useValue: {} },
      {
        provide: DataSource,
        useValue: {
          transaction: jest.fn(async (callback) => callback(manager)),
        },
      },
      { provide: SseService, useValue: { emit: jest.fn() } },
      { provide: SettingsService, useValue: { get: jest.fn() } },
      { provide: CustomerService, useValue: customerService },
    ],
  }).compile();

  return {
    service: moduleRef.get(OrderService),
    customerService,
    orders,
    loyaltyTransactions,
    sessions,
    checkoutSession,
  };
}

describe('OrderService loyalty payment ledger', () => {
  it('awards 100 points for a paid 100,999 VND customer order', async () => {
    const harness = await buildPaymentHarness([order(ORDER_ONE_ID)]);

    await harness.service.paySingleOrder({
      orderId: ORDER_ONE_ID,
      tableToken: TABLE_TOKEN,
    });

    expect(harness.loyaltyTransactions).toEqual([
      expect.objectContaining({
        customerId: 7,
        orderId: ORDER_ONE_ID,
        points: 100,
        type: LoyaltyPointTransactionType.EARN,
      }),
    ]);
  });

  it('does not double-award when the same paid order is retried', async () => {
    const harness = await buildPaymentHarness([order(ORDER_ONE_ID)]);
    const payment = { orderId: ORDER_ONE_ID, tableToken: TABLE_TOKEN };

    await harness.service.paySingleOrder(payment);
    await harness.service.paySingleOrder(payment);

    expect(harness.loyaltyTransactions).toHaveLength(1);
  });

  it('does not award points for guest orders or orders worth less than 1,000 VND', async () => {
    const guestOrder = order(ORDER_ONE_ID, { customerId: null });
    const zeroPointOrder = order(ORDER_TWO_ID, {
      customerId: 7,
      totalAmount: 999,
    });
    const harness = await buildPaymentHarness([guestOrder, zeroPointOrder]);

    await harness.service.paySingleOrder({
      orderId: guestOrder.id,
      tableToken: TABLE_TOKEN,
    });
    await harness.service.paySingleOrder({
      orderId: zeroPointOrder.id,
      tableToken: TABLE_TOKEN,
    });

    expect(harness.loyaltyTransactions).toHaveLength(0);
  });

  it('marks only the paying customer shortcut after their latest pending order is paid', async () => {
    const paidAt = new Date('2026-08-12T05:00:00.000Z');
    jest.useFakeTimers().setSystemTime(paidAt);
    const harness = await buildPaymentHarness([order(ORDER_ONE_ID)]);

    await harness.service.paySingleOrder({
      orderId: ORDER_ONE_ID,
      tableToken: TABLE_TOKEN,
    });

    expect(harness.sessions[0].paidAt).toEqual(paidAt);
    expect(harness.sessions[1].paidAt).toBeNull();
  });

  it('keeps paidAt clear while that customer still has another unpaid order', async () => {
    const harness = await buildPaymentHarness([
      order(ORDER_ONE_ID),
      order(ORDER_TWO_ID, { customerId: 7, totalAmount: 25_000 }),
    ]);

    await harness.service.paySingleOrder({
      orderId: ORDER_ONE_ID,
      tableToken: TABLE_TOKEN,
    });

    expect(harness.sessions[0].paidAt).toBeNull();
  });

  it('awards each customer order during table bulk payment', async () => {
    const harness = await buildPaymentHarness([
      order(ORDER_ONE_ID, { totalAmount: 10_999 }),
      order(ORDER_TWO_ID, { customerId: 8, totalAmount: 20_999 }),
    ]);

    await harness.service.payUnpaidOrdersByTable({ tableToken: TABLE_TOKEN });

    expect(harness.loyaltyTransactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          orderId: ORDER_ONE_ID,
          customerId: 7,
          points: 10,
        }),
        expect.objectContaining({
          orderId: ORDER_TWO_ID,
          customerId: 8,
          points: 20,
        }),
      ]),
    );
    expect(harness.loyaltyTransactions).toHaveLength(2);
  });

  it('marks each customer shortcut after table bulk payment pays their last order', async () => {
    const paidAt = new Date('2026-08-12T06:00:00.000Z');
    jest.useFakeTimers().setSystemTime(paidAt);
    const harness = await buildPaymentHarness([
      order(ORDER_ONE_ID, { customerId: 7 }),
      order(ORDER_TWO_ID, { customerId: 8 }),
    ]);

    await harness.service.payUnpaidOrdersByTable({ tableToken: TABLE_TOKEN });

    expect(harness.sessions[0].paidAt).toEqual(paidAt);
    expect(harness.sessions[1].paidAt).toEqual(paidAt);
  });

  it.each(['checkoutComplete', 'checkoutCompleteStaff'] as const)(
    'awards points when %s finalizes a checkout session',
    async (method) => {
      const harness = await buildPaymentHarness([order(ORDER_ONE_ID)]);

      if (method === 'checkoutComplete') {
        await harness.service.checkoutComplete({
          sessionId: SESSION_ID,
          tableToken: TABLE_TOKEN,
          clientSecret: 'client-secret',
        });
      } else {
        await harness.service.checkoutCompleteStaff({ sessionId: SESSION_ID });
      }

      expect(harness.loyaltyTransactions).toEqual([
        expect.objectContaining({ orderId: ORDER_ONE_ID, points: 100 }),
      ]);
    },
  );

  it('does not award a cancelled order through any payment path', async () => {
    const harness = await buildPaymentHarness([
      order(ORDER_ONE_ID, { status: OrderStatus.CANCELLED }),
    ]);

    await expect(
      harness.service.paySingleOrder({
        orderId: ORDER_ONE_ID,
        tableToken: TABLE_TOKEN,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(harness.loyaltyTransactions).toHaveLength(0);
  });
});

describe('OrderService staff customer context', () => {
  it('returns customer display name and earned points but no email in staff order DTO', async () => {
    const harness = await buildPaymentHarness([]);
    const customerOrder = order(ORDER_ONE_ID, {
      paidStatus: true,
      customer: {
        id: 7,
        fullName: 'Châu',
        email: 'chau@gmail.com',
      } as Order['customer'],
    });
    Object.assign(customerOrder, {
      loyaltyTransactions: [
        {
          orderId: ORDER_ONE_ID,
          customerId: 7,
          points: 100,
        } as LoyaltyPointTransaction,
      ],
    });

    const dto = (
      harness.service as unknown as {
        buildDto(value: Order, includeStaffContext: boolean): Record<string, unknown>;
      }
    ).buildDto(customerOrder, true);

    expect(dto).toMatchObject({
      customerDisplayName: 'Châu',
      loyaltyPointsEarned: 100,
    });
    expect(dto).not.toHaveProperty('customerEmail');
    expect(dto).not.toHaveProperty('email');
  });

  it('does not expose customer context in public order DTOs', async () => {
    const harness = await buildPaymentHarness([]);
    const customerOrder = order(ORDER_ONE_ID, {
      customer: {
        id: 7,
        fullName: 'Châu',
        email: 'chau@gmail.com',
      } as Order['customer'],
    });

    const dto = (
      harness.service as unknown as {
        buildDto(value: Order): Record<string, unknown>;
      }
    ).buildDto(customerOrder);

    expect(dto).not.toHaveProperty('customerDisplayName');
    expect(dto).not.toHaveProperty('loyaltyPointsEarned');
    expect(JSON.stringify(dto)).not.toContain('chau@gmail.com');
  });

  it.each(['getActiveQueue', 'page', 'detail'] as const)(
    'loads customer and loyalty relations for staff endpoint %s',
    async (method) => {
      const customerOrder = order(ORDER_ONE_ID, { customerId: 7 });
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([customerOrder]),
      };
      const orderRepository = {
        createQueryBuilder: jest.fn(() => queryBuilder),
        findOne: jest.fn().mockResolvedValue(customerOrder),
      };
      const moduleRef = await Test.createTestingModule({
        providers: [
          OrderService,
          { provide: getRepositoryToken(Order), useValue: orderRepository },
          { provide: getRepositoryToken(OrderItem), useValue: {} },
          { provide: getRepositoryToken(Table), useValue: {} },
          { provide: getRepositoryToken(Product), useValue: {} },
          { provide: DataSource, useValue: {} },
          { provide: SseService, useValue: { emit: jest.fn() } },
          { provide: SettingsService, useValue: { get: jest.fn() } },
          { provide: CustomerService, useValue: {} },
        ],
      }).compile();
      const service = moduleRef.get(OrderService);

      if (method === 'getActiveQueue') {
        await service.getActiveQueue();
        const joins = queryBuilder.leftJoinAndSelect.mock.calls.map(
          ([relation]: [string]) => relation,
        );
        expect(joins).toEqual(
          expect.arrayContaining(['o.customer', 'o.loyaltyTransactions']),
        );
        return;
      }

      if (method === 'page') {
        await service.page({ pageNo: 1, pageSize: 20 });
        const joinedBuilders = orderRepository.createQueryBuilder.mock.results
          .map(({ value }: { value: typeof queryBuilder }) => value)
          .filter(Boolean);
        const joins = joinedBuilders.flatMap((builder) =>
          builder.leftJoinAndSelect.mock.calls.map(
            ([relation]: [string]) => relation,
          ),
        );
        expect(joins).toEqual(
          expect.arrayContaining(['o.customer', 'o.loyaltyTransactions']),
        );
        return;
      }

      await service.detail(ORDER_ONE_ID);
      expect(orderRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: expect.arrayContaining([
            'customer',
            'loyaltyTransactions',
          ]),
        }),
      );
    },
  );
});
