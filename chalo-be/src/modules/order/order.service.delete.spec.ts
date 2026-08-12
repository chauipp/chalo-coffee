import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Table } from '../table/entities/table.entity';
import { Product } from '../product/entities/product.entity';
import { PagerToken } from '../pager/entities/pager-token.entity';
import { PaymentAllocation } from '../payment/entities/payment-allocation.entity';
import { PaymentTransaction } from '../payment/entities/payment-transaction.entity';
import { LoyaltyPointTransaction } from '../customer/entities/loyalty-point-transaction.entity';
import { SseService } from '../sse/sse.service';
import { SettingsService } from '../settings/settings.service';
import { CustomerService } from '../customer/customer.service';

describe('OrderService.deleteByAdmin', () => {
  let service: OrderService;
  let manager: any;

  beforeEach(async () => {
    manager = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      getRepository: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(async (_entity: unknown, value: unknown) => value),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: {} },
        { provide: getRepositoryToken(OrderItem), useValue: {} },
        { provide: getRepositoryToken(Table), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: DataSource, useValue: { transaction: jest.fn((cb: any) => cb(manager)) } },
        { provide: SseService, useValue: { emit: jest.fn() } },
        { provide: SettingsService, useValue: { get: jest.fn() } },
        { provide: CustomerService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(OrderService);
  });

  it('xóa toàn bộ dữ liệu tài chính và điểm thưởng của đơn đã thanh toán riêng lẻ', async () => {
    const order = { id: 'order-1', tableId: 'table-1', pagerId: null };
    const allocation = {
      id: 'allocation-1',
      amount: 45_000,
      paymentTransactionId: 'payment-1',
      paymentTransaction: { id: 'payment-1', totalAmount: 45_000 },
    };
    manager.findOne.mockResolvedValue(order);
    manager.find.mockResolvedValue([allocation]);
    const countQuery = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    };
    manager.getRepository.mockImplementation((entity: unknown) =>
      entity === Order
        ? { createQueryBuilder: jest.fn(() => countQuery) }
        : { findOne: jest.fn().mockResolvedValue({ id: 'table-1', status: 'OCCUPIED' }), save: jest.fn() },
    );

    await expect(service.deleteByAdmin('order-1')).resolves.toEqual({ id: 'order-1' });

    expect(manager.delete).toHaveBeenCalledWith(LoyaltyPointTransaction, { orderId: 'order-1' });
    expect(manager.delete).toHaveBeenCalledWith(PaymentAllocation, { id: 'allocation-1' });
    expect(manager.delete).toHaveBeenCalledWith(PaymentTransaction, { id: 'payment-1' });
    expect(manager.delete).toHaveBeenCalledWith(OrderItem, { orderId: 'order-1' });
    expect(manager.delete).toHaveBeenCalledWith(Order, { id: 'order-1' });
  });
});
