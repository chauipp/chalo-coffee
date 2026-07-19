import { OrderService } from './order.service';
import { CheckoutSession } from './entities/checkout-session.entity';
import { Table } from '../table/entities/table.entity';
import { Order } from './entities/order.entity';

describe('OrderService.checkoutStart — payCode', () => {
  const table = { id: 'tbl-1', qrToken: 'tok-1', name: 'Bàn 01' };
  const order = {
    id: 'ord-1',
    tableToken: 'tok-1',
    totalAmount: 50000,
    status: 'PENDING',
    paidStatus: false,
    items: [],
    table,
  };

  // Fake manager: chỉ mock đúng những gì checkoutStart + resolvePayableOrders chạm tới
  function build(sessionFindOne: jest.Mock) {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ ...order }]),
    };
    const repos = new Map<unknown, unknown>([
      [Table, { findOne: jest.fn().mockResolvedValue(table) }],
      [Order, { createQueryBuilder: jest.fn(() => qb) }],
      [CheckoutSession, { findOne: sessionFindOne }],
    ]);
    const manager = {
      getRepository: jest.fn((e: unknown) => repos.get(e)),
      create: jest.fn((_e: unknown, v: unknown) => v),
      save: jest.fn((_e: unknown, v: Record<string, unknown>) =>
        Promise.resolve({ id: 'sess-1', ...v }),
      ),
    };
    const dataSource = {
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb(manager)),
    };
    const service = new OrderService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      dataSource as never,
      { emit: jest.fn() } as never,
      {} as never,
    );
    return { service };
  }

  it('gán payCode đúng định dạng và trả về trong response', async () => {
    const { service } = build(jest.fn().mockResolvedValue(null));
    const res = await service.checkoutStart({ tableToken: 'tok-1' });
    expect(res.payCode).toMatch(/^CK[A-HJKMNP-Z2-9]{6}$/);
  });

  it('trùng payCode thì sinh lại (unique retry)', async () => {
    const sessionFindOne = jest
      .fn()
      .mockResolvedValueOnce({ id: 'sess-x' }) // lần 1: mã đã tồn tại
      .mockResolvedValueOnce(null); // lần 2: ok
    const { service } = build(sessionFindOne);
    const res = await service.checkoutStart({ tableToken: 'tok-1' });
    expect(sessionFindOne).toHaveBeenCalledTimes(2);
    expect(res.payCode).toMatch(/^CK[A-HJKMNP-Z2-9]{6}$/);
  });
});
