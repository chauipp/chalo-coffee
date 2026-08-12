import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { Order } from '../order/entities/order.entity';
import { Table } from '../table/entities/table.entity';
import { User } from '../user/entities/user.entity';
import { CustomerService } from './customer.service';
import {
  CustomerTableSession,
  CustomerTableSessionStatus,
} from './entities/customer-table-session.entity';
import { LoyaltyPointTransaction } from './entities/loyalty-point-transaction.entity';

type SessionRepo = Pick<
  Repository<CustomerTableSession>,
  'findOne' | 'create' | 'save'
>;

const fixedTable: Table = {
  id: 'a3dc1140-f3d4-4a26-9b03-06cf87a217e3',
  name: 'Bàn A',
  area: 'Tầng 1',
  status: 'AVAILABLE',
  qrToken: 'fixed-print-qr',
  orders: [],
  createdAt: new Date('2026-08-12T00:00:00.000Z'),
} as Table;

const customer = (id: number): User =>
  ({
    id,
    username: `customer-${id}`,
    password: 'unused',
    fullName: `Khách ${id}`,
    avatar: null,
    googleSubject: `google-${id}`,
    email: `customer-${id}@example.com`,
    role: UserRole.CUSTOMER,
    isActive: true,
    currentRefreshTokenHash: null,
    createdAt: new Date('2026-08-12T00:00:00.000Z'),
  }) as User;

const createSession = (
  customerId: number,
  overrides: Partial<CustomerTableSession> = {},
): CustomerTableSession =>
  ({
    id: `00000000-0000-4000-8000-${customerId.toString().padStart(12, '0')}`,
    customerId,
    tableId: fixedTable.id,
    tableToken: fixedTable.qrToken,
    status: CustomerTableSessionStatus.ACTIVE,
    startedAt: new Date('2026-08-12T01:00:00.000Z'),
    lastActivityAt: new Date('2026-08-12T01:00:00.000Z'),
    paidAt: null,
    endedAt: null,
    businessDate: '2026-08-12',
    endedReason: null,
    updatedAt: new Date('2026-08-12T01:00:00.000Z'),
    customer: customer(customerId),
    table: fixedTable,
    ...overrides,
  }) as CustomerTableSession;

function buildService(initialSessions: CustomerTableSession[] = []) {
  const sessions = initialSessions;
  let sequence = sessions.length;

  const sessionRepo: SessionRepo = {
    findOne: jest.fn(async (options: { where: Record<string, unknown> }) => {
      const where = options.where;
      return (
        sessions.find((session) =>
          Object.entries(where).every(
            ([key, value]) =>
              session[key as keyof CustomerTableSession] === value,
          ),
        ) ?? null
      );
    }),
    create: jest.fn((data: Partial<CustomerTableSession>) => {
      sequence += 1;
      return createSession(data.customerId as number, {
        id: `10000000-0000-4000-8000-${sequence.toString().padStart(12, '0')}`,
        ...data,
      });
    }),
    save: jest.fn(async (session: CustomerTableSession) => {
      const index = sessions.findIndex(
        (existing) => existing.id === session.id,
      );
      if (index >= 0) sessions[index] = session;
      else sessions.push(session);
      return session;
    }),
  };

  const tableRepo = {
    findOneBy: jest.fn(async ({ qrToken }: { qrToken: string }) =>
      qrToken === fixedTable.qrToken ? fixedTable : null,
    ),
  };
  const userRepo = {
    findOneBy: jest.fn(async ({ id }: { id: number }) => customer(id)),
  };
  const loyaltyRepo = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ balance: '0' }),
    })),
  };
  const orderRepo = {
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  const service = new CustomerService(
    sessionRepo as Repository<CustomerTableSession>,
    loyaltyRepo as unknown as Repository<LoyaltyPointTransaction>,
    tableRepo as unknown as Repository<Table>,
    userRepo as unknown as Repository<User>,
    orderRepo as unknown as Repository<Order>,
  );

  return { service, sessions, tableRepo };
}

describe('CustomerService table shortcut', () => {
  it('does not let one customer scanning a table close another customer shortcut', async () => {
    const now = new Date('2026-08-12T02:00:00.000Z');
    const sessionA = createSession(1);
    const { service } = buildService([sessionA]);

    await service.scanTable(2, { tableToken: fixedTable.qrToken }, now);

    await expect(service.getActiveShortcut(1, now)).resolves.toMatchObject({
      customerId: 1,
      tableToken: fixedTable.qrToken,
      status: CustomerTableSessionStatus.ACTIVE,
    });
  });

  it('expires a paid shortcut after 30 idle minutes but preserves the stable table QR', async () => {
    const session = createSession(1, {
      lastActivityAt: new Date('2026-08-12T01:10:00.000Z'),
      paidAt: new Date('2026-08-12T01:00:00.000Z'),
    });
    const { service, tableRepo } = buildService([session]);

    const shortcut = await service.getActiveShortcut(
      1,
      new Date('2026-08-12T01:40:00.000Z'),
    );

    expect(shortcut).toBeNull();
    expect(session).toMatchObject({
      status: CustomerTableSessionStatus.EXPIRED,
      endedReason: 'IDLE_AFTER_PAID',
    });
    expect(fixedTable.qrToken).toBe('fixed-print-qr');
    expect(tableRepo.findOneBy).not.toHaveBeenCalled();
  });

  it('keeps an unpaid shortcut active even after 30 idle minutes', async () => {
    const session = createSession(1, {
      lastActivityAt: new Date('2026-08-12T01:00:00.000Z'),
      paidAt: null,
    });
    const { service } = buildService([session]);

    await expect(
      service.getActiveShortcut(1, new Date('2026-08-12T05:00:00.000Z')),
    ).resolves.toMatchObject({ id: session.id, status: 'ACTIVE' });
  });

  it('uses last activity after payment as the 30-minute idle boundary', async () => {
    const session = createSession(1, {
      paidAt: new Date('2026-08-12T01:00:00.000Z'),
      lastActivityAt: new Date('2026-08-12T01:20:00.000Z'),
    });
    const { service } = buildService([session]);

    await expect(
      service.getActiveShortcut(1, new Date('2026-08-12T01:49:59.999Z')),
    ).resolves.toMatchObject({ id: session.id, status: 'ACTIVE' });
    await expect(
      service.getActiveShortcut(1, new Date('2026-08-12T01:50:00.000Z')),
    ).resolves.toBeNull();
  });

  it('expires the shortcut when the Vietnam business date changes', async () => {
    const session = createSession(1, {
      businessDate: '2026-08-12',
      lastActivityAt: new Date('2026-08-12T16:59:00.000Z'),
    });
    const { service } = buildService([session]);

    await expect(
      service.getActiveShortcut(1, new Date('2026-08-12T17:00:00.000Z')),
    ).resolves.toBeNull();
    expect(session).toMatchObject({
      status: CustomerTableSessionStatus.EXPIRED,
      endedReason: 'DAY_ENDED',
    });
  });

  it('moves only the scanning customer shortcut to a new valid table', async () => {
    const ownSession = createSession(1);
    const otherSession = createSession(2);
    const { service } = buildService([ownSession, otherSession]);

    const result = await service.scanTable(
      1,
      { tableToken: fixedTable.qrToken },
      new Date('2026-08-12T03:00:00.000Z'),
    );

    expect(result).toMatchObject({
      customerId: 1,
      tableId: fixedTable.id,
      paidAt: null,
    });
    expect(otherSession).toMatchObject({
      customerId: 2,
      status: CustomerTableSessionStatus.ACTIVE,
    });
  });

  it('rejects an invalid table QR without creating a shortcut', async () => {
    const { service, sessions } = buildService();

    await expect(
      service.scanTable(1, { tableToken: 'invalid-token' }),
    ).rejects.toThrow(NotFoundException);
    expect(sessions).toHaveLength(0);
  });

  it('leave closes only the caller shortcut', async () => {
    const ownSession = createSession(1);
    const otherSession = createSession(2);
    const { service } = buildService([ownSession, otherSession]);

    await service.leaveTable(1, new Date('2026-08-12T02:00:00.000Z'));

    expect(ownSession).toMatchObject({
      status: CustomerTableSessionStatus.CLOSED,
      endedReason: 'CUSTOMER_LEFT',
    });
    expect(otherSession.status).toBe(CustomerTableSessionStatus.ACTIVE);
  });
});
