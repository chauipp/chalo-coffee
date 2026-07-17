import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Table } from '../table/entities/table.entity';
import { Product } from '../product/entities/product.entity';
import { SseService } from '../sse/sse.service';
import { SettingsService } from '../settings/settings.service';

describe('OrderService STATUS_TRANSITIONS', () => {
  let service: OrderService;
  let manager: any;
  let sse: { emit: jest.Mock };

  /** Đơn đang khoá ở trạng thái `from`, rồi bản đầy đủ sau khi đổi sang `to` */
  const mockOrder = (from: string, to: string) => {
    manager.findOne
      .mockResolvedValueOnce({ id: 'o1', status: from, tableId: 't1' })
      .mockResolvedValueOnce({
        id: 'o1',
        status: to,
        tableId: 't1',
        tableToken: 'tok',
        items: [],
        table: { name: 'Ban 01' },
      });
  };

  beforeEach(async () => {
    manager = { findOne: jest.fn(), save: jest.fn(), getRepository: jest.fn() };
    sse = { emit: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: {} },
        { provide: getRepositoryToken(OrderItem), useValue: {} },
        { provide: getRepositoryToken(Table), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        {
          provide: DataSource,
          useValue: { transaction: jest.fn(async (cb: any) => cb(manager)) },
        },
        { provide: SseService, useValue: sse },
        { provide: SettingsService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(OrderService);
  });

  it('PENDING → PREPARING: staff kéo thẳng vào pha, không qua bước xác nhận', async () => {
    mockOrder('PENDING', 'PREPARING');
    const result = await service.updateStatus({ id: 'o1', status: 'PREPARING' } as any);
    expect(result.status).toBe('PREPARING');
  });

  it('PENDING → CONFIRMED bị chặn: không tạo mới trạng thái đã gỡ khỏi luồng', async () => {
    manager.findOne.mockResolvedValueOnce({ id: 'o1', status: 'PENDING', tableId: 't1' });
    await expect(
      service.updateStatus({ id: 'o1', status: 'CONFIRMED' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('CONFIRMED → PREPARING vẫn chạy: đơn CONFIRMED cũ trong DB phải đi tiếp được', async () => {
    mockOrder('CONFIRMED', 'PREPARING');
    const result = await service.updateStatus({ id: 'o1', status: 'PREPARING' } as any);
    expect(result.status).toBe('PREPARING');
  });

  it('READY → PREPARING: đường lùi khi tick nhầm ly cuối', async () => {
    mockOrder('READY', 'PREPARING');
    const result = await service.updateStatus({ id: 'o1', status: 'PREPARING' } as any);
    expect(result.status).toBe('PREPARING');
  });

  it('READY → COMPLETED vẫn chạy: staff bấm "Đã bê ra"', async () => {
    manager.getRepository.mockReturnValue({
      createQueryBuilder: () => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      }),
      findOne: jest.fn().mockResolvedValue(null),
    });
    mockOrder('READY', 'COMPLETED');
    const result = await service.updateStatus({ id: 'o1', status: 'COMPLETED' } as any);
    expect(result.status).toBe('COMPLETED');
  });
});
