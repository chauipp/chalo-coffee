import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Table } from '../table/entities/table.entity';
import { Product } from '../product/entities/product.entity';
import { SseService } from '../sse/sse.service';
import { SettingsService } from '../settings/settings.service';

describe('OrderService estimated-wait wiring', () => {
  let service: OrderService;
  let settings: { get: jest.Mock };
  let orderItemQb: any;

  beforeEach(async () => {
    // Query-builder stub for orderItemRepo.createQueryBuilder(...) in computeEstimatedWait
    orderItemQb = {
      select: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ totalMinutes: '30' }), // 30 prep-minutes queued
    };

    settings = { get: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: {} },
        { provide: getRepositoryToken(OrderItem), useValue: { createQueryBuilder: () => orderItemQb } },
        { provide: getRepositoryToken(Table), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: SseService, useValue: { emit: jest.fn() } },
        { provide: SettingsService, useValue: settings },
      ],
    }).compile();

    service = moduleRef.get(OrderService);
  });

  it('divides queued minutes by settings.baristaCount (not the constant)', async () => {
    settings.get.mockResolvedValue({ waitTimeEnabled: true, baristaCount: 5 });
    // 30 / 5 = 6
    await expect(service.computeEstimatedWait()).resolves.toBe(6);
  });

  it('returns null when waitTimeEnabled is false and skips the query', async () => {
    settings.get.mockResolvedValue({ waitTimeEnabled: false, baristaCount: 3 });
    await expect(service.computeEstimatedWait()).resolves.toBeNull();
    expect(orderItemQb.getRawOne).not.toHaveBeenCalled();
  });

  it('estimatedWait() system mode reports enabled:false when toggled off', async () => {
    settings.get.mockResolvedValue({ waitTimeEnabled: false, baristaCount: 3 });
    await expect(service.estimatedWait()).resolves.toEqual({
      mode: 'system',
      enabled: false,
      estimatedMinutes: null,
    });
  });

  it('estimatedWait() system mode reports enabled:true with minutes', async () => {
    settings.get.mockResolvedValue({ waitTimeEnabled: true, baristaCount: 3 });
    // 30 / 3 = 10
    await expect(service.estimatedWait()).resolves.toEqual({
      mode: 'system',
      enabled: true,
      estimatedMinutes: 10,
    });
  });
});
