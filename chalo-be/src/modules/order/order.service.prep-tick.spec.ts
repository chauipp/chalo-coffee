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

describe('OrderService.setItemPrepared', () => {
  let service: OrderService;
  let manager: any;
  let sse: { emit: jest.Mock };

  /**
   * items: danh sách item của đơn sau khi đã ghi tick.
   * orderStatus: trạng thái đơn lúc bị khoá.
   */
  const setup = (
    item: any,
    itemsAfterSave: any[],
    orderStatus = 'PREPARING',
  ) => {
    manager.findOne.mockImplementation((entity: any, opts: any) => {
      if (entity === OrderItem) return Promise.resolve(item);
      if (opts?.relations) {
        return Promise.resolve({
          id: 'o1',
          status: itemsAfterSave.every((i) => i.preparedQuantity >= i.quantity)
            ? 'READY'
            : orderStatus,
          tableId: 't1',
          tableToken: 'tok',
          items: itemsAfterSave,
          table: { name: 'Ban 06' },
        });
      }
      return Promise.resolve({ id: 'o1', status: orderStatus, tableId: 't1', tableToken: 'tok' });
    });
    manager.find.mockResolvedValue(itemsAfterSave);
  };

  beforeEach(async () => {
    manager = { findOne: jest.fn(), find: jest.fn(), save: jest.fn() };
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

  it('tick đủ mọi item -> đơn tự chuyển READY và bắn order_status_changed', async () => {
    const item = { id: 'i1', orderId: 'o1', quantity: 1, preparedQuantity: 0 };
    setup(item, [{ ...item, preparedQuantity: 1 }]);

    const result = await service.setItemPrepared('i1', { preparedQuantity: 1 });

    expect(result.status).toBe('READY');
    expect(sse.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'order_status_changed' }),
    );
  });

  it('còn item chưa đủ -> đơn giữ PREPARING và bắn order_prep_progress', async () => {
    const item = { id: 'i1', orderId: 'o1', quantity: 1, preparedQuantity: 0 };
    setup(item, [
      { ...item, preparedQuantity: 1 },
      { id: 'i2', orderId: 'o1', quantity: 2, preparedQuantity: 0 },
    ]);

    const result = await service.setItemPrepared('i1', { preparedQuantity: 1 });

    expect(result.status).toBe('PREPARING');
    expect(sse.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'order_prep_progress' }),
    );
  });

  it('gọi hai lần cùng giá trị -> idempotent, không đếm đôi', async () => {
    const item = { id: 'i1', orderId: 'o1', quantity: 3, preparedQuantity: 2 };
    setup(item, [{ ...item, preparedQuantity: 2 }]);

    await service.setItemPrepared('i1', { preparedQuantity: 2 });
    await service.setItemPrepared('i1', { preparedQuantity: 2 });

    expect(item.preparedQuantity).toBe(2); // vẫn 2, không thành 4
  });

  it('preparedQuantity vượt quantity -> BadRequest', async () => {
    const item = { id: 'i1', orderId: 'o1', quantity: 2, preparedQuantity: 0 };
    setup(item, [item]);

    await expect(
      service.setItemPrepared('i1', { preparedQuantity: 3 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('đơn không ở PREPARING -> BadRequest (không tick đơn chưa vào pha)', async () => {
    const item = { id: 'i1', orderId: 'o1', quantity: 1, preparedQuantity: 0 };
    setup(item, [item], 'PENDING');

    await expect(
      service.setItemPrepared('i1', { preparedQuantity: 1 }),
    ).rejects.toThrow(BadRequestException);
  });
});
