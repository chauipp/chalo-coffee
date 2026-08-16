import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MAX_PAGE_SIZE, normalizePageSize, OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Table } from '../table/entities/table.entity';
import { Product } from '../product/entities/product.entity';
import { SseService } from '../sse/sse.service';
import { SettingsService } from '../settings/settings.service';
import { CustomerService } from '../customer/customer.service';
import { OrderStatus } from '../../common/enums/order-status.enum';

describe('OrderService byToken performance boundaries', () => {
  it('clamps requested page sizes above the public maximum', () => {
    expect(MAX_PAGE_SIZE).toBe(100);
    expect(normalizePageSize(1_000)).toBe(100);
    expect(normalizePageSize(undefined)).toBe(20);
    expect(normalizePageSize(20)).toBe(20);
  });

  it('loads the ETA queue once for all legacy orders without a stored ETA', async () => {
    const queueQuery = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { id: 'first', createdAt: '2026-08-16T01:00:00.000Z', prepMinutes: '4' },
        { id: 'second', createdAt: '2026-08-16T02:00:00.000Z', prepMinutes: '6' },
      ]),
    };
    const byTokenQuery = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'second', tableId: 'table-1', tableToken: 'table-token',
          status: OrderStatus.PREPARING, paidStatus: false, orderSource: 'QR',
          estimatedWaitMinutes: null, items: [], paymentRequested: false,
          createdAt: new Date('2026-08-16T02:00:00.000Z'), updatedAt: new Date('2026-08-16T02:00:00.000Z'),
        },
        {
          id: 'first', tableId: 'table-1', tableToken: 'table-token',
          status: OrderStatus.PENDING, paidStatus: false, orderSource: 'QR',
          estimatedWaitMinutes: null, items: [], paymentRequested: false,
          createdAt: new Date('2026-08-16T01:00:00.000Z'), updatedAt: new Date('2026-08-16T01:00:00.000Z'),
        },
      ]),
    };
    const orderRepo = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(byTokenQuery)
        .mockReturnValueOnce(queueQuery),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: {} },
        { provide: getRepositoryToken(Table), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: SseService, useValue: { emit: jest.fn() } },
        { provide: SettingsService, useValue: { get: jest.fn().mockResolvedValue({ waitTimeEnabled: true, baristaCount: 2 }) } },
        { provide: CustomerService, useValue: {} },
      ],
    }).compile();

    const result = await moduleRef.get(OrderService).byToken('table-token');

    expect(queueQuery.getRawMany).toHaveBeenCalledTimes(1);
    expect(result.map(({ estimateWaitMinutes }) => estimateWaitMinutes)).toEqual([5, 2]);
  });
});
