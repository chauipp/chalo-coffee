import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { Table } from '../table/entities/table.entity';
import { Product } from '../product/entities/product.entity';
import { ProductStatus } from '../../common/enums/product-status.enum';

describe('OrderService inventory reservation', () => {
  it('trừ nguyên liệu trong đúng transaction sau khi order có id', async () => {
    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({ id: 'table-1', name: 'Bàn 01', qrToken: 'table-token', status: 'AVAILABLE' })
        .mockResolvedValueOnce({ id: 'product-1', name: 'Latte', imageUrl: null, price: 35_000, status: ProductStatus.AVAILABLE, modifierGroups: [] })
        .mockResolvedValueOnce({
          id: 'order-1', tableId: 'table-1', tableToken: 'table-token', status: 'PENDING',
          paidStatus: false, totalAmount: 70_000, orderSource: 'QR', items: [], table: { name: 'Bàn 01' }, pager: null,
        }),
      create: jest.fn((_entity, values) => ({ id: 'order-1', ...values })),
      save: jest.fn(async (_entity, value) => value),
    };
    const inventory = { reserveForOrder: jest.fn().mockResolvedValue([]) };
    const service = new (OrderService as unknown as new (...args: unknown[]) => OrderService)(
      {} as never, {} as never, {} as never, {} as never,
      { transaction: (callback: (m: typeof manager) => Promise<unknown>) => callback(manager) },
      { emit: jest.fn() },
      { get: jest.fn().mockResolvedValue({ waitTimeEnabled: false, baristaCount: 1 }) },
      {},
      undefined,
      inventory,
    );

    await service.create({ tableToken: 'table-token', items: [{ productId: 'product-1', quantity: 2 }] }, null);

    expect(inventory.reserveForOrder).toHaveBeenCalledWith(
      manager,
      [{ productId: 'product-1', quantity: 2 }],
      'order-1',
    );
  });
});
